import "reflect-metadata";
import * as assert from 'assert';
import { UiohookKey } from 'uiohook-napi-lite';
import * as transform from '../../../keybindingTracker/transform';

describe("Key Transform Test", () => {

    it("some keys from keycode (Uiohook)", () => {
        assert.equal(transform.keyFromUioHookKeycode(UiohookKey.F10), "f10");
        assert.equal(transform.keyFromUioHookKeycode(UiohookKey.W), "w");
        assert.equal(transform.keyFromUioHookKeycode(UiohookKey.Alt), "alt");
        assert.equal(transform.keyFromUioHookKeycode(UiohookKey.Escape), "escape");
        assert.equal(transform.keyFromUioHookKeycode(999999), transform.UNSUPPORTED_KEY);
    });

    it("some keys from Simen key names", () => {
        assert.equal(transform.keyFromSimenKeyName("LEFT SHIFT"), "shift");
        assert.equal(transform.keyFromSimenKeyName("A"), "a");
        assert.equal(transform.keyFromSimenKeyName("RETURN"), "enter");
        assert.equal(transform.keyFromSimenKeyName("UNKNOWN_KEY_NAME_XYZ"), transform.UNSUPPORTED_KEY);
    });

});