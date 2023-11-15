import * as assert from 'assert';
import { KeyDownStack } from "./KeyDownStack";

describe("Key Down Stack Test", () => {

    it("single key press", () => {
        let stack = new KeyDownStack();
        stack.keyDown("A");
        assert.equal(stack.hasKeystroke(["A"]), true);
    });

});