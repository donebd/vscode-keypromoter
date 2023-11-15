import { Writable } from 'stream';
import * as winston from 'winston';

const level = 'debug';

const defaultTransport = new winston.transports.Console();

export const logger: winston.Logger = winston.createLogger({
    level: level,
    format: winston.format.simple(),
    transports: [
        defaultTransport
    ]
});

export interface Channel {
    append(value: string): void;
}

export function initLogger(outputChannel: Channel) {
    logger.clear();
    const outputStream = new Writable({
        write(chunk: any, encoding, callback) {
            outputChannel.append(chunk.toString());
            callback();
        }
    });
    logger.add(new winston.transports.Stream({ stream: outputStream }));
}
