import { inject, injectable } from 'inversify';
import path from 'path';
import * as vscode from 'vscode';
import * as configuration from '../configuration';
import { didAffectIgnoredCommands } from '../configuration';
import { TYPES } from '../di/identifiers';
import { FileHelper } from '../helper/fileHelper';
import { logger } from '../helper/logging';
import { WildcardMatcher } from '../helper/wildcardMatcher';
import { CommandGroup } from '../models/commandGroup';
import { PluginContext } from '../pluginContext';
import { CommandCounterService } from './commandCounterService';

@injectable()
export class SubscriptionService {

    private readonly commandIdToOverloadHandlerMap: Map<string, vscode.Disposable> = new Map();

    private readonly builtInIgnoreCommandsList = [
        "notification.expand",
        "notification.clear",
        "notification.collapse",
        "type",
        "compositionEnd",
        "compositionStart",
        "compositionType",
        "replacePreviousChar",
        "cursorLeft",
        "cursorRight",
        "cursorUp",
        "cursorDown",
        "debug.editBreakpoint",
        "workbench.debug.viewlet.action.removeBreakpoint",
        "debug.removeWatchExpression",
        "search.action",
        "quickInput.next",
        "quickInput.previous",
        "workbench.action.output.toggleOutput"
    ];

    private readonly editorActionTrackerCommands = new Set([
        "type",
        "cursorLeft",
        "cursorRight",
        "cursorUp",
        "cursorDown",
        "cursorWordLeft",
        "cursorWordRight",
        "cursorWordStartLeft",
        "cursorWordEndRight",
        "cursorHome",
        "cursorEnd",
        "cursorTop",
        "cursorBottom",
        "cursorPageUp",
        "cursorPageDown",
        "cursorWordLeftSelect",
        "cursorWordRightSelect",
        "cursorWordStartLeftSelect",
        "cursorWordEndRightSelect",
        "cursorHomeSelect",
        "cursorEndSelect",
        "deleteLeft",
        "deleteRight",
        "deleteWordLeft",
        "deleteWordRight",
        "paste",
        "cut",
        "tab",
        "outdent",
        "editor.action.insertLineAfter",
        "editor.action.insertLineBefore"
    ]);

    private recentCommands: { command: string; timestamp: number }[] = [];
    private readonly RECENT_COMMAND_WINDOW_MS = 500;

    private ignoreMatcher: WildcardMatcher;
    private configurationWatcher?: vscode.Disposable;

    constructor(
        @inject(TYPES.CommandCounterService) private readonly commandCounter: CommandCounterService,
        @inject(TYPES.FileHelper) private readonly fileHelper: FileHelper
    ) {
        this.ignoreMatcher = this.createIgnoreMatcher();
    }

    public async listenForPossibleShortcutActions(): Promise<vscode.Disposable[]> {
        const allCommandIds = await vscode.commands.getCommands(true);

        const commandIds = this.filterIgnoredCommands(allCommandIds);

        const editorTrackerCommandsToAdd = Array.from(this.editorActionTrackerCommands)
            .filter(cmd => !commandIds.includes(cmd));

        const allCommandsToListen = [...commandIds, ...editorTrackerCommandsToAdd];

        this.runtimeExecuteErrorsHandling(this.commandIdToOverloadHandlerMap);
        this.listenVscodeCommands(allCommandsToListen);

        this.configurationWatcher = vscode.workspace.onDidChangeConfiguration(e => {
            if (didAffectIgnoredCommands(e)) {
                logger.info('Ignored commands configuration changed, updating listeners');
                this.updateIgnoredCommands();
            }
        });

        const publicApiDisposables = this.listenPublicVscodeApi();
        return [...publicApiDisposables, this.configurationWatcher];
    }

    private createIgnoreMatcher(): WildcardMatcher {
        const userIgnoredCommands = configuration.getIgnoreCommands();
        const allIgnoredPatterns = [...this.builtInIgnoreCommandsList, ...userIgnoredCommands];
        logger.debug(`Creating ignore matcher with patterns: ${allIgnoredPatterns.join(', ')}`);
        return new WildcardMatcher(allIgnoredPatterns);
    }

    private filterIgnoredCommands(commandIds: string[]): string[] {
        return commandIds.filter(commandId => {
            const shouldIgnore = this.ignoreMatcher.matches(commandId);
            if (shouldIgnore) {
                logger.debug(`Command ${commandId} is ignored by pattern`);
            }
            return !shouldIgnore;
        });
    }

