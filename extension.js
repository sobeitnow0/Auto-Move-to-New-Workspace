// SPDX-License-Identifier: GPL-2.0-or-later

import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';
import Gio from 'gi://Gio';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

class WindowMover {
    constructor(settings) {
        this._settings = settings;
        this._appSystem = Shell.AppSystem.get_default();
        this._windowTracker = Shell.WindowTracker.get_default();
        this._appConfigs = new Map();
        this._processedWindows = new WeakSet();
        this._idleSources = new Set();
        this._timeouts = new Set();

        this._settings.connectObject('changed::application-list',
            () => this._updateAppConfigs(), this);

        this._updateAppConfigs();

        // Listen for new window creations across the entire display
        global.display.connectObject('window-created',
            (display, window) => this._onWindowCreated(window), this);
    }

    _updateAppConfigs() {
        this._appConfigs.clear();
        const settingsList = this._settings.get_strv('application-list');

        for (const entry of settingsList) {
            if (!entry || !entry.trim()) continue;
            const parts = entry.split(':');
            const appId = parts[0]?.trim();
            if (appId) {
                const isBackground = parts[2] === 'true';
                const autoMaximize = parts[3] === 'true';
                this._appConfigs.set(appId, {
                    background: isBackground,
                    autoMaximize: autoMaximize,
                });
            }
        }
    }

    _findConfigForWindow(window, app) {
        if (!window) return null;

        // 1. Try Shell.App ID (e.g. org.gnome.Nautilus.desktop)
        if (app) {
            const appId = app.get_id();
            if (appId && this._appConfigs.has(appId)) {
                return this._appConfigs.get(appId);
            }
        }

        // 2. Try WM_CLASS
        const wmClass = window.get_wm_class ? window.get_wm_class() : null;
        if (wmClass && this._appConfigs.has(wmClass)) {
            return this._appConfigs.get(wmClass);
        }

        // 3. Try WM_CLASS instance
        const wmInstance = window.get_wm_class_instance ? window.get_wm_class_instance() : null;
        if (wmInstance && this._appConfigs.has(wmInstance)) {
            return this._appConfigs.get(wmInstance);
        }

        // 4. Try GTK Application ID
        const gtkAppId = window.get_gtk_application_id ? window.get_gtk_application_id() : null;
        if (gtkAppId && this._appConfigs.has(gtkAppId)) {
            return this._appConfigs.get(gtkAppId);
        }

        return null;
    }

