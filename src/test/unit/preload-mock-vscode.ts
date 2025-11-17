/**
 * Мокаем 'vscode' через mock-require, чтобы unit-тесты не падали с "Cannot find module 'vscode'",
 * когда модули импортируют VSCode API.
 * 
 * Этот файл подключается через `-r` в package.json — должен грузиться первым!
 * Добавляй новые методы/поля, если будут нужны для тестов.
 */
import mock from 'mock-require';

// Мокируем основные классы VSCode
class Position {
    constructor(public line: number, public character: number) { }

    isAfter(other: Position): boolean {
        if (this.line > other.line) { return true; }
        if (this.line < other.line) { return false; }
        return this.character > other.character;
    }

    isBefore(other: Position): boolean {
        if (this.line < other.line) { return true; }
        if (this.line > other.line) { return false; }
        return this.character < other.character;
    }

    isEqual(other: Position): boolean {
        return this.line === other.line && this.character === other.character;
    }

    compareTo(other: Position): number {
        if (this.line < other.line) { return -1; }
        if (this.line > other.line) { return 1; }
        if (this.character < other.character) { return -1; }
        if (this.character > other.character) { return 1; }
        return 0;
    }

    translate(lineDelta?: number, characterDelta?: number): Position {
        return new Position(
            this.line + (lineDelta || 0),
            this.character + (characterDelta || 0)
        );
    }

    with(line?: number, character?: number): Position {
        return new Position(
            line !== undefined ? line : this.line,
            character !== undefined ? character : this.character
        );
    }
}

class Range {
    constructor(
        public start: Position,
        public end: Position
    ) { }

    get isEmpty(): boolean {
        return this.start.isEqual(this.end);
    }

    get isSingleLine(): boolean {
        return this.start.line === this.end.line;
    }

    contains(positionOrRange: Position | Range): boolean {
        if (positionOrRange instanceof Position) {
            return !positionOrRange.isBefore(this.start) && !positionOrRange.isAfter(this.end);
        }
        return this.contains(positionOrRange.start) && this.contains(positionOrRange.end);
    }

    isEqual(other: Range): boolean {
        return this.start.isEqual(other.start) && this.end.isEqual(other.end);
    }

    intersection(other: Range): Range | undefined {
        const start = this.start.isAfter(other.start) ? this.start : other.start;
        const end = this.end.isBefore(other.end) ? this.end : other.end;
        if (start.isAfter(end)) {
            return undefined;
        }
        return new Range(start, end);
    }

    union(other: Range): Range {
        const start = this.start.isBefore(other.start) ? this.start : other.start;
        const end = this.end.isAfter(other.end) ? this.end : other.end;
        return new Range(start, end);
    }

    with(start?: Position, end?: Position): Range {
        return new Range(
            start || this.start,
            end || this.end
        );
    }
}

class Selection extends Range {
    constructor(
        public anchor: Position,
        public active: Position
    ) {
        super(
            anchor.isBefore(active) ? anchor : active,
            anchor.isBefore(active) ? active : anchor
        );
    }

    get isReversed(): boolean {
        return this.anchor === this.end;
    }
}

enum TextDocumentChangeReason {
    Undo = 1,
    Redo = 2
}

class MockTextLine {
    constructor(
        public text: string,
        public lineNumber: number,
        public range: Range,
        public rangeIncludingLineBreak: Range,
        public firstNonWhitespaceCharacterIndex: number,
        public isEmptyOrWhitespace: boolean
    ) { }
}

class MockTextDocument {
    constructor(
        public uri: any,
        public fileName: string,
        public isUntitled: boolean,
        public languageId: string,
        public version: number,
        public isDirty: boolean,
        public isClosed: boolean,
        private lines: string[]
    ) { }

    applyEdit(range: Range, newText: string): void {
        const line = this.lines[range.start.line];
        if (!line) { return; }

        const before = line.substring(0, range.start.character);
        const after = line.substring(range.end.character);
        this.lines[range.start.line] = before + newText + after;
    }

    get lineCount(): number {
        return this.lines.length;
    }

    lineAt(lineOrPosition: number | Position): MockTextLine {
        const lineNum = typeof lineOrPosition === 'number'
            ? lineOrPosition
            : lineOrPosition.line;

        const text = this.lines[lineNum] || '';
        const firstNonWs = text.search(/\S/);

        return new MockTextLine(
            text,
            lineNum,
            new Range(new Position(lineNum, 0), new Position(lineNum, text.length)),
            new Range(new Position(lineNum, 0), new Position(lineNum, text.length)),
            firstNonWs >= 0 ? firstNonWs : text.length,
            text.trim().length === 0
        );
    }

