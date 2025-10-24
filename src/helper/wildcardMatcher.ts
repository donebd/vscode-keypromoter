
export class WildcardMatcher {
    private patterns: RegExp[] = [];
    
    constructor(patterns: string[]) {
        this.updatePatterns(patterns);
    }
    
    public updatePatterns(patterns: string[]): void {
        this.patterns = patterns.map(pattern => {
            // Escape special regex characters except *
            const escapedPattern = pattern
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\*/g, '.*');
            return new RegExp(`^${escapedPattern}$`);
        });
    }
    
    public matches(text: string): boolean {
        return this.patterns.some(pattern => pattern.test(text));
    }
    
    public getPatterns(): string[] {
        return this.patterns.map(p => p.source);
    }
}
