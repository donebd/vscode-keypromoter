import * as assert from 'assert';
import * as keybindings from './keybindings';

describe("Keybindings Test", () => {

    it("get default keybindings", () => {
        let bindings = keybindings.load("linux");
        assert.equal(bindings.get("editor.action.insertCursorAbove"), ["ctrl+shift+up", "shift+alt+up"]);
    });

});