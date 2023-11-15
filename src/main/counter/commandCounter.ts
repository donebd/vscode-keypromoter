import * as vscode from 'vscode';
import { CommandGroup, CommandGroupModel } from '../../models/commandGroup';
import { KeybindingStorage } from "../keybindings/keybindings";
import { KeyLogger } from '../keylogging/KeyLogger';
import { logger } from '../logging';

export class CommandCounter {
    private commandToCounter = new Map<string, number>();
    private commandGroupToCounter = new Map<string, number>();

    private readonly keybindingStorage: KeybindingStorage;
    private readonly keyLogger: KeyLogger;

    constructor(keybindingStorage: KeybindingStorage, keyLogger: KeyLogger) {
        this.keybindingStorage = keybindingStorage;
        this.keyLogger = keyLogger;
    }

    public handleCommand(commandId: string) {
        const keybindings = this.keybindingStorage.getKeybindingsFor(commandId);
        if (keybindings !== undefined && keybindings !== null) {
            let currCounter = this.commandToCounter.get(commandId) ?? 0;
            if (!this.keyLogger.hasAnyKeybinding(keybindings)) {
                currCounter++;
                logger.debug(`user did not use keybinding for command ${commandId}, counter = ${currCounter}`);
            }
            if (currCounter > this.getLoyaltyLevel()) {
                logger.info(`show info message for command ${commandId}`);
                vscode.window.showInformationMessage("You could use " + "'" + keybindings.join("' or '") + "'" + " to perform command " + commandId + "!");
                currCounter = 0;
            }
            this.commandToCounter.set(commandId, currCounter);
        }
    }

    public handleCommandGroup(commandGroup: CommandGroupModel) {
        const groupId = commandGroup.groupId;
        const commandIds = commandGroup.commandIds;
        const groupKeybindings: string[] = [];
        commandIds.forEach(commandId => {
            const commandKeybindings = this.keybindingStorage.getKeybindingsFor(commandId);
            if (commandKeybindings) {
                groupKeybindings.push(...commandKeybindings);
            }
        });

        if (groupKeybindings.length !== 0) {
            let currCounter = this.commandGroupToCounter.get(groupId) ?? 0;
            if (!this.keyLogger.hasAnyKeybinding(groupKeybindings)) {
                currCounter++;
                logger.debug(`user did not use keybindings for group ${groupId}, counter = ${currCounter}`);
            }
            if (currCounter > this.getLoyaltyLevel()) {
                logger.info(`show info message for group ${groupId}`);
                this.suggestToUseGroupShortcut(groupId);
                currCounter = 0;
            }
            this.commandGroupToCounter.set(groupId, currCounter);
        }
    }

    private suggestToUseGroupShortcut(groupId: string) {
        if (groupId === CommandGroup.NavigateBetweenTabsGroup.groupId) {
            const goNextEditorCommand = CommandGroup.NavigateBetweenTabsGroup.commandIds[0];
            const goPreviousEditorCommand = CommandGroup.NavigateBetweenTabsGroup.commandIds[1];
            const goToFirstEditorCommand = CommandGroup.NavigateBetweenTabsGroup.commandIds[2];
            const goToSecondEditorCommand = CommandGroup.NavigateBetweenTabsGroup.commandIds[3];

            const goNextShortcut = this.keybindingStorage.getKeybindingsFor(goNextEditorCommand) ?? [""];
            const goPreviousShortcut = this.keybindingStorage.getKeybindingsFor(goPreviousEditorCommand) ?? [""];
            const goToFirstShortcut = this.keybindingStorage.getKeybindingsFor(goToFirstEditorCommand) ?? [""];
            const goToSecondShortcut = this.keybindingStorage.getKeybindingsFor(goToSecondEditorCommand) ?? [""];


            const checkAllShortcutsButton = "View all shortcuts";
            vscode.window.showInformationMessage(
                `You could use '${goNextShortcut}'/'${goPreviousShortcut}' or '${goToFirstShortcut}', '${goToSecondShortcut}'... keybindings to navigate between editors. You can also check all keybindings for this.`,
                checkAllShortcutsButton
            ).then(button => {
                if (button === checkAllShortcutsButton) {
                    vscode.commands.executeCommand("workbench.action.openGlobalKeybindings", groupId);
                }
            });
        }
    }

    private getLoyaltyLevel() : number {
        return vscode.workspace.getConfiguration("keypromoter").get("loyaltyLevel") as number ?? 5;
    }
}