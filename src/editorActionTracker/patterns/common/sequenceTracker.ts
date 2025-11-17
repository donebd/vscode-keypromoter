export interface SequenceConfig<T> {
    maxLength?: number;
    timeout?: number;
    minLength?: number;
}

export class SequenceTracker<T extends { timestamp: number }> {
    private sequence: T[] = [];
    private lastTime = 0;

    constructor(private config: SequenceConfig<T> = {}) {
        this.config.maxLength = config.maxLength ?? 50;
        this.config.timeout = config.timeout ?? 3000;
        this.config.minLength = config.minLength ?? 1;
    }

    public add(item: T): void {
        const now = item.timestamp;

        // Check timeout
        if (this.hasTimedOut(now)) {
            this.reset();
        }

        // Clean old items
        if (this.config.timeout) {
            this.sequence = this.sequence.filter(
                s => now - s.timestamp < this.config.timeout!
            );
        }

        this.sequence.push(item);
        this.lastTime = now;

        // Limit length
        if (this.config.maxLength && this.sequence.length > this.config.maxLength) {
            this.sequence.shift();
        }
    }

    public get items(): readonly T[] {
        return this.sequence;
    }

    public get length(): number {
        return this.sequence.length;
    }

    public get lastItem(): T | undefined {
        return this.sequence[this.sequence.length - 1];
    }

    public get firstItem(): T | undefined {
        return this.sequence[0];
    }

    public hasMinLength(): boolean {
        return this.sequence.length >= (this.config.minLength ?? 1);
    }

    public hasTimedOut(currentTime: number): boolean {
        return this.lastTime > 0 &&
            this.config.timeout !== undefined &&
            (currentTime - this.lastTime) > this.config.timeout;
    }

    public reset(): void {
        this.sequence = [];
        this.lastTime = 0;
    }

    public filter(predicate: (item: T) => boolean): T[] {
        return this.sequence.filter(predicate);
    }

    public slice(start?: number, end?: number): T[] {
        return this.sequence.slice(start, end);
    }

    public some(predicate: (item: T) => boolean): boolean {
        return this.sequence.some(predicate);
    }

    public every(predicate: (item: T) => boolean): boolean {
        return this.sequence.every(predicate);
    }
}
