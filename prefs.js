// SPDX-License-Identifier: GPL-2.0-or-later

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const SETTINGS_KEY = 'application-list';
const WORKSPACE_MAX = 36;

class Rule extends GObject.Object {
    static [GObject.properties] = {
        'id': GObject.ParamSpec.string('id', null, null, GObject.ParamFlags.READWRITE, ''),
        'display-name': GObject.ParamSpec.string('display-name', null, null, GObject.ParamFlags.READWRITE, ''),
        'app-info': GObject.ParamSpec.object('app-info', null, null, GObject.ParamFlags.READWRITE, Gio.AppInfo),
        'workspace': GObject.ParamSpec.uint('workspace', null, null, GObject.ParamFlags.READWRITE, 1, WORKSPACE_MAX, 1),
        'background': GObject.ParamSpec.boolean('background', null, null, GObject.ParamFlags.READWRITE, false),
        'auto-maximize': GObject.ParamSpec.boolean('auto-maximize', null, null, GObject.ParamFlags.READWRITE, false),
    };
    static { GObject.registerClass(this); }
}

class RulesList extends GObject.Object {
    static [GObject.interfaces] = [Gio.ListModel];
    static { GObject.registerClass(this); }

    #settings;
    #rules = [];
    #changedId;

    constructor(settings) {
        super();
        this.#settings = settings;
        this.#changedId = this.#settings.connectObject(`changed::${SETTINGS_KEY}`, () => this.#sync(), this);
        this.#sync();
    }

    append(id, appInfo = null) {
        if (!id || this.#rules.some(r => r.id === id)) return;

        const displayName = appInfo ? appInfo.get_display_name() : id;
        const pos = this.#rules.length;

        this.#rules.push(new Rule({
            id,
            displayName,
            appInfo,
            workspace: 1,
            background: false,
            autoMaximize: false,
        }));

        this.#saveRules();
        this.items_changed(pos, 0, 1);
    }

    remove(id) {
        const pos = this.#rules.findIndex(r => r.id === id);
        if (pos < 0) return;
        this.#rules.splice(pos, 1);
        this.#saveRules();
        this.items_changed(pos, 1, 0);
    }

    toggleBackground(id, isBackground) {
        const rule = this.#rules.find(r => r.id === id);
        if (!rule) return;
        rule.background = isBackground;
        this.#saveRules();
    }

    toggleAutoMaximize(id, isAutoMaximize) {
        const rule = this.#rules.find(r => r.id === id);
        if (!rule) return;
        rule.autoMaximize = isAutoMaximize;
        this.#saveRules();
    }

    #saveRules() {
        this.#settings.block_signal_handler(this.#changedId);
        this.#settings.set_strv(SETTINGS_KEY, this.#rules.map(r =>
            `${r.id}:${r.workspace}:${r.background}:${r.autoMaximize}`
        ));
        this.#settings.unblock_signal_handler(this.#changedId);
    }

    #sync() {
        const removed = this.#rules.length;
        this.#rules = [];

        for (const stringRule of this.#settings.get_strv(SETTINGS_KEY)) {
            if (!stringRule || !stringRule.trim()) continue;
            const parts = stringRule.split(':');
            const id = parts[0]?.trim();
            if (!id) continue;

            const workspace = parseInt(parts[1], 10) || 1;
            const background = parts[2] === 'true';
            const autoMaximize = parts[3] === 'true';

            let appInfo = null;
            try {
                if (Gio.DesktopAppInfo) {
                    appInfo = Gio.DesktopAppInfo.new(id);
                }
            } catch (e) {
                appInfo = null;
            }

            const displayName = appInfo ? appInfo.get_display_name() : id;

            this.#rules.push(new Rule({
                id,
                displayName,
                appInfo,
                workspace,
                background,
                autoMaximize,
            }));
        }

        this.items_changed(0, removed, this.#rules.length);
    }

    vfunc_get_item_type() { return Rule; }
    vfunc_get_n_items() { return this.#rules.length; }
    vfunc_get_item(pos) { return this.#rules[pos] ?? null; }
}

class RuleRow extends Adw.ActionRow {
    static { GObject.registerClass(this); }

    constructor(rule, rulesList) {
        super({
            activatable: false,
            title: rule.displayName,
            subtitle: rule.id !== rule.displayName ? rule.id : '',
        });

        const iconBox = new Gtk.Image({
            pixel_size: 32,
            css_classes: ['icon-dropshadow'],
        });

        if (rule.appInfo && rule.appInfo.get_icon()) {
            iconBox.set_from_gicon(rule.appInfo.get_icon());
        } else {
            iconBox.set_from_icon_name('application-x-executable-symbolic');
        }
        this.add_prefix(iconBox);

        // Control box for options
        const controlsBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            valign: Gtk.Align.CENTER,
        });

        // Background mode switch
        const bgBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            valign: Gtk.Align.CENTER,
            tooltip_text: _('Open in background without switching workspace'),
        });
        const bgIcon = new Gtk.Image({ icon_name: 'view-conceal-symbolic' });
        const bgSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: rule.background,
        });
        bgSwitch.connect('notify::active', () => {
            rulesList.toggleBackground(rule.id, bgSwitch.active);
        });
        bgBox.append(bgIcon);
        bgBox.append(bgSwitch);
        controlsBox.append(bgBox);

        // Auto-maximize switch
        const maxBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            valign: Gtk.Align.CENTER,
            tooltip_text: _('Automatically maximize on new workspace'),
        });
        const maxIcon = new Gtk.Image({ icon_name: 'window-maximize-symbolic' });
        const maxSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: rule.autoMaximize,
        });
        maxSwitch.connect('notify::active', () => {
            rulesList.toggleAutoMaximize(rule.id, maxSwitch.active);
        });
        maxBox.append(maxIcon);
        maxBox.append(maxSwitch);
        controlsBox.append(maxBox);

        // Delete button
        const removeButton = new Gtk.Button({
            icon_name: 'user-trash-symbolic',
            has_frame: false,
            valign: Gtk.Align.CENTER,
            tooltip_text: _('Remove rule'),
            css_classes: ['flat', 'destructive-action'],
        });
        removeButton.connect('clicked', () => {
            rulesList.remove(rule.id);
        });
        controlsBox.append(removeButton);

        this.add_suffix(controlsBox);
    }
}

