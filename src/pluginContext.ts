import { KeyLogger } from "./keylogger/keyLogger";

export class PluginContext {

    private static keyLogger: KeyLogger | undefined;

    public static init(keyLogger: KeyLogger) {
        this.keyLogger = keyLogger;
    }

    public static dispose() {
        this.keyLogger?.dispose();
    }

}
