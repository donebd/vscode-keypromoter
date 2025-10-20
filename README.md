# Key Promoter

Extension that helps you to learn keyboard shortcuts while you are working.

> **Note:** The current VSCode API does not allow the plugin to be implemented in full. Therefore, the plugin was implemented as a workaround and partially tracks user actions by indirect signs.

If you have any problems or want to participate in the development, welcome to the [project repository on GitHub](https://github.com/donebd/vscode-keypromoter).

## 🔒 Privacy & Security Notice

✅ **100% Local Processing** - No data leaves your computer  
✅ **Open Source** - [Fully auditable code](https://github.com/donebd/vscode-keypromoter)  
✅ **No Telemetry** - Zero data collection  
✅ **In-Memory Only** - No logs written to disk  
✅ **Focus-Aware** - Automatically pauses when VS Code loses focus (only monitors within VS Code)

**[Read our Privacy Policy](PRIVACY.md)** | **No data collection** | **Local processing only**

> **For antivirus users:** This extension monitors keyboard events to suggest shortcuts. Some antivirus software may flag this as "keylogger-like" behavior, but the extension is completely safe and transparent. You can review the source code at any time.

## Features

![example](img/key_promoter.gif)

* When you use the mouse on a button inside the editor, the extension shows you the keyboard shortcut that you should have used instead.

* For buttons that don't have a shortcut, the extension prompts you with the possibility to directly create one by opening the keybindings menu.

## Extension Settings

|Setting|Description|Default|
|-|-|-|
|`Key Promoter.enabled`|**Enable/disable keyboard shortcut detection**<br>The extension monitors keyboard events locally to detect mouse usage patterns. If disabled, the extension will not function.|`true`|
|`Key Promoter.loyaltyLevel`|Number of mouse-based command executions before showing notification|`5`|
|`Key Promoter.ignoredCommands`|Commands that will not trigger notifications|`["type"]`|
|`Key Promoter.suggestKeybindingCreation`|Suggest creating custom shortcuts for commands without them|`true`|
|`Key Promoter.logger.loggingLevel`|Logging level for troubleshooting (`Error`, `Warn`, `Info`, `Debug`)|`"Info"`|

### 🔧 About the "enabled" Setting

This setting exists because:
- Some antivirus software flags keyboard monitoring as suspicious behavior
- You may want to temporarily disable the extension without uninstalling it
- Provides transparency and user control over keyboard event monitoring

**⚠️ Important:** If you disable this setting, the extension will not work at all, as it cannot suggest shortcuts without monitoring your keyboard usage.

## Notes

* **For macOS users:** You may need to grant permission for the extension to monitor keyboard shortcuts (System Preferences → Security & Privacy → Privacy → Accessibility)

![MacOS permission](img/MacOs_permission.jpg)
 
## Limitations

* Some default editor actions are not supported
* Other extensions' commands are not supported
* May have issues on Linux Wayland
* There may be incorrect behavior when working via WSL

## Manual Installation

1. Clone the repository:
```bash
git clone git@github.com:donebd/vscode-keypromoter.git
```
2. Write in terminal:
```
npm run build
```
3. Install builded .vsix file

![Manual .vsix installation](img/manual_vsix_installation.jpg)

## Troubleshooting

Use `Key Promoter` output panel to see logs. You can change log level in settings.

![Troubleshooting](img/troubleshooting.png)
