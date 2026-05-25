Auto Move to New Workspace 
A GNOME Shell extension that automatically moves new windows of selected applications to a new empty workspace. 
Unlike the original extension which binds apps to fixed workspace numbers, this extension embraces GNOME’s dynamic
workspace philosophy. It ensures that your focused apps always get their own isolated space, automatically creating new
workspaces when needed without leaving empty gaps. 
Features 
Dynamic Allocation – Reuses the last workspace if empty, otherwise creates a new one.
Focus Control – Choose whether focus follows the app to the new workspace or stays on your current one
(background mode).
Per-App Background Toggle – Set individual apps to always open in the background without switching workspaces.
Tiling Manager Compatible – Works alongside Mosaic, Forge, Pop Shell, etc.
Smart Child Window Handling – Dialogs and “Save As” windows stay with their parent application.
Loop Protection – Prevents infinite workspace creation loops. 
Installation 
Manual 
Clone the repository: 
git clone https://github.com/sobeitnow0/Auto-Move-to-New-Workspace.git
 Copy to the extensions directory: 
mkdir -p ~/.local/share/gnome-shell/extensions
cp -r Auto-Move-to-New-Workspace ~/.local/share/gnome-shell/extensions/auto-move-new-workspace@sobeitnow/
 Compile the schemas: 
cd ~/.local/share/gnome-shell/extensions/auto-move-new-workspace@sobeitnow/schemas
glib-compile-schemas .
 Restart GNOME Shell: 
X11: Press Alt+F2, type r, press Enter
Wayland: Log out and log back in
Enable the extension: 
gnome-extensions enable auto-move-new-workspace@sobeitnow

Usage 
Open the Extensions app → Auto Move to New Workspace → ⚙.
Click + to add applications.
Toggle the switch next to each app for background mode (stays on current workspace).
The top toggle controls whether focus automatically follows to the new workspace. 
How it works 
When you open a configured application and it’s the only instance on your current workspace, the extension: 1. Checks if the
last workspace is empty (reuses it) or creates a new one. 2. Moves the window there. 3. Either switches focus or keeps you
where you are (configurable). 
Troubleshooting 
If an app isn’t detected (e.g., it opens a login helper window first), use GNOME Looking Glass (Alt+F2, type lg) to find the
real wmclass and add it manually via dconf: 
/org/gnome/shell/extensions/auto-move-new-workspace/application-list
License 
GNU General Public License v2.0 or later (GPL-2.0-or-later)
