import * as assert from 'assert';
import { Platform } from '../platform';
import { KeybindingStorage } from './keybindings';

describe("Default Keybindings Test", () => {


    it("get linux default keybindings", () => {
        const linuxStorage = new KeybindingStorage(Platform.LINUX);
        let bindings = linuxStorage.getDefaultKeybindingMap();
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+shift+up", "shift+alt+up"]);
        assert.equal(countBindings(bindings), 858);
    });

    it("get macos default keybindings", () => {
        const macStorage = new KeybindingStorage(Platform.MACOS);
        let bindings = macStorage.getDefaultKeybindingMap();
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["alt+cmd+up"]);
        assert.equal(countBindings(bindings), 925);
    });

    it("get windows default keybindings", () => {
        const windowsStorage = new KeybindingStorage(Platform.WINDOWS);
        let bindings = windowsStorage.getDefaultKeybindingMap();
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+alt+up"]);
        assert.equal(countBindings(bindings), 866);
    });

    it("get unsupported OS default keybindings", () => {
        const unsupportedStorage = new KeybindingStorage(Platform.UNSUPPORTED);
        let bindings = unsupportedStorage.getDefaultKeybindingMap();
        assert.equal(bindings.size, 0);
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
        const linuxStorage = new KeybindingStorage(Platform.LINUX);
        let bindings = linuxStorage.getDefaultKeybindingMap();
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+shift+up", "shift+alt+up"]);
        linuxStorage.patch(bindings, JsonPatch);
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+shift+up", "numpad_add"]);
    });

});
