import * as assert from 'assert';
import { KeyLogBuffer } from "./KeyLogBuffer";

describe("Key Log Buffer Test", () => {
    it("buffer size 1", () => {
        var buf = new KeyLogBuffer(1);
        buf.keyPressed("A");
        assert.equal(buf.wasPressed("A"), true);
    });
});
