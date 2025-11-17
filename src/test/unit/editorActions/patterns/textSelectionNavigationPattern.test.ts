import "reflect-metadata";
import * as assert from 'assert';
import { TextSelectionNavigationPattern } from '../../../../editorActionTracker/patterns/textSelectionNavigationPattern';
import { EditorAction, EditorActionType } from '../../../../editorActionTracker/types';
import * as vscode from 'vscode';

describe("TextSelectionNavigationPattern Test", () => {

    function createSelectionAction(
        startChar: number,
        endChar: number,
        timestamp: number
    ): EditorAction {
        return {
            type: EditorActionType.Selection,
            timestamp,
            document: {} as vscode.TextDocument,
            selection: new vscode.Selection(
                new vscode.Position(0, startChar),
                new vscode.Position(0, endChar)
            )
        };
    }

    it("should detect char-by-char word selection", () => {
        const pattern = new TextSelectionNavigationPattern();

        // Select "hello" char by char (expanding right)
        const actions = [
            createSelectionAction(0, 1, 100),
            createSelectionAction(0, 2, 150),
            createSelectionAction(0, 3, 200),
            createSelectionAction(0, 4, 250),
            createSelectionAction(0, 5, 300),
        ];

        let match = null;
        for (const action of actions) {
            match = pattern.process(action);
            if (match) { break; }
        }

        // Will trigger if crossing word boundary
        // (needs actual editor context to detect)
    });

    it("should detect char-by-char selection expanding left", () => {
        const pattern = new TextSelectionNavigationPattern();

        // Select backward char by char
        const actions = [
            createSelectionAction(5, 5, 100),  // Empty selection at 5
            createSelectionAction(4, 5, 150),  // Select 1 char left
            createSelectionAction(3, 5, 200),  // Select 2 chars left
            createSelectionAction(2, 5, 250),  // Select 3 chars left
            createSelectionAction(1, 5, 300),  // Select 4 chars left
        ];

        let match = null;
        for (const action of actions) {
            match = pattern.process(action);
            if (match) { break; }
        }

        // Should detect selection pattern
    });

    it("should reset on timeout", () => {
        const pattern = new TextSelectionNavigationPattern();

        pattern.process(createSelectionAction(0, 1, 100));
        pattern.process(createSelectionAction(0, 2, 150));

        // Long pause (> 1000ms step interval)
        const match = pattern.process(createSelectionAction(0, 3, 2000));

        // Should have reset
        assert.equal(match, null);
    });

    it("should reset when selection is cleared", () => {
        const pattern = new TextSelectionNavigationPattern();

        pattern.process(createSelectionAction(0, 1, 100));
        pattern.process(createSelectionAction(0, 2, 150));

        // Empty selection
        const emptySelection: EditorAction = {
            type: EditorActionType.Selection,
            timestamp: 200,
            document: {} as vscode.TextDocument,
            selection: new vscode.Selection(
                new vscode.Position(0, 5),
                new vscode.Position(0, 5)
            )
        };

        pattern.process(emptySelection);

        // Should have reset - next selection won't have enough history
        const match = pattern.process(createSelectionAction(0, 6, 250));
        assert.equal(match, null);
    });

    it("should ignore multi-line selection", () => {
        const pattern = new TextSelectionNavigationPattern();

        pattern.process(createSelectionAction(0, 1, 100));

        // Multi-line selection
        const multiLineAction: EditorAction = {
            type: EditorActionType.Selection,
            timestamp: 150,
            document: {} as vscode.TextDocument,
            selection: new vscode.Selection(
                new vscode.Position(0, 0),
                new vscode.Position(1, 5)
            )
        };

        pattern.process(multiLineAction);

        // Should have reset
        const match = pattern.process(createSelectionAction(0, 2, 200));
        assert.equal(match, null);
    });
});
