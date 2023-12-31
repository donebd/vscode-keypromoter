import { UiohookKey } from "uiohook-napi";

export const UNSUPPORTED_KEY = "UNSUPPORTED_KEY";

const keyMap = new Map<number, string>([
    [UiohookKey.Backspace, "backspace"],
    [UiohookKey.Tab, "tab"],
    [UiohookKey.Enter, "enter"],
    [3612, "enter"],
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
    [UiohookKey.Semicolon, ";"],
    [UiohookKey.Comma, ","],
    [UiohookKey.Minus, "-"],
    [UiohookKey.Period, "."],
    [UiohookKey.Slash, "/"],
    [UiohookKey.Equal, "="],
    [UiohookKey.BracketLeft, "["],
    [UiohookKey.Backslash, "\\"],
    [UiohookKey.BracketRight, "]"],
    [UiohookKey.Ctrl, "ctrl"],
    [UiohookKey.CtrlRight, "ctrl"],
    [UiohookKey.Alt, "alt"],
    [UiohookKey.AltRight, "alt"],
    [UiohookKey.Shift, "shift"],
    [UiohookKey.ShiftRight, "shift"],
    [UiohookKey.Meta, "meta"],
    [UiohookKey.MetaRight, "meta"],
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
    [UiohookKey.Backquote, "`"],
    [UiohookKey.Delete, "delete"],
    [UiohookKey.CapsLock, "capslock"],
    [UiohookKey.Quote, "'"],
    [UiohookKey.NumLock, "numlock"],
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
    [UiohookKey.NumpadArrowLeft, "left"],
    [UiohookKey.NumpadArrowRight, "right"],
    [UiohookKey.NumpadArrowUp, "up"],
    [UiohookKey.NumpadArrowDown, "down"],
    [UiohookKey.NumpadDecimal, "numpad_decimal"],
    [UiohookKey.NumpadDelete, "delete"],
    [UiohookKey.NumpadInsert, "insert"],
    [UiohookKey.NumpadHome, "home"],
    [UiohookKey.NumpadPageUp, "pageup"],
    [UiohookKey.NumpadPageDown, "pagedown"],
    [UiohookKey.NumpadEnd, "end"],
]);

export function keyFromKeycode(keycode: number): string {
    return keyMap.get(keycode) ?? UNSUPPORTED_KEY;
}
