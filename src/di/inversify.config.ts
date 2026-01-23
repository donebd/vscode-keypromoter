import "reflect-metadata";
import { Container } from "inversify";
import * as vscode from 'vscode';

// !!!WARNING!!! "reflect-metadata" dependency must be imported before all other
import { FileHelper } from "../helper/fileHelper";
import { Platform } from "../helper/platform";
import { KeybindingTracker } from "../keybindingTracker/keybindingTracker";
import { SimenKeybindingTracker } from "../keybindingTracker/simenKeybindingTracker";
import { UiHookKeybindingTracker } from "../keybindingTracker/uiHookKeybindingTracker";
import { CommandCounterService } from "../services/commandCounterService";
import { KeybindingStorage } from "../services/keybindingStorage";
import { SubscriptionService } from "../services/subscriptionService";
import { EditorActionTracker } from "../editorActionTracker/editorActionTracker";
import { EditorStateManager } from "../editorActionTracker/editorStateManager";
import { EditorActionNotifier } from "../services/editorActionNotifier";
import { TYPES } from "./identifiers";

export const diContainer = new Container();

export function setupExtensionDependencies(platform: Platform, context: vscode.ExtensionContext) {
    diContainer.bind<vscode.ExtensionContext>(TYPES.ExtensionContext).toConstantValue(context);
    diContainer.bind(TYPES.Platform).toConstantValue(platform);

    if (platform === Platform.MACOS) {
        diContainer.bind<KeybindingTracker>(TYPES.KeybindingTracker).to(SimenKeybindingTracker).inSingletonScope();
    } else {
        diContainer.bind<KeybindingTracker>(TYPES.KeybindingTracker).to(UiHookKeybindingTracker).inSingletonScope();
    }

    diContainer.bind<KeybindingStorage>(TYPES.KeybindingStorage).to(KeybindingStorage).inSingletonScope();
    diContainer.bind<CommandCounterService>(TYPES.CommandCounterService).to(CommandCounterService).inSingletonScope();
    diContainer.bind<FileHelper>(TYPES.FileHelper).to(FileHelper).inSingletonScope();
    diContainer.bind<SubscriptionService>(TYPES.SubscriptionService).to(SubscriptionService).inSingletonScope();

    // Editor action tracking
    diContainer.bind<EditorStateManager>(TYPES.EditorStateManager).to(EditorStateManager).inSingletonScope();
    diContainer.bind<EditorActionNotifier>(TYPES.EditorActionNotifier).to(EditorActionNotifier).inSingletonScope();
    diContainer.bind<EditorActionTracker>(TYPES.EditorActionTracker).to(EditorActionTracker).inSingletonScope();
}