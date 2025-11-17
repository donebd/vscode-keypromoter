import { injectable } from 'inversify';
import * as vscode from 'vscode';
import * as configuration from '../configuration';
import { getPatternFriendlyName } from '../editorActionTracker/patternRegistry';
import { PatternMatch } from '../editorActionTracker/types';
import { logger } from '../helper/logging';
import { WildcardMatcher } from '../helper/wildcardMatcher';

@injectable()
export class EditorActionNotifier {
    private patternCounters = new Map<string, number>();
    private shownPatterns = new Set<string>();
    private ignoreMatcher: WildcardMatcher;

    private readonly PATTERN_PREFIX = 'editorPattern.';

    constructor() {
        this.ignoreMatcher = new WildcardMatcher(configuration.getIgnoreCommands());

        vscode.workspace.onDidChangeConfiguration(e => {
            if (configuration.didAffectIgnoredCommands(e)) {
                this.ignoreMatcher.updatePatterns(configuration.getIgnoreCommands());
                logger.debug('Updated ignored patterns in EditorActionNotifier');
            }
        });
    }

    /**
     * Get unique key for pattern tracking (includes sub-pattern if present)
     */
    private getPatternKey(match: PatternMatch): string {
        if (match.subPatternId) {
            return `${match.patternId}:${match.subPatternId}`;
        }
        return match.patternId;
    }

    /**
     * Get pattern identifier for ignore list (only main pattern ID)
     */
    private getIgnoreKey(match: PatternMatch): string {
        return this.PATTERN_PREFIX + match.patternId;
    }

    /**
     * Get pattern identifier for sub-pattern ignore (if needed)
     */
    private getSubPatternIgnoreKey(match: PatternMatch): string | null {
        if (match.subPatternId) {
            return `${this.PATTERN_PREFIX}${match.patternId}.${match.subPatternId}`;
        }
        return null;
    }

    public notify(match: PatternMatch): void {
        if (!configuration.getEditorActionsEnabled()) {
            logger.debug('Editor actions disabled, not showing notification');
            return;
        }

        // Check if main pattern is ignored
        const mainIgnoreKey = this.getIgnoreKey(match);
        if (this.ignoreMatcher.matches(mainIgnoreKey)) {
            logger.debug(`Pattern ${match.patternId} is ignored`);
            return;
        }

        // Check if sub-pattern is specifically ignored
        const subIgnoreKey = this.getSubPatternIgnoreKey(match);
        if (subIgnoreKey && this.ignoreMatcher.matches(subIgnoreKey)) {
            logger.debug(`Sub-pattern ${match.patternId}:${match.subPatternId} is ignored`);
            return;
        }

        // Use composite key for tracking (includes sub-pattern)
        const patternKey = this.getPatternKey(match);

        const counter = (this.patternCounters.get(patternKey) || 0) + 1;
        this.patternCounters.set(patternKey, counter);

        const loyaltyLevel = configuration.getEditorActionsLoyaltyLevel();

        logger.debug(`Pattern ${patternKey} counter: ${counter}/${loyaltyLevel}`);
        if (counter < loyaltyLevel) {
            return;
        }

        // Check if already shown (using composite key)
        if (this.shownPatterns.has(patternKey)) {
            return;
        }

        this.shownPatterns.add(patternKey);
        this.patternCounters.set(patternKey, 0);

        const ignoreThisBtn = 'Ignore This Tip';

        const buttons = ['Got it', 'Show Keybinding', ignoreThisBtn];

        vscode.window.showInformationMessage(
            `💡 ${match.message}`,
            ...buttons
        ).then(selection => {
            if (selection === 'Show Keybinding') {
                vscode.commands.executeCommand(
                    'workbench.action.openGlobalKeybindings',
                    match.suggestedCommand
                );
            } else if (selection === ignoreThisBtn) {
                const keyToIgnore = subIgnoreKey || mainIgnoreKey;
                configuration.addIgnoreCommand(keyToIgnore);
                logger.info(`Pattern ${patternKey} added to ignore list`);

                const friendlyName = this.getFriendlySubPatternName(match);
                vscode.window.showInformationMessage(
                    `"${friendlyName}" tip will no longer be shown.`
                );
            }
        });

        setTimeout(() => {
            this.shownPatterns.delete(patternKey);
        }, 60000);
    }

    /**
     * Get friendly name for pattern (including sub-pattern if present)
     */
    private getFriendlySubPatternName(match: PatternMatch): string {
        const baseName = getPatternFriendlyName(match.patternId);

        if (!match.subPatternId) {
            return baseName;
        }

        // Map sub-pattern IDs to friendly names
        const subPatternNames: Record<string, string> = {
            'word-traversal': 'Word-by-word navigation',
            'line-traversal': 'Line start/end navigation',
            'edge-bounce': 'Line edge navigation',
            'page-scroll': 'Page scrolling',
            'file-jump': 'File start/end jumping'
        };

        return subPatternNames[match.subPatternId] || `${baseName} (${match.subPatternId})`;
    }

    public reset(): void {
        this.patternCounters.clear();
        this.shownPatterns.clear();
    }
}