    _onWindowCreated(window) {
        if (!this._settings || !window) return;

        // Immediately skip non-normal windows (tooltips, menus, desktop, etc.)
        if (window.get_window_type() !== Meta.WindowType.NORMAL) return;

        // Defer with idle priority so Mutter and Shell finish assigning initial properties
        const idleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._idleSources.delete(idleId);
            if (!this._settings) return GLib.SOURCE_REMOVE;
            this._processWindow(window);
            return GLib.SOURCE_REMOVE;
        });
        this._idleSources.add(idleId);
    }

    _processWindow(window) {
        if (!this._settings || !window) return;
        if (this._processedWindows.has(window)) return;

        // Verify window is still valid and has a compositor actor
        try {
            if (!window.get_compositor_private()) return;
        } catch (e) {
            return;
        }

        this._processedWindows.add(window);

        // Keep modal/dialog windows with their parent
        try {
            const parent = window.get_transient_for();
            if (parent) {
                const parentWs = parent.get_workspace();
                if (parentWs && window.get_workspace() !== parentWs) {
                    window.change_workspace(parentWs);
                    parentWs.activate(global.get_current_time());
                }
                return;
            }
        } catch (e) {
            return;
        }

        if (window.skip_taskbar || window.is_on_all_workspaces() || window.is_above()) {
            return;
        }
        if (window.get_window_type() !== Meta.WindowType.NORMAL) {
            return;
        }

        const app = this._windowTracker.get_window_app(window);
        const config = this._findConfigForWindow(window, app);
        if (!config) return;

        const currentWorkspace = window.get_workspace();
        if (!currentWorkspace) return;

        // Respect Mutter's workspaces-only-on-primary setting
        try {
            if (Meta.prefs_get_workspaces_only_on_primary && Meta.prefs_get_workspaces_only_on_primary()) {
                if (window.is_on_primary_monitor && !window.is_on_primary_monitor()) {
                    return;
                }
            }
        } catch (e) {
            // Ignore if setting not present
        }

        // Sibling check: if the application already has a window on this workspace, don't move
        if (app) {
            const hasSibling = app.get_windows().some(w =>
                w !== window &&
                w.get_workspace() === currentWorkspace &&
                !w.skip_taskbar &&
                !w.is_on_all_workspaces()
            );
            if (hasSibling) return;
        }

        // If configured, keep on current workspace if it's already empty
        const ignoreEmpty = this._settings.get_boolean('ignore-empty-workspace');
        if (ignoreEmpty) {
            const isCurrentEmpty = currentWorkspace.list_windows().every(w =>
                w.is_on_all_workspaces() || w === window || w.is_above()
            );
            if (isCurrentEmpty) {
                if (config.autoMaximize) {
                    window.maximize(Meta.MaximizeFlags.BOTH);
                }
                return;
            }
        }

        this._moveToNewWorkspace(window, config);
    }

    _moveToNewWorkspace(window, config) {
        const workspaceManager = global.workspace_manager;
        if (!workspaceManager) return;

        const currentWorkspace = window.get_workspace();
        const originWorkspace = workspaceManager.get_active_workspace();
        let targetWorkspace = null;

        const isDynamic = Meta.prefs_get_dynamic_workspaces ? Meta.prefs_get_dynamic_workspaces() : true;

        if (isDynamic) {
            const lastIndex = workspaceManager.n_workspaces - 1;
            const lastWorkspace = workspaceManager.get_workspace_by_index(lastIndex);

            const isLastEmpty = lastWorkspace.list_windows().every(w =>
                w.is_on_all_workspaces() || w === window || w.is_above()
            );

            if (isLastEmpty && lastWorkspace !== currentWorkspace) {
                targetWorkspace = lastWorkspace;
            } else {
                targetWorkspace = workspaceManager.append_new_workspace(false, global.display.get_current_time());
            }
        } else {
            // Static workspaces: pick the first empty workspace
            for (let i = 0; i < workspaceManager.n_workspaces; i++) {
                const ws = workspaceManager.get_workspace_by_index(i);
                if (ws !== currentWorkspace && ws.list_windows().every(w => w.is_on_all_workspaces() || w === window)) {
                    targetWorkspace = ws;
                    break;
                }
            }
            if (!targetWorkspace) {
                targetWorkspace = workspaceManager.get_workspace_by_index(workspaceManager.n_workspaces - 1);
            }
        }

        if (!targetWorkspace || window.get_workspace() === targetWorkspace) return;

        window.change_workspace(targetWorkspace);

        if (config.autoMaximize) {
            window.maximize(Meta.MaximizeFlags.BOTH);
        }

        const globalFocus = this._settings.get_boolean('focus-new-workspace');

        if (globalFocus && !config.background) {
            Main.activateWindow(window);
        } else if (config.background) {
            // Prevent workspace switch jitter by activating origin workspace immediately
            if (workspaceManager.get_active_workspace() !== originWorkspace) {
                originWorkspace.activate(global.get_current_time());
            }
        }
    }

    destroy() {
        for (const id of this._idleSources) {
            GLib.source_remove(id);
        }
        this._idleSources.clear();

        for (const id of this._timeouts) {
            GLib.source_remove(id);
        }
        this._timeouts.clear();

        global.display.disconnectObject(this);

        if (this._settings) {
            this._settings.disconnectObject(this);
            this._settings = null;
        }

        this._appConfigs.clear();
        this._appSystem = null;
        this._windowTracker = null;
    }
}

export default class AutoMoveExtension extends Extension {
    enable() {
        this.initTranslations();
        this._settings = this.getSettings();
        this._windowMover = new WindowMover(this._settings);
    }

    disable() {
        if (this._windowMover) {
            this._windowMover.destroy();
            this._windowMover = null;
        }
        this._settings = null;
    }
}