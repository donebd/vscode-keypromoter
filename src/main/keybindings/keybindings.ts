import { readFileSync } from 'fs';
import * as json from "json5";

class Keybinding {
    key!: string;
    command!: string;
}

export function loadDefault(platform: string): Map<string, string[]> {
    let document = json.parse<Keybinding[]>(readFileSync(`./default-keybindings/${platform}.keybindings.json`).toString());
    let keybindings = new Map<string, string[]>();
    for (let i in document) {
        let keystrokes = keybindings.get(document[i].command) ?? new Array<string>();
        keystrokes.push(document[i].key);
        keybindings.set(document[i].command, keystrokes);
    }
    return keybindings;
}

export function patch(keybindings: Map<string, string[]>, JsonPatch: string) {
    let patch = json.parse<Keybinding[]>(JsonPatch);
    for (let i in patch) {
        let key = patch[i].key;
        let command = patch[i].command;
        let keystrokes: Array<string>;
        if (command.startsWith("-")) {
            command = command.slice(1);
            keystrokes = keybindings.get(command) ?? new Array<string>();
            keystrokes = keystrokes.filter(other => other !== key);
        } else {
            keystrokes = keybindings.get(command) ?? new Array<string>();
            keystrokes.push(key);
        }
        keybindings.set(command, keystrokes);
    }
}
