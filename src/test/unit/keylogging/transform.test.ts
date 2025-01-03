import "reflect-metadata";
import * as assert from 'assert';
import * as iohook from 'uiohook-napi';
import * as transform from '../../../keylogger/transform';

describe("Key Transform Test", () => {

    it("some keys from keycode", () => {
        assert.equal(transform.keyFromUioHookKeycode(iohook.UiohookKey.F10), "f10");
        assert.equal(transform.keyFromUioHookKeycode(iohook.UiohookKey.W), "w");
        assert.equal(transform.keyFromUioHookKeycode(iohook.UiohookKey.Alt), "alt");
        assert.equal(transform.keyFromUioHookKeycode(iohook.UiohookKey.Escape), "escape");
        assert.equal(transform.keyFromUioHookKeycode(0), transform.UNSUPPORTED_KEY);
    });

});