# Privacy Policy - Key Promoter Extension

## Data Collection
This extension **does NOT collect, store, or transmit any data**.

## How It Works
- Monitors keyboard shortcuts **locally only** within VS Code
- Compares your actions with available keybindings
- All processing happens **in-memory** on your computer
- **No logs are written to disk**
- **No network requests are made**

### Focus-Aware Monitoring

**Privacy Enhancement:** Keyboard monitoring is **automatically paused** when VS Code loses focus.

- **Only monitors when VS Code is active** - No keyboard events are processed when you're using other applications
- **Automatic pause/resume** - Seamlessly stops when you switch apps, resumes when you return

This ensures the extension only monitors shortcuts within VS Code itself, never in your browser, terminal, or other applications.

## Permissions
The extension requires keyboard event access only to:
- Detect when you perform actions without shortcuts
- Suggest the corresponding keyboard shortcut

## Open Source
Full source code: https://github.com/donebd/vscode-keypromoter
