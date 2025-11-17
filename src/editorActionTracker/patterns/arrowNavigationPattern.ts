import * as vscode from 'vscode';
import { EditorPatternId, getPatternSuggestedCommand } from '../patternRegistry';
import { EditorAction, EditorActionType, NavigationStep, PatternMatch } from '../types';
import { BaseEditorActionPattern } from './baseEditorActionPattern';
import { EDIT_COMMANDS, INSTANT_NAVIGATION_COMMANDS } from './common/constants';
import { PatternUtils } from './common/patternUtils';
import { SequenceTracker } from './common/sequenceTracker';

export class ArrowNavigationPattern extends BaseEditorActionPattern {
    private moves: SequenceTracker<NavigationStep>;
    private lastPosition: vscode.Position | null = null;
    private sequenceStartPosition: vscode.Position | null = null;
    private edgeBounces = 0;
    private lastEdgeBounceTime = 0;

    private readonly MAX_MOVE_INTERVAL = 1000;
    private readonly EDGE_BOUNCE_INTERVAL = 300;
    private readonly MIN_CHAR_MOVES_FOR_WORD = 5;
    private readonly MIN_CHAR_MOVES_FOR_LINE = 5;
    private readonly MIN_WORD_JUMPS_FOR_LINE = 3;
    private readonly MIN_VERTICAL_MOVES = 5;
    private readonly MAX_EDGE_BOUNCES = 2;
    private readonly MIN_CHARS_FOR_LINE_TRAVERSAL = 5;

    constructor() {
        super(
            EditorPatternId.ArrowNavigation,
            getPatternSuggestedCommand(EditorPatternId.ArrowNavigation)
        );
        this.moves = new SequenceTracker({ timeout: 3000, maxLength: 50 });
    }

    public reset(): void {
        this.logDebug(`resetting (had ${this.moves.length} moves, ${this.edgeBounces} edge bounces)`);
        this.moves.reset();
        this.lastPosition = null;
        this.sequenceStartPosition = null;
        this.edgeBounces = 0;
        this.lastEdgeBounceTime = 0;
    }

