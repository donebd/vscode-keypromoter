import { EditorPatternId, getPatternSuggestedCommand } from '../patternRegistry';
import { EditorAction, EditorActionType, PatternMatch } from '../types';
import { BaseEditorActionPattern } from './baseEditorActionPattern';
import { FAST_ACTION_THRESHOLD_MS } from './common/constants';
import { PatternUtils } from './common/patternUtils';
import { SequenceTracker } from './common/sequenceTracker';

interface InsertInfo {
    text: string;
    line: number;
    timestamp: number;
}

export class LineDuplicationPattern extends BaseEditorActionPattern {
    private insertions: SequenceTracker<InsertInfo>;

    private readonly MIN_TEXT_LENGTH = 3;
    private readonly MIN_DUPLICATIONS = 2;

    constructor() {
        super(
            EditorPatternId.LineDuplicationManual,
            getPatternSuggestedCommand(EditorPatternId.LineDuplicationManual)
        );
        this.insertions = new SequenceTracker({ timeout: 5000, maxLength: 10 });
    }

    public reset(): void {
        this.insertions.reset();
    }

    public process(action: EditorAction): PatternMatch | null {
        if (action.type !== EditorActionType.Insert || !action.text || !action.range) {
            return null;
        }

        const trimmedText = action.text.trim();
        if (trimmedText.length < this.MIN_TEXT_LENGTH) {
            return null;
        }

        // Add to sequence
        this.insertions.add({
            text: trimmedText,
            line: action.range.start.line,
            timestamp: action.timestamp
        });

        if (this.insertions.length < this.MIN_DUPLICATIONS) {
            return null;
        }

        // Check for duplication pattern
        const recentInserts = this.insertions.slice(-this.MIN_DUPLICATIONS);

        // All same text?
        const firstText = recentInserts[0].text;
        if (!recentInserts.every(item => item.text === firstText)) {
            return null;
        }

        // Different lines?
        const lines = recentInserts.map(item => item.line);
        const uniqueLines = new Set(lines);

        if (uniqueLines.size < this.MIN_DUPLICATIONS) {
            return null;
        }

        // Lines close together?
        const minLine = Math.min(...lines);
        const maxLine = Math.max(...lines);
        if (maxLine - minLine > this.MIN_DUPLICATIONS + 1) {
            return null;
        }

        // Check timing
        const timestamps = recentInserts.map(item => item.timestamp);
        if (PatternUtils.isTooFast(timestamps, FAST_ACTION_THRESHOLD_MS)) {
            this.logDebug('too fast, likely shortcut');
            this.reset();
            return null;
        }

        // Check if copy commands were used
        const firstItem = recentInserts[0];
        const lastItem = recentInserts[recentInserts.length - 1];

        if (this.wasAnyCommandExecutedInRange(
            ['editor.action.copyLinesDownAction', 'editor.action.copyLinesUpAction'],
            firstItem.timestamp,
            lastItem.timestamp
        )) {
            this.reset();
            return null;
        }

        const keyHint = this.getFormattedKeybinding(this.suggestedCommand);

        this.logInfo(`matched: ${recentInserts.length} insertions of "${firstText}"`);

        const match: PatternMatch = {
            patternId: this.id,
            suggestedCommand: this.suggestedCommand,
            message: `You manually duplicated a line. Try ${keyHint} to duplicate lines faster!`,
            detectedActions: []
        };

        this.reset();
        return match;
    }
}
