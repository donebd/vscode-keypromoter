import { readFileSync } from 'fs';
import * as json from "json5";

class Keybinding {
    key!: string;
    command!: string;
}

export function loadDefault(platform: string): Map<string, string[]> {
    let keybindings = new Map<string, string[]>();
    try {
        let file = readFileSync(`./default-keybindings/${platform}.keybindings.json`);
        let document = json.parse<Keybinding[]>(file.toString());
        for (let i in document) {
            let keystrokes = keybindings.get(document[i].command) ?? new Array<string>();
            keystrokes.push(document[i].key);
            keybindings.set(document[i].command, keystrokes);
        }
    } catch (e) {
        if (e instanceof Error) {
            console.log("Error when loading default keybindings: %s", e.message);
        }
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

export function loadWithUser(platform: string): Map<string, string[]> {
    let keybindings = loadDefault(platform);
    let pathToUser = "";
    switch (platform) {
        case "linux":
            pathToUser = process.env.HOME + "/.config/Code";
            break;
        case "windows":
            pathToUser = process.env.APPDATA + "/Code";
            break;
        case "macos":
            pathToUser = process.env.HOME + "/Library/Application Support/Code";
            break;
    }
    try {
        pathToUser = ((process.env.VSCODE_PORTABLE ? process.env.VSCODE_PORTABLE + "/user-data/User/" : pathToUser) + "/User/keybindings.json")
            .replace(/\//g, process.platform === "win32" ? "\\" : "/");
        let userJson = readFileSync(pathToUser).toString();
        patch(keybindings, userJson); 
    } catch(e) {
        if (e instanceof Error) {
            console.log("Error when loading user keybindings: %s", e.message);
        }
    }
    return keybindings;
} 
