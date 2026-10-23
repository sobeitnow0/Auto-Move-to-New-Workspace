# Auto Move to New Workspace

A GNOME Shell extension that automatically moves new windows of selected applications
to a new empty workspace.

> [!NOTE]
> **Notice regarding GNOME Extensions (EGO):**
> This project was developed with the assistance of Artificial Intelligence (AI). In adherence to GNOME Extensions' submission guidelines and review policies regarding AI-assisted code, **this extension will not be submitted to extensions.gnome.org (EGO)**. It is maintained directly on GitHub for manual installation and community use via Git or releases.

Unlike the original extension which binds apps to fixed workspace numbers, this
extension embraces GNOME's **dynamic workspace** philosophy. It ensures that your
focused apps always get their own isolated space, automatically creating new
workspaces when needed without leaving empty gaps.

## Features

- **Dynamic Workspace Allocation** – Automatically reuses the last workspace if empty, or creates a new one at the end. Also respects static workspaces if dynamic workspaces are disabled.
- **Ignore Empty Workspace** – If the current workspace is already empty, the application stays on the current workspace instead of creating an unnecessary extra workspace.
- **Focus Control** – Choose whether focus follows the window to the new workspace or stays on your current workspace.
- **Per-App Background Toggle** – Set individual apps to open silently in the background without switching workspaces or causing screen flicker.
- **Per-App Auto-Maximize** – Automatically maximize the window once moved to the new workspace.
- **Custom WM_CLASS & App ID Support** – Support for Flatpaks, Steam games, Wine apps, and custom scripts right from the preferences dialog without touching `dconf`.
- **Tiling Manager Compatible** – Works seamlessly alongside Mosaic, Forge, Pop Shell, PaperWM, and GNOME Shell tiling.
- **Smart Child Window Handling** – Dialogs, file pickers, and "Save As" windows stay with their parent application.
- **Multi-Monitor Safe** – Respects Mutter's `workspaces-only-on-primary` setting.
- **Modern Libadwaita Interface** – Clean, native settings dialog compatible with GNOME 45 through 51+.
- **Internationalization (i18n)** – Built-in gettext localization support (English and Brazilian Portuguese included).

## Compatibility

- **GNOME Shell:** 45, 46, 47, 48, 49, 50, 51+
- **Display Server:** Wayland and X11

## Installation

### Automated Installer

Run the included installer script:
```bash
./install.sh
```

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sobeitnow0/Auto-Move-to-New-Workspace.git
   cd Auto-Move-to-New-Workspace
   ```

2. Copy files to the GNOME Shell extensions directory:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/auto-move-new-workspace@sobeitnow
   cp -r metadata.json extension.js prefs.js schemas locale ~/.local/share/gnome-shell/extensions/auto-move-new-workspace@sobeitnow/
   ```

3. Compile the GSettings schema:
   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/auto-move-new-workspace@sobeitnow/schemas/
   ```

4. Restart GNOME Shell:
   - **X11:** Press `Alt` + `F2`, type `r`, and press `Enter`.
   - **Wayland:** Log out and log back in, or restart the session.

5. Enable the extension:
   ```bash
   gnome-extensions enable auto-move-new-workspace@sobeitnow
   ```

## Usage

1. Open **Extensions** app (or run `gnome-extensions prefs auto-move-new-workspace@sobeitnow`).
2. Click the **+** (Add) button in the Application Rules section.
3. Search and select any installed application, or type a custom WM_CLASS / App ID.
4. Customize per-app behaviors:
   - **Background Mode** (hide icon): Keeps focus on your current workspace when the app opens.
   - **Auto-Maximize** (maximize icon): Automatically maximizes the application window on its new workspace.
   - **Delete** (trash icon): Removes the application rule.

## Packaging

To create a clean package zip for GitHub Releases or manual distribution:

```bash
./package.sh
```

## License

GNU General Public License v2.0 or later (GPL-2.0-or-later).
