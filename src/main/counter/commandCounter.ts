import * as vscode from 'vscode';
import { CommandGroup, CommandGroupModel } from '../../models/commandGroup';
import { DescriptionHandler } from "../descriptions/descriptionHandler";
import { KeybindingStorage } from "../keybindings/keybindings";
import { KeyLogger } from '../keylogging/KeyLogger';
import { logger } from '../logging';

export class CommandCounter {
    private internalCommandToCounter = new Map<string, number>();
    private internalCommandGroupToCounter = new Map<string, number>();
    private publicCommandToCounter = new Map<string, number>();
    private publicCommandGroupToCounter = new Map<string, number>();

    private descriptionHandler = new DescriptionHandler();

    private readonly keybindingStorage: KeybindingStorage;
    private readonly keyLogger: KeyLogger;

    constructor(keybindingStorage: KeybindingStorage, keyLogger: KeyLogger) {
        this.keybindingStorage = keybindingStorage;
        this.keyLogger = keyLogger;
    }

    public handleCommand(commandId: string, times: number = 1) {
        const keybindings = this.keybindingStorage.getKeybindingsFor(commandId);
        if (keybindings !== undefined && keybindings !== null) {
            let currCounter = this.internalCommandToCounter.get(commandId) ?? 0;
            let publicCounter = this.publicCommandToCounter.get(commandId) ?? 0;
            if (!this.keyLogger.hasAnyKeybinding(keybindings)) {
                currCounter += times;
                publicCounter += times;
                logger.debug(`user did not use keybinding for command ${commandId}, counter = ${currCounter}`);
            }
            if (currCounter > this.getLoyaltyLevel()) {
                logger.info(`show info message for command ${commandId}`);
                vscode.window.showInformationMessage(this.buildStyledMessage(keybindings, commandId));
                currCounter = 0;
            }
            this.internalCommandToCounter.set(commandId, currCounter);
            this.publicCommandToCounter.set(commandId, publicCounter);
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
            let currCounter = this.internalCommandGroupToCounter.get(groupId) ?? 0;
            let publicCounter = this.publicCommandGroupToCounter.get(groupId) ?? 0;
            if (!this.keyLogger.hasAnyKeybinding(groupKeybindings)) {
                currCounter++;
                logger.debug(`user did not use keybindings for group ${groupId}, counter = ${currCounter}`);
            }
            if (currCounter > this.getLoyaltyLevel()) {
                logger.info(`show info message for group ${groupId}`);
                this.suggestToUseGroupShortcut(groupId);
                currCounter = 0;
            }
            this.internalCommandGroupToCounter.set(groupId, currCounter);
            this.publicCommandGroupToCounter.set(groupId, publicCounter);
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
            const publicCounter = this.publicCommandGroupToCounter.get(groupId)!;
            vscode.window.showInformationMessage(
                `Tip: you can use '${goNextShortcut}'/'${goPreviousShortcut}' or '${goToFirstShortcut}', '${goToSecondShortcut}'... to navigate between editors. You missed ${publicCounter} times! You can also check keybindings for all commands.`,
                checkAllShortcutsButton
            ).then(button => {
                if (button === checkAllShortcutsButton) {
                    vscode.commands.executeCommand("workbench.action.openGlobalKeybindings", groupId);
                }
            });
        }
    }

    private getLoyaltyLevel(): number {
        return vscode.workspace.getConfiguration("keypromoter").get("loyaltyLevel", 5);
    }

    private buildStyledMessage(keybindings: string[], commandId: string): string {
        const publicCounter = this.publicCommandToCounter.get(commandId)!;
        const description = this.descriptionHandler.getDescriptionForCommand(commandId) ?? commandId;
        return `Tip: you can use <${keybindings.join("> or <")}> to perform command '${description}'. You missed ${publicCounter} times!`;
    }
}