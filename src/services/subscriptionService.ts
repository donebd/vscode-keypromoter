import { inject, injectable } from 'inversify';
import path from 'path';
import * as vscode from 'vscode';
import { TYPES } from '../di/identifiers';
import { FileHelper } from '../helper/fileHelper';
import { logger } from '../helper/logging';
import { CommandGroup } from '../models/commandGroup';
import { CommandCounterService } from './commandCounterService';

@injectable()
export class SubscriptionService {

    private readonly commandIdToOverloadHandlerMap: Map<string, vscode.Disposable> = new Map();
    private readonly ignoreCommandToListenList = [
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

    constructor(
        @inject(TYPES.CommandCounterService) private readonly commandCounter: CommandCounterService,
        @inject(TYPES.FileHelper) private readonly fileHelper: FileHelper
    ) { }

    public async listenForPossibleShortcutActions(): Promise<vscode.Disposable[]> {
        const commandIds = (await vscode.commands.getCommands(true)).filter(id => !this.ignoreCommandToListenList.find(it => id.startsWith(it)));
        this.runtimeExecuteErrorsHandling(this.commandIdToOverloadHandlerMap);
        this.listenVscodeCommands(commandIds);
        return this.listenPublicVscodeApi();
    }

    private listenVscodeCommands(commandIds: string[]) {
        const commandHandler = (commandId: string, ...args: any[]) => {
            this.commandIdToOverloadHandlerMap.get(commandId)!.dispose();
            return this.proxyCallback(commandHandler, commandId, ...args);
        };

        commandIds.forEach(commandId => {
            try {
                const overloadedHandler = vscode.commands.registerCommand(commandId, (...args: any[]) => { return commandHandler(commandId, ...args); });
                this.commandIdToOverloadHandlerMap.set(
                    commandId,
                    overloadedHandler
                );
            } catch (e) {
                logger.debug(`command ${commandId} can't be overloaded`);
            }
        });
    }

    private async proxyCallback(proxyCommandHandler: (commandId: string, ...args: any[]) => Promise<any>, commandId: string, ...any: any[]): Promise<any> {
        const pipeArgs = any;
        logger.debug(`command ${commandId} was executed!`);
        let result = null;
        this.commandCounter.handleCommand(commandId);
        if (pipeArgs && pipeArgs.length !== 0) {
            result = vscode.commands.executeCommand(commandId, ...pipeArgs);
        } else {
            result = vscode.commands.executeCommand(commandId);
        }

        this.commandIdToOverloadHandlerMap.set(
            commandId,
            vscode.commands.registerCommand(commandId, (...args: any[]) => { return proxyCommandHandler(commandId, ...args); })
        );
        return result;
    }

    private runtimeExecuteErrorsHandling(commandIdToOverloadHandlerMap: Map<string, vscode.Disposable>) {
        const originalExecuteCommand = vscode.commands.executeCommand;
        const errHandler = (errName: string, commandId: string) => {
            if (errName === 'TypeError') {
                logger.debug(`Command ${commandId} seems to depend on thisArg.`);
                commandIdToOverloadHandlerMap.get(commandId)!.dispose();
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

        // Here complex logic cause vscode handle this in many ways
        // Handled on text editor closed/opened
        // And not only text editor is text editor (LOL)
        // Output view defined as text editor too
        const onDidChangeEditorHandler = vscode.window.onDidChangeActiveTextEditor((textEditor) => {
            const openEditors = vscode.window.tabGroups.activeTabGroup.tabs;
            const actualStateTabs = openEditors.map(tab => tab.label);
            if (!textEditor) {
                if (openEditors.length === 0 && previousStateTabs.length !== 1) {
                    const times = previousStateTabs.length - actualStateTabs.length;
                    this.commandCounter.handleCommand("workbench.action.closeAllEditors", times);
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
                    // It's some of not text editor view or text editor not in workspace
                    return;
                }

                if (previousStateTabs.length > actualStateTabs.length) {
                    const times = previousStateTabs.length - actualStateTabs.length;
                    this.commandCounter.handleCommand("workbench.action.closeActiveEditor", times);
                    activeTextEditor = textEditor.document.fileName;
                    previousStateTabs = actualStateTabs;
                    return;
                }
                if (openEditors.length === 1 || !equalsCheck(previousStateTabs, actualStateTabs)) {
                    this.commandCounter.handleCommand("workbench.action.quickOpen");
                    activeTextEditor = textEditor.document.fileName;
                    previousStateTabs = actualStateTabs;
                    return;
                }

                // Here navigate between tabs
                this.commandCounter.handleCommandGroup(CommandGroup.NavigateBetweenTabsGroup);
            }

            previousStateTabs = vscode.window.tabGroups.activeTabGroup.tabs.map(tab => tab.label);
            activeTextEditor = textEditor.document.fileName;
        });

        // This handler explicity ignore, cause it doesn't suit our purposes
        const onDidCloseTextDocumentHandler = vscode.workspace.onDidCloseTextDocument(() => { });

        const onDidOpenTerminalHandler = vscode.window.onDidOpenTerminal(() => {
            this.commandCounter.handleCommand("workbench.action.terminal.new");
        });

        const onDidCloseTerminalHandler = vscode.window.onDidCloseTerminal(() => {
            this.commandCounter.handleCommand("workbench.action.terminal.kill");
        });

        return [onDidChangeEditorHandler, onDidCloseTextDocumentHandler, onDidCloseTerminalHandler, onDidOpenTerminalHandler];
    }

}
