# 🚀 Auto Move to New Workspace

A powerful GNOME Shell extension that intelligently manages your workspaces by automatically moving windows of selected applications to dedicated spaces.

## Overview

Unlike traditional extensions that bind applications to fixed workspace numbers, **Auto Move to New Workspace** embraces GNOME's **dynamic workspace philosophy**. It ensures your focused applications always have their own isolated space, automatically creating new workspaces as needed without cluttering your workspace list with empty gaps.

**Perfect for:** developers, power users, and anyone who wants to organize their workflow by application without manual workspace juggling.

## ✨ Key Features

- **🔄 Smart Dynamic Allocation** – Reuses the last empty workspace or creates a new one, keeping your workspace list clean
- **👁️ Flexible Focus Control** – Choose whether the extension switches focus to the new workspace or keeps you on the current one (background mode)
- **⚙️ Per-App Configuration** – Set individual apps to open in the foreground or background with per-app toggle switches
- **🪟 Tiling Manager Compatible** – Works seamlessly alongside Mosaic, Forge, Pop Shell, and other tiling extensions
- **👶 Smart Child Window Handling** – Dialogs, popovers, and file dialogs stay with their parent application window
- **🛡️ Loop Protection** – Prevents infinite workspace creation loops from stalled or hung applications
- **⌨️ Lightweight & Efficient** – Minimal performance impact on your GNOME Shell

## 📋 Requirements

- **GNOME Shell** 42 or later
- **X11** or **Wayland** (both supported)
- Linux distribution with GNOME 42+

## 📦 Installation

### Option 1: Manual Installation (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sobeitnow0/Auto-Move-to-New-Workspace.git
   cd Auto-Move-to-New-Workspace
   ```

2. **Copy to GNOME Extensions directory:**
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions
   cp -r . ~/.local/share/gnome-shell/extensions/auto-move-new-workspace@sobeitnow/
   ```

3. **Compile GSettings schemas:**
   ```bash
   cd ~/.local/share/gnome-shell/extensions/auto-move-new-workspace@sobeitnow/schemas
   glib-compile-schemas .
   ```

4. **Restart GNOME Shell:**
   - **X11:** Press `Alt` + `F2`, type `r`, press `Enter`
   - **Wayland:** Log out and log back in

5. **Enable the extension:**
   ```bash
   gnome-extensions enable auto-move-new-workspace@sobeitnow
   ```

6. **Verify installation:**
   ```bash
   gnome-extensions list | grep auto-move
   ```

### Option 2: GNOME Extensions Website

