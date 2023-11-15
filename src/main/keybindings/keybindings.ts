import { readFileSync } from 'fs';
import * as json from 'json5';
import * as path from 'path';
import { Platform } from '../platform';
import { logger } from '../logging';

class Keybinding {
    key!: string;
    command!: string;
}

export class KeybindingStorage {

    constructor(
        private readonly platform: Platform
    ) { }

    public getKeybindingMap(): Map<string, string[]> {
        let keybindings = this.getDefaultKeybindingMap();
        let pathToUser = "";
        switch (this.platform) {
            case Platform.LINUX:
                pathToUser = process.env.HOME + "/.config/Code";
                break;
            case Platform.WINDOWS:
                pathToUser = process.env.APPDATA + "/Code";
                break;
            case Platform.MACOS:
                pathToUser = process.env.HOME + "/Library/Application Support/Code";
                break;
        }
        try {
            pathToUser = ((process.env.VSCODE_PORTABLE ? process.env.VSCODE_PORTABLE + "/user-data/User/" : pathToUser) + "/User/keybindings.json")
                .replace(/\//g, this.platform === Platform.WINDOWS ? "\\" : "/");
            let userJson = readFileSync(pathToUser).toString();
            this.patch(keybindings, userJson);
        } catch (e) {
            if (e instanceof Error) {
                logger.log('error', `error when loading user keybindings: ${e.message}`);
            }
        }
        return keybindings;
    }

    
    public getDefaultKeybindingMap(): Map<string, string[]> {
        let keybindings = new Map<string, string[]>();
        try {
            let p = path.resolve(__dirname, `../../.././default-keybindings/${this.platform}.keybindings.json`);
            let file = readFileSync(p);
            let document = json.parse<Keybinding[]>(file.toString());
            for (let i in document) {
                let keystrokes = keybindings.get(document[i].command) ?? new Array<string>();
                keystrokes.push(document[i].key);
                keybindings.set(document[i].command, keystrokes);
            }
        } catch (e) {
            if (e instanceof Error) {
                logger.log('error', `error when loading default keybindings: ${e.message}`);
            }
        }
        return keybindings;
    }

    public patch(keybindings: Map<string, string[]>, JsonPatch: string) {
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

}

