import { uIOhook } from 'uiohook-napi-lite';
import * as vscode from 'vscode';
import { logger } from '../helper/logging';
import { NodeKeybindingTracker } from '../keybindingTracker/nodeKeybindingTracker';
import { UiHookKeybindingTracker } from '../keybindingTracker/uiHookKeybindingTracker';
import { PluginContext } from '../pluginContext';

export class KeyboardTestPanel {
    private static currentPanel: KeyboardTestPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private keysPressed: Set<string> = new Set();
    private totalPresses = 0;
    private currentKeys: Set<string> = new Set();

    public static show(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (KeyboardTestPanel.currentPanel) {
            KeyboardTestPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'keyboardTest',
            '🎹 Keyboard Test',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        KeyboardTestPanel.currentPanel = new KeyboardTestPanel(panel, context);
    }

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this.panel = panel;
        this.panel.webview.html = this.getHtmlContent();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        this.startListening();
    }

    private startListening() {
        const tracker = PluginContext.getKeybindingTracker();
        if (!tracker) { return; }

        logger.info('KeyboardTestPanel: tracker found, type:', tracker.constructor.name);

        if (tracker instanceof UiHookKeybindingTracker) {
            this.setupUiohookListeners(uIOhook);
        } else if (tracker instanceof NodeKeybindingTracker) {
            this.setupGlobalKeyListeners((tracker as any).keyListener);
        } else {
            logger.error("Unknown tracker type");
            return;
        }

        this.panel.webview.postMessage({ type: 'ready' });
    }

    private setupUiohookListeners(uiohook: any) {
        logger.info('KeyboardTestPanel: setting up UiHook listeners');

        const onKeyDown = (event: any) => {
            const keyName = this.getKeyNameFromUiohookEvent(event);
            if (keyName && keyName !== 'UNSUPPORTED_KEY') {
                this.handleKeyEvent('down', keyName);
            }
        };

        const onKeyUp = (event: any) => {
            const keyName = this.getKeyNameFromUiohookEvent(event);
            if (keyName && keyName !== 'UNSUPPORTED_KEY') {
                this.handleKeyEvent('up', keyName);
            }
        };

        const onMouseDown = () => {
            this.handleKeyEvent('mouse', 'Mouse Click');
        };

        uiohook.on('keydown', onKeyDown);
        uiohook.on('keyup', onKeyUp);
        uiohook.on('mousedown', onMouseDown);

        this.disposables.push({
            dispose: () => {
                uiohook.off('keydown', onKeyDown);
                uiohook.off('keyup', onKeyUp);
                uiohook.off('mousedown', onMouseDown);
                logger.info('KeyboardTestPanel: UiHook listeners removed');
            }
        });

        logger.info('KeyboardTestPanel: UiHook listeners attached successfully');
    }

    private setupGlobalKeyListeners(globalKeyListener: any) {
        logger.info('KeyboardTestPanel: setting up GlobalKeyListener');

        const listener = (event: any, down: any) => {
            const keyName = this.getKeyNameFromNodeEvent(down);
            if (keyName && keyName !== 'UNSUPPORTED_KEY') {
                if (down.state === 'DOWN') {
                    this.handleKeyEvent('down', keyName);
                } else if (down.state === 'UP') {
                    this.handleKeyEvent('up', keyName);
                }
            }
        };

        globalKeyListener.addListener(listener);

        this.disposables.push({
            dispose: () => {
                globalKeyListener.removeListener(listener);
                logger.info('KeyboardTestPanel: GlobalKeyListener removed');
            }
        });

        logger.info('KeyboardTestPanel: GlobalKeyListener attached successfully');
    }

