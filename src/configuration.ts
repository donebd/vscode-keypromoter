import * as vscode from 'vscode';
import { logger } from './helper/logging';

const section = "Key Promoter";

const logLevelScope = "logger.loggingLevel";
const loyaltyLevelScope = "loyaltyLevel";
const ignoredCommandsScope = "ignoredCommands";
const suggestKeybindingCreationScope = "suggestKeybindingCreation";
const pluginEnabledScope = "enabled";

// New settings for editor actions
const editorActionsEnabledScope = "editorActions.enabled";
const editorActionsLoyaltyLevelScope = "editorActions.loyaltyLevel";

export function getLogLevel(): string {
    return vscode.workspace.getConfiguration(section).get(logLevelScope, 'Info');
}

export function didAffectIgnoredCommands(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(`${section}.${ignoredCommandsScope}`);
}

export function didAffectLogLevel(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(`${section}.${logLevelScope}`);
}

export function didAffectPluginEnabled(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(`${section}.${pluginEnabledScope}`);
}

export function didAffectEditorActionsEnabled(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(`${section}.${editorActionsEnabledScope}`);
}

export function didAffectEditorActionsLoyaltyLevel(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(`${section}.${editorActionsLoyaltyLevelScope}`);
}

export function getLoyaltyLevel(): number {
    return vscode.workspace.getConfiguration(section).get(loyaltyLevelScope, 5);
}

export function getEditorActionsLoyaltyLevel(): number {
    return vscode.workspace.getConfiguration(section).get(editorActionsLoyaltyLevelScope, 1);
}

export function getIgnoreCommands(): string[] {
    return vscode.workspace.getConfiguration(section).get(ignoredCommandsScope, []);
}

export function addIgnoreCommand(command: string) {
    let ignored = getIgnoreCommands().filter(it => it !== command);
    ignored.push(command);
    try {
        vscode.workspace.getConfiguration(section).update(ignoredCommandsScope, ignored, vscode.ConfigurationTarget.Global);
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
        logger.info(`updated 'suggest keybinding creation' setting to '${value}'`);
    } catch (e) {
        if (e instanceof Error) {   
            logger.error(`error when updating 'suggest keybinding creation' setting: ${e.message}`);
        }
    }
}

export function getPluginEnabled(): boolean {
    return vscode.workspace.getConfiguration(section).get(pluginEnabledScope, true);
}

export function setPluginEnabled(value: boolean): Thenable<void> {
    logger.info(`updating 'plugin enabled' setting to '${value}'`);
    return vscode.workspace.getConfiguration(section).update(pluginEnabledScope, value, vscode.ConfigurationTarget.Global);
}

export function getEditorActionsEnabled(): boolean {
    return vscode.workspace.getConfiguration(section).get(editorActionsEnabledScope, true);
}

export function setEditorActionsEnabled(value: boolean): Thenable<void> {
    logger.info(`updating 'editor actions enabled' setting to '${value}'`);
    return vscode.workspace.getConfiguration(section).update(editorActionsEnabledScope, value, vscode.ConfigurationTarget.Global);
}
