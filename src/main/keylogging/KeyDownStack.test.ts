import * as assert from 'assert';
import { KeyDownStack } from "./KeyDownStack";

describe("Key Down Stack Test", () => {

    it("single key down", () => {
        let stack = new KeyDownStack();
        stack.keyDown("A");
        assert.equal(stack.hasKeystroke(["A"]), true);
    });

    it("many keys down", () => {
        let stack = new KeyDownStack();
        stack.keyDown("A");
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

});