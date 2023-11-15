// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { uIOhook } from 'uiohook-napi';
import { SubscriptionService } from './services/subscriptionService';
import { CommandCounter } from './main/counter/commandCounter';
import * as platform from './main/platform';
import { KeybindingStorage } from './main/keybindings/keybindings';
import { KeyLogger } from './main/keylogging/KeyLogger';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let keyLogger = new KeyLogger();
	uIOhook.on('keydown', (e) => {
		keyLogger.handleKeyDown(e.keycode);
	});
	uIOhook.on('keyup', (e) => {
		keyLogger.handleKeyUp(e.keycode);
	});
	uIOhook.on('mousedown', (_) => {
		keyLogger.handleMousePress();
	});
	uIOhook.start();

	console.log('Reading keybindings...');
	const keybindingStorage = new KeybindingStorage(platform.get());
	console.log(keybindingStorage.getKeybindingMap());
	const commandCounter = new CommandCounter(0, keybindingStorage, keyLogger);
	const subscriptionService = new SubscriptionService(commandCounter);
	subscriptionService.listenForPossibleShortcutActions();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-keypromoter.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-keypromoter!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