    private handleKeyEvent(type: 'down' | 'up' | 'mouse', keyName: string) {
        logger.debug(`KeyboardTestPanel: ${type} - ${keyName}`);

        if (type === 'down') {
            this.currentKeys.add(keyName);
            this.totalPresses++;
            this.keysPressed.add(keyName);

            const keys = Array.from(this.currentKeys);
            this.panel.webview.postMessage({
                type: 'keypress',
                keys: keys,
                totalPresses: this.totalPresses,
                uniqueKeys: this.keysPressed.size,
                event: 'down'
            });
        } else if (type === 'up') {
            this.currentKeys.delete(keyName);

            if (this.currentKeys.size === 0) {
                this.panel.webview.postMessage({
                    type: 'keyreleased'
                });
            } else {
                // Still show remaining keys
                const keys = Array.from(this.currentKeys);
                this.panel.webview.postMessage({
                    type: 'keypress',
                    keys: keys,
                    totalPresses: this.totalPresses,
                    uniqueKeys: this.keysPressed.size,
                    event: 'up'
                });
            }
        } else if (type === 'mouse') {
            this.totalPresses++;
            this.keysPressed.add(keyName);

            this.panel.webview.postMessage({
                type: 'keypress',
                keys: [keyName],
                totalPresses: this.totalPresses,
                uniqueKeys: this.keysPressed.size,
                event: 'mouse'
            });

            // Auto-clear mouse after 500ms
            setTimeout(() => {
                if (this.currentKeys.size === 0) {
                    this.panel.webview.postMessage({
                        type: 'keyreleased'
                    });
                }
            }, 500);
        }
    }

    private getKeyNameFromUiohookEvent(event: any): string | null {
        if (event.keycode !== undefined) {
            try {
                const { keyFromUioHookKeycode } = require('../keybindingTracker/transform');
                return keyFromUioHookKeycode(event.keycode);
            } catch (error) {
                logger.error('Failed to transform keycode:', error);
                return `Key_${event.keycode}`;
            }
        }
        return null;
    }

    private getKeyNameFromNodeEvent(down: any): string | null {
        if (down.name) {
            try {
                const { keyFromNodeKeyName } = require('../keybindingTracker/transform');
                return keyFromNodeKeyName(down.name);
            } catch (error) {
                logger.error('Failed to transform key name:', error);
                return down.name;
            }
        }
        return null;
    }

    private getHtmlContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keyboard Test</title>
    <style>
        :root {
            --key-bg: var(--vscode-button-background);
            --key-fg: var(--vscode-button-foreground);
            --key-pressed-bg: #007acc;
            --key-pressed-fg: white;
            --transition: all 120ms cubic-bezier(0.2, 0.8, 0.4, 1);
        }

        body {
            font-family: var(--vscode-font-family), system-ui, sans-serif;
            padding: 30px 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        h1 {
            text-align: center;
            margin-bottom: 10px;
            font-weight: 600;
            font-size: 2em;
        }

        .status {
            text-align: center;
            padding: 12px;
            border-radius: 8px;
            font-weight: 500;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }

        .keys-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }

        .keys {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            align-items: center;
            max-width: 100%;
            font-size: 22px;
        }

