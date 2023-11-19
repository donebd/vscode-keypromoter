import * as assert from 'assert';
import { Platform } from '../../../helper/platform';
import { KeybindingStorage } from '../../../services/keybindingStorage';

describe("Default Keybindings Test", () => {

    it("get linux default keybindings", () => {
        const linuxStorage = new KeybindingStorage(Platform.LINUX, true);
        assert.deepEqual(linuxStorage.getKeybindingsFor("editor.action.insertCursorAbove"), ["ctrl+shift+up", "shift+alt+up"]);
        assert.equal(countBindings(linuxStorage.allKeybindings()), 858);
    });

    it("get macos default keybindings", () => {
        const macStorage = new KeybindingStorage(Platform.MACOS, true);
        assert.deepEqual(macStorage.getKeybindingsFor("editor.action.insertCursorAbove"), ["alt+cmd+up"]);
        assert.equal(countBindings(macStorage.allKeybindings()), 925);
    });

    it("get windows default keybindings", () => {
        const windowsStorage = new KeybindingStorage(Platform.WINDOWS, true);
        assert.deepEqual(windowsStorage.getKeybindingsFor("editor.action.insertCursorAbove"), ["ctrl+alt+up"]);
        assert.equal(countBindings(windowsStorage.allKeybindings()), 866);
    });

    it("get unsupported OS default keybindings", () => {
        const unsupportedStorage = new KeybindingStorage(Platform.UNSUPPORTED, true);
        assert.equal(unsupportedStorage.allKeybindings().size, 0);
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
        const linuxStorage = new KeybindingStorage(Platform.LINUX, true);
        assert.deepEqual(linuxStorage.getKeybindingsFor("editor.action.insertCursorAbove"), ["ctrl+shift+up", "shift+alt+up"]);
        linuxStorage.patch(JsonPatch);
        assert.deepEqual(linuxStorage.getKeybindingsFor("editor.action.insertCursorAbove"), ["ctrl+shift+up", "numpad_add"]);
    });

});
