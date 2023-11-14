import * as assert from 'assert';
import * as keybindings from './keybindings';

describe("Default Keybindings Test", () => {

    it("get linux default keybindings", () => {
        let bindings = keybindings.loadDefault("linux");
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+shift+up", "shift+alt+up"]);
        assert.equal(countBindings(bindings), 858);
    });

    it("get macos default keybindings", () => {
        let bindings = keybindings.loadDefault("macos");
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["alt+cmd+up"]);
        assert.equal(countBindings(bindings), 925);
    });

    it("get windows default keybindings", () => {
        let bindings = keybindings.loadDefault("windows");
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+alt+up"]);
        assert.equal(countBindings(bindings), 866);
    });

});

function countBindings(bindings: Map<string, string[]>) {
    let count = 0;
    bindings.forEach((keystrokes: string[], _: string) => {
        count += keystrokes.length;
    });
    return count;
}

describe("Patched Keybindings Test", () => {

    it("patch default keybindings", () => {
        const JsonPatch =
        `
        [
            {
                "key": "numpad_add",
                "command": "editor.action.insertCursorAbove",
                "when": "editorTextFocus"
            },
            {
                "key": "shift+alt+up",
                "command": "-editor.action.insertCursorAbove",
                "when": "editorTextFocus"
            }
        ]
        `;
        let bindings = keybindings.loadDefault("linux");
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+shift+up", "shift+alt+up"]);
        keybindings.patch(bindings, JsonPatch);
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+shift+up", "numpad_add"]);
    });

});
