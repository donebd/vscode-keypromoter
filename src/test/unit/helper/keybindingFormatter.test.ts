import * as assert from 'assert';
import { KeybindingFormatter } from '../../../helper/keybindingFormatter';

describe('KeybindingFormatter Test', () => {

    describe('format', () => {
        it('should format simple keybinding', () => {
            assert.strictEqual(
                KeybindingFormatter.format('ctrl+k'),
                'Ctrl+K'
            );
        });

        it('should format complex keybinding', () => {
            assert.strictEqual(
                KeybindingFormatter.format('ctrl+shift+alt+k'),
                'Ctrl+Shift+Alt+K'
            );
        });

        it('should format arrow keys with symbols', () => {
            assert.strictEqual(
                KeybindingFormatter.format('ctrl+up'),
                'Ctrl+↑'
            );

            assert.strictEqual(
                KeybindingFormatter.format('shift+down'),
                'Shift+↓'
            );
        });

        it('should format special keys', () => {
            assert.strictEqual(
                KeybindingFormatter.format('ctrl+enter'),
                'Ctrl+Enter'
            );

            assert.strictEqual(
                KeybindingFormatter.format('shift+escape'),
                'Shift+Esc'
            );

            assert.strictEqual(
                KeybindingFormatter.format('ctrl+backspace'),
                'Ctrl+Backspace'
            );
        });

        it('should handle cmd as Cmd', () => {
            assert.strictEqual(
                KeybindingFormatter.format('cmd+k'),
                'Cmd+K'
            );
        });

        it('should handle meta as Cmd', () => {
            assert.strictEqual(
                KeybindingFormatter.format('meta+k'),
                'Cmd+K'
            );
        });

        it('should return fallback for null', () => {
            assert.strictEqual(
                KeybindingFormatter.format(null),
                'the keyboard shortcut'
            );
        });

        it('should handle function keys', () => {
            assert.strictEqual(
                KeybindingFormatter.format('f5'),
                'F5'
            );

            assert.strictEqual(
                KeybindingFormatter.format('ctrl+f12'),
                'Ctrl+F12'
            );
        });

        it('should handle mixed case input', () => {
            assert.strictEqual(
                KeybindingFormatter.format('CTRL+SHIFT+K'),
                'Ctrl+Shift+K'
            );
        });
    });

    describe('formatFirst', () => {
        it('should format first keybinding from array', () => {
            assert.strictEqual(
                KeybindingFormatter.formatFirst(['ctrl+k', 'cmd+k']),
                'Ctrl+K'
            );
        });

        it('should return fallback for empty array', () => {
            assert.strictEqual(
                KeybindingFormatter.formatFirst([]),
                'the keyboard shortcut'
            );
        });

        it('should handle single element array', () => {
            assert.strictEqual(
                KeybindingFormatter.formatFirst(['shift+alt+f']),
                'Shift+Alt+F'
            );
        });
    });

    describe('formatAll', () => {
        it('should format all keybindings', () => {
            const result = KeybindingFormatter.formatAll([
                'ctrl+k',
                'cmd+k',
                'shift+delete'
            ]);

            assert.deepStrictEqual(result, [
                'Ctrl+K',
                'Cmd+K',
                'Shift+Delete'
            ]);
        });

        it('should return empty array for empty input', () => {
            assert.deepStrictEqual(
                KeybindingFormatter.formatAll([]),
                []
            );
        });
    });
});