        .key {
            background: var(--key-bg);
            color: var(--key-fg);
            padding: 14px 24px;
            border-radius: 12px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            transition: var(--transition);
            transform: translateY(0);
            min-width: 60px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .key::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .key.pressed {
            background: var(--key-pressed-bg);
            color: var(--key-pressed-fg);
            transform: translateY(4px) scale(0.98);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        .key.pressed::before {
            opacity: 1;
        }

        .key.mouse {
            background: #ff6b6b;
            animation: pulse 0.6s ease-out;
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 30px;
            flex-wrap: wrap;
        }

        .stat {
            text-align: center;
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 16px 24px;
            border-radius: 12px;
            min-width: 140px;
            border: 1px solid var(--vscode-panel-border);
        }

        .stat-value {
            font-size: 2.2em;
            font-weight: bold;
            color: var(--vscode-testing-iconPassed);
        }

        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 4px;
        }

        .placeholder {
            font-size: 1.4em;
            opacity: 0.5;
            font-style: italic;
            transition: opacity 0.4s ease;
        }

        .instructions {
            margin-top: 30px;
            padding: 16px;
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            border-radius: 0 8px 8px 0;
            font-size: 0.95em;
        }

        .fade-out {
            opacity: 0;
            transition: opacity 0.4s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Keyboard Test Panel</h1>
        
        <div class="status" id="status">
            <span id="status-text">Initializing...</span>
        </div>

        <div class="keys-container">
            <div class="keys" id="keys">
                <div class="placeholder" id="placeholder">Press any key to start...</div>
            </div>
        </div>

        <div class="stats">
            <div class="stat">
                <div class="stat-value" id="total-presses">0</div>
                <div class="stat-label">Total Presses</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="unique-keys">0</div>
                <div class="stat-label">Unique Keys</div>
            </div>
        </div>

        <div class="instructions">
            <strong>Tip:</strong> Try holding multiple keys — modifiers like <code>Ctrl</code>, <code>Shift</code>, <code>Alt</code>, <code>Meta</code> are fully supported!
        </div>
    </div>

    <script>
    const vscode = acquireVsCodeApi();
    const keysContainer = document.getElementById('keys');
    const placeholder = document.getElementById('placeholder');
    const statusText = document.getElementById('status-text');
    const totalPresses = document.getElementById('total-presses');
    const uniqueKeysEl = document.getElementById('unique-keys');

    // Храним элемент + функцию отмены удаления
    const activeKeys = new Map(); // keyName → { el, cancelRemoval }

    function createKeyElement(keyName) {
        const el = document.createElement('div');
        el.className = 'key';
        el.textContent = keyName.toUpperCase();
        el.dataset.key = keyName;

        el.style.opacity = '0';
        el.style.transform = 'scale(0.8) translateY(-20px)';
        keysContainer.appendChild(el);

        requestAnimationFrame(() => {
            el.style.transition = 'all 180ms cubic-bezier(0.2, 0.8, 0.4, 1)';
            el.style.opacity = '1';
            el.style.transform = 'scale(1) translateY(0)';
        });

        return el;
    }

    function scheduleRemoval(key, el) {
        el.style.transition = 'all 160ms cubic-bezier(0.4, 0, 0.8, 0.2)';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.85) translateY(-10px)';

        let removed = false;
        
        const cleanup = () => {
            if (removed) return;
            removed = true;
            
            if (el.parentNode) el.remove();
            activeKeys.delete(key);

            // Показываем placeholder, если ничего не осталось
            if (activeKeys.size === 0) {
                placeholder.style.display = 'block';
            }
        };

        const timer = setTimeout(cleanup, 200);
        const listener = () => cleanup();
        
        el.addEventListener('transitionend', listener, { once: true });

        return () => {
            if (removed) return;
            removed = true;
            
            clearTimeout(timer);
            el.removeEventListener('transitionend', listener);
        };
    }

    window.addEventListener('message', event => {
        const msg = event.data;

        switch (msg.type) {
            case 'ready':
                statusText.textContent = 'Ready! Start pressing keys...';
                document.getElementById('status').className = 'status active';
                break;

            case 'error':
                statusText.textContent = 'Error: ' + msg.message;
                document.getElementById('status').className = 'status error';
                break;

            case 'keypress':
                placeholder.style.display = 'none';
                totalPresses.textContent = msg.totalPresses;
                uniqueKeysEl.textContent = msg.uniqueKeys;

                const currentKeysSet = new Set(msg.keys);

                // --- Добавляем новые клавиши ---
                msg.keys.forEach(key => {
                    const existing = activeKeys.get(key);
                    
                    if (!existing) {
                        // Создаем новый элемент
                        const el = createKeyElement(key);
                        if (key.includes('Mouse')) el.classList.add('mouse');
                        el.classList.add('pressed');
                        activeKeys.set(key, { el, cancelRemoval: null });
                    } else if (existing.cancelRemoval) {
                        // Отменяем запланированное удаление
                        existing.cancelRemoval();
                        existing.cancelRemoval = null;
                        
                        // Возвращаем элемент к видимому состоянию
                        existing.el.style.transition = 'all 100ms ease-out';
                        existing.el.style.opacity = '1';
                        existing.el.style.transform = 'scale(1) translateY(0)';
                        existing.el.classList.add('pressed');
                    } else {
                        // Элемент уже активен
                        existing.el.classList.add('pressed');
                    }
                });

                // --- Удаляем отжатые клавиши ---
                for (const [key, entry] of activeKeys) {
                    if (!currentKeysSet.has(key) && !entry.cancelRemoval) {
                        entry.el.classList.remove('pressed');
                        entry.cancelRemoval = scheduleRemoval(key, entry.el);
                    }
                }

                break;

            case 'keyreleased':
                // Все клавиши отжаты, проверяем placeholder
                if (activeKeys.size === 0) {
                    placeholder.style.display = 'block';
                }
                break;
        }
    });
</script>
</body>
</html>`;
    }

    public dispose() {
        KeyboardTestPanel.currentPanel = undefined;
        logger.info('KeyboardTestPanel: disposing');

        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}

export function registerKeyboardTestPanel(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('keyPromoter.testKeyboard', () => {
            KeyboardTestPanel.show(context);
        })
    );
}