    public process(action: EditorAction): PatternMatch | null {
        if (action.type !== EditorActionType.Selection || !action.selection) {
            return null;
        }

        if (!action.selection.isEmpty) {
            if (this.moves.length > 0) {
                this.reset();
            }
            return null;
        }

        // Ignore if editing or instant navigation
        if (this.wasAnyCommandRecentlyExecuted(EDIT_COMMANDS, 200)) {
            if (this.moves.length > 0) {
                this.reset();
            }
            return null;
        }

        if (this.wasAnyCommandRecentlyExecuted(INSTANT_NAVIGATION_COMMANDS)) {
            this.reset();
            return null;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        const newPosition = action.selection.active;

        // Initialize
        if (!this.lastPosition) {
            this.lastPosition = newPosition;
            this.sequenceStartPosition = newPosition;
            return null;
        }

        // Check interval
        const timeSinceLastMove = action.timestamp - (this.moves.lastItem?.timestamp || action.timestamp);
        if (timeSinceLastMove > this.MAX_MOVE_INTERVAL) {
            const result = this.checkForPattern();
            this.reset();
            this.lastPosition = newPosition;
            this.sequenceStartPosition = newPosition;
            return result;
        }

        // Calculate movement
        const lineDiff = newPosition.line - this.lastPosition.line;
        const charDiff = newPosition.character - this.lastPosition.character;

        const step = this.analyzeMovement(newPosition, lineDiff, charDiff, action.timestamp);

        if (!step) {
            const result = this.checkForPattern();
            this.reset();
            this.lastPosition = newPosition;
            this.sequenceStartPosition = newPosition;
            return result;
        }

        // Verify word jumps
        if (step.isWordStep && (step.direction === 'left' || step.direction === 'right')) {
            if (!this.wasAnyCommandRecentlyExecuted(['cursorWordLeft', 'cursorWordRight'])) {
                const result = this.checkForPattern();
                this.reset();
                this.lastPosition = newPosition;
                this.sequenceStartPosition = newPosition;
                return result;
            }
        }

        // Check edge bounce
        if (step.direction === 'left' || step.direction === 'right') {
            const edgeBounce = this.checkEdgeBounce(editor, newPosition, step.direction);
            if (edgeBounce) {
                return edgeBounce;
            }
        }

        // Track move
        this.moves.add(step);

        // Check patterns
        const match = this.checkSmartPatterns(editor, newPosition);
        if (match) {
            return match;
        }

        this.lastPosition = newPosition;
        return null;
    }

    private analyzeMovement(
        position: vscode.Position,
        lineDiff: number,
        charDiff: number,
        timestamp: number
    ): NavigationStep | null {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        let direction: 'left' | 'right' | 'up' | 'down' | 'unknown' = 'unknown';
        let stepSize = 0;
        let isWordJump = false;

        // Horizontal
        if (lineDiff === 0) {
            if (charDiff > 0) {
                direction = 'right';
                stepSize = charDiff;
                isWordJump = charDiff > 1;
            } else if (charDiff < 0) {
                direction = 'left';
                stepSize = Math.abs(charDiff);
                isWordJump = Math.abs(charDiff) > 1;
            }
        }
        // Vertical
        else if (Math.abs(charDiff) <= 3) {
            if (lineDiff > 0) {
                direction = 'down';
                stepSize = lineDiff;
                isWordJump = lineDiff > 1;
            } else {
                direction = 'up';
                stepSize = Math.abs(lineDiff);
                isWordJump = Math.abs(lineDiff) > 1;
            }
        }

        if (direction === 'unknown') {
            return null;
        }

        const wasInWord = this.lastPosition ? PatternUtils.isPositionInWord(editor, this.lastPosition) : false;

        return {
            timestamp,
            line: position.line,
            character: position.character,
            direction,
            stepSize,
            isWordStep: isWordJump,
            wasInWord
        };
    }

    private checkEdgeBounce(
        editor: vscode.TextEditor,
        position: vscode.Position,
        direction: 'left' | 'right'
    ): PatternMatch | null {
        if (this.moves.length < 3) {
            return null;
        }

        const edgeInfo = PatternUtils.getLineEdgeInfo(editor, position);
        if (!edgeInfo) {
            return null;
        }

        const atEdge = (direction === 'left' && edgeInfo.atLineStart) ||
            (direction === 'right' && edgeInfo.atLineEnd);

        if (!atEdge) {
            return null;
        }

        // Check if cursor didn't move (stuck at edge)
        if (this.lastPosition &&
            this.lastPosition.line === position.line &&
            this.lastPosition.character === position.character) {

            const now = Date.now();
            if (this.lastEdgeBounceTime > 0 && (now - this.lastEdgeBounceTime) < this.EDGE_BOUNCE_INTERVAL) {
                this.edgeBounces++;
            } else {
                this.edgeBounces = 1;
            }

            this.lastEdgeBounceTime = now;

            if (this.edgeBounces >= this.MAX_EDGE_BOUNCES) {
                this.logInfo(`edge bounce matched (${this.edgeBounces} bounces)`);

                const suggestedCommand = direction === 'right' ? 'cursorEnd' : 'cursorHome';
                const keyHint = this.getFormattedKeybinding(suggestedCommand);
                const match: PatternMatch = {
                    patternId: this.id,
                    subPatternId: 'edge-bounce',
                    suggestedCommand,
                    message: `You're at the line ${direction === 'left' ? 'start' : 'end'}. Try ${keyHint} to navigate across lines!`,
                    detectedActions: []
                };

                this.reset();
                return match;
            }
        } else {
            this.edgeBounces = 0;
        }

        return null;
    }

    private checkSmartPatterns(editor: vscode.TextEditor, currentPos: vscode.Position): PatternMatch | null {
        const charMoves = this.moves.filter(m => !m.isWordStep);
        const wordJumps = this.moves.filter(m => m.isWordStep);
        const horizontalMoves = this.moves.filter(m => m.direction === 'left' || m.direction === 'right');

        // Word jumps to line edge
        if (wordJumps.length >= this.MIN_WORD_JUMPS_FOR_LINE) {
            const lineEdgeMatch = this.checkLineEdgeForJumps(editor, currentPos, wordJumps);
            if (lineEdgeMatch) {
                return lineEdgeMatch;
            }
        }

        // Char-by-char patterns
        if (charMoves.length >= this.MIN_CHAR_MOVES_FOR_WORD && horizontalMoves.length > 0) {
            if (charMoves.length >= this.MIN_CHAR_MOVES_FOR_LINE) {
                const lineTraversal = this.checkLineTraversal(editor, currentPos, charMoves);
                if (lineTraversal) {
                    return lineTraversal;
                }
            }

            const wordTraversal = this.checkWordTraversal(editor, currentPos, charMoves);
            if (wordTraversal) {
                return wordTraversal;
            }
        }

        return null;
    }

    private checkLineEdgeForJumps(
        editor: vscode.TextEditor,
        currentPos: vscode.Position,
        wordJumps: readonly NavigationStep[]
    ): PatternMatch | null {
        if (!this.sequenceStartPosition || this.sequenceStartPosition.line !== currentPos.line) {
            return null;
        }

        const edgeInfo = PatternUtils.getLineEdgeInfo(editor, currentPos);
        if (!edgeInfo || (!edgeInfo.atLineStart && !edgeInfo.atLineEnd)) {
            return null;
        }

        const startChar = this.sequenceStartPosition.character;
        const distanceFromEdge = edgeInfo.atLineStart
            ? startChar
            : (edgeInfo.lineLength - startChar);

        if (distanceFromEdge < this.MIN_CHARS_FOR_LINE_TRAVERSAL) {
            return null;
        }

        const direction = edgeInfo.atLineEnd ? 'end' : 'start';
        const suggestedCommand = direction === 'end' ? 'cursorEnd' : 'cursorHome';
        const keyHint = this.getFormattedKeybinding(suggestedCommand);

        this.logInfo(`word jump to line ${direction} detected (${wordJumps.length} jumps)`);

        return {
            patternId: this.id,
            subPatternId: 'word-jump-to-line-edge',
            suggestedCommand,
            message: `You jumped by words to line ${direction}. Try ${keyHint} to jump instantly!`,
            detectedActions: []
        };
    }

    private checkWordTraversal(
        editor: vscode.TextEditor,
        currentPos: vscode.Position,
        charMoves: readonly NavigationStep[]
    ): PatternMatch | null {
        const isCurrentlyInWord = PatternUtils.isPositionInWord(editor, currentPos);
        const wasInWordSequence = charMoves.some(m => m.wasInWord);

        if (wasInWordSequence && !isCurrentlyInWord && charMoves.length >= this.MIN_CHAR_MOVES_FOR_WORD) {
            const direction = PatternUtils.getHorizontalPredominantDirection([...charMoves]);

            if (direction !== 'unknown') {
                this.logInfo(`word traversal detected (${charMoves.length} char moves)`);

                const suggestedCommand = direction === 'right' ? 'cursorWordRight' : 'cursorWordLeft';
                const keyHint = this.getFormattedKeybinding(suggestedCommand);
                return {
                    patternId: this.id,
                    subPatternId: 'word-traversal',
                    suggestedCommand,
                    message: `You navigated through a word character by character. Try ${keyHint} to jump by words!`,
                    detectedActions: []
                };
            }
        }

        return null;
    }

    private checkLineTraversal(
        editor: vscode.TextEditor,
        currentPos: vscode.Position,
        charMoves: readonly NavigationStep[]
    ): PatternMatch | null {
        if (!this.sequenceStartPosition || this.sequenceStartPosition.line !== currentPos.line) {
            return null;
        }

        const edgeInfo = PatternUtils.getLineEdgeInfo(editor, currentPos);
        if (!edgeInfo || (!edgeInfo.atLineStart && !edgeInfo.atLineEnd)) {
            return null;
        }

        const startChar = this.sequenceStartPosition.character;
        const charsTraveled = Math.abs(currentPos.character - startChar);

        if (charsTraveled < this.MIN_CHARS_FOR_LINE_TRAVERSAL) {
            return null;
        }

        // Check predominance
        const direction = PatternUtils.getHorizontalPredominantDirection([...charMoves]);
        if (direction === 'unknown') {
            return null;
        }

        const edgeDirection = edgeInfo.atLineEnd ? 'end' : 'start';
        const suggestedCommand = edgeDirection === 'end' ? 'cursorEnd' : 'cursorHome';
        const keyHint = this.getFormattedKeybinding(suggestedCommand);

        this.logInfo(`line traversal to ${edgeDirection} detected (${charMoves.length} char moves)`);

        return {
            patternId: this.id,
            subPatternId: 'line-traversal',
            suggestedCommand,
            message: `You pressed arrow ${charMoves.length} times to reach line ${edgeDirection}. Try ${keyHint}!`,
            detectedActions: []
        };
    }

    public checkForPattern(): PatternMatch | null {
        if (this.moves.length === 0) {
            return null;
        }

        const verticalMoves = this.moves.filter(m => m.direction === 'up' || m.direction === 'down');

        if (verticalMoves.length >= this.MIN_VERTICAL_MOVES) {
            const upCount = verticalMoves.filter(m => m.direction === 'up').length;
            const downCount = verticalMoves.filter(m => m.direction === 'down').length;

            let suggestedCommand: string;
            let message: string;
            let subPatternId: string;

            if (verticalMoves.length >= 15) {
                const direction = downCount > upCount ? 'bottom' : 'top';
                suggestedCommand = direction === 'bottom' ? 'cursorBottom' : 'cursorTop';
                const keyHint = this.getFormattedKeybinding(suggestedCommand); message = `You pressed arrow ${verticalMoves.length} times. Try ${keyHint} to jump to file ${direction}!`;
                subPatternId = 'file-jump';
            } else {
                const direction = downCount > upCount ? 'down' : 'up';
                suggestedCommand = direction === 'down' ? 'cursorPageDown' : 'cursorPageUp';
                const keyHint = this.getFormattedKeybinding(suggestedCommand); message = `You pressed arrow ${verticalMoves.length} times. Try ${keyHint} to scroll faster!`;
                subPatternId = 'page-scroll';
            }

            this.logInfo(`vertical pattern matched (${verticalMoves.length} moves)`);

            return {
                patternId: this.id,
                subPatternId,
                suggestedCommand,
                message,
                detectedActions: []
            };
        }

        return null;
    }
}
