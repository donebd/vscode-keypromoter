import * as vscode from 'vscode';
import * as configuration from './configuration';
import { TYPES } from './di/identifiers';
import { diContainer, setupExtensionDependencies } from './di/inversify.config';
import * as logging from './helper/logging';
import { logger } from './helper/logging';
import * as platform from './helper/platform';
import { KeybindingTracker } from './keybindingTracker/keybindingTracker';
import { PluginContext } from './pluginContext';
import { KeybindingStorage } from './services/keybindingStorage';
import { SubscriptionService } from './services/subscriptionService';

export function activate(context: vscode.ExtensionContext) {
	initLogging(context);
	logger.info("activating extension...");

	const osPlatform = platform.get();
	setupExtensionDependencies(osPlatform);

	// Initialize keyboard shortcut detector if enabled
	// NOTE: All keyboard events are processed locally and never leave your computer
	// Monitoring is automatically paused when VS Code loses focus
	if (configuration.getPluginEnabled()) {
		initializeKeybindingTracker();
	} else {
		showDisabledNotification();
	}

	const keybindingStorage = diContainer.get<KeybindingStorage>(TYPES.KeybindingStorage);
	const subscriptionService = diContainer.get<SubscriptionService>(TYPES.SubscriptionService);
	const disposables = subscriptionService.listenForPossibleShortcutActions();

	disposables.then((disposables) => {
		context.subscriptions.push(...disposables);
	});
	
	listenNewKeybindings(context, keybindingStorage);
	listenPluginEnabledChanges(context);
	listenWindowFocusChanges(context);

	logger.info("extension activated!");
}

export function deactivate() {
	PluginContext.dispose();
}

function initializeKeybindingTracker(): void {
	if (PluginContext.hasKeybindingTracker()) {
		logger.info("keybinding tracker already initialized");
		return;
	}
	
	try {
		const tracker = diContainer.get<KeybindingTracker>(TYPES.KeybindingTracker);
		tracker.init();
		PluginContext.setKeybindingTracker(tracker);
		logger.info("keybinding tracker initialized successfully");
	} catch (error) {
		logger.error(`failed to initialize keybinding tracker: ${error}`);
		vscode.window.showErrorMessage(
			"Key Promoter: Failed to initialize keyboard shortcut detection. Check the output panel for details."
		);
	}
}

function disposeKeybindingTracker(): void {
	if (PluginContext.hasKeybindingTracker()) {
		logger.info("disposing keybinding tracker");
		PluginContext.dispose();
	}
}

function showDisabledNotification(): void {
	logger.info("plugin is disabled, showing notification");
	
	const message = "Key Promoter is currently disabled. " +
		"The extension needs to monitor keyboard shortcuts to suggest better workflow. " +
		"All processing is done locally on your computer - no data is collected or transmitted.";
	
	vscode.window.showInformationMessage(
		message,
		"Enable Plugin",
		"Learn More"
	).then(selection => {
		if (selection === "Enable Plugin") {
			configuration.setPluginEnabled(true).then(() => {
				logger.info("plugin enabled by user, reloading window");
				vscode.commands.executeCommand('workbench.action.reloadWindow');
			});
		} else if (selection === "Learn More") {
			vscode.env.openExternal(
				vscode.Uri.parse("https://github.com/donebd/vscode-keypromoter#privacy--security")
			);
		}
	});
}

function listenPluginEnabledChanges(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (configuration.didAffectPluginEnabled(e)) {
				const isEnabled = configuration.getPluginEnabled();
				logger.info(`plugin enabled setting changed to: ${isEnabled}`);
				
				if (isEnabled) {
					initializeKeybindingTracker();
					vscode.window.showInformationMessage(
						"Key Promoter enabled. Reloading window is recommended for full functionality.",
						"Reload Window",
						"Later"
					).then(selection => {
						if (selection === "Reload Window") {
							vscode.commands.executeCommand('workbench.action.reloadWindow');
						}
					});
				} else {
					disposeKeybindingTracker();
					vscode.window.showInformationMessage(
						"Key Promoter disabled. The extension will no longer monitor keyboard shortcuts."
					);
				}
			}
		})
	);
}

function listenWindowFocusChanges(context: vscode.ExtensionContext): void {
	// Track window focus state to pause/resume keyboard monitoring
	// This ensures we only listen to keyboard events when VS Code is active
	context.subscriptions.push(
		vscode.window.onDidChangeWindowState((windowState) => {
			if (!PluginContext.hasKeybindingTracker()) {
				return;
			}

			if (windowState.focused) {
				logger.debug("VS Code window gained focus - resuming keyboard monitoring");
				PluginContext.resume();
			} else {
				logger.debug("VS Code window lost focus - pausing keyboard monitoring");
				PluginContext.pause();
			}
		})
	);

	// Handle initial state - if window is not focused on activation, start paused
	if (!vscode.window.state.focused && PluginContext.hasKeybindingTracker()) {
		logger.info("VS Code window not focused on activation - starting in paused state");
		PluginContext.pause();
	}
}

function listenNewKeybindings(context: vscode.ExtensionContext, keybindingStorage: KeybindingStorage): void {
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument((event) => {
			if (event.fileName === keybindingStorage.userKeybindingsPath) {
				logger.info("User keybinding change detected");
				keybindingStorage.updateKeybindings();
			}
		})
	);
}

function initLogging(context: vscode.ExtensionContext): void {
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
