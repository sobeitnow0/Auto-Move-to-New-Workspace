#!/bin/bash

# Define paths
UUID="auto-move-new-workspace@sobeitnow"
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
SRC_DIR="$(dirname "$(realpath "$0")")"

echo "=== Installer for Auto Move to New Workspace ==="
echo "Source: $SRC_DIR"
echo "Destination: $TARGET_DIR"

# Create the target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Copy extension files to the GNOME Shell extension directory
echo "Copying files to GNOME Shell extension directory..."
cp -r "$SRC_DIR/metadata.json" "$TARGET_DIR/"
cp -r "$SRC_DIR/extension.js" "$TARGET_DIR/"
cp -r "$SRC_DIR/prefs.js" "$TARGET_DIR/"
mkdir -p "$TARGET_DIR/schemas"
cp "$SRC_DIR/schemas/"*.xml "$TARGET_DIR/schemas/"

# Compile GSettings schemas in the target directory
echo "Compiling GSettings schemas..."
glib-compile-schemas "$TARGET_DIR/schemas/"

# Copy logo if it exists
if [ -f "$SRC_DIR/logo.png" ]; then
    cp "$SRC_DIR/logo.png" "$TARGET_DIR/"
fi

echo "Installation successfully completed!"
echo "--------------------------------------------------"
echo "To enable the extension:"
echo "1. On Wayland: Restart your session (Log Out / Log In) or open the 'Extensions' app (gnome-extensions-app)."
echo "2. On X11: Press Alt + F2, type 'r' and press Enter to restart GNOME Shell."
echo "3. To enable via terminal, run:"
echo "   gnome-extensions enable $UUID"
echo "4. To open preferences via terminal, run:"
echo "   gnome-extensions prefs $UUID"
echo "--------------------------------------------------"
