import * as fs from 'fs';
import path from 'path';

export class DescriptionHandler {
  private jsonCommands: CommandInfo[];
  private pathToDescriptions = path.resolve(__dirname, `../../.././default-keybindings/descriptions/command_descriptions.json`);

  constructor() {
    this.jsonCommands = this.readJsonFile(this.pathToDescriptions);
  }

  private readJsonFile(filePath: string): CommandInfo[] {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading/parsing JSON file: ${error}`);
      return [];
    }
  }

  public getDescriptionForCommand(targetCommand: string): string | undefined {
    const commandInfo = this.jsonCommands.find((item) => item.command === targetCommand);
    return commandInfo ? commandInfo.description : undefined;
  }
}

interface CommandInfo {
    command: string;
    description: string;
  }