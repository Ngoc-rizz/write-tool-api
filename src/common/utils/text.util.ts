export function countWords(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countChars(text: string): number {
    return text?.length ?? 0;
}
