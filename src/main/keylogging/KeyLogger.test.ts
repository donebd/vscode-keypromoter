import * as assert from 'assert';
import { KeyLogger } from "./KeyLogger";
import { UiohookKey } from 'uiohook-napi';

describe("Key Logger Test", () => {

    it("single key", () => {
        let keyLogger = new KeyLogger();
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), false);
        keyLogger.handleKeyDown(UiohookKey.W);
        assert.equal(keyLogger.hasAnyKeybinding(["w"]), true);
    });

});
