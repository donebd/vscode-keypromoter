import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import { TYPES } from '../di/identifiers';
import { logger } from '../helper/logging';
import { EditorActionNotifier } from '../services/editorActionNotifier';
import { KeybindingStorage } from '../services/keybindingStorage';
import { EditorStateManager } from './editorStateManager';
import { EditorAction, EditorActionPattern, EditorActionType, TrackerReference } from './types';

@injectable()
export class EditorActionTracker implements TrackerReference {
    private patterns: EditorActionPattern[] = [];
    private disposables: vscode.Disposable[] = [];
    private isActive: boolean = false;

    private recentCommandExecutions = new Map<string, number[]>();

    private lastMousePressTime = 0;
    private lastMouseReleaseTime = 0;

    private readonly MOUSE_SELECTION_GRACE_PERIOD_MS = 300;
    private readonly COMMAND_TRACKING_WINDOW_MS = 2000;
    private readonly MAX_TRACKED_EXECUTIONS = 10;

    constructor(
        @inject(TYPES.EditorStateManager) private readonly stateManager: EditorStateManager,
        @inject(TYPES.EditorActionNotifier) private readonly notifier: EditorActionNotifier,
        @inject(TYPES.KeybindingStorage) private readonly keybindingStorage: KeybindingStorage
    ) { }

    public registerPattern(pattern: EditorActionPattern): void {
        this.patterns.push(pattern);
        logger.debug(`Registered editor action pattern: ${pattern.id}`);
    }

    public notifyMousePressed(): void {
        this.lastMousePressTime = Date.now();
        logger.debug('Mouse press tracked');
    }

    public notifyMouseReleased(): void {
        this.lastMouseReleaseTime = Date.now();
        logger.debug('Mouse release tracked');
    }

    public notifyCommandExecuted(commandId: string): void {
        const now = Date.now();

        let executions = this.recentCommandExecutions.get(commandId) || [];

        executions = executions.filter(time => now - time < this.COMMAND_TRACKING_WINDOW_MS);

        executions.push(now);

        // Keep only recent ones
        if (executions.length > this.MAX_TRACKED_EXECUTIONS) {
            executions = executions.slice(-this.MAX_TRACKED_EXECUTIONS);
        }

        this.recentCommandExecutions.set(commandId, executions);

        logger.debug(`Command executed and tracked: ${commandId} (${executions.length} recent executions)`);

        this.resetPatternsAffectedByCommand(commandId);
    }

    public getKeybindingsFor(command: string): string[] {
        return this.keybindingStorage.getKeybindingsFor(command);
    }

    /**
     * Check if selection is likely made with mouse
     * Returns true if:
     * - Mouse is currently pressed (between press and release)
     * - Mouse was released recently (within grace period)
     */
    public isMouseSelectionLikely(): boolean {
        const now = Date.now();

        if (this.lastMousePressTime > this.lastMouseReleaseTime) {
            logger.debug('Mouse is currently pressed - likely mouse selection');
            return true;
        }

        const timeSinceRelease = now - this.lastMouseReleaseTime;
        if (timeSinceRelease < this.MOUSE_SELECTION_GRACE_PERIOD_MS) {
            logger.debug(`Mouse released ${timeSinceRelease}ms ago - likely mouse selection`);
            return true;
        }

        return false;
    }

    /**
     * Check if a command was recently executed
     */
    public wasCommandRecentlyExecuted(commandId: string, withinMs: number = this.COMMAND_TRACKING_WINDOW_MS): boolean {
        const executions = this.recentCommandExecutions.get(commandId);
        if (!executions || executions.length === 0) {
            return false;
        }

        const now = Date.now();
        const lastExecution = executions[executions.length - 1];
        const elapsed = now - lastExecution;

        return elapsed < withinMs;
    }

    /**
     * Get the timestamp of the last execution of a command
     */
    public getLastCommandExecutionTime(commandId: string): number | null {
        const executions = this.recentCommandExecutions.get(commandId);
        if (!executions || executions.length === 0) {
            return null;
        }
        return executions[executions.length - 1];
    }

    /**
     * Reset patterns that should not trigger when specific commands are used
     */
    private resetPatternsAffectedByCommand(commandId: string): void {
        const commandToPatternMap: Record<string, string[]> = {
            'editor.action.moveLinesUpAction': ['line-movement-manual'],
            'editor.action.moveLinesDownAction': ['line-movement-manual'],
            'editor.action.copyLinesUpAction': ['line-duplication-manual'],
            'editor.action.copyLinesDownAction': ['line-duplication-manual'],
            'editor.action.deleteLines': ['line-delete-backspace'],
            'deleteWordLeft': ['word-delete-backspace'],
            'deleteWordRight': ['word-delete-backspace'],
        };

        const affectedPatternIds = commandToPatternMap[commandId];
        if (affectedPatternIds) {
            this.patterns.forEach(pattern => {
                if (affectedPatternIds.includes(pattern.id)) {
                    logger.debug(`Resetting pattern ${pattern.id} due to command ${commandId}`);
                    pattern.reset();
                }
            });
        }
    }

