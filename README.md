# Key Promoter

Extension that helps you to learn shortcuts while you are working.

## Features

![example](img/key_promoter.gif)

* When you use the mouse on a button inside the editor, the extension will shows you the keyboard shortcut that you should have used instead.

* For buttons that don't have a shortcut, the extension prompts you with the possibility to directly create one by opening the menu.

## Extension Settings

|Name|Description|Default|
|-|-|-|
|`Key Promoter.loyaltyLevel`|Number of command executions using mouse before notification|`5`|
|`Key Promoter.ignoredCommands`|List of commands that will not be processed by the extension|`[]`|
|`Key Promoter.suggestKeybindingCreation`|Specifies whether to suggest creation of keybindings for commands without them|`true`|
|`Key Promoter.logger.loggingLevel`|Control logging level|`"Info"`|

## Limitations

* Some of the default editor actions are not supported
* Other extensions commands are not supported

## Installation

(**SOON**)

## Manual installation

1. Clone repo:
```
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
