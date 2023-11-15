import path from 'path';
import { Subject } from 'rxjs';
import * as vscode from 'vscode';
import { CommandCounter } from '../main/counter/commandCounter';
import { FileHelper } from '../main/helper/fileHelper';
import { logger } from '../main/logging';
import { CommandGroup } from '../models/commandGroup';

export class SubscriptionService {

    private readonly pipe = new Subject<[string, ...any]>();
    private readonly commandIdToOverloadHandlerMap: Map<string, vscode.Disposable> = new Map();
    private readonly commandCounter: CommandCounter;
    private readonly fileHelper: FileHelper;
    private readonly ignoreCommandList = [
        "notification.expand",
        "notification.clear",
        "notification.collapse"
    ];

    constructor(commandCounter: CommandCounter, fileHelper: FileHelper) {
        this.commandCounter = commandCounter;
        this.fileHelper = fileHelper;
    }

    public async listenForPossibleShortcutActions() {
        const commandIds = (await vscode.commands.getCommands(true))
            .filter(id => this.ignoreCommandList.find(it => it === id) === undefined);
        this.listenVscodeCommands(commandIds);
        this.listenPublicVscodeApi();
    }

    private listenVscodeCommands(commandIds: string[]) {
        const commandHandler = async (commandId: string, args: any) => {
            this.commandIdToOverloadHandlerMap.get(commandId)!.dispose();
            this.pipe.next([commandId, args]);
        };

        commandIds.forEach(commandId => {
            try {
                const overloadedHandler = vscode.commands.registerCommand(commandId, async (args) => commandHandler(commandId, args));
                this.commandIdToOverloadHandlerMap.set(
                    commandId,
                    overloadedHandler
                );
            } catch (e) {
                logger.debug(`command ${commandId} can't be overloaded`);
            }
        });

        this.pipe.subscribe(async (next) => {
            const commandId = next[0];
            const pipeArgs = next[1];
            logger.debug(`command ${commandId} was executed!`);
            if (pipeArgs) {
                await vscode.commands.executeCommand(commandId, pipeArgs);
            } else {
                await vscode.commands.executeCommand(commandId);
            }

            this.commandCounter.handleCommand(commandId);

            this.commandIdToOverloadHandlerMap.set(
                commandId,
                vscode.commands.registerCommand(commandId, async (args) => commandHandler(commandId, args))
            );
        });
    }

    private listenPublicVscodeApi() {
        let activeTextEditor: string | undefined;
        let previousStateTabs: string[] = [];


        const equalsCheck = (a: string[], b: string[]) => {
            return JSON.stringify(a) === JSON.stringify(b);
        };

        // Here complex logic cause vscode handle this in many ways
        // Handled on text editor closed/opened
        // And not only text editor is text editor (LOL)
        // Output view defined as text editor too
        vscode.window.onDidChangeActiveTextEditor((textEditor) => {
            const openEditors = vscode.window.tabGroups.activeTabGroup.tabs;
            const actualStateTabs = openEditors.map(tab => tab.label);
            if (!textEditor) {
                if (openEditors.length === 0) {
                    const times = previousStateTabs.length - actualStateTabs.length;
                    this.commandCounter.handleCommand("workbench.action.closeActiveEditor", times);
                    previousStateTabs = actualStateTabs;
                }
                activeTextEditor = textEditor;
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
        vscode.workspace.onDidCloseTextDocument(() => { });

        vscode.window.onDidCloseTerminal(() => {
            this.commandCounter.handleCommand("workbench.action.terminal.kill");
        });
    }

}
