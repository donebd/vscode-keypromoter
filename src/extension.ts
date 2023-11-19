import * as vscode from 'vscode';
import * as configuration from './configuration';
import { FileHelper } from './helper/fileHelper';
import * as logging from './helper/logging';
import { logger } from './helper/logging';
import * as platform from './helper/platform';
import { KeyLogger } from './keylogger/keyLogger';
import { PluginContext } from './pluginContext';
import { CommandCounterService } from './services/commandCounterService';
import { KeybindingStorage } from './services/keybindingStorage';
import { SubscriptionService } from './services/subscriptionService';

export function activate(context: vscode.ExtensionContext) {
	initLogging(context);
	logger.info("activating extension...");

	const keyLogger = new KeyLogger();
	keyLogger.init();
	const keybindingStorage = new KeybindingStorage(platform.get());
	const commandCounter = new CommandCounterService(keybindingStorage, keyLogger);
	const fileHelper = new FileHelper();
	const subscriptionService = new SubscriptionService(commandCounter, fileHelper);
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
