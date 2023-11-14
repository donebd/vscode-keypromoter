import { Subject } from 'rxjs';
import * as vscode from 'vscode';
import { CommandCounter } from '../main/counter/commandCounter';

export class SubscriptionService {

    private readonly pipe = new Subject<[string, ...any]>();
    private readonly commandIdToOverloadHandlerMap: Map<string, vscode.Disposable> = new Map();
    private readonly commandCounter : CommandCounter;

    constructor(commandCounter : CommandCounter) {
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
                console.log(`${commandId} can't be overloaded`)
            }
        });

        this.pipe.subscribe(async (next) => {
            const commandId = next[0];
            const pipeArgs = next[1];
            console.log(commandId + " executed!");
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

    // Пока убирать не стал, потенциально здесь может что то хендлиться, что не хендлиться коммандами
    private listenPublicVscodeApi() {
        vscode.workspace.onDidCreateFiles((event) => {
            // Potential keybindigs:
            // welcome.showNewFileEntries
            // workbench.action.files.newUntitledFile
            // vscode.window.showInformationMessage('File created!');
        });

        vscode.workspace.onDidRenameFiles((event) => {
            // Potential keybindigs:
            // renameFile
            // vscode.window.showInformationMessage('File renamed!');
        });

        vscode.window.onDidChangeActiveTextEditor((event) => {
            // Potential keybindigs:
            // many way to open from shortcuts:
            // workbench.action.openEditorAtIndex1, workbench.action.openEditorAtIndex2...
            // workbench.action.nextEditor, workbench.action.previousEditor,
            // workbench.action.quickOpen

            // workbench.action.closeActiveEditor

            // Детектить что ничего из этого не было нажато, и сказать юзеру что вот смотри сколько у нас способов
            // Кнопка посмотреть все шорткаты где будет перечисленны все перечисленные


            // Нужно быть аккруатным т.к. эта лямбда дергается и при onDidCreateFiles и при onDidRenameFiles и когда мы просто закрываем едитор
            // vscode.window.showInformationMessage('onDidChangeActiveTextEditor');
        });

        vscode.workspace.onDidSaveTextDocument((event) => {
            // Potential keybindigs:
            // workbench.action.files.save, workbench.action.files.saveAs, workbench.action.files.saveWithoutFormatting
            // vscode.window.showInformationMessage('Text document save!');
        });

        vscode.window.onDidChangeWindowState((event) => {
            // vscode.window.showInformationMessage('onDidChangeWindowState');
        });

        vscode.window.onDidOpenTerminal((event) => {
            //Potential keybindigs:
            // workbench.action.terminal.openNativeConsole, workbench.action.terminal.new
            // and other workbench.action.terminal.* group
            // vscode.window.showInformationMessage('onDidOpenTerminal');
        });

        vscode.window.onDidCloseTerminal((event) => {
            //Potential keybindigs:
            // workbench.action.terminal.kill
            // vscode.window.showInformationMessage('onDidCloseTerminal');
        });
    }

}
