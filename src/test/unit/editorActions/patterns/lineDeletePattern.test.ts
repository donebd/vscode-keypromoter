import "reflect-metadata";
import * as assert from 'assert';
import * as vscode from 'vscode';
import { LineDeletePattern } from '../../../../editorActionTracker/patterns/lineDeletePattern';
import { EditorAction, EditorActionType } from '../../../../editorActionTracker/types';

declare const __setMockActiveEditor: (lines: string[]) => any;
declare const __clearMockActiveEditor: () => void;
declare const __applyMockEdit: (range: vscode.Range, newText: string) => void;

describe("LineDeletePattern Test", () => {

    afterEach(() => {
        __clearMockActiveEditor();
    });

    function createDeleteAction(
        line: number,
        startChar: number,
        endChar: number,
        rangeLength: number,
        timestamp: number
    ): EditorAction {
        return {
            type: EditorActionType.Delete,
            timestamp,
            document: {} as vscode.TextDocument,
            range: new vscode.Range(
                new vscode.Position(line, startChar),
                new vscode.Position(line, endChar)
            ),
            rangeLength
        };
    }

    it("should detect char-by-char line deletion", () => {
        const pattern = new LineDeletePattern();
        __setMockActiveEditor(["hello world"]);

        const editor = vscode.window.activeTextEditor;
        assert.ok(editor, "Mock editor should be active");
        assert.ok(editor.document, "Mock editor's document should exist");

        // Удаляем "hello world" посимвольно справа налево
        // "hello world" -> "hello worl" -> ... -> ""
        const actions = Array.from({ length: 11 }, (_, i) =>
            createDeleteAction(0, 10 - i, 11 - i, 1, 100 + i * 50)
        );

        let match = null;
        for (const action of actions) {
            __applyMockEdit(action.range!, '');
            match = pattern.process(action);
            if (match) { break; }
        }

        assert.notEqual(match, null, "Pattern should have been detected");
        assert.equal(match?.patternId, 'line-delete-backspace');
        assert.equal(match?.suggestedCommand, 'editor.action.deleteLines');
    });

    it("should detect word-by-word line deletion", () => {
        const pattern = new LineDeletePattern();
        __setMockActiveEditor(["hello world"]);

        // Удаляем словами: "world" -> " " -> "hello"
        const actions = [
            createDeleteAction(0, 6, 11, 5, 100),  // "hello world" -> "hello "
            createDeleteAction(0, 5, 6, 1, 150),   // "hello " -> "hello"
            createDeleteAction(0, 0, 5, 5, 200),   // "hello" -> ""
        ];

        let match = null;
        for (const action of actions) {
            __applyMockEdit(action.range!, '');
            match = pattern.process(action);
            if (match) { break; }
        }

        assert.notEqual(match, null);
        assert.equal(match?.suggestedCommand, 'editor.action.deleteLines');
        assert.ok(match?.message.includes('word-by-word'));
    });

    it("should not trigger on partial line deletion", () => {
        const pattern = new LineDeletePattern();
        __setMockActiveEditor(["hello world"]);

        // Удаляем только 5 символов из 11
        const actions = Array.from({ length: 5 }, (_, i) =>
            createDeleteAction(0, 4 - i, 5 - i, 1, 100 + i * 50)
        );

        let match = null;
        for (const action of actions) {
            __applyMockEdit(action.range!, '');
            match = pattern.process(action);
        }

        assert.equal(match, null);
    });

    it("should require minimum deletions for char-by-char", () => {
        const pattern = new LineDeletePattern();
        __setMockActiveEditor(["test"]);

        // Только 3 удаления из 4 символов (недостаточно)
        const actions = Array.from({ length: 3 }, (_, i) =>
            createDeleteAction(0, 2 - i, 3 - i, 1, 100 + i * 50)
        );

        let match = null;
        for (const action of actions) {
            __applyMockEdit(action.range!, '');
            match = pattern.process(action);
        }

        assert.equal(match, null, "Should not trigger due to not enough deletions");
    });
});