Coming soon to [GNOME Shell Extensions](https://extensions.gnome.org).

## 🎯 Quick Start

1. Open **Activities** → Search for **"Extensions"** → Launch the Extensions app
2. Find **"Auto Move to New Workspace"** and click the ⚙️ gear icon to open settings
3. Click the **➕ Add** button to select applications
4. Configure each app:
   - **Background Mode**: Toggle to keep the app in the background (don't switch focus)
   - **Global Focus Toggle**: Top toggle controls automatic focus switching for all apps

### Example Workflow

Let's say you want VS Code to open in a new workspace automatically:

1. Add `code` to the application list
2. Leave "Background Mode" **OFF** (focus will follow)
3. Every time you open VS Code, it will:
   - Move to an empty workspace (or create one)
   - Automatically switch your focus there

## 🔧 How It Works

### Workspace Reuse Logic

When you open a configured application:

1. **Check Last Workspace** – The extension checks if the last workspace is empty
2. **Reuse or Create** – If empty, it reuses that workspace; otherwise, creates a new one
3. **Move Window** – Moves the application window to the selected workspace
4. **Handle Focus** – Either switches your focus to follow or keeps you on the current workspace

### Child Window Handling

The extension automatically detects and keeps child windows (dialogs, file browsers, modals) with their parent:
- File save/open dialogs
- Application popups and notifications
- Login windows and authentication dialogs
- Search boxes and utility windows

## ⚙️ Configuration

### Via GUI (Recommended)

All settings are available through the GNOME Extensions app. No command-line needed.

### Via dconf (Advanced)

For power users, settings are stored in:
```
/org/gnome/shell/extensions/auto-move-new-workspace/
```

Key settings:
- `application-list` – List of applications to monitor
- `focus-follows` – Whether focus automatically switches to new workspace
- `background-mode-apps` – Apps configured to open in background

View all settings:
```bash
dconf dump /org/gnome/shell/extensions/auto-move-new-workspace/
```

Edit directly:
```bash
dconf write /org/gnome/shell/extensions/auto-move-new-workspace/focus-follows true
```

## 🐛 Troubleshooting

### Application Not Being Detected

**Problem:** You added an app, but it's not being moved to a new workspace.

**Solution:**
1. Open **Looking Glass** debugger: Press `Alt` + `F2`, type `lg`, press `Enter`
2. In the REPL tab, run:
   ```javascript
   global.display.get_focus_window().get_wm_class()
   ```
   Make sure the application window is focused first
3. Copy the output and use that exact string in the extension settings

**Example:** An app might report `Chromium` but open as `google-chrome`:
```bash
# Identify the correct wmclass
xdotool getactivewindow getwindowname
```

### Focus Not Switching

**Possible causes:**
- Global focus toggle is OFF – Check the top toggle in settings
- Background mode is ON for that app – Disable it if you want focus to follow
- Another extension is interfering – Try disabling other workspace extensions

### Extension Not Loading

**Check the logs:**
```bash
journalctl /usr/bin/gnome-shell -f
```

Look for errors related to `auto-move-new-workspace`.

**Common fixes:**
- Ensure GNOME Shell version is 42+: `gnome-shell --version`
- Recompile schemas and restart GNOME Shell
- Check file permissions: `chmod -R 755 ~/.local/share/gnome-shell/extensions/auto-move-new-workspace@sobeitnow/`

### Too Many Workspaces Being Created

**Solution:**
- Enable "Background Mode" for less-important apps to prevent focus switches
- Reduce the number of monitored applications
- Check that the loop protection is working (should prevent runaway workspace creation)

### Performance Issues

If GNOME Shell feels sluggish:
- Reduce the number of monitored applications
- Check for conflicting tiling extensions
- Monitor CPU/memory: `gnome-system-monitor`

## 🔗 Related Projects

- **Original Extension** – [Auto Move Windows](https://extensions.gnome.org/extension/2738/auto-move-windows/)
- **Workspace Alternatives:**
  - [Mosaic](https://extensions.gnome.org/extension/5114/mosaic/) – Tiling window manager
  - [Forge](https://extensions.gnome.org/extension/4481/forge/) – Advanced window management
  - [Pop Shell](https://github.com/system76/pop-shell) – Pop!_OS tiling shell

## 📝 License

This project is licensed under the **GNU General Public License v2.0 or later** (GPL-2.0-or-later).

See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** – Open an [issue](https://github.com/sobeitnow0/Auto-Move-to-New-Workspace/issues) with:
   - GNOME Shell version
   - Steps to reproduce
   - Error logs from `journalctl`

2. **Suggest Features** – [Discussions](https://github.com/sobeitnow0/Auto-Move-to-New-Workspace/discussions) are open for feature requests

3. **Submit Code** – Fork, make changes, and submit a pull request

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/sobeitnow0/Auto-Move-to-New-Workspace/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/sobeitnow0/Auto-Move-to-New-Workspace/discussions)
- 📧 **Direct Contact**: Check GitHub profile

## 🙏 Acknowledgments

- Inspired by the original [Auto Move Windows](https://extensions.gnome.org/extension/2738/auto-move-windows/) extension
- Built for modern GNOME workflows and dynamic workspace management
- Thanks to the GNOME community and extension developers

---

**Made with ❤️ for GNOME Shell**
