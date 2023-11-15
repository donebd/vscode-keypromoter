import { Writable } from 'stream';
import * as winston from 'winston';
import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel("Key Promoter");

const outputStream = new Writable({
    write(chunk: any, encoding, callback) {
        outputChannel.append(chunk.toString());
    }
});

export const logger = winston.createLogger({
    transports: [
        new winston.transports.Stream({ stream: outputStream })
    ]
});
