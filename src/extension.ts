import * as vscode from 'vscode';
import { uIOhook } from 'uiohook-napi';
import { SubscriptionService } from './services/subscriptionService';
import { CommandCounter } from './main/counter/commandCounter';
import * as platform from './main/platform';
import { KeybindingStorage } from './main/keybindings/keybindings';
import { KeyLogger } from './main/keylogging/KeyLogger';
import { logger } from './main/logging';

export function activate(context: vscode.ExtensionContext) {
	logger.info("activating extension...");

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

	const keybindingStorage = new KeybindingStorage(platform.get());
	const commandCounter = new CommandCounter(keybindingStorage, keyLogger);
	const subscriptionService = new SubscriptionService(commandCounter);
	subscriptionService.listenForPossibleShortcutActions();
	logger.info("extension activated!");
}

export function deactivate() {
	logger.info("deactivating extension...");
	uIOhook.stop();
	logger.info("extension deactivated!");
}
