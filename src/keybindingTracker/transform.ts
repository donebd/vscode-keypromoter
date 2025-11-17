import { UiohookKey } from "uiohook-napi-lite";

export const UNSUPPORTED_KEY = "UNSUPPORTED_KEY";

const uioKeyMap = new Map<number, string>([
    // Основные клавиши
    [UiohookKey.Backspace, "backspace"],
    [UiohookKey.Tab, "tab"],
    [UiohookKey.Enter, "enter"],
    [3612, "enter"], // NumpadEnter
    [UiohookKey.Escape, "escape"],
    [UiohookKey.Space, "space"],
    [UiohookKey.PageUp, "pageup"],
    [UiohookKey.PageDown, "pagedown"],
    [UiohookKey.End, "end"],
    [UiohookKey.Home, "home"],
    [UiohookKey.ArrowLeft, "left"],
    [UiohookKey.ArrowUp, "up"],
    [UiohookKey.ArrowRight, "right"],
    [UiohookKey.ArrowDown, "down"],

    // Буквы
    [UiohookKey.A, "a"],
    [UiohookKey.B, "b"],
    [UiohookKey.C, "c"],
    [UiohookKey.D, "d"],
    [UiohookKey.E, "e"],
    [UiohookKey.F, "f"],
    [UiohookKey.G, "g"],
    [UiohookKey.H, "h"],
    [UiohookKey.I, "i"],
    [UiohookKey.J, "j"],
    [UiohookKey.K, "k"],
    [UiohookKey.L, "l"],
    [UiohookKey.M, "m"],
    [UiohookKey.N, "n"],
    [UiohookKey.O, "o"],
    [UiohookKey.P, "p"],
    [UiohookKey.Q, "q"],
    [UiohookKey.R, "r"],
    [UiohookKey.S, "s"],
    [UiohookKey.T, "t"],
    [UiohookKey.U, "u"],
    [UiohookKey.V, "v"],
    [UiohookKey.W, "w"],
    [UiohookKey.X, "x"],
    [UiohookKey.Y, "y"],
    [UiohookKey.Z, "z"],

    // Функциональные клавиши
    [UiohookKey.F1, "f1"],
    [UiohookKey.F2, "f2"],
    [UiohookKey.F3, "f3"],
    [UiohookKey.F4, "f4"],
    [UiohookKey.F5, "f5"],
    [UiohookKey.F6, "f6"],
    [UiohookKey.F7, "f7"],
    [UiohookKey.F8, "f8"],
    [UiohookKey.F9, "f9"],
    [UiohookKey.F10, "f10"],
    [UiohookKey.F11, "f11"],
    [UiohookKey.F12, "f12"],
    [UiohookKey.F13, "f13"],
    [UiohookKey.F14, "f14"],
    [UiohookKey.F15, "f15"],
    [UiohookKey.F16, "f16"],
    [UiohookKey.F17, "f17"],
    [UiohookKey.F18, "f18"],
    [UiohookKey.F19, "f19"],
    [UiohookKey.F20, "f20"],
    [UiohookKey.F21, "f21"],
    [UiohookKey.F22, "f22"],
    [UiohookKey.F23, "f23"],
    [UiohookKey.F24, "f24"],

    // Символы и пунктуация
    [UiohookKey.Semicolon, ";"],
    [UiohookKey.Comma, ","],
    [UiohookKey.Minus, "-"],
    [UiohookKey.Period, "."],
    [UiohookKey.Slash, "/"],
    [UiohookKey.Equal, "="],
    [UiohookKey.BracketLeft, "["],
    [UiohookKey.Backslash, "\\"],
    [UiohookKey.BracketRight, "]"],
    [UiohookKey.Backquote, "`"],
    [UiohookKey.Quote, "'"],

    // Модификаторы
    [UiohookKey.Ctrl, "ctrl"],
    [UiohookKey.CtrlRight, "ctrl"],
    [UiohookKey.Alt, "alt"],
    [UiohookKey.AltRight, "alt"],
    [UiohookKey.Shift, "shift"],
    [UiohookKey.ShiftRight, "shift"],
    [UiohookKey.Meta, "meta"],
    [UiohookKey.MetaRight, "meta"],

    // Цифры
    [UiohookKey[0], "0"],
    [UiohookKey[1], "1"],
    [UiohookKey[2], "2"],
    [UiohookKey[3], "3"],
    [UiohookKey[4], "4"],
    [UiohookKey[5], "5"],
    [UiohookKey[6], "6"],
    [UiohookKey[7], "7"],
    [UiohookKey[8], "8"],
    [UiohookKey[9], "9"],

    // Специальные клавиши
    [UiohookKey.Delete, "delete"],
    [UiohookKey.CapsLock, "capslock"],
    [UiohookKey.ScrollLock, "scrolllock"],
    [UiohookKey.NumLock, "numlock"],
    [UiohookKey.PrintScreen, "printscreen"],
    [UiohookKey.Insert, "insert"],
    // [UiohookKey.Pause, "pause"],

    // Numpad
    [UiohookKey.Numpad0, "numpad0"],
    [UiohookKey.Numpad1, "numpad1"],
    [UiohookKey.Numpad2, "numpad2"],
    [UiohookKey.Numpad3, "numpad3"],
    [UiohookKey.Numpad4, "numpad4"],
    [UiohookKey.Numpad5, "numpad5"],
    [UiohookKey.Numpad6, "numpad6"],
    [UiohookKey.Numpad7, "numpad7"],
    [UiohookKey.Numpad8, "numpad8"],
    [UiohookKey.Numpad9, "numpad9"],
    [UiohookKey.NumpadAdd, "numpad_add"],
    [UiohookKey.NumpadMultiply, "numpad_multiply"],
    [UiohookKey.NumpadSubtract, "numpad_subtract"],
    [UiohookKey.NumpadDivide, "numpad_divide"],
    [UiohookKey.NumpadDecimal, "numpad_decimal"],
    [UiohookKey.NumpadArrowLeft, "left"],
    [UiohookKey.NumpadArrowRight, "right"],
    [UiohookKey.NumpadArrowUp, "up"],
    [UiohookKey.NumpadArrowDown, "down"],
    [UiohookKey.NumpadDelete, "delete"],
    [UiohookKey.NumpadInsert, "insert"],
    [UiohookKey.NumpadHome, "home"],
    [UiohookKey.NumpadPageUp, "pageup"],
    [UiohookKey.NumpadPageDown, "pagedown"],
    [UiohookKey.NumpadEnd, "end"],

    // Мультимедийные клавиши (если поддерживаются библиотекой)
    [0xE030, "volumeup"],        // Volume Up
    [0xE02E, "volumedown"],      // Volume Down
    [0xE020, "audiomute"],       // Mute
    [0xE022, "audioplay"],       // Play/Pause
    [0xE024, "audiostop"],       // Stop
    [0xE019, "audionext"],       // Next Track
    [0xE010, "audioprev"],       // Previous Track
    [0xE02C, "eject"],           // Eject

    // Браузерные клавиши
    [0xE065, "browsersearch"],   // Browser Search
    [0xE032, "browserhome"],     // Browser Home
    [0xE06A, "browserback"],     // Browser Back
    [0xE069, "browserforward"],  // Browser Forward
    [0xE068, "browserstop"],     // Browser Stop
    [0xE067, "browserrefresh"],  // Browser Refresh
    [0xE066, "browserfavorites"], // Browser Favorites

    // Системные клавиши
    [0xE05E, "power"],           // Power
    [0xE05F, "sleep"],           // Sleep
    [0xE063, "wakeup"],          // Wake Up
    [0xE021, "mediaselect"],     // Media Select
    [0xE06B, "launchapp1"],      // Launch App 1
    [0xE06C, "launchapp2"],      // Launch App 2
    [0xE06D, "launchmail"],      // Launch Mail

    // Дополнительные клавиши
    [0xE05D, "contextmenu"],     // Context Menu (Menu key)
    [0xE008, "undo"],            // Undo (если есть)
    [0xE007, "redo"],            // Redo (если есть)
    [0xE017, "cut"],             // Cut
    [0xE018, "copy"],            // Copy
    [0xE00A, "paste"],           // Paste
    [0xE065, "find"],            // Find
    [0xE03B, "help"],            // Help

    // Интернациональные клавиши
    [0xE072, "lang1"],           // Language 1 (Hangul/Kana)
    [0xE073, "lang2"],           // Language 2 (Hanja/Kanji)
    [0xE076, "intlbackslash"],   // IntlBackslash
    [0xE079, "intlro"],          // IntlRo (Brazilian / key)
    [0xE07B, "intlyen"],         // IntlYen
]);

