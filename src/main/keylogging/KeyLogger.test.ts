import * as assert from 'assert';
import { KeyLogger } from "./KeyLogger";
import { UiohookKey } from 'uiohook-napi';

describe("Key Logger Test", () => {

    it("single key", () => {
        let keyLogger = new KeyLogger();
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), false);
        keyLogger.handleKeyDown(UiohookKey.W);
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), true);
        keyLogger.handleKeyUp(UiohookKey.W);
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), false);
    });

    it("two keys", () => {
        let keyLogger = new KeyLogger();
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+w"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["w+ctrl"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl"]), false);
        keyLogger.handleKeyDown(UiohookKey.Ctrl);
        keyLogger.handleKeyDown(UiohookKey.W);
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+w"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["w+ctrl"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl"]), false);
        keyLogger.handleKeyUp(UiohookKey.Ctrl);
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+w"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["w+ctrl"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl"]), false);
    });

    it("many keys", () => {
        let keyLogger = new KeyLogger();
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+shift+w"]), false);
        keyLogger.handleKeyDown(UiohookKey.Ctrl);
        keyLogger.handleKeyDown(UiohookKey.Shift);
        keyLogger.handleKeyDown(UiohookKey.W);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+shift+w"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+w+shift", "w+shift+ctrl", "shift+w+ctrl"]), false);
    });

});
