import * as assert from 'assert';
import { KeyDownStack } from "../../../keylogger/keyDownStack";

describe("Key Down Stack Test", () => {

    it("single key down", () => {
        let stack = new KeyDownStack();
        stack.keyDown("A");
        assert.equal(stack.hasKeystroke(["A"]), true);
    });

    it("many keys down", () => {
        let stack = new KeyDownStack();
        assert.equal(stack.hasKeystroke([]), true);
        stack.keyDown("A");
        assert.equal(stack.hasKeystroke([]), false);
        stack.keyDown("B");
        stack.keyDown("C");
        assert.equal(stack.hasKeystroke(["A"]), false);
        assert.equal(stack.hasKeystroke(["B"]), false);
        assert.equal(stack.hasKeystroke(["C"]), false);
        assert.equal(stack.hasKeystroke(["A", "B"]), false);
        assert.equal(stack.hasKeystroke(["B", "C"]), false);
        assert.equal(stack.hasKeystroke(["A", "C"]), false);
        assert.equal(stack.hasKeystroke(["A", "B", "C"]), true);
        assert.equal(stack.hasKeystroke(["B", "A", "C"]), false);
    });

    it("single key up", () => {
        let stack = new KeyDownStack();
        stack.keyDown("A");
        stack.keyUp("B");
        assert.equal(stack.hasKeystroke(["A"]), true);
        stack.keyUp("A");
        assert.equal(stack.hasKeystroke(["A"]), false);
        assert.equal(stack.hasKeystroke([]), true);
    });

    it("many keys up", () => {
        let stack = new KeyDownStack();
        stack.keyDown("A");
        stack.keyDown("B");
        stack.keyDown("C");
        assert.equal(stack.hasKeystroke(["A", "B", "C"]), true);
        stack.keyUp("B");
        assert.equal(stack.hasKeystroke(["A", "B", "C"]), false);
        assert.equal(stack.hasKeystroke(["A", "C"]), true);
        stack.keyUp("A");
        assert.equal(stack.hasKeystroke(["A", "C"]), false);
        assert.equal(stack.hasKeystroke(["C"]), true);
        stack.keyUp("C");
        assert.equal(stack.hasKeystroke(["C"]), false);
        assert.equal(stack.hasKeystroke([]), true);
    });

    it("reset", () => {
        let stack = new KeyDownStack();
        stack.keyDown("A");
        stack.keyDown("B");
        stack.keyDown("C");
        assert.equal(stack.hasKeystroke(["A", "B", "C"]), true);
        stack.reset();
        assert.equal(stack.hasKeystroke(["A", "B", "C"]), false);
        assert.equal(stack.hasKeystroke(["A", "B"]), false);
        assert.equal(stack.hasKeystroke(["A"]), false);
        assert.equal(stack.hasKeystroke([]), true);
    });

});