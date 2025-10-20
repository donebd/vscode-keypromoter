import "reflect-metadata";
import * as assert from 'assert';
import { UiohookKey } from 'uiohook-napi';
import { UiHookKeybindingTracker } from '../../../keybindingTracker/uiHookKeybindingTracker';

describe("Key Logger Test", () => {

    it("single key", () => {
        let keybindingTracker = new UiHookKeybindingTracker();
        assert.equal(keybindingTracker.hasAnyKeybinding(["w"]), false);
        keybindingTracker.handleKeyDown(UiohookKey.W);
        assert.equal(keybindingTracker.hasAnyKeybinding(["w"]), true);
        keybindingTracker.handleKeyUp(UiohookKey.W);
        assert.equal(keybindingTracker.hasAnyKeybinding(["w"]), false);
    });

    it("two keys", () => {
        let keybindingTracker = new UiHookKeybindingTracker();
        assert.equal(keybindingTracker.hasAnyKeybinding(["w"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl+w"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["w+ctrl"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl"]), false);
        keybindingTracker.handleKeyDown(UiohookKey.Ctrl);
        keybindingTracker.handleKeyDown(UiohookKey.W);
        assert.equal(keybindingTracker.hasAnyKeybinding(["w"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl+w"]), true);
        assert.equal(keybindingTracker.hasAnyKeybinding(["w+ctrl"]), true);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl"]), false);
        keybindingTracker.handleKeyUp(UiohookKey.Ctrl);
        assert.equal(keybindingTracker.hasAnyKeybinding(["w"]), true);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl+w"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["w+ctrl"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl"]), false);
    });

    it("many keys", () => {
        let keybindingTracker = new UiHookKeybindingTracker();
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl+shift+w"]), false);
        keybindingTracker.handleKeyDown(UiohookKey.Ctrl);
        keybindingTracker.handleKeyDown(UiohookKey.Shift);
        keybindingTracker.handleKeyDown(UiohookKey.W);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl+shift+w"]), true);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl+w+shift", "w+shift+ctrl", "shift+w+ctrl"]), true);
    });

    it("key reuse", () => {
        let keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.handleKeyDown(UiohookKey.Alt);
        keybindingTracker.handleKeyDown(UiohookKey.ArrowDown);
        assert.equal(keybindingTracker.hasAnyKeybinding(["alt+down"]), true);
        keybindingTracker.handleKeyUp(UiohookKey.ArrowDown);
        keybindingTracker.handleKeyDown(UiohookKey.ArrowUp);
        assert.equal(keybindingTracker.hasAnyKeybinding(["alt+down"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["alt+up"]), true);
    });

    it("chords", () => {
        let keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.handleKeyDown(UiohookKey.A);
        keybindingTracker.handleKeyUp(UiohookKey.A);
        keybindingTracker.handleKeyDown(UiohookKey.B);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a+b"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a b"]), true);
    });

    it("repeated chords", () => {
        let keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.handleKeyDown(UiohookKey.A);
        keybindingTracker.handleKeyUp(UiohookKey.A);
        keybindingTracker.handleKeyDown(UiohookKey.B);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a b"]), true);
        keybindingTracker.handleKeyUp(UiohookKey.B);
        keybindingTracker.handleKeyDown(UiohookKey.B);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a b"]), false);
    });

    it("mouse press", () => {
        let keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.handleKeyDown(UiohookKey.A);
        keybindingTracker.handleKeyDown(UiohookKey.B);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a+b"]), true);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a b"]), true);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a+b"]), false);
        keybindingTracker.handleKeyDown(UiohookKey.A);
        keybindingTracker.handleKeyDown(UiohookKey.B);
        keybindingTracker.handleMousePress();
        assert.equal(keybindingTracker.hasAnyKeybinding(["a+b"]), true);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a b"]), false);
    });

});