class AddRuleDialog {
    constructor(parent, rulesList) {
        this._parent = parent;
        this._rulesList = rulesList;

        if (Adw.Dialog) {
            this._dialog = new Adw.Dialog({
                title: _('Add Application Rule'),
                content_width: 480,
                content_height: 580,
            });
        } else {
            this._dialog = new Gtk.Window({
                transient_for: parent,
                modal: true,
                title: _('Add Application Rule'),
                default_width: 480,
                default_height: 580,
            });
        }

        const toolbarView = new Adw.ToolbarView();
        const headerBar = new Adw.HeaderBar();
        toolbarView.add_top_bar(headerBar);

        const contentBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12,
        });
        toolbarView.set_content(contentBox);

        // Search entry
        const searchEntry = new Gtk.SearchEntry({
            placeholder_text: _('Search applications...'),
        });
        contentBox.append(searchEntry);

        // Custom WM_CLASS / App ID entry
        const customGroup = new Adw.PreferencesGroup({
            title: _('Custom WM_CLASS or App ID'),
            description: _('For Flatpaks, Steam games, or apps not listed below'),
        });

        const customEntryRow = new Adw.EntryRow({
            title: _('WM_CLASS or App ID'),
        });
        const addCustomButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            tooltip_text: _('Add custom rule'),
            css_classes: ['flat', 'suggested-action'],
        });
        addCustomButton.connect('clicked', () => {
            const text = customEntryRow.get_text()?.trim();
            if (text) {
                this._rulesList.append(text, null);
                this._close();
            }
        });
        customEntryRow.add_suffix(addCustomButton);
        customGroup.add(customEntryRow);
        contentBox.append(customGroup);

        // Scrolled installed apps list
        const appsGroup = new Adw.PreferencesGroup({
            title: _('Installed Applications'),
        });
        contentBox.append(appsGroup);

        const scrolled = new Gtk.ScrolledWindow({
            vexpand: true,
            hexpand: true,
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
        });
        contentBox.append(scrolled);

        const listBox = new Gtk.ListBox({
            selection_mode: Gtk.SelectionMode.NONE,
            css_classes: ['boxed-list'],
        });
        scrolled.set_child(listBox);

        // Load installed apps
        const existingRules = new Set();
        for (let i = 0; i < this._rulesList.get_n_items(); i++) {
            const r = this._rulesList.get_item(i);
            if (r) existingRules.add(r.id);
        }

        const allApps = Gio.AppInfo.get_all().filter(app => {
            return app && app.should_show() && !existingRules.has(app.get_id());
        });
        allApps.sort((a, b) => a.get_display_name().localeCompare(b.get_display_name()));

        const appRows = [];

        for (const app of allApps) {
            const row = new Adw.ActionRow({
                title: app.get_display_name(),
                subtitle: app.get_id(),
                activatable: true,
            });

            const icon = new Gtk.Image({
                pixel_size: 32,
                css_classes: ['icon-dropshadow'],
            });
            if (app.get_icon()) {
                icon.set_from_gicon(app.get_icon());
            } else {
                icon.set_from_icon_name('application-x-executable-symbolic');
            }
            row.add_prefix(icon);

            row.connect('activated', () => {
                this._rulesList.append(app.get_id(), app);
                this._close();
            });

            listBox.append(row);
            appRows.push({ row, app });
        }

        searchEntry.connect('search-changed', () => {
            const query = searchEntry.get_text().toLowerCase().trim();
            for (const { row, app } of appRows) {
                if (!query) {
                    row.set_visible(true);
                    continue;
                }
                const name = app.get_display_name().toLowerCase();
                const id = app.get_id().toLowerCase();
                const desc = (app.get_description() || '').toLowerCase();
                const matches = name.includes(query) || id.includes(query) || desc.includes(query);
                row.set_visible(matches);
            }
        });

        if (this._dialog.set_child) {
            this._dialog.set_child(toolbarView);
        } else if (this._dialog.set_content) {
            this._dialog.set_content(toolbarView);
        }
    }

    present() {
        if (this._dialog.present) {
            this._dialog.present(this._parent);
        } else {
            this._dialog.show();
        }
    }

    _close() {
        if (this._dialog.close) {
            this._dialog.close();
        } else if (this._dialog.destroy) {
            this._dialog.destroy();
        }
    }
}

