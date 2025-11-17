import { injectable } from 'inversify';
import { EditorAction, EditorState } from './types';

@injectable()
export class EditorStateManager {
    private state: EditorState = {
        actionSequence: [],
        documentVersion: 0
    };

    private readonly MAX_SEQUENCE_LENGTH = 50;
    private readonly SEQUENCE_TIMEOUT_MS = 5000000;

    public recordAction(action: EditorAction): void {
        const now = Date.now();
        this.state.actionSequence = this.state.actionSequence.filter(
            a => now - a.timestamp < this.SEQUENCE_TIMEOUT_MS
        );

        this.state.actionSequence.push(action);
        this.state.lastAction = action;

        if (action.selection) {
            this.state.lastSelection = action.selection;
        }
        if (action.text) {
            this.state.lastText = action.text;
        }

        if (this.state.actionSequence.length > this.MAX_SEQUENCE_LENGTH) {
            this.state.actionSequence.shift();
        }

        this.state.documentVersion++;
    }

    public getState(): Readonly<EditorState> {
        return this.state;
    }

    public getRecentActions(count: number): EditorAction[] {
        return this.state.actionSequence.slice(-count);
    }

    public reset(): void {
        this.state = {
            actionSequence: [],
            documentVersion: 0
        };
    }
}
