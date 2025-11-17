import * as vscode from 'vscode';
import { KeybindingFormatter } from '../../helper/keybindingFormatter';
import { logger } from '../../helper/logging';
import { EditorAction, EditorActionPattern, PatternMatch, TrackerReference } from '../types';
import { PatternUtils } from './common/patternUtils';

export abstract class BaseEditorActionPattern implements EditorActionPattern {
    protected trackerRef?: TrackerReference;

    constructor(
        public readonly id: string,
        public readonly suggestedCommand: string
    ) { }

    public setTrackerReference(ref: TrackerReference): void {
        this.trackerRef = ref;
    }

    public isEnabled(): boolean {
        return true;
    }

    public abstract reset(): void;
    public abstract process(action: EditorAction): PatternMatch | null;

    // Common utilities available to all patterns
    protected isPositionInWord(editor: vscode.TextEditor, position: vscode.Position): boolean {
        return PatternUtils.isPositionInWord(editor, position);
    }

    protected wasAnyCommandExecutedInRange(
        commands: string[],
        startTime: number,
        endTime: number
    ): boolean {
        if (!this.trackerRef) {
            return false;
        }

        for (const cmd of commands) {
            const execTime = this.trackerRef.getLastCommandExecutionTime(cmd);
            if (execTime && execTime >= startTime && execTime <= endTime) {
                logger.debug(`${this.id}: command ${cmd} was executed in time range`);
                return true;
            }
        }
        return false;
    }

    protected wasAnyCommandRecentlyExecuted(commands: string[], withinMs: number = 100): boolean {
        if (!this.trackerRef) {
            return false;
        }

        for (const cmd of commands) {
            if (this.trackerRef.wasCommandRecentlyExecuted(cmd, withinMs)) {
                logger.debug(`${this.id}: command ${cmd} was recently executed`);
                return true;
            }
        }
        return false;
    }

    protected getKeybindingsFor(command: string): string[] {
        if (!this.trackerRef) {
            return [];
        }
        return this.trackerRef.getKeybindingsFor(command);
    }

    protected getFirstKeybinding(command: string): string | null {
        const bindings = this.getKeybindingsFor(command);
        return bindings.length > 0 ? bindings[0] : null;
    }

    protected getFormattedKeybinding(command: string): string {
        const keybinding = this.getFirstKeybinding(command);
        return KeybindingFormatter.format(keybinding);
    }

    protected logDebug(message: string): void {
        logger.debug(`${this.id}: ${message}`);
    }

    protected logInfo(message: string): void {
        logger.info(`${this.id}: ${message}`);
    }
}
