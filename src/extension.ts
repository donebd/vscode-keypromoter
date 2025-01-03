import * as vscode from 'vscode';
import * as configuration from './configuration';
import { TYPES } from './di/identifiers';
import { diContainer, setupExtensionDependencies } from './di/inversify.config';
import * as logging from './helper/logging';
import { logger } from './helper/logging';
import * as platform from './helper/platform';
import { KeyLogger } from './keylogger/keyLogger';
import { PluginContext } from './pluginContext';
import { KeybindingStorage } from './services/keybindingStorage';
import { SubscriptionService } from './services/subscriptionService';

export function activate(context: vscode.ExtensionContext) {
	initLogging(context);
	logger.info("activating extension...");
	const _platform = platform.get();
	setupExtensionDependencies(_platform);

	const keyLogger = diContainer.get<KeyLogger>(TYPES.KeyLogger);
	keyLogger.init();
	const keybindingStorage = diContainer.get<KeybindingStorage>(TYPES.KeybindingStorage);
	const subscriptionService = diContainer.get<SubscriptionService>(TYPES.SubscriptionService);
	const disposables = subscriptionService.listenForPossibleShortcutActions();

	disposables.then((disposables) => {
		context.subscriptions.push(...disposables);
	});
	listenNewKeybindings(context, keybindingStorage);

	PluginContext.init(keyLogger);
	logger.info("extension activated!");
}

export function deactivate() {
	PluginContext.dispose();
}

function listenNewKeybindings(context: vscode.ExtensionContext, keybindingStorage: KeybindingStorage) {
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument((event) => {
			if (event.fileName === keybindingStorage.userKeybindingsPath) {
				logger.info("User keybinding change detected");
				keybindingStorage.updateKeybindings();
			}
		})
	);
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
