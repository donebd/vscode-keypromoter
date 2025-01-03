import "reflect-metadata";
import { Container } from "inversify";

// !!!WARNING!!! "reflect-metadata" dependency must be imported before all other
import { FileHelper } from "../helper/fileHelper";
import { Platform } from "../helper/platform";
import { KeyLogger } from "../keylogger/keyLogger";
import { NodeKeyLogger } from "../keylogger/nodeKeyLogger";
import { UiHookKeyLogger } from "../keylogger/uiHookKeyLogger";
import { CommandCounterService } from "../services/commandCounterService";
import { KeybindingStorage } from "../services/keybindingStorage";
import { SubscriptionService } from "../services/subscriptionService";
import { TYPES } from "./identifiers";

export const diContainer = new Container();

export function setupExtensionDependencies(platform: Platform) {
    if (platform === Platform.MACOS || platform === Platform.WINDOWS) {
        diContainer.bind<KeyLogger>(TYPES.KeyLogger).to(NodeKeyLogger).inSingletonScope();
    } else {
        // linux only x11
        diContainer.bind<KeyLogger>(TYPES.KeyLogger).to(UiHookKeyLogger).inSingletonScope();
    }

    diContainer.bind<KeybindingStorage>(TYPES.KeybindingStorage).toConstantValue(new KeybindingStorage(platform));
    diContainer.bind<CommandCounterService>(TYPES.CommandCounterService).to(CommandCounterService).inSingletonScope();
    diContainer.bind<FileHelper>(TYPES.FileHelper).to(FileHelper).inSingletonScope();
    diContainer.bind<SubscriptionService>(TYPES.SubscriptionService).to(SubscriptionService).inSingletonScope();
}
