import * as assert from 'assert';
import * as keybindings from './keybindings';

describe("Keybindings Test", () => {

    it("get default keybindings", () => {
        let bindings = keybindings.load("linux");
        assert.deepEqual(bindings.get("editor.action.insertCursorAbove"), ["ctrl+shift+up", "shift+alt+up"]);
        let total = 0;
        bindings.forEach((keystrokes: string[], _: string) => {
            total += keystrokes.length;
        });
        assert.equal(total, 858);
    });

});