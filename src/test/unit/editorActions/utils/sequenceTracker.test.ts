import "reflect-metadata";
import * as assert from 'assert';
import { SequenceTracker } from '../../../../editorActionTracker/patterns/common/sequenceTracker';

interface TestItem {
    timestamp: number;
    value: string;
}

describe("SequenceTracker Test", () => {

    it("should add items and track length", () => {
        const tracker = new SequenceTracker<TestItem>({ maxLength: 10 });

        assert.equal(tracker.length, 0);

        tracker.add({ timestamp: 100, value: 'a' });
        assert.equal(tracker.length, 1);

        tracker.add({ timestamp: 200, value: 'b' });
        assert.equal(tracker.length, 2);
    });

    it("should respect max length", () => {
        const tracker = new SequenceTracker<TestItem>({ maxLength: 3 });

        tracker.add({ timestamp: 100, value: 'a' });
        tracker.add({ timestamp: 200, value: 'b' });
        tracker.add({ timestamp: 300, value: 'c' });
        tracker.add({ timestamp: 400, value: 'd' });

        assert.equal(tracker.length, 3);
        assert.equal(tracker.firstItem?.value, 'b');
        assert.equal(tracker.lastItem?.value, 'd');
    });

    it("should handle timeout", () => {
        const tracker = new SequenceTracker<TestItem>({ timeout: 1000 });

        tracker.add({ timestamp: 100, value: 'a' });
        tracker.add({ timestamp: 200, value: 'b' });

        assert.equal(tracker.length, 2);

        // Add item after timeout
        tracker.add({ timestamp: 1200, value: 'c' });

        assert.equal(tracker.length, 1);
        assert.equal(tracker.firstItem?.value, 'c');
    });

    it("should filter items correctly", () => {
        const tracker = new SequenceTracker<TestItem>({ maxLength: 10 });

        tracker.add({ timestamp: 100, value: 'a' });
        tracker.add({ timestamp: 200, value: 'b' });
        tracker.add({ timestamp: 300, value: 'a' });
        tracker.add({ timestamp: 400, value: 'c' });

        const aItems = tracker.filter(item => item.value === 'a');
        assert.equal(aItems.length, 2);
    });

    it("should check predicates with some and every", () => {
        const tracker = new SequenceTracker<TestItem>({ maxLength: 10 });

        tracker.add({ timestamp: 100, value: 'a' });
        tracker.add({ timestamp: 200, value: 'b' });
        tracker.add({ timestamp: 300, value: 'a' });

        assert.equal(tracker.some(item => item.value === 'b'), true);
        assert.equal(tracker.some(item => item.value === 'z'), false);

        assert.equal(tracker.every(item => item.timestamp > 0), true);
        assert.equal(tracker.every(item => item.value === 'a'), false);
    });

    it("should reset correctly", () => {
        const tracker = new SequenceTracker<TestItem>({ maxLength: 10 });

        tracker.add({ timestamp: 100, value: 'a' });
        tracker.add({ timestamp: 200, value: 'b' });

        assert.equal(tracker.length, 2);

        tracker.reset();

        assert.equal(tracker.length, 0);
        assert.equal(tracker.firstItem, undefined);
        assert.equal(tracker.lastItem, undefined);
    });

    it("should slice items", () => {
        const tracker = new SequenceTracker<TestItem>({ maxLength: 10 });

        tracker.add({ timestamp: 100, value: 'a' });
        tracker.add({ timestamp: 200, value: 'b' });
        tracker.add({ timestamp: 300, value: 'c' });
        tracker.add({ timestamp: 400, value: 'd' });

        const lastTwo = tracker.slice(-2);
        assert.equal(lastTwo.length, 2);
        assert.equal(lastTwo[0].value, 'c');
        assert.equal(lastTwo[1].value, 'd');
    });

    it("should check minimum length", () => {
        const tracker = new SequenceTracker<TestItem>({ minLength: 3 });

        tracker.add({ timestamp: 100, value: 'a' });
        assert.equal(tracker.hasMinLength(), false);

        tracker.add({ timestamp: 200, value: 'b' });
        assert.equal(tracker.hasMinLength(), false);

        tracker.add({ timestamp: 300, value: 'c' });
        assert.equal(tracker.hasMinLength(), true);
    });
});
