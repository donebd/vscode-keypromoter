import "reflect-metadata";
import * as assert from 'assert';
import { PatternUtils } from '../../../../editorActionTracker/patterns/common/patternUtils';
import { NavigationStep } from '../../../../editorActionTracker/types';

describe("PatternUtils Test", () => {

    describe("getPredominantDirection", () => {
        it("should detect right direction", () => {
            const steps: NavigationStep[] = [
                { timestamp: 100, line: 0, character: 1, direction: 'right', stepSize: 1, isWordStep: false },
                { timestamp: 200, line: 0, character: 2, direction: 'right', stepSize: 1, isWordStep: false },
                { timestamp: 300, line: 0, character: 3, direction: 'right', stepSize: 1, isWordStep: false },
            ];

            assert.equal(PatternUtils.getPredominantDirection(steps), 'right');
        });

        it("should detect left direction", () => {
            const steps: NavigationStep[] = [
                { timestamp: 100, line: 0, character: 3, direction: 'left', stepSize: 1, isWordStep: false },
                { timestamp: 200, line: 0, character: 2, direction: 'left', stepSize: 1, isWordStep: false },
                { timestamp: 300, line: 0, character: 1, direction: 'left', stepSize: 1, isWordStep: false },
            ];

            assert.equal(PatternUtils.getPredominantDirection(steps), 'left');
        });

        it("should return unknown for mixed directions without predominance", () => {
            const steps: NavigationStep[] = [
                { timestamp: 100, line: 0, character: 1, direction: 'right', stepSize: 1, isWordStep: false },
                { timestamp: 200, line: 0, character: 0, direction: 'left', stepSize: 1, isWordStep: false },
                { timestamp: 300, line: 0, character: 1, direction: 'right', stepSize: 1, isWordStep: false },
            ];

            assert.equal(PatternUtils.getPredominantDirection(steps), 'unknown');
        });

        it("should handle empty array", () => {
            assert.equal(PatternUtils.getPredominantDirection([]), 'unknown');
        });
    });

    describe("getHorizontalPredominantDirection", () => {
        it("should filter only horizontal movements", () => {
            const steps: NavigationStep[] = [
                { timestamp: 100, line: 0, character: 1, direction: 'right', stepSize: 1, isWordStep: false },
                { timestamp: 200, line: 1, character: 1, direction: 'down', stepSize: 1, isWordStep: false },
                { timestamp: 300, line: 1, character: 2, direction: 'right', stepSize: 1, isWordStep: false },
            ];

            assert.equal(PatternUtils.getHorizontalPredominantDirection(steps), 'right');
        });
    });

    describe("isContinuousSequence", () => {
        it("should detect continuous right movement", () => {
            const steps = [
                { line: 0, character: 0 },
                { line: 0, character: 1 },
                { line: 0, character: 2 },
            ];

            const isContinuous = PatternUtils.isContinuousSequence(
                steps,
                (prevChar) => prevChar + 1
            );

            assert.equal(isContinuous, true);
        });

        it("should detect discontinuous movement", () => {
            const steps = [
                { line: 0, character: 0 },
                { line: 0, character: 1 },
                { line: 0, character: 5 }, // Jump
            ];

            const isContinuous = PatternUtils.isContinuousSequence(
                steps,
                (prevChar) => prevChar + 1
            );

            assert.equal(isContinuous, false);
        });

        it("should detect line change", () => {
            const steps = [
                { line: 0, character: 0 },
                { line: 1, character: 1 }, // Line changed
            ];

            const isContinuous = PatternUtils.isContinuousSequence(
                steps,
                (prevChar) => prevChar + 1
            );

            assert.equal(isContinuous, false);
        });
    });

    describe("isTooFast", () => {
        it("should detect fast actions", () => {
            const timestamps = [100, 120, 140]; // 20ms apart

            assert.equal(PatternUtils.isTooFast(timestamps, 50), true);
        });

        it("should not flag slow actions", () => {
            const timestamps = [100, 200, 300]; // 100ms apart

            assert.equal(PatternUtils.isTooFast(timestamps, 50), false);
        });
    });

    describe("isWordBoundary", () => {
        it("should detect word boundaries", () => {
            assert.equal(PatternUtils.isWordBoundary(' '), true);
            assert.equal(PatternUtils.isWordBoundary('.'), true);
            assert.equal(PatternUtils.isWordBoundary(','), true);
            assert.equal(PatternUtils.isWordBoundary('('), true);
        });

        it("should not flag word characters", () => {
            assert.equal(PatternUtils.isWordBoundary('a'), false);
            assert.equal(PatternUtils.isWordBoundary('Z'), false);
            assert.equal(PatternUtils.isWordBoundary('5'), false);
        });
    });

    describe("averageTimeDiff", () => {
        it("should calculate average time difference", () => {
            const items = [
                { timestamp: 100 },
                { timestamp: 200 },
                { timestamp: 300 },
                { timestamp: 400 },
            ];

            assert.equal(PatternUtils.averageTimeDiff(items), 100);
        });

        it("should handle single item", () => {
            const items = [{ timestamp: 100 }];

            assert.equal(PatternUtils.averageTimeDiff(items), 0);
        });

        it("should handle empty array", () => {
            assert.equal(PatternUtils.averageTimeDiff([]), 0);
        });
    });
});
