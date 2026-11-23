// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The publication card after a save (F158; UAT-344, UAT-347, UAT-349): the pure rule that reads each answer of the project's
 * `publication` port and says what the card shows. The card leaves as soon as it is known there is no build: the host does not
 * publish (`none`), the build of the save was seen running and is done, or a build newer than the one of before the save is done.
 * An «idle» answer about the build of before keeps it up until `BUILD_START` has passed (the host takes a moment to start the build).
 * A query that failed after the save says the publication could not be confirmed, at once. An answer to a question asked before
 * the save only teaches which deploy was there before.
 */
import type { KitPublication } from './ports';

/**
 * How long after a save an «idle» answer about the build of before is taken as «the build has not started yet», not «there is no
 * build».
 */
export const BUILD_START = 90_000;

/** The save waiting to be published: when, whether its build was seen running, and the deploy of before (once known). */
export interface SaveMark {
    at: number;
    seen: boolean;
    /** Whether an answer from before the save told which deploy was there; without it, a newer build cannot be told apart. */
    known: boolean;
    before?: string;
}

/** The mark of a save, from the last answer that said something about the deploys (null: none came yet). */
export function markAfterSave(last: KitPublication | null, at: number): SaveMark {
    return { at, seen: false, known: last !== null, before: last?.build };
}

/**
 * What one answer does: `card` is what the card shows now (absent, it stays as it is), `mark` the save still waiting, and
 * `askAgain` asks the port once more (the deploy of before was just learned, so the next answer can be told apart).
 * `asked` is when the question went out, `shown` the card's state now and `clock` the time of the answer.
 */
export function readAnswer(now: KitPublication, asked: number, mark: SaveMark | null, shown: KitPublication['state'], clock: number): { card?: KitPublication; mark: SaveMark | null; askAgain?: boolean } {
    if (now.state === 'idle' && now.none) return { card: now, mark: null };
    if (mark && asked < mark.at) {
        // Asked before the save: it says what was there before, not what the save started.
        if (!mark.known && now.state !== 'unknown') return { mark: { ...mark, known: true, before: now.build }, askAgain: true };
        return { mark };
    }
    if (now.state === 'unknown') {
        // A failed query confirms nothing and denies nothing: the failure of the last publication stays said, and the save stays
        // waiting (its mark goes on), so only a newer finished deploy or the save's own build can take the warning down.
        if (shown === 'failed') return { mark };
        if (mark || shown === 'publishing' || shown === 'unknown') return { card: now, mark };
        return { card: { state: 'idle' }, mark: null };
    }
    const next = now.state === 'publishing' && mark ? { ...mark, seen: true } : mark;
    const newer = now.build !== undefined && next?.known && next.before !== undefined && now.build !== next.before;
    // After a failed query (the warning up), the deadline does not end the wait: the build of before, idle, confirms nothing.
    const waiting = shown === 'unknown' || clock - (next?.at ?? 0) < BUILD_START;
    if (now.state === 'idle' && next && !next.seen && !newer && waiting) return { mark: next };
    return { card: now, mark: now.state === 'idle' ? null : next };
}
