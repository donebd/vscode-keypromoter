import * as vscode from 'vscode';
import * as configuration from './configuration';
import { TYPES } from './di/identifiers';
import { diContainer, setupExtensionDependencies } from './di/inversify.config';
import { EditorActionTracker } from './editorActionTracker/editorActionTracker';
import { ArrowNavigationPattern } from './editorActionTracker/patterns/arrowNavigationPattern';
import { LineDeletePattern } from './editorActionTracker/patterns/lineDeletePattern';
import { LineDuplicationPattern } from './editorActionTracker/patterns/lineDuplicationPattern';
import { LineMovementPattern } from './editorActionTracker/patterns/lineMovementPattern';
import { TextSelectionNavigationPattern } from './editorActionTracker/patterns/textSelectionNavigationPattern';
import { WordDeletePattern } from './editorActionTracker/patterns/wordDeletePattern';
import { WordSelectionPattern } from './editorActionTracker/patterns/wordSelectionPattern';
import * as logging from './helper/logging';
import { logger } from './helper/logging';
import * as platform from './helper/platform';
import { KeybindingTracker } from './keybindingTracker/keybindingTracker';
import { PluginContext } from './pluginContext';
import { KeybindingStorage } from './services/keybindingStorage';
import { registerKeyboardTestPanel } from './services/keyboardTestPanel';
import { SubscriptionService } from './services/subscriptionService';

export function activate(context: vscode.ExtensionContext) {
	initLogging(context);
	logger.info("activating extension...");

	const osPlatform = platform.get();
	setupExtensionDependencies(osPlatform);

	if (configuration.getPluginEnabled()) {
		initializeKeybindingTracker();

		if (configuration.getEditorActionsEnabled()) {
			initializeEditorActionTracker(context);
		}
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
	listenEditorActionsEnabledChanges(context);
	listenWindowFocusChanges(context);
	registerKeyboardTestPanel(context);

	logger.info("extension activated!");
}

export function deactivate() {
	PluginContext.dispose();
}

function initializeEditorActionTracker(context: vscode.ExtensionContext): void {
	if (PluginContext.hasEditorActionTracker()) {
		logger.info("editor action tracker already initialized");
		return;
	}

	try {
		const tracker = diContainer.get<EditorActionTracker>(TYPES.EditorActionTracker);

		// Create patterns and inject tracker reference
		const lineDeletePattern = new LineDeletePattern();
		lineDeletePattern.setTrackerReference(tracker);

		const wordDeletePattern = new WordDeletePattern();
		wordDeletePattern.setTrackerReference(tracker);

		const lineMovementPattern = new LineMovementPattern();
		lineMovementPattern.setTrackerReference(tracker);

		const lineDuplicationPattern = new LineDuplicationPattern();
		lineDuplicationPattern.setTrackerReference(tracker);

		const wordSelectionPattern = new WordSelectionPattern();
		wordSelectionPattern.setTrackerReference(tracker);

		const arrowNavigationPattern = new ArrowNavigationPattern();
		arrowNavigationPattern.setTrackerReference(tracker);

		const textSelectionPattern = new TextSelectionNavigationPattern();
		textSelectionPattern.setTrackerReference(tracker);

		// Register patterns
		tracker.registerPattern(lineDeletePattern);
		tracker.registerPattern(wordDeletePattern);
		tracker.registerPattern(lineMovementPattern);
		tracker.registerPattern(lineDuplicationPattern);
		tracker.registerPattern(wordSelectionPattern);
		tracker.registerPattern(arrowNavigationPattern);
		tracker.registerPattern(textSelectionPattern);

		tracker.start();
		PluginContext.setEditorActionTracker(tracker);

		context.subscriptions.push({
			dispose: () => {
				if (PluginContext.hasEditorActionTracker()) {
					PluginContext.getEditorActionTracker()?.dispose();
				}
			}
		});

		logger.info("editor action tracker initialized successfully");
	} catch (error) {
		logger.error(`failed to initialize editor action tracker: ${error}`);
	}
}

function disposeEditorActionTracker(): void {
	if (PluginContext.hasEditorActionTracker()) {
		logger.info("disposing editor action tracker");
		const tracker = PluginContext.getEditorActionTracker();
		if (tracker) {
			tracker.dispose();
			PluginContext.setEditorActionTracker(undefined);
		}
	}
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
		PluginContext.setKeybindingTracker(undefined);
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

					if (configuration.getEditorActionsEnabled()) {
						initializeEditorActionTracker(context);
					}

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
					disposeEditorActionTracker();
					vscode.window.showInformationMessage(
						"Key Promoter disabled. The extension will no longer monitor keyboard shortcuts."
					);
				}
			}
		})
	);
}

function listenEditorActionsEnabledChanges(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (configuration.didAffectEditorActionsEnabled(e)) {
				const isEnabled = configuration.getEditorActionsEnabled();
				logger.info(`editor actions enabled setting changed to: ${isEnabled}`);

				if (isEnabled && configuration.getPluginEnabled()) {
					initializeEditorActionTracker(context);
					vscode.window.showInformationMessage(
						"Editor action tips enabled. The extension will now suggest shortcuts for editing patterns."
					);
				} else {
					disposeEditorActionTracker();
					if (!isEnabled) {
						vscode.window.showInformationMessage(
							"Editor action tips disabled."
						);
					}
				}
			}
		})
	);
}

function listenWindowFocusChanges(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.window.onDidChangeWindowState((windowState) => {
			if (!PluginContext.hasKeybindingTracker() && !PluginContext.hasEditorActionTracker()) {
				return;
			}

			if (windowState.focused) {
				logger.debug("VS Code window gained focus - resuming monitoring");
				PluginContext.resume();
			} else {
				logger.debug("VS Code window lost focus - pausing monitoring");
				PluginContext.pause();
			}
		})
	);

	if (!vscode.window.state.focused && (PluginContext.hasKeybindingTracker() || PluginContext.hasEditorActionTracker())) {
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
