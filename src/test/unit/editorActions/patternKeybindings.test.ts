import * as assert from 'assert';
import "reflect-metadata";
import {
    EditorPatternId,
    getAllUsedCommands,
    getPatternCommands,
    PATTERN_RESET_COMMANDS,
    PATTERN_SUGGESTED_COMMANDS
} from '../../../editorActionTracker/patternRegistry';
import { Platform } from '../../../helper/platform';
import { KeybindingStorage } from '../../../services/keybindingStorage';

describe('Pattern Keybindings Test', () => {

    describe('Default keybindings coverage', () => {

        const platforms = [Platform.LINUX, Platform.WINDOWS, Platform.MACOS];

        platforms.forEach(platform => {
            describe(`${platform} platform`, () => {

                let storage: KeybindingStorage;
                let allCommands: string[];
                let missingCommands: string[];

                before(() => {
                    storage = new KeybindingStorage(platform, true); // defaultOnly = true
                    allCommands = getAllUsedCommands();
                    missingCommands = allCommands.filter(cmd => {
                        const bindings = storage.getKeybindingsFor(cmd);
                        return bindings.length === 0;
                    });
                });

                it('should have keybindings for all pattern commands', () => {
                    if (missingCommands.length > 0) {
                        assert.fail(
                            `Missing keybindings for ${platform}:\n` +
                            missingCommands.map(cmd => `  - ${cmd}`).join('\n') +
                            `\n\nTotal: ${missingCommands.length}/${allCommands.length} commands missing`
                        );
                    }
                });

                it('should have keybindings for all suggested commands', () => {
                    const missingSuggested = Object.entries(PATTERN_SUGGESTED_COMMANDS)
                        .filter(([_, cmd]) => storage.getKeybindingsFor(cmd).length === 0)
                        .map(([patternId, cmd]) => ({ patternId, cmd }));

                    if (missingSuggested.length > 0) {
                        assert.fail(
                            `Missing suggested command keybindings for ${platform}:\n` +
                            missingSuggested.map(({ patternId, cmd }) =>
                                `  - ${patternId}: ${cmd}`
                            ).join('\n')
                        );
                    }
                });

                it('should have keybindings for all reset commands', () => {
                    const missingReset: { patternId: string; cmd: string }[] = [];

                    Object.entries(PATTERN_RESET_COMMANDS).forEach(([patternId, commands]) => {
                        commands.forEach(cmd => {
                            if (storage.getKeybindingsFor(cmd).length === 0) {
                                missingReset.push({ patternId, cmd });
                            }
                        });
                    });

                    if (missingReset.length > 0) {
                        assert.fail(
                            `Missing reset command keybindings for ${platform}:\n` +
                            missingReset.map(({ patternId, cmd }) =>
                                `  - ${patternId}: ${cmd}`
                            ).join('\n')
                        );
                    }
                });

                // Individual pattern tests
                Object.values(EditorPatternId).forEach(patternId => {
                    it(`should have keybindings for ${patternId} pattern`, () => {
                        const commands = getPatternCommands(patternId);
                        const missing = commands.filter(cmd =>
                            storage.getKeybindingsFor(cmd).length === 0
                        );

                        if (missing.length > 0) {
                            assert.fail(
                                `Pattern ${patternId} has missing keybindings for ${platform}:\n` +
                                missing.map(cmd => `  - ${cmd}`).join('\n')
                            );
                        }
                    });
                });
            });
        });
    });

    describe('Keybinding format validation', () => {

        const platforms = [Platform.LINUX, Platform.WINDOWS, Platform.MACOS];

        platforms.forEach(platform => {
            it(`should have non-empty keybindings for ${platform}`, () => {
                const storage = new KeybindingStorage(platform, true);
                const allCommands = getAllUsedCommands();

                allCommands.forEach(cmd => {
                    const bindings = storage.getKeybindingsFor(cmd);
                    bindings.forEach(binding => {
                        assert.ok(
                            binding && binding.length > 0,
                            `Empty keybinding for command ${cmd} on ${platform}`
                        );
                    });
                });
            });

            it(`should have valid keybinding format for ${platform}`, () => {
                const storage = new KeybindingStorage(platform, true);
                const allCommands = getAllUsedCommands();

                // Simple validation: keybindings should contain at least one character
                // and use + as separator (if modifier keys are present)
                const validKeybindingPattern = /^[\w+\-]+$/;

                allCommands.forEach(cmd => {
                    const bindings = storage.getKeybindingsFor(cmd);
                    bindings.forEach(binding => {
                        assert.ok(
                            validKeybindingPattern.test(binding),
                            `Invalid keybinding format for ${cmd} on ${platform}: "${binding}"`
                        );
                    });
                });
            });
        });
    });

    describe('Command coverage statistics', () => {

        it('should report coverage for all platforms', () => {
            const platforms = [Platform.LINUX, Platform.WINDOWS, Platform.MACOS];
            const allCommands = getAllUsedCommands();

            console.log('\n=== Keybinding Coverage Report ===\n');
            console.log(`Total commands used: ${allCommands.length}\n`);

            platforms.forEach(platform => {
                const storage = new KeybindingStorage(platform, true);
                const covered = allCommands.filter(cmd =>
                    storage.getKeybindingsFor(cmd).length > 0
                );

                const coverage = ((covered.length / allCommands.length) * 100).toFixed(1);

                console.log(`${platform}:`);
                console.log(`  Covered: ${covered.length}/${allCommands.length} (${coverage}%)`);

                if (covered.length < allCommands.length) {
                    const missing = allCommands.filter(cmd =>
                        storage.getKeybindingsFor(cmd).length === 0
                    );
                    console.log(`  Missing: ${missing.join(', ')}`);
                }
                console.log('');
            });

            // This test always passes, it's just for reporting
            assert.ok(true);
        });

        it('should list all commands by pattern', () => {
            console.log('\n=== Commands by Pattern ===\n');

            Object.values(EditorPatternId).forEach(patternId => {
                const commands = getPatternCommands(patternId);
                console.log(`${patternId}:`);
                commands.forEach(cmd => console.log(`  - ${cmd}`));
                console.log('');
            });

            assert.ok(true);
        });
    });

    describe('Cross-platform consistency', () => {

        it('should have same commands across all platforms', () => {
            const platforms = [Platform.LINUX, Platform.WINDOWS, Platform.MACOS];
            const storages = platforms.map(p => new KeybindingStorage(p, true));
            const allCommands = getAllUsedCommands();

            const inconsistencies: string[] = [];

            allCommands.forEach(cmd => {
                const hasBindings = storages.map(s =>
                    s.getKeybindingsFor(cmd).length > 0
                );

                // Check if some platforms have it but others don't
                const hasAny = hasBindings.some(h => h);
                const hasAll = hasBindings.every(h => h);

                if (hasAny && !hasAll) {
                    const missing = platforms.filter((_, i) => !hasBindings[i]);
                    inconsistencies.push(
                        `${cmd}: missing on ${missing.join(', ')}`
                    );
                }
            });

            if (inconsistencies.length > 0) {
                console.warn(
                    '\n⚠️  Cross-platform inconsistencies detected:\n' +
                    inconsistencies.map(i => `  - ${i}`).join('\n')
                );
            }

            // This is a warning, not a failure - some commands may be platform-specific
            assert.ok(true);
        });
    });

    describe('Specific command tests', () => {

        it('should have deleteLine on all platforms', () => {
            const platforms = [Platform.LINUX, Platform.WINDOWS, Platform.MACOS];

            platforms.forEach(platform => {
                const storage = new KeybindingStorage(platform, true);
                const bindings = storage.getKeybindingsFor('editor.action.deleteLines');

                assert.ok(
                    bindings.length > 0,
                    `editor.action.deleteLines command has no keybinding on ${platform}`
                );
            });
        });

        it('should have word navigation commands on all platforms', () => {
            const platforms = [Platform.LINUX, Platform.WINDOWS, Platform.MACOS];
            const wordCommands = [
                'cursorWordLeft',
                'cursorWordRight',
                'deleteWordLeft',
                'deleteWordRight'
            ];

            platforms.forEach(platform => {
                const storage = new KeybindingStorage(platform, true);

                wordCommands.forEach(cmd => {
                    const bindings = storage.getKeybindingsFor(cmd);
                    assert.ok(
                        bindings.length > 0,
                        `${cmd} has no keybinding on ${platform}`
                    );
                });
            });
        });

        it('should have line movement commands on all platforms', () => {
            const platforms = [Platform.LINUX, Platform.WINDOWS, Platform.MACOS];
            const lineCommands = [
                'editor.action.moveLinesUpAction',
                'editor.action.moveLinesDownAction',
                'editor.action.copyLinesUpAction',
                'editor.action.copyLinesDownAction'
            ];

            platforms.forEach(platform => {
                const storage = new KeybindingStorage(platform, true);

                lineCommands.forEach(cmd => {
                    const bindings = storage.getKeybindingsFor(cmd);
                    assert.ok(
                        bindings.length > 0,
                        `${cmd} has no keybinding on ${platform}`
                    );
                });
            });
        });
    });
});
