import * as vscode from 'vscode';
import { logger } from '../main/logging';

const section = "keypromoter";

const logLevelScope = "logger.loggingLevel";
const loyaltyLevelScope = "loyaltyLevel";
const ignoredCommandsScope = "ignoredCommands";
const suggestKeybindingCreationScope = "suggestKeybindingCreation";

export function getLogLevel(): string {
    return vscode.workspace.getConfiguration(section).get(logLevelScope, 'Info');
}

export function didAffectLogLevel(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(section);
}

export function getLoyaltyLevel(): number {
    return vscode.workspace.getConfiguration(section).get(loyaltyLevelScope, 5);
}

export function getIgnoreCommands(): string[] {
    return vscode.workspace.getConfiguration(section).get(ignoredCommandsScope, []);
}

export function addIgnoreCommand(command: string) {
    let ignored = getIgnoreCommands().filter(it => it !== command);
    ignored.push(command);
    try {
        vscode.workspace.getConfiguration(section).update(ignoredCommandsScope, ignored, vscode.ConfigurationTarget.Global);
        if (getIgnoreCommands().sort().toString() !== ignored.sort().toString()) {
            throw new Error(`configuration was not saved`);
        }
        logger.info(`added command ${command} to ignore list (with total length of ${ignored.length})`);
    } catch (e) {
        if (e instanceof Error) {   
            logger.error(`error when adding command ${command} to ignore list: ${e.message}`);
        }
    }
}

export function getSuggestKeybindingCreation(): boolean {
    return vscode.workspace.getConfiguration(section).get(suggestKeybindingCreationScope, true);
}

export function setSuggestKeybindingCreation(value: boolean) {
    try {
        vscode.workspace.getConfiguration(section).update(suggestKeybindingCreationScope, value, vscode.ConfigurationTarget.Global);
        if (getSuggestKeybindingCreation() !== value) {
            throw new Error(`configuration was not saved`);
        }
        logger.info(`updated 'suggest keybinding creation' setting to '${value}'`);
    } catch (e) {
        if (e instanceof Error) {   
            logger.error(`error when updating 'suggest keybinding creation' setting: ${e.message}`);
        }
    }
}
