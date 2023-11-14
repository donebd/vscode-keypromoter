import * as vscode from 'vscode';
import { KeybindingStorage } from "../keybindings/keybindings";
import { KeyLogBuffer } from "../keylogging/KeyLogBuffer";
import { keyFromKeycode } from "../keylogging/transform";

export class CommandCounter {
    private commandToCounter = new Map<string, number>();
    private keyBuf = new KeyLogBuffer(5);

    private readonly maxErrors: number;
    private readonly keybindingStorage: KeybindingStorage;

    constructor(maxErrors: number, keybindingStorage: KeybindingStorage) {
        this.maxErrors = maxErrors;
        this.keybindingStorage = keybindingStorage;
    }

    public handleCommand(commandId: string) {
        const keybindings = this.keybindingStorage.getKeybindingMap().get(commandId);
        if (keybindings !== undefined && keybindings !== null) {
            let currCounter = this.commandToCounter.get(commandId) ?? 0;
            let keybindingUsed = false;
            for (let keybinding of keybindings) {
                keybindingUsed = keybindingUsed || this.keyBuf.hasKeystroke(keybinding.split(/\+| /)).valueOf();
            }
            if (!keybindingUsed) {
                currCounter++;
            }
            if (currCounter > this.maxErrors) {
                vscode.window.showInformationMessage("You could use " + keybindings.join(" or ") + " keybindings " + " to perform command " + commandId + "!");
                currCounter = 0;
            }
            this.commandToCounter.set(commandId, currCounter);
        }
    }

    public handleKeyPress(keycode: number) {
        this.keyBuf.keyPressed(keyFromKeycode(keycode));
    }
}