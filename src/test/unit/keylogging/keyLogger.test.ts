import "reflect-metadata";
import * as assert from 'assert';
import { UiohookKey } from 'uiohook-napi';
import { UiHookKeyLogger } from '../../../keylogger/uiHookKeyLogger';

describe("Key Logger Test", () => {

    it("single key", () => {
        let keyLogger = new UiHookKeyLogger();
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), false);
        keyLogger.handleKeyDown(UiohookKey.W);
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), true);
        keyLogger.handleKeyUp(UiohookKey.W);
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), false);
    });

    it("two keys", () => {
        let keyLogger = new UiHookKeyLogger();
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+w"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["w+ctrl"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl"]), false);
        keyLogger.handleKeyDown(UiohookKey.Ctrl);
        keyLogger.handleKeyDown(UiohookKey.W);
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+w"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["w+ctrl"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl"]), false);
        keyLogger.handleKeyUp(UiohookKey.Ctrl);
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+w"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["w+ctrl"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl"]), false);
    });

    it("many keys", () => {
        let keyLogger = new UiHookKeyLogger();
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+shift+w"]), false);
        keyLogger.handleKeyDown(UiohookKey.Ctrl);
        keyLogger.handleKeyDown(UiohookKey.Shift);
        keyLogger.handleKeyDown(UiohookKey.W);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+shift+w"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["ctrl+w+shift", "w+shift+ctrl", "shift+w+ctrl"]), true);
    });

    it("key reuse", () => {
        let keyLogger = new UiHookKeyLogger();
        keyLogger.handleKeyDown(UiohookKey.Alt);
        keyLogger.handleKeyDown(UiohookKey.ArrowDown);
        assert.equal(keyLogger.hasAnyKeybinding(["alt+down"]), true);
        keyLogger.handleKeyUp(UiohookKey.ArrowDown);
        keyLogger.handleKeyDown(UiohookKey.ArrowUp);
        assert.equal(keyLogger.hasAnyKeybinding(["alt+down"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["alt+up"]), true);
    });

    it("chords", () => {
        let keyLogger = new UiHookKeyLogger();
        keyLogger.handleKeyDown(UiohookKey.A);
        keyLogger.handleKeyUp(UiohookKey.A);
        keyLogger.handleKeyDown(UiohookKey.B);
        assert.equal(keyLogger.hasAnyKeybinding(["a+b"]), false);
        assert.equal(keyLogger.hasAnyKeybinding(["a b"]), true);
    });

    it("repeated chords", () => {
        let keyLogger = new UiHookKeyLogger();
        keyLogger.handleKeyDown(UiohookKey.A);
        keyLogger.handleKeyUp(UiohookKey.A);
        keyLogger.handleKeyDown(UiohookKey.B);
        assert.equal(keyLogger.hasAnyKeybinding(["a b"]), true);
        keyLogger.handleKeyUp(UiohookKey.B);
        keyLogger.handleKeyDown(UiohookKey.B);
        assert.equal(keyLogger.hasAnyKeybinding(["a b"]), false);
    });

    it("mouse press", () => {
        let keyLogger = new UiHookKeyLogger();
        keyLogger.handleKeyDown(UiohookKey.A);
        keyLogger.handleKeyDown(UiohookKey.B);
        assert.equal(keyLogger.hasAnyKeybinding(["a+b"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["a b"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["a+b"]), false);
        keyLogger.handleKeyDown(UiohookKey.A);
        keyLogger.handleKeyDown(UiohookKey.B);
        keyLogger.handleMousePress();
        assert.equal(keyLogger.hasAnyKeybinding(["a+b"]), true);
        assert.equal(keyLogger.hasAnyKeybinding(["a b"]), false);
    });

});
