import * as vscode from 'vscode';
import { Direction, HorizontalDirection, LineEdgeInfo, NavigationStep } from '../../types';
import { WORD_BOUNDARY_CHARS } from './constants';

export class PatternUtils {
    /**
     * Calculate predominant direction from steps
     */
    static getPredominantDirection(
        steps: NavigationStep[],
        minRatio: number = 0.7
    ): Direction {
        const leftCount = steps.filter(s => s.direction === 'left').length;
        const rightCount = steps.filter(s => s.direction === 'right').length;
        const upCount = steps.filter(s => s.direction === 'up').length;
        const downCount = steps.filter(s => s.direction === 'down').length;

        const counts = { left: leftCount, right: rightCount, up: upCount, down: downCount };
        const total = leftCount + rightCount + upCount + downCount;

        if (total === 0) {
            return 'unknown';
        }

        const [maxDirection, maxCount] = Object.entries(counts).reduce((a, b) =>
            b[1] > a[1] ? b : a
        ) as [Direction, number];

        if (maxCount < total * minRatio) {
            return 'unknown';
        }

        return maxDirection;
    }

    /**
     * Get horizontal predominant direction
     */
    static getHorizontalPredominantDirection(
        steps: NavigationStep[],
        minRatio: number = 0.7
    ): HorizontalDirection {
        const horizontalSteps = steps.filter(s => s.direction === 'left' || s.direction === 'right');
        const direction = this.getPredominantDirection(horizontalSteps, minRatio);

        if (direction === 'left' || direction === 'right') {
            return direction;
        }
        return 'unknown';
    }

    /**
     * Check if steps form a continuous sequence
     */
    static isContinuousSequence(
        steps: { line: number, character: number }[],
        expectedCharDiff: (prevChar: number) => number
    ): boolean {
        for (let i = 1; i < steps.length; i++) {
            const prev = steps[i - 1];
            const curr = steps[i];

            if (curr.line !== prev.line) {
                return false;
            }

            const expectedChar = expectedCharDiff(prev.character);
            if (curr.character !== expectedChar) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if any action was too fast (likely a shortcut)
     */
    static isTooFast(timestamps: number[], threshold: number): boolean {
        for (let i = 1; i < timestamps.length; i++) {
            const timeDiff = timestamps[i] - timestamps[i - 1];
            if (timeDiff < threshold) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if position is in a word
     */
    static isPositionInWord(editor: vscode.TextEditor, position: vscode.Position): boolean {
        try {
            const line = editor.document.lineAt(position.line);
            if (position.character >= line.text.length) {
                return false;
            }
            const char = line.text[position.character];
            return /\w/.test(char);
        } catch {
            return false;
        }
    }

    /**
     * Check if character is a word boundary
     */
    static isWordBoundary(char: string): boolean {
        return WORD_BOUNDARY_CHARS.has(char);
    }

    /**
     * Get line edge information
     */
    static getLineEdgeInfo(editor: vscode.TextEditor, position: vscode.Position): LineEdgeInfo | null {
        try {
            const line = editor.document.lineAt(position.line);
            return {
                atLineStart: position.character === 0,
                atLineEnd: position.character >= line.text.length,
                lineLength: line.text.length,
                lineText: line.text
            };
        } catch {
            return null;
        }
    }

    /**
     * Check if position is at line edge
     */
    static isAtLineEdge(editor: vscode.TextEditor, position: vscode.Position): boolean {
        const info = this.getLineEdgeInfo(editor, position);
        return info ? (info.atLineStart || info.atLineEnd) : false;
    }

    /**
     * Calculate average time difference between items
     */
    static averageTimeDiff(items: { timestamp: number }[]): number {
        if (items.length < 2) {
            return 0;
        }

        let totalDiff = 0;
        for (let i = 1; i < items.length; i++) {
            totalDiff += items[i].timestamp - items[i - 1].timestamp;
        }

        return totalDiff / (items.length - 1);
    }
}
