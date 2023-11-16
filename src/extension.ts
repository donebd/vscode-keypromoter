import { uIOhook } from 'uiohook-napi';
import * as vscode from 'vscode';
import { CommandCounter } from './main/counter/commandCounter';
import { FileHelper } from './main/helper/fileHelper';
import { KeybindingStorage } from './main/keybindings/keybindings';
import { KeyLogger } from './main/keylogging/KeyLogger';
import * as logging from './main/logging';
import { logger } from './main/logging';
import * as platform from './main/platform';
import { SubscriptionService } from './services/subscriptionService';
import * as configuration from './main/configuration';

export function activate(context: vscode.ExtensionContext) {
	initLogging(context);

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
	const fileHelper = new FileHelper();
	const subscriptionService = new SubscriptionService(commandCounter, fileHelper);
	subscriptionService.listenForPossibleShortcutActions();
	logger.info("extension activated!");
}

export function deactivate() {
	logger.info("deactivating extension...");
	uIOhook.stop();
	logger.info("extension deactivated!");
}

function initLogging(context: vscode.ExtensionContext) {
	function setLogLevel() {
		let logLevel = configuration.getLogLevel();
		logging.setLevel(logLevel);
	}
	logging.init(vscode.window.createOutputChannel("Key Promoter", "log"));
	setLogLevel();
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (configuration.didAffectLogLevel(e)) {
				setLogLevel();
			}
		})
	);
}
