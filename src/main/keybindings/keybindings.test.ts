import * as assert from 'assert';
import * as keybindings from './keybindings';

describe("Keybindings Test", () => {

    it("get linux default keybindings", () => {
        let bindings = keybindings.load("linux");
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+shift+up", "shift+alt+up"]);
        assert.equal(countBindings(bindings), 858);
    });

    it("get macos default keybindings", () => {
        let bindings = keybindings.load("macos");
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["alt+cmd+up"]);
        assert.equal(countBindings(bindings), 925);
    });

    it("get windows default keybindings", () => {
        let bindings = keybindings.load("windows");
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