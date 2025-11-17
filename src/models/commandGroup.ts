export interface CommandGroupModel {
    groupId: string,
    commandIds: string[]
}

export class CommandGroup {

    public static NavigateBetweenTabsGroup: CommandGroupModel = {
        groupId: "workbench.action.Editor",
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
            "workbench.action.navigateForward",
            "workbench.action.navigateBack"
        ]
    };

    public static NavigationCommandsGroup: CommandGroupModel = {
        groupId: "workbench.action.Navigation",
        commandIds: [
            // Навигация между редакторами
            "workbench.action.navigateForward",
            "workbench.action.navigateBack",
            "workbench.action.navigateToLastEditLocation",
            "workbench.action.navigateBackInNavigationLocations",
            "workbench.action.navigateForwardInNavigationLocations",
            "workbench.action.navigateBackInEditLocations",
            "workbench.action.navigateForwardInEditLocations",

            // Навигация между табами
            "workbench.action.nextEditor",
            "workbench.action.previousEditor",
            "workbench.action.openNextRecentlyUsedEditor",
            "workbench.action.openPreviousRecentlyUsedEditor",
            "workbench.action.openNextRecentlyUsedEditorInGroup",
            "workbench.action.openPreviousRecentlyUsedEditorInGroup",
            "workbench.action.quickOpenPreviousRecentlyUsedEditor",
            "workbench.action.quickOpenLeastRecentlyUsedEditor",
            "workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup",
            "workbench.action.quickOpenLeastRecentlyUsedEditorInGroup",

            // Навигация между группами редакторов
            "workbench.action.focusFirstEditorGroup",
            "workbench.action.focusSecondEditorGroup",
            "workbench.action.focusThirdEditorGroup",
            "workbench.action.focusFourthEditorGroup",
            "workbench.action.focusFifthEditorGroup",
            "workbench.action.focusLastEditorGroup",
            "workbench.action.focusAboveGroup",
            "workbench.action.focusBelowGroup",
            "workbench.action.focusLeftGroup",
            "workbench.action.focusRightGroup",
            "workbench.action.focusNextGroup",
            "workbench.action.focusPreviousGroup",

            // Прямой доступ к редакторам
            "workbench.action.openEditorAtIndex1",
            "workbench.action.openEditorAtIndex2",
            "workbench.action.openEditorAtIndex3",
            "workbench.action.openEditorAtIndex4",
            "workbench.action.openEditorAtIndex5",
            "workbench.action.openEditorAtIndex6",
            "workbench.action.openEditorAtIndex7",
            "workbench.action.openEditorAtIndex8",
            "workbench.action.openEditorAtIndex9"
        ]
    };

    public static isNavigationCommand(commandId: string): boolean {
        return this.NavigationCommandsGroup.commandIds.includes(commandId);
    }


    public static getCommandIds(group: CommandGroupModel): string[] {
        return [...group.commandIds];
    }
}
