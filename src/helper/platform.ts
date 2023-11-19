export enum Platform {
    WINDOWS = "windows",
    LINUX = "linux",
    MACOS = "macos",
    UNSUPPORTED = "unsupported",
}

export function get(): Platform {
    switch (process.platform.toLowerCase()) {
        case "win32":
            return Platform.WINDOWS;
        case "aix":
        case "freebsd":
        case "linux":
        case "openbsd":
        case "sunos":
            return Platform.LINUX;
        case "darwin":
            return Platform.MACOS;
    }
    return Platform.UNSUPPORTED;
}
