import * as vscode from "vscode";

export class FileHelper {
    
    public getCurrentWorkspacePath(): string {
        if (vscode.workspace.workspaceFolders) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
        return "";
    }

}