    public start(): void {
        if (this.isActive) {
            logger.warn('EditorActionTracker is already active');
            return;
        }

        this.isActive = true;
        this.subscribeToEditorEvents();
        logger.info('EditorActionTracker started');
    }

    public pause(): void {
        this.stop();
    }

    public resume(): void {
        if (!this.isActive) {
            this.start();
        }
    }

    public stop(): void {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.patterns.forEach(p => p.reset());
        logger.info('EditorActionTracker stopped');
    }

    public dispose(): void {
        this.stop();
        this.recentCommandExecutions.clear();
    }

    private subscribeToEditorEvents(): void {
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(e => {
                if (!this.isActive || !e.document || e.document.uri.scheme !== 'file') {
                    return;
                }
                this.handleTextChange(e);
            })
        );

        this.disposables.push(
            vscode.window.onDidChangeTextEditorSelection(e => {
                if (!this.isActive) {
                    return;
                }

                if (e.textEditor.document.uri.scheme !== 'file') {
                    return;
                }

                this.handleSelectionChange(e);
            })
        );

        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                // Only reset for file editors
                if (!editor || editor.document.uri.scheme !== 'file') {
                    return;
                }

                this.stateManager.reset();
                this.patterns.forEach(p => p.reset());
            })
        );
    }

    private handleTextChange(event: vscode.TextDocumentChangeEvent): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== event.document) {
            return;
        }

        // Ignore undo/redo operations
        if (event.reason === vscode.TextDocumentChangeReason.Undo ||
            event.reason === vscode.TextDocumentChangeReason.Redo) {
            logger.debug(`Ignoring ${event.reason === vscode.TextDocumentChangeReason.Undo ? 'undo' : 'redo'} operation`);
            return;
        }

        for (const change of event.contentChanges) {
            const action = this.createActionFromChange(change, event.document, event.reason);

            this.stateManager.recordAction(action);
            this.checkPatterns(action);
        }
    }

    private createActionFromChange(
        change: vscode.TextDocumentContentChangeEvent,
        document: vscode.TextDocument,
        reason?: vscode.TextDocumentChangeReason
    ): EditorAction {
        const hasText = change.text.length > 0;
        const hasRangeLength = change.rangeLength > 0;

        let actionType: EditorActionType;
        if (hasText && hasRangeLength) {
            actionType = EditorActionType.Replace;
        } else if (hasText && !hasRangeLength) {
            actionType = EditorActionType.Insert;
        } else {
            actionType = EditorActionType.Delete;
        }

        const action: EditorAction = {
            type: actionType,
            timestamp: Date.now(),
            document: document,
            range: change.range,
            rangeOffset: change.rangeOffset,
            rangeLength: change.rangeLength,
            text: hasText ? change.text : '',
            reason: reason
        };

        logger.debug(
            `Action: ${actionType}, ` +
            `range: [${change.range.start.line}:${change.range.start.character} - ${change.range.end.line}:${change.range.end.character}], ` +
            `rangeLength: ${change.rangeLength}, ` +
            `text length: ${change.text.length}`
        );

        return action;
    }

    private handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
        // Ignore non-file editors (Output, Debug Console, etc.)
        if (event.textEditor.document.uri.scheme !== 'file') {
            return;
        }

        // Ignore if this is not the active editor
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor !== event.textEditor) {
            return;
        }

        const primarySelection = event.selections[0];
        if (!primarySelection) {
            return;
        }

        // Ignore selection changes caused by editing commands
        const editCommands = [
            'deleteLeft', 'deleteRight',
            'deleteWordLeft', 'deleteWordRight',
            'type', 'paste', 'cut',
            'tab', 'outdent'
        ];

        for (const cmd of editCommands) {
            if (this.wasCommandRecentlyExecuted(cmd, 50)) {
                logger.debug(`Ignoring selection change caused by ${cmd}`);
                return;
            }
        }

        // This prevents false positives when user selects with mouse
        if (this.isMouseSelectionLikely()) {
            logger.debug('Ignoring selection change - mouse was recently pressed');
            return;
        }

        const action: EditorAction = {
            type: EditorActionType.Selection,
            timestamp: Date.now(),
            document: event.textEditor.document,
            selection: primarySelection
        };

        this.stateManager.recordAction(action);
        this.checkPatterns(action);
    }

    private checkPatterns(action: EditorAction): void {
        for (const pattern of this.patterns) {
            if (!pattern.isEnabled()) {
                continue;
            }

            const match = pattern.process(action);
            if (match) {
                logger.info(`Pattern matched: ${pattern.id}, suggested command: ${match.suggestedCommand}`);
                this.notifier.notify(match);
            }
        }
    }
}
