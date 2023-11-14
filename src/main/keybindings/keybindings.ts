import { readFileSync } from 'fs';
import * as json from "json5";

class Keybinding {
    key!: string;
    command!: string;
}

export function load(platform: string): Map<string, string[]> {
    let document = json.parse<Keybinding[]>(readFileSync("./default-keybindings/linux.keybindings.json").toString());
    let keybindings = new Map<string, string[]>();
    for (let i in document) {
        let keystrokes = keybindings.get(document[i].command) ?? new Array<string>();
        keystrokes.push(document[i].key);
        keybindings.set(document[i].command, keystrokes);
    }
    return keybindings;
}