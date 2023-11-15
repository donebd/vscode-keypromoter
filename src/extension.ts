import * as vscode from 'vscode';
import { uIOhook } from 'uiohook-napi';
import { SubscriptionService } from './services/subscriptionService';
import { CommandCounter } from './main/counter/commandCounter';
import * as platform from './main/platform';
import { KeybindingStorage } from './main/keybindings/keybindings';
import { KeyLogger } from './main/keylogging/KeyLogger';

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
	const commandCounter = new CommandCounter(keybindingStorage, keyLogger);
	const subscriptionService = new SubscriptionService(commandCounter);
	subscriptionService.listenForPossibleShortcutActions();
}

export function deactivate() {
	uIOhook.stop();
}
