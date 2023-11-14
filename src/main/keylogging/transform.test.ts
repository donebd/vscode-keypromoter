import * as assert from 'assert';
import * as transform from './transform';
import * as iohook from 'uiohook-napi';

describe("Key Transform Test", () => {

    it("some keys from keycode", () => {
        assert.equal(transform.keyFromKeycode(iohook.UiohookKey.F10), "f10");
        assert.equal(transform.keyFromKeycode(iohook.UiohookKey.W), "w");
        assert.equal(transform.keyFromKeycode(iohook.UiohookKey.Alt), "alt");
        assert.equal(transform.keyFromKeycode(iohook.UiohookKey.Escape), "escape");
        assert.equal(transform.keyFromKeycode(0), transform.UNSUPPORTED_KEY);
    });

});