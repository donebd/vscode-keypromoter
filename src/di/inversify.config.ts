import "reflect-metadata";
import { Container } from "inversify";

// !!!WARNING!!! "reflect-metadata" dependency must be imported before all other
import { FileHelper } from "../helper/fileHelper";
import { Platform } from "../helper/platform";
import { KeybindingTracker } from "../keybindingTracker/keybindingTracker";
import { NodeKeybindingTracker } from "../keybindingTracker/nodeKeybindingTracker";
import { UiHookKeybindingTracker } from "../keybindingTracker/uiHookKeybindingTracker";
import { CommandCounterService } from "../services/commandCounterService";
import { KeybindingStorage } from "../services/keybindingStorage";
import { SubscriptionService } from "../services/subscriptionService";
import { TYPES } from "./identifiers";

export const diContainer = new Container();

export function setupExtensionDependencies(platform: Platform) {
    if (platform === Platform.MACOS || platform === Platform.WINDOWS) {
        diContainer.bind<KeybindingTracker>(TYPES.KeybindingTracker).to(NodeKeybindingTracker).inSingletonScope();
    } else {
        // linux only x11
        diContainer.bind<KeybindingTracker>(TYPES.KeybindingTracker).to(UiHookKeybindingTracker).inSingletonScope();
    }

    diContainer.bind<KeybindingStorage>(TYPES.KeybindingStorage).toConstantValue(new KeybindingStorage(platform));
    diContainer.bind<CommandCounterService>(TYPES.CommandCounterService).to(CommandCounterService).inSingletonScope();
    diContainer.bind<FileHelper>(TYPES.FileHelper).to(FileHelper).inSingletonScope();
    diContainer.bind<SubscriptionService>(TYPES.SubscriptionService).to(SubscriptionService).inSingletonScope();
}
