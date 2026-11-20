/**
 * Not app code: a function with a cyclomatic complexity of exactly 11 (one path, plus ten
 * decisions), so the complexity test can prove that its measuring sees a function above 10.
 */
export function tooManyPaths(n) {
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

/** Exactly at the limit: this one must not be reported. */
export function atTheLimit(n) {
    if (n === 1) return 'one'
    if (n === 2) return 'two'
    if (n === 3) return 'three'
    if (n === 4) return 'four'
    if (n === 5) return 'five'
    if (n === 6) return 'six'
    if (n === 7) return 'seven'
    if (n === 8) return 'eight'
    if (n === 9) return 'nine'
    return 'many'
}
