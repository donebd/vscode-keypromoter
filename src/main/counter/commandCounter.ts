import * as vscode from 'vscode';
import { CommandGroup, CommandGroupModel } from '../../models/commandGroup';
import { DescriptionHandler } from "../descriptions/descriptionHandler";
import { KeybindingStorage } from "../keybindings/keybindings";
import { KeyLogger } from '../keylogging/KeyLogger';
import { logger } from '../logging';
import * as configuration from '../configuration';

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
        if (configuration.getIgnoreCommands().includes(commandId)) {
            logger.info(`ignoring command ${commandId} from ignore list`);
            return;
        }

        let publicCounter = this.publicCommandToCounter.get(commandId) ?? 0;
        let internalCounter = this.internalCommandToCounter.get(commandId) ?? 0;
        const keybindings = this.keybindingStorage.getKeybindingsFor(commandId);

        if (keybindings.length === 0) {
            internalCounter += times;
            publicCounter += times;
            logger.debug(`command ${commandId} doesn't have a keybinding, counter = ${internalCounter}`);
            if (internalCounter > configuration.getLoyaltyLevel()) {
                const suggestToAddShortcut = "Add keybinding";
                const description = this.descriptionHandler.getDescriptionForCommand(commandId) ?? commandId;
                vscode.window.showInformationMessage(
                    `You used command '${description}' more than ${publicCounter} times - you can add a shortcut for quicker access.`,
                    suggestToAddShortcut
                ).then(button => {
                    if (button === suggestToAddShortcut) {
                        logger.info("opening keybindings menu for suggested command");
                        vscode.commands.executeCommand("workbench.action.openGlobalKeybindings", commandId);
                    }
                });
                internalCounter = 0;
            }
        } else {
            if (!this.keyLogger.hasAnyKeybinding(keybindings)) {
                internalCounter += times;
                publicCounter += times;
                logger.debug(`user did not use keybinding for command ${commandId}, counter = ${internalCounter}`);
            } else {
                internalCounter -= times;
                internalCounter = (internalCounter < 0) ? 0 : internalCounter;
                logger.debug(`user did use keybinding for command ${commandId}, counter = ${internalCounter}`);
            }
            if (internalCounter > configuration.getLoyaltyLevel()) {
                logger.info(`show info message for command ${commandId}`);
                const ignoreBtn = "Add to ignore list";
                vscode.window.showInformationMessage(
                    this.buildStyledMessage(keybindings, commandId),
                    ignoreBtn
                ).then(button => {
                    if (button === ignoreBtn) {
                        configuration.addIgnoreCommand(commandId);
                    }
                });
                internalCounter = 0;
            }
        }
        this.internalCommandToCounter.set(commandId, internalCounter);
        this.publicCommandToCounter.set(commandId, publicCounter);
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
                publicCounter++;
                logger.debug(`user did not use keybindings for group ${groupId}, counter = ${currCounter}`);
            } else {
                currCounter -= 1;
                currCounter = (currCounter < 0) ? 0 : currCounter;
                logger.debug(`user did use keybinding for group ${groupId}, counter = ${currCounter}`);
            }

            if (currCounter > configuration.getLoyaltyLevel()) {
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

    private buildStyledMessage(keybindings: string[], commandId: string): string {
        const publicCounter = this.publicCommandToCounter.get(commandId)!;
        const description = this.descriptionHandler.getDescriptionForCommand(commandId) ?? commandId;
        return `Tip: you can use <${keybindings.join("> or <")}> to perform command '${description}'. You missed ${publicCounter} times!`;
    }
}