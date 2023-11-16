# Key Promoter

Extension that helps you to learn shortcuts while you are working.

## Features

![example](img/key_promoter.gif)

* When you use the mouse on a button inside the editor, the extension will shows you the keyboard shortcut that you should have used instead.

* For buttons that don't have a shortcut, the extension prompts you with the possibility to directly create one by opening the menu.

## Extension Settings

|Name|Description|Default|
|-|-|-|
|`keypromoter.loyaltyLevel`|Number of command executions using mouse before notification|`5`|
|`keypromoter.ignoredCommands`|List of commands that will not be processed by the extension|`[]`|
|`keypromoter.suggestKeybindingCreation`|Specifies whether to suggest creation of keybindings for commands without them|`true`|
|`keypromoter.logger.loggingLevel`|Control logging level|`"Info"`|

## Limitations

* Some of the default editor actions are not supported
* Other extensions commands are not supported

## Installation

(**SOON**)

## Troubleshooting

Use `Key Promoter` output panel to see logs. You can change log level in settings.

![troubleshooting](img/troubleshooting.png)
