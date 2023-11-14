import { readFileSync } from 'fs';
import * as json from "json5";

export function load(platform: string): Map<string, string[]> {
    console.log(json.parse(readFileSync("./default-keybindings/linux.keybindings.json").toString()));
    return new Map();
}