#!/usr/bin/env ts-node
import "reflect-metadata";
import { Platform } from '../src/helper/platform';
import { KeybindingStorage } from '../src/services/keybindingStorage';
import { getAllUsedCommands } from '../src/editorActionTracker/patternRegistry';

const platforms = [Platform.LINUX, Platform.WINDOWS, Platform.MACOS];
const allCommands = getAllUsedCommands();

console.log('='.repeat(60));
console.log('Keybinding Coverage Report');
console.log('='.repeat(60));
console.log(`\nTotal commands used in patterns: ${allCommands.length}\n`);

let allPlatformsCovered = true;

platforms.forEach(platform => {
    const storage = new KeybindingStorage(platform, true);
    const covered: string[] = [];
    const missing: string[] = [];

    allCommands.forEach(cmd => {
        const bindings = storage.getKeybindingsFor(cmd);
        if (bindings.length > 0) {
            covered.push(cmd);
        } else {
            missing.push(cmd);
        }
    });

    const coverage = ((covered.length / allCommands.length) * 100).toFixed(1);
    const status = missing.length === 0 ? '✓' : '✗';

    console.log(`${status} ${platform}`);
    console.log(`  Coverage: ${covered.length}/${allCommands.length} (${coverage}%)`);

    if (missing.length > 0) {
        allPlatformsCovered = false;
        console.log(`  Missing keybindings:`);
        missing.forEach(cmd => console.log(`    - ${cmd}`));
    }

    console.log('');
});

console.log('='.repeat(60));

if (!allPlatformsCovered) {
    console.error('\n❌ Some platforms are missing keybindings!\n');
    process.exit(1);
} else {
    console.log('\n✅ All commands have keybindings on all platforms!\n');
    process.exit(0);
}
