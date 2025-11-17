import * as assert from 'assert';
import "reflect-metadata";
import { UiohookKey } from 'uiohook-napi-lite';
import { UiHookKeybindingTracker } from '../../../keybindingTracker/uiHookKeybindingTracker';

describe("Key Logger Test", () => {

    let keybindingTracker: UiHookKeybindingTracker | null = null;

    afterEach(() => {
        if (keybindingTracker) {
            keybindingTracker.dispose();
            keybindingTracker = null;
        }
    });

    it("single key", () => {
        keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.init();
        assert.equal(keybindingTracker.hasAnyKeybinding(["w"]), false);
        keybindingTracker.handleKeyDown(UiohookKey.W);
        assert.equal(keybindingTracker.hasAnyKeybinding(["w"]), true);
        keybindingTracker.handleKeyUp(UiohookKey.W);
        assert.equal(keybindingTracker.hasAnyKeybinding(["w"]), false);
    });

    it("two keys", () => {
        keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.init();
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
        keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.init();
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl+shift+w"]), false);
        keybindingTracker.handleKeyDown(UiohookKey.Ctrl);
        keybindingTracker.handleKeyDown(UiohookKey.Shift);
        keybindingTracker.handleKeyDown(UiohookKey.W);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl+shift+w"]), true);
        assert.equal(keybindingTracker.hasAnyKeybinding(["ctrl+w+shift", "w+shift+ctrl", "shift+w+ctrl"]), true);
    });

    it("key reuse", () => {
        keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.init();
        keybindingTracker.handleKeyDown(UiohookKey.Alt);
        keybindingTracker.handleKeyDown(UiohookKey.ArrowDown);
        assert.equal(keybindingTracker.hasAnyKeybinding(["alt+down"]), true);
        keybindingTracker.handleKeyUp(UiohookKey.ArrowDown);
        keybindingTracker.handleKeyDown(UiohookKey.ArrowUp);
        assert.equal(keybindingTracker.hasAnyKeybinding(["alt+down"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["alt+up"]), true);
    });

    it("chords", () => {
        keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.init();
        keybindingTracker.handleKeyDown(UiohookKey.A);
        keybindingTracker.handleKeyUp(UiohookKey.A);
        keybindingTracker.handleKeyDown(UiohookKey.B);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a+b"]), false);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a b"]), true);
    });

    it("repeated chords", () => {
        keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.init();
        keybindingTracker.handleKeyDown(UiohookKey.A);
        keybindingTracker.handleKeyUp(UiohookKey.A);
        keybindingTracker.handleKeyDown(UiohookKey.B);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a b"]), true);
        keybindingTracker.handleKeyUp(UiohookKey.B);
        keybindingTracker.handleKeyDown(UiohookKey.B);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a b"]), false);
    });

    it("mouse press", () => {
        keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.init();
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

    it("mouse press and release", () => {
        keybindingTracker = new UiHookKeybindingTracker();
        keybindingTracker.init();

        keybindingTracker.handleKeyDown(UiohookKey.A);
        keybindingTracker.handleKeyDown(UiohookKey.B);
        assert.equal(keybindingTracker.hasAnyKeybinding(["a+b"]), true);

        // Mouse press clears buffer
        keybindingTracker.handleMousePress();
        assert.equal(keybindingTracker.hasAnyKeybinding(["a b"]), false);

        // Mouse release doesn't affect keybinding detection
        keybindingTracker.handleMouseRelease();
        assert.equal(keybindingTracker.hasAnyKeybinding(["a+b"]), true);

        keybindingTracker.handleKeyUp(UiohookKey.A);
        keybindingTracker.handleKeyUp(UiohookKey.B);
    });

});
