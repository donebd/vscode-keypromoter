
export interface CommandGroupModel {
    groupId: string,
    commandIds: string[]
}

export class CommandGroup {

    public static NavigateBetweenTabsGroup: CommandGroupModel = {
        groupId: "workbench.action.Editor", // (string to find navigation commands in Keyboard Shortcut views)
        commandIds: [
            "workbench.action.nextEditor",
            "workbench.action.previousEditor",
            "workbench.action.openEditorAtIndex1",
            "workbench.action.openEditorAtIndex2",
            "workbench.action.openEditorAtIndex3",
            "workbench.action.openEditorAtIndex4",
            "workbench.action.openEditorAtIndex5",
            "workbench.action.openEditorAtIndex6",
            "workbench.action.openEditorAtIndex7",
            "workbench.action.openEditorAtIndex8",
            "workbench.action.openEditorAtIndex9",
        ]
    };


}
