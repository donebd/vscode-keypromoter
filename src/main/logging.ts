import { Writable } from 'stream';
import * as winston from 'winston';

const outputStream = new Writable({
    write(chunk: any, encoding, callback) {
        console.log(chunk.toString());
    }
});

export const logger = winston.createLogger({
    transports: [
        new winston.transports.Stream({ stream: outputStream })
    ]
});