export function keyFromUioHookKeycode(keycode: number): string {
    const key = uioKeyMap.get(keycode);
    if (!key) {
        // Log неизвестный keycode для отладки
        console.debug(`Unknown keycode: 0x${keycode.toString(16).toUpperCase()} (${keycode})`);
        return UNSUPPORTED_KEY;
    }
    return key;
}

const nodeNameKeyMap = new Map<string, string>([
    // Основные клавиши
    ["BACKSPACE", "backspace"],
    ["TAB", "tab"],
    ["RETURN", "enter"],
    ["NUMPAD RETURN", "enter"],
    ["ESCAPE", "escape"],
    ["SPACE", "space"],
    ["PAGE UP", "pageup"],
    ["PAGE DOWN", "pagedown"],
    ["END", "end"],
    ["HOME", "home"],
    ["LEFT ARROW", "left"],
    ["UP ARROW", "up"],
    ["RIGHT ARROW", "right"],
    ["DOWN ARROW", "down"],

    // Буквы
    ["A", "a"], ["B", "b"], ["C", "c"], ["D", "d"], ["E", "e"],
    ["F", "f"], ["G", "g"], ["H", "h"], ["I", "i"], ["J", "j"],
    ["K", "k"], ["L", "l"], ["M", "m"], ["N", "n"], ["O", "o"],
    ["P", "p"], ["Q", "q"], ["R", "r"], ["S", "s"], ["T", "t"],
    ["U", "u"], ["V", "v"], ["W", "w"], ["X", "x"], ["Y", "y"],
    ["Z", "z"],

    // Функциональные клавиши
    ["F1", "f1"], ["F2", "f2"], ["F3", "f3"], ["F4", "f4"],
    ["F5", "f5"], ["F6", "f6"], ["F7", "f7"], ["F8", "f8"],
    ["F9", "f9"], ["F10", "f10"], ["F11", "f11"], ["F12", "f12"],
    ["F13", "f13"], ["F14", "f14"], ["F15", "f15"], ["F16", "f16"],
    ["F17", "f17"], ["F18", "f18"], ["F19", "f19"], ["F20", "f20"],
    ["F21", "f21"], ["F22", "f22"], ["F23", "f23"], ["F24", "f24"],

    // Символы
    ["SEMICOLON", ";"],
    ["COMMA", ","],
    ["MINUS", "-"],
    ["DOT", "."],
    ["NUMPAD DOT", "."],
    ["FORWARD SLASH", "/"],
    ["EQUALS", "="],
    ["SQUARE BRACKET OPEN", "["],
    ["BACKSLASH", "\\"],
    ["SQUARE BRACKET CLOSE", "]"],
    ["BACKTICK", "`"],
    ["QUOTE", "'"],

    // Модификаторы
    ["LEFT CTRL", "ctrl"],
    ["RIGHT CTRL", "ctrl"],
    ["LEFT ALT", "alt"],
    ["RIGHT ALT", "alt"],
    ["LEFT SHIFT", "shift"],
    ["RIGHT SHIFT", "shift"],
    ["LEFT META", "meta"],
    ["RIGHT META", "meta"],
    ["LEFT SUPER", "meta"],  // Linux
    ["RIGHT SUPER", "meta"], // Linux
    ["LEFT CMD", "meta"],    // macOS alternative
    ["RIGHT CMD", "meta"],   // macOS alternative

    // Цифры
    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
    ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],

    // Специальные клавиши
    ["DELETE", "delete"],
    ["CAPS LOCK", "capslock"],
    ["SCROLL LOCK", "scrolllock"],
    ["NUM LOCK", "numlock"],
    ["PRINT SCREEN", "printscreen"],
    ["INS", "insert"],
    ["INSERT", "insert"],
    ["PAUSE", "pause"],
    ["PAUSE BREAK", "pause"],

    // Numpad
    ["NUMPAD 0", "numpad0"],
    ["NUMPAD 1", "numpad1"],
    ["NUMPAD 2", "numpad2"],
    ["NUMPAD 3", "numpad3"],
    ["NUMPAD 4", "numpad4"],
    ["NUMPAD 5", "numpad5"],
    ["NUMPAD 6", "numpad6"],
    ["NUMPAD 7", "numpad7"],
    ["NUMPAD 8", "numpad8"],
    ["NUMPAD 9", "numpad9"],
    ["NUMPAD PLUS", "numpad_add"],
    ["NUMPAD MULTIPLY", "numpad_multiply"],
    ["NUMPAD MINUS", "numpad_subtract"],
    ["NUMPAD DIVIDE", "numpad_divide"],

    // Мультимедийные клавиши
    ["VOLUME UP", "volumeup"],
    ["VOLUME DOWN", "volumedown"],
    ["AUDIO MUTE", "audiomute"],
    ["MUTE", "audiomute"],
    ["PLAY PAUSE", "audioplay"],
    ["PLAY/PAUSE", "audioplay"],
    ["MEDIA PLAY PAUSE", "audioplay"],
    ["MEDIA STOP", "audiostop"],
    ["MEDIA NEXT TRACK", "audionext"],
    ["MEDIA PREVIOUS TRACK", "audioprev"],
    ["NEXT TRACK", "audionext"],
    ["PREVIOUS TRACK", "audioprev"],
    ["EJECT", "eject"],

    // Браузерные клавиши
    ["BROWSER SEARCH", "browsersearch"],
    ["BROWSER HOME", "browserhome"],
    ["BROWSER BACK", "browserback"],
    ["BROWSER FORWARD", "browserforward"],
    ["BROWSER STOP", "browserstop"],
    ["BROWSER REFRESH", "browserrefresh"],
    ["BROWSER FAVORITES", "browserfavorites"],

    // Системные клавиши
    ["POWER", "power"],
    ["SLEEP", "sleep"],
    ["WAKE UP", "wakeup"],
    ["WAKE", "wakeup"],
    ["MEDIA SELECT", "mediaselect"],
    ["LAUNCH APP 1", "launchapp1"],
    ["LAUNCH APP 2", "launchapp2"],
    ["LAUNCH MAIL", "launchmail"],
    ["CONTEXT MENU", "contextmenu"],
    ["MENU", "contextmenu"],
    ["APPLICATION", "contextmenu"],

    // Дополнительные клавиши
    ["UNDO", "undo"],
    ["REDO", "redo"],
    ["CUT", "cut"],
    ["COPY", "copy"],
    ["PASTE", "paste"],
    ["FIND", "find"],
    ["HELP", "help"],
]);

export function keyFromNodeKeyName(keyName: string): string {
    const normalizedKey = keyName.toUpperCase();
    const key = nodeNameKeyMap.get(normalizedKey);
    if (!key) {
        // Log неизвестное имя клавиши для отладки
        console.debug(`Unknown key name: "${keyName}"`);
        return UNSUPPORTED_KEY;
    }
    return key;
}
