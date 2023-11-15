import { Writable } from 'stream';
import * as winston from 'winston';
import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel("Key Promoter");

const outputStream = new Writable({
    write(chunk: any, encoding, callback) {
        outputChannel.append(chunk.toString());
    }
});

const level = 'info';

const format = winston.format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

export const logger = winston.createLogger({
    level: level,
    format: format,
    transports: [
        new winston.transports.Stream({ stream: outputStream })
    ]
});
