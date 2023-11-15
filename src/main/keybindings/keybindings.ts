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

    private readonly keybindings: Map<string, string[]>;

    constructor(private readonly platform: Platform, defaultOnly: boolean = false) {
        this.keybindings = new Map<string, string[]>();
        if (defaultOnly) {
            this.loadDefaultMap();
        } else {
            this.loadFullMap();
        }
     }

    public getKeybindingsFor(command: string): string[] {
        return this.keybindings.get(command) ?? [];
    }

    private loadFullMap() {
        this.loadDefaultMap();
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
            this.patch(userJson);
        } catch (e) {
            if (e instanceof Error) {
                logger.error(`error when loading user keybindings: ${e.message}`);
            }
        }
    }

    private loadDefaultMap() {
        try {
            let p = path.resolve(__dirname, `../../.././default-keybindings/${this.platform}.keybindings.json`);
            let file = readFileSync(p);
            let document = json.parse<Keybinding[]>(file.toString());
            for (let i in document) {
                let keystrokes = this.keybindings.get(document[i].command) ?? new Array<string>();
                keystrokes.push(document[i].key);
                this.keybindings.set(document[i].command, keystrokes);
            }
        } catch (e) {
            if (e instanceof Error) {
                logger.error(`error when loading default keybindings: ${e.message}`);
            }
        }
    }

    public patch(JsonPatch: string) {
        let patch = json.parse<Keybinding[]>(JsonPatch);
        for (let i in patch) {
            let key = patch[i].key;
            let command = patch[i].command;
            let keystrokes: Array<string>;
            if (command.startsWith("-")) {
                command = command.slice(1);
                keystrokes = this.keybindings.get(command) ?? new Array<string>();
                keystrokes = keystrokes.filter(other => other !== key);
            } else {
                keystrokes = this.keybindings.get(command) ?? new Array<string>();
                keystrokes.push(key);
            }
            this.keybindings.set(command, keystrokes);
        }
    }

}

