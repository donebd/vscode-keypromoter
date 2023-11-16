import * as vscode from 'vscode';
import { logger } from '../main/logging';

const section = "keypromoter";

const logLevelScope = "logger.loggingLevel";
const loyaltyLevelScope = "loyaltyLevel";
const ignoredCommandsScope = "ignoredCommands";

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
        vscode.workspace.getConfiguration(section).update(section, ignored, vscode.ConfigurationTarget.Global);
        logger.info(`added command ${command} to ignore list (with total length of ${ignored.length})`);
    } catch (e) {
        if (e instanceof Error) {   
            logger.error(`error when adding command ${command} to ignore list: ${e.message}`);
        }
    }
}