    private async updateIgnoredCommands(): Promise<void> {
        this.ignoreMatcher = this.createIgnoreMatcher();

        const commandsToDispose: string[] = [];
        this.commandIdToOverloadHandlerMap.forEach((handler, commandId) => {
            if (this.editorActionTrackerCommands.has(commandId)) {
                return;
            }

            if (this.ignoreMatcher.matches(commandId)) {
                logger.info(`Disposing handler for now-ignored command: ${commandId}`);
                handler.dispose();
                commandsToDispose.push(commandId);
            }
        });

        commandsToDispose.forEach(commandId => {
            this.commandIdToOverloadHandlerMap.delete(commandId);
        });

        const allCommandIds = await vscode.commands.getCommands(true);
        const commandsToRegister = allCommandIds.filter(commandId =>
            !this.ignoreMatcher.matches(commandId) &&
            !this.commandIdToOverloadHandlerMap.has(commandId)
        );

        const editorTrackerCommandsToAdd = Array.from(this.editorActionTrackerCommands)
            .filter(cmd => !this.commandIdToOverloadHandlerMap.has(cmd));

        const allToRegister = [...commandsToRegister, ...editorTrackerCommandsToAdd];

        if (allToRegister.length > 0) {
            logger.info(`Registering handlers for ${allToRegister.length} commands`);
            this.listenVscodeCommands(allToRegister);
        }
    }

    private listenVscodeCommands(commandIds: string[]) {
        const commandHandler = (commandId: string, ...args: any[]) => {
            this.commandIdToOverloadHandlerMap.get(commandId)!.dispose();
            return this.proxyCallback(commandHandler, commandId, ...args);
        };

        commandIds.forEach(commandId => {
            try {
                const overloadedHandler = vscode.commands.registerCommand(commandId, (...args: any[]) => {
                    return commandHandler(commandId, ...args);
                });
                this.commandIdToOverloadHandlerMap.set(commandId, overloadedHandler);
            } catch (e) {
                logger.debug(`command ${commandId} can't be overloaded`);
            }
        });
    }

    private trackCommandExecution(commandId: string): void {
        const now = Date.now();

        this.recentCommands = this.recentCommands.filter(
            cmd => now - cmd.timestamp < this.RECENT_COMMAND_WINDOW_MS
        );

        this.recentCommands.push({ command: commandId, timestamp: now });

        logger.debug(`Tracked command: ${commandId}, recent: ${this.recentCommands.map(c => c.command).join(', ')}`);
    }

    private wasRecentNavigationCommand(): boolean {
        const now = Date.now();
        return this.recentCommands.some(
            cmd => CommandGroup.isNavigationCommand(cmd.command) &&
                now - cmd.timestamp < this.RECENT_COMMAND_WINDOW_MS
        );
    }

    private async proxyCallback(
        proxyCommandHandler: (commandId: string, ...args: any[]) => Promise<any>,
        commandId: string,
        ...any: any[]
    ): Promise<any> {
        const pipeArgs = any;
        logger.debug(`command ${commandId} was executed!`);

        this.trackCommandExecution(commandId);

        if (this.editorActionTrackerCommands.has(commandId)) {
            this.notifyEditorActionTracker(commandId);
        }

        let result = null;
        this.commandCounter.handleCommand(commandId);

        if (pipeArgs && pipeArgs.length !== 0) {
            result = vscode.commands.executeCommand(commandId, ...pipeArgs);
        } else {
            result = vscode.commands.executeCommand(commandId);
        }

        this.commandIdToOverloadHandlerMap.set(
            commandId,
            vscode.commands.registerCommand(commandId, (...args: any[]) => {
                return proxyCommandHandler(commandId, ...args);
            })
        );

        return result;
    }

    private notifyEditorActionTracker(commandId: string): void {
        const editorTracker = PluginContext.getEditorActionTracker();
        if (editorTracker) {
            editorTracker.notifyCommandExecuted(commandId);
        }
    }

    private runtimeExecuteErrorsHandling(commandIdToOverloadHandlerMap: Map<string, vscode.Disposable>) {
        const originalExecuteCommand = vscode.commands.executeCommand;
        const errHandler = (errName: string, commandId: string) => {
            if (errName === 'TypeError') {
                logger.debug(`Command ${commandId} seems to depend on thisArg.`);
                commandIdToOverloadHandlerMap.get(commandId)?.dispose();
            }
        };

        vscode.commands.executeCommand = new Proxy(originalExecuteCommand, {
            apply(target, thisArg, args) {
                const [commandId] = args;

                try {
                    const result = Reflect.apply(target, thisArg, args);
                    if (result instanceof Promise) {
                        return result.catch(err => {
                            errHandler(err.name, commandId);
                            throw err;
                        });
                    }
                    return result;
                } catch (err) {
                    if (err instanceof Error) {
                        errHandler(err.name, commandId);
                    }
                    throw err;
                }
            }
        });
    }

