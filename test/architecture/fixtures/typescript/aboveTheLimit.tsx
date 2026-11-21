/**
 * Not app code (F83 TASK-02): a TypeScript function with a cyclomatic complexity of 11, so the
 * complexity test can prove that its measuring reads .tsx and sees a function above 10.
 */
/* eslint-disable complexity */
export function tooManyPaths(n: number): string {
    if (n === 1) return 'one'
    if (n === 2) return 'two'
    if (n === 3) return 'three'
    if (n === 4) return 'four'
    if (n === 5) return 'five'
    if (n === 6) return 'six'
    if (n === 7) return 'seven'
    if (n === 8) return 'eight'
    if (n === 9) return 'nine'
    if (n === 10) return 'ten'
    return 'many'
}
