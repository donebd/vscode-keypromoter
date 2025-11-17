// src/test/unit/editorActions/patterns/arrowNavigationPattern.test.ts

import * as assert from 'assert';
import "reflect-metadata";
import * as vscode from 'vscode';
import { EditorPatternId } from '../../../../editorActionTracker/patternRegistry';
import { ArrowNavigationPattern } from '../../../../editorActionTracker/patterns/arrowNavigationPattern';
import { EditorAction, EditorActionType } from '../../../../editorActionTracker/types';

declare const __setMockActiveEditor: (lines: string[]) => any;
declare const __clearMockActiveEditor: () => void;

describe("ArrowNavigationPattern Test", () => {

    beforeEach(() => {
        const lines = Array.from({ length: 30 }, (_, i) => `Line ${i}: hello world example text.`);
        __setMockActiveEditor(lines);
    });

    afterEach(() => {
        __clearMockActiveEditor();
    });

    function createSelectionAction(
        line: number,
        character: number,
        timestamp: number
    ): EditorAction {
        return {
            type: EditorActionType.Selection,
            timestamp,
            document: {} as vscode.TextDocument,
            selection: new vscode.Selection(
                new vscode.Position(line, character),
                new vscode.Position(line, character)
            )
        };
    }

    it("should detect word traversal pattern", () => {
        const pattern = new ArrowNavigationPattern();

        const actions = [
            createSelectionAction(0, 8, 100),  // Start at 'h'
            createSelectionAction(0, 9, 150),  // 'e'
            createSelectionAction(0, 10, 200), // 'l'
            createSelectionAction(0, 11, 250), // 'l'
            createSelectionAction(0, 12, 300), // 'o'
            createSelectionAction(0, 13, 350), // ' ' (space after 'hello')
        ];

        let match = null;
        for (const action of actions) {
            match = pattern.process(action);
            if (match) { break; }
        }

        assert.notEqual(match, null, "Pattern should have been detected");
        assert.equal(match?.subPatternId, 'word-traversal');
        assert.equal(match?.patternId, EditorPatternId.ArrowNavigation);
    });

    it("should detect vertical navigation pattern", () => {
        const pattern = new ArrowNavigationPattern();

        // Move down 6 lines
        const actions = Array.from({ length: 7 }, (_, i) => // 6 moves + 1 initial = 7 actions
            createSelectionAction(i, 0, 100 + i * 100)
        );

        let match = null;
        // Process all but the last action to accumulate moves
        for (let i = 0; i < actions.length - 1; i++) {
            pattern.process(actions[i]);
        }
        // The last action triggers the check in checkForPattern due to interval timeout logic
        // Or simply checking after the loop. A final check is needed.
        // Let's explicitly trigger the final check by resetting.
        pattern.process(actions[actions.length - 1]); // last move
        match = pattern.checkForPattern(); // Manually check at the end of sequence

        assert.notEqual(match, null);
        assert.equal(match?.subPatternId, 'page-scroll');
        assert.equal(match?.patternId, EditorPatternId.ArrowNavigation);
    });

    it("should detect file jump pattern (many vertical moves)", () => {
        const pattern = new ArrowNavigationPattern();

        // Move down 20 lines
        const actions = Array.from({ length: 21 }, (_, i) => // 20 moves + 1 initial
            createSelectionAction(i, 0, 100 + i * 50)
        );

        let match = null;
        for (const action of actions) {
            pattern.process(action);
        }
        // The pattern is checked when the sequence ends (e.g., on timeout or a different action).
        // For testing, we can manually trigger the final check.
        match = pattern.checkForPattern();

        assert.notEqual(match, null);
        assert.equal(match?.subPatternId, 'file-jump');
        assert.equal(match?.patternId, EditorPatternId.ArrowNavigation);
    });

    it("should reset on timeout", () => {
        const pattern = new ArrowNavigationPattern();

        pattern.process(createSelectionAction(0, 0, 100));
        pattern.process(createSelectionAction(0, 1, 200));

        // Long pause (> 1000ms, which is MAX_MOVE_INTERVAL)
        // The process method itself will reset and check, but the new sequence is too short.
        const match = pattern.process(createSelectionAction(0, 2, 2000));

        // Should have reset, not enough moves in new sequence
        assert.equal(match, null);
    });

    it("should ignore non-empty selection", () => {
        const pattern = new ArrowNavigationPattern();

        pattern.process(createSelectionAction(0, 0, 100));
        pattern.process(createSelectionAction(0, 1, 150));

        // Selection with text
        const selectionAction: EditorAction = {
            type: EditorActionType.Selection,
            timestamp: 200,
            document: {} as vscode.TextDocument,
            selection: new vscode.Selection(
                new vscode.Position(0, 0),
                new vscode.Position(0, 5)
            )
        };

        pattern.process(selectionAction); // This will reset the pattern's state

        // Next move won't have enough history
        const match = pattern.process(createSelectionAction(0, 6, 250));
        assert.equal(match, null);
    });
});
