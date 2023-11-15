import * as fs from 'fs';

export class DescriptionHandler {
  private jsonCommands: CommandInfo[];

  constructor(filePath: string) {
    this.jsonCommands = this.readJsonFile(filePath);
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