    private listenPublicVscodeApi(): vscode.Disposable[] {
        let activeTextEditor: string | undefined;
        let previousStateTabs: string[] = [];

        const equalsCheck = (a: string[], b: string[]) => {
            return JSON.stringify(a) === JSON.stringify(b);
        };

        const wasRecentCommand = (commandId: string): boolean => {
            const now = Date.now();
            return this.recentCommands.some(
                cmd => cmd.command === commandId &&
                    now - cmd.timestamp < this.RECENT_COMMAND_WINDOW_MS
            );
        };

        const onDidChangeEditorHandler = vscode.window.onDidChangeActiveTextEditor((textEditor) => {
            const openEditors = vscode.window.tabGroups.activeTabGroup.tabs;
            const actualStateTabs = openEditors.map(tab => tab.label);

            if (!textEditor) {
                if (openEditors.length === 0 && previousStateTabs.length !== 1) {
                    if (!wasRecentCommand("workbench.action.closeAllEditors")) {
                        const times = previousStateTabs.length - actualStateTabs.length;
                        this.commandCounter.handleCommand("workbench.action.closeAllEditors", times);
                    } else {
                        logger.debug('closeAllEditors was already tracked via command execution');
                    }
                    previousStateTabs = actualStateTabs;
                }
                activeTextEditor = textEditor;
                return;
            }

            if (textEditor.document.uri.scheme === "output") {
                this.commandCounter.handleCommand("workbench.action.output.toggleOutput");
                return;
            }

            if (!activeTextEditor) {
                const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
                const workspaceFolder = this.fileHelper.getCurrentWorkspacePath();
                const isDocumentInWorkspace = textEditor.document.fileName.includes(workspaceFolder);

                if (
                    !textEditor.document.fileName.includes(path.sep) ||
                    textEditor.document.isClosed ||
                    activeTab?.label.includes(`↔`) ||
                    !isDocumentInWorkspace
                ) {
                    return;
                }

                if (previousStateTabs.length > actualStateTabs.length) {
                    if (!wasRecentCommand("workbench.action.closeActiveEditor")) {
                        const times = previousStateTabs.length - actualStateTabs.length;
                        this.commandCounter.handleCommand("workbench.action.closeActiveEditor", times);
                    } else {
                        logger.debug('closeActiveEditor was already tracked via command execution');
                    }
                    activeTextEditor = textEditor.document.fileName;
                    previousStateTabs = actualStateTabs;
                    return;
                }

                if (openEditors.length === 1 || !equalsCheck(previousStateTabs, actualStateTabs)) {
                    if (!this.wasRecentNavigationCommand()) {
                        logger.debug('Editor changed without navigation command - counting as quickOpen');
                        this.commandCounter.handleCommand("workbench.action.quickOpen");
                    } else {
                        logger.debug('Editor changed by navigation command - NOT counting as quickOpen');
                    }
                    activeTextEditor = textEditor.document.fileName;
                    previousStateTabs = actualStateTabs;
                    return;
                }

                this.commandCounter.handleCommandGroup(CommandGroup.NavigateBetweenTabsGroup);
            }

            previousStateTabs = vscode.window.tabGroups.activeTabGroup.tabs.map(tab => tab.label);
            activeTextEditor = textEditor.document.fileName;
        });

        const onDidCloseTextDocumentHandler = vscode.workspace.onDidCloseTextDocument(() => { });

        const onDidOpenTerminalHandler = vscode.window.onDidOpenTerminal(() => {
            this.commandCounter.handleCommand("workbench.action.terminal.new");
        });

        const onDidCloseTerminalHandler = vscode.window.onDidCloseTerminal(() => {
            this.commandCounter.handleCommand("workbench.action.terminal.kill");
        });

        return [
            onDidChangeEditorHandler,
            onDidCloseTextDocumentHandler,
            onDidCloseTerminalHandler,
            onDidOpenTerminalHandler
        ];
    }

    public dispose(): void {
        this.commandIdToOverloadHandlerMap.forEach(handler => handler.dispose());
        this.commandIdToOverloadHandlerMap.clear();
        this.configurationWatcher?.dispose();
        this.recentCommands = [];
    }
}
