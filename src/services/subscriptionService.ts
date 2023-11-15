import path from 'path';
import { Subject } from 'rxjs';
import * as vscode from 'vscode';
import { CommandCounter } from '../main/counter/commandCounter';
import { CommandGroup } from '../models/commandGroup';
import { logger } from '../main/logging';

export class SubscriptionService {

    private readonly pipe = new Subject<[string, ...any]>();
    private readonly commandIdToOverloadHandlerMap: Map<string, vscode.Disposable> = new Map();
    private readonly commandCounter: CommandCounter;

    constructor(commandCounter: CommandCounter) {
        this.commandCounter = commandCounter;
    }

    public async listenForPossibleShortcutActions() {
        const commandIds = await vscode.commands.getCommands(true);
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
                logger.log('debug', `command ${commandId} can't be overloaded`);
            }
        });

        this.pipe.subscribe(async (next) => {
            const commandId = next[0];
            const pipeArgs = next[1];
            logger.log('debug', `command ${commandId} was executed!`);
            if (next[1]) {
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
            if (!textEditor) {
                activeTextEditor = textEditor;
                return;
            }

            if (!activeTextEditor) {
                if (!textEditor.document.fileName.includes(path.sep)) {
                    // It's some of output view. Don't need handle explicity (handled by commands)
                    return;
                }

                const openEditors = vscode.window.tabGroups.activeTabGroup.tabs;
                const actualStateTabs = openEditors.map(tab => tab.label);
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
