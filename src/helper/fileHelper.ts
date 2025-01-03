import { injectable } from "inversify";
import * as vscode from "vscode";

@injectable()
export class FileHelper {
    
    public getCurrentWorkspacePath(): string {
        if (vscode.workspace.workspaceFolders) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
        return "";
    }

}