export default class AutoMovePrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        this.initTranslations();
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();

        // General Settings Group
        const generalGroup = new Adw.PreferencesGroup({
            title: _('General Settings'),
        });

        // Focus Switch Row
        const focusRow = new Adw.SwitchRow({
            title: _('Focus on New Workspace'),
            subtitle: _('Automatically switch focus to the new workspace when an application opens.'),
        });
        settings.bind('focus-new-workspace', focusRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        generalGroup.add(focusRow);

        // Ignore Empty Workspace Switch Row
        const emptyRow = new Adw.SwitchRow({
            title: _('Ignore If Current Workspace Is Empty'),
            subtitle: _('Keep the application on the current workspace if it has no other windows.'),
        });
        settings.bind('ignore-empty-workspace', emptyRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        generalGroup.add(emptyRow);

        page.add(generalGroup);

        // Application Rules Group
        const rulesList = new RulesList(settings);
        const rulesGroup = new Adw.PreferencesGroup({
            title: _('Application Rules'),
            description: _('Manage applications configured to open in a new empty workspace.'),
        });

        const addHeaderButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            tooltip_text: _('Add application rule'),
            css_classes: ['suggested-action'],
        });
        addHeaderButton.connect('clicked', () => {
            const dialog = new AddRuleDialog(window, rulesList);
            dialog.present();
        });
        rulesGroup.set_header_suffix(addHeaderButton);

        const listBox = new Gtk.ListBox({
            selection_mode: Gtk.SelectionMode.NONE,
            css_classes: ['boxed-list'],
        });
        rulesGroup.add(listBox);

        listBox.bind_model(rulesList, item => new RuleRow(item, rulesList));

        page.add(rulesGroup);
        window.add(page);
    }
}