import * as assert from 'assert';
import "reflect-metadata";
import * as vscode from 'vscode';
import { Range } from 'vscode';
import { WordDeletePattern } from '../../../../editorActionTracker/patterns/wordDeletePattern';
import { EditorAction, EditorActionType } from '../../../../editorActionTracker/types';

declare const __setMockActiveEditor: (lines: string[]) => any;
declare const __clearMockActiveEditor: () => void;
declare const __applyMockEdit: (range: Range, newText: string) => void;

describe("WordDeletePattern Test", () => {

    beforeEach(() => {
        __setMockActiveEditor(["hello beautiful world"]);
    });

    afterEach(() => {
        __clearMockActiveEditor();
    });


    function createDeleteAction(
        line: number,
        startChar: number,
        rangeLength: number,
        timestamp: number
    ): EditorAction {
        return {
            type: EditorActionType.Delete,
            timestamp,
            document: {} as vscode.TextDocument,
            range: new vscode.Range(
                new vscode.Position(line, startChar),
                new vscode.Position(line, startChar + rangeLength)
            ),
            rangeLength
        };
    }

    it("should detect word deletion with backspace (left direction)", () => {
        const pattern = new WordDeletePattern();

        // Simulate deletion "word" chat by char (backspace)
        const actions = [
            createDeleteAction(0, 3, 1, 100), // Удаляем 'd'
            createDeleteAction(0, 2, 1, 150), // Удаляем 'r'
            createDeleteAction(0, 1, 1, 200), // Удаляем 'o'
            createDeleteAction(0, 0, 1, 250), // Удаляем 'w'
        ];

        let match = null;
        for (const action of actions) {
            __applyMockEdit(action.range!, '');
            match = pattern.process(action);
            if (match) { break; }
        }

        assert.notEqual(match, null);
        assert.equal(match?.patternId, 'word-delete-backspace');
        assert.equal(match?.suggestedCommand, 'deleteWordLeft');
    });

    it("should detect word deletion with delete key (right direction)", () => {
        __setMockActiveEditor(["word test"]);  // Короткий текст с словом "word"

        const pattern = new WordDeletePattern();

        // "word test" -> remove "word" (4 символа)
        const actions = [
            createDeleteAction(0, 0, 1, 100), // 'w'
            createDeleteAction(0, 0, 1, 150), // 'o'
            createDeleteAction(0, 0, 1, 200), // 'r'
            createDeleteAction(0, 0, 1, 250), // 'd'
        ];

        let match = null;
        for (const action of actions) {
            __applyMockEdit(action.range!, '');
            match = pattern.process(action);
            if (match) { break; }
        }

        assert.notEqual(match, null);
        assert.equal(match?.suggestedCommand, 'deleteWordRight');
    });

    it("should not trigger on too few deletions", () => {
        const pattern = new WordDeletePattern();

        // 2 deletions (minimum 4)
        const actions = [
            createDeleteAction(0, 1, 1, 100),
            createDeleteAction(0, 0, 1, 150),
        ];

        let match = null;
        for (const action of actions) {
            match = pattern.process(action);
        }

        assert.equal(match, null);
    });

    it("should reset on direction change", () => {
        const pattern = new WordDeletePattern();

        // Start delete from left
        pattern.process(createDeleteAction(0, 3, 1, 100));
        pattern.process(createDeleteAction(0, 2, 1, 150));

        // Change direction (remove right)
        pattern.process(createDeleteAction(0, 2, 1, 200));

        // The template should reset - not removed enough in the new direction
        const match = pattern.process(createDeleteAction(0, 2, 1, 250));

        assert.equal(match, null);
    });

    it("should reset on timeout", () => {
        const pattern = new WordDeletePattern();

        pattern.process(createDeleteAction(0, 3, 1, 100));
        pattern.process(createDeleteAction(0, 2, 1, 150));

        // A long pause
        const match = pattern.process(createDeleteAction(0, 1, 1, 2000));

        assert.equal(match, null);
    });

    it("should reset on line change", () => {
        const pattern = new WordDeletePattern();

        pattern.process(createDeleteAction(0, 3, 1, 100));
        pattern.process(createDeleteAction(0, 2, 1, 150));

        // Another line
        const match = pattern.process(createDeleteAction(1, 1, 1, 200));

        assert.equal(match, null);
    });

    it("should reset on non-delete action", () => {
        const pattern = new WordDeletePattern();

        pattern.process(createDeleteAction(0, 3, 1, 100));
        pattern.process(createDeleteAction(0, 2, 1, 150));

        const insertAction: EditorAction = {
            type: EditorActionType.Insert,
            timestamp: 200,
            document: {} as vscode.TextDocument,
            text: 'x'
        };

        const match = pattern.process(insertAction);

        assert.equal(match, null);
    });
});
