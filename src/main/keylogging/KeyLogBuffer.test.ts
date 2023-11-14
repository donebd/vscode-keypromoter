import * as assert from 'assert';
import { KeyLogBuffer } from "./KeyLogBuffer";

describe("Key Log Buffer Test", () => {

    it("buffer size 1", () => {
        var buf = new KeyLogBuffer(1);
        assert.equal(buf.wasPressed("A"), false);
        buf.keyPressed("A");
        assert.equal(buf.wasPressed("A"), true);
        assert.equal(buf.wasPressed("B"), false);
        buf.keyPressed("B");
        assert.equal(buf.wasPressed("A"), false);
        assert.equal(buf.wasPressed("B"), true);
    });

    it("buffer size 2", () => {
        var buf = new KeyLogBuffer(2);
        assert.equal(buf.wasPressed("A"), false);
        assert.equal(buf.wasPressed("B"), false);
        buf.keyPressed("A");
        assert.equal(buf.wasPressed("A"), true);
        assert.equal(buf.wasPressed("B"), false);
        buf.keyPressed("B");
        assert.equal(buf.wasPressed("A"), true);
        assert.equal(buf.wasPressed("B"), true);
        buf.keyPressed("C");
        assert.equal(buf.wasPressed("A"), false);
        assert.equal(buf.wasPressed("B"), true);
        assert.equal(buf.wasPressed("C"), true);
    });

    it("keystrokes", () => {
        var buf = new KeyLogBuffer(3);
        buf.keyPressed("A");
        buf.keyPressed("B");
        buf.keyPressed("C");
        assert.equal(buf.hasKeystroke(["A", "C"]), false);
        assert.equal(buf.hasKeystroke(["A", "B"]), true);
        assert.equal(buf.hasKeystroke(["B", "C"]), true);
        assert.equal(buf.hasKeystroke(["A", "B", "C"]), true);        
    });

    it("looping keystrokes", () => {
        var buf = new KeyLogBuffer(3);
        buf.keyPressed("A");
        buf.keyPressed("B");
        buf.keyPressed("C");
        buf.keyPressed("D");
        assert.equal(buf.hasKeystroke(["A", "B"]), false);
        assert.equal(buf.hasKeystroke(["B", "C"]), true);
        assert.equal(buf.hasKeystroke(["C", "D"]), true);
        assert.equal(buf.hasKeystroke(["D", "A"]), false);
        assert.equal(buf.hasKeystroke(["A", "B", "C"]), false);
        assert.equal(buf.hasKeystroke(["B", "C", "D"]), true);        
    });

});