    getText(range?: Range): string {
        if (!range) {
            return this.lines.join('\n');
        }

        if (range.start.line === range.end.line) {
            const line = this.lines[range.start.line] || '';
            return line.substring(range.start.character, range.end.character);
        }

        // Multi-line
        const result: string[] = [];
        for (let i = range.start.line; i <= range.end.line; i++) {
            const line = this.lines[i] || '';
            if (i === range.start.line) {
                result.push(line.substring(range.start.character));
            } else if (i === range.end.line) {
                result.push(line.substring(0, range.end.character));
            } else {
                result.push(line);
            }
        }
        return result.join('\n');
    }
}

class MockTextEditor {
    constructor(
        public document: MockTextDocument,
        public selection: Selection,
        public selections: Selection[]
    ) { }

    get visibleRanges(): Range[] {
        return [new Range(new Position(0, 0), new Position(this.document.lineCount, 0))];
    }
}

// Глобальное хранилище для мокового редактора
let mockActiveEditor: MockTextEditor | undefined;

// Функция для установки мокового редактора (используется в тестах)
(global as any).__setMockActiveEditor = (lines: string[]) => {
    const doc = new MockTextDocument(
        { scheme: 'file', fsPath: '/test.txt' },
        '/test.txt',
        false,
        'plaintext',
        1,
        false,
        false,
        lines
    );
    mockActiveEditor = new MockTextEditor(
        doc,
        new Selection(new Position(0, 0), new Position(0, 0)),
        [new Selection(new Position(0, 0), new Position(0, 0))]
    );
    return mockActiveEditor;
};

(global as any).__applyMockEdit = (range: Range, newText: string = '') => {
    if (mockActiveEditor && mockActiveEditor.document) {
        (mockActiveEditor.document as any).applyEdit(range, newText);
    }
};

(global as any).__clearMockActiveEditor = () => {
    mockActiveEditor = undefined;
};


// Мокируем сам модуль vscode
mock('vscode', {
    Position,
    Range,
    Selection,
    TextDocumentChangeReason,

    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/tmp' } }],
        onDidChangeTextDocument: () => ({ dispose: () => { } }),
        onDidSaveTextDocument: () => ({ dispose: () => { } }),
        onDidCloseTextDocument: () => ({ dispose: () => { } }),
        getConfiguration: () => ({
            get: () => undefined,
            has: () => false,
            update: () => Promise.resolve()
        })
    },

    window: {
        get activeTextEditor() {
            return mockActiveEditor;
        },
        showTextDocument: () => Promise.resolve(),
        showInformationMessage: () => Promise.resolve(),
        showWarningMessage: () => Promise.resolve(),
        showErrorMessage: () => Promise.resolve(),
        createOutputChannel: () => ({
            append: () => { },
            appendLine: () => { },
            clear: () => { },
            show: () => { },
            hide: () => { },
            dispose: () => { }
        }),
        onDidChangeActiveTextEditor: () => ({ dispose: () => { } }),
        onDidChangeTextEditorSelection: () => ({ dispose: () => { } }),
        onDidChangeWindowState: () => ({ dispose: () => { } }),
        tabGroups: {
            activeTabGroup: {
                tabs: [],
                activeTab: undefined
            }
        },
        state: {
            focused: true
        }
    },

    commands: {
        executeCommand: () => Promise.resolve(),
        registerCommand: () => ({ dispose: () => { } }),
        getCommands: () => Promise.resolve([])
    },

    env: {
        language: "en-US",
        openExternal: () => Promise.resolve(true)
    },

    languages: {
        createDiagnosticCollection: () => ({
            clear: () => { },
            delete: () => { },
            dispose: () => { },
            forEach: () => { },
            get: () => undefined,
            has: () => false,
            set: () => { }
        })
    },

    extensions: {
        getExtension: () => undefined,
        all: []
    },

    Uri: {
        parse: (value: string) => ({ fsPath: value, scheme: 'file' }),
        file: (path: string) => ({ fsPath: path, scheme: 'file' })
    },

    Disposable: class {
        static from(...disposables: any[]) {
            return { dispose: () => disposables.forEach(d => d.dispose()) };
        }
        dispose() { }
    }
});

// Регистрируем reflect-metadata после мока
import "reflect-metadata";

// Увеличиваем stack trace для удобства отладки
Error.stackTraceLimit = 100;

console.log('✓ VSCode mock loaded successfully');
