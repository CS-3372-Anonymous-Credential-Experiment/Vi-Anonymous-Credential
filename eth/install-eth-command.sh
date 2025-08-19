#!/bin/bash

# Install eth command globally
# This script creates a symlink to make 'eth' available system-wide

echo "🔧 Installing eth command globally..."

# Get the current directory
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ETH_SCRIPT="$CURRENT_DIR/eth"

# Check if eth script exists
if [ ! -f "$ETH_SCRIPT" ]; then
    echo "❌ Error: eth script not found in $CURRENT_DIR"
    exit 1
fi

# Make sure eth script is executable
chmod +x "$ETH_SCRIPT"

# Create symlink in /usr/local/bin (requires sudo)
if [ -w "/usr/local/bin" ]; then
    # If we can write to /usr/local/bin directly
    if [ -L "/usr/local/bin/eth" ]; then
        echo "🔄 Updating existing symlink..."
        rm "/usr/local/bin/eth"
    fi
    ln -s "$ETH_SCRIPT" "/usr/local/bin/eth"
    echo "✅ eth command installed to /usr/local/bin/eth"
else
    # If we need sudo
    echo "🔐 Need sudo to install globally..."
    if [ -L "/usr/local/bin/eth" ]; then
        sudo rm "/usr/local/bin/eth"
    fi
    sudo ln -s "$ETH_SCRIPT" "/usr/local/bin/eth"
    echo "✅ eth command installed to /usr/local/bin/eth"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "You can now use:"
echo "  eth start          # Start the network"
echo "  eth status         # Check status"
echo "  eth test           # Test network"
echo "  eth help           # Show all commands"
echo ""
echo "The command is available globally from any directory."
