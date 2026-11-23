// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * A navigation port with no browser (F332, TASK-05): the places kept in memory, as a router would keep them. The kit's
 * tests hand it to the panel to prove it moves only through the port; a project writes its own over its router (the
 * MJRPpersonal over Next's, the V0 over its own), with the same three calls.
 */
/**
 * @typedef {import('../../ui/ports').KitNavigation} KitNavigation
 * @typedef {import('../../ui/ports').KitLocation} KitLocation
 * @typedef {KitNavigation & { moves: Array<{ target: KitLocation; replace: boolean }>; back(): void }} MemoryNavigation
 *   `moves`: every move the panel asked for, in order; `back`: the back button.
 */

/**
 * @param {KitLocation} initial
 * @returns {MemoryNavigation}
 */
export function memoryNavigation(initial) {
    /** @type {KitLocation[]} */
    const entries = [initial];
    /** @type {Set<() => void>} */
    const listeners = new Set();
    const tell = () => { for (const listener of [...listeners]) listener(); };
    /** @type {MemoryNavigation['moves']} */
    const moves = [];
    return {
        moves,
        where: () => entries[entries.length - 1],
        go(target, options = {}) {
            const replace = !!options.replace;
            moves.push({ target, replace });
            if (replace) entries[entries.length - 1] = target;
            else entries.push(target);
            tell();
        },
        listen(changed) {
            listeners.add(changed);
            return () => { listeners.delete(changed); };
        },
        back() {
            if (entries.length > 1) entries.pop();
            tell();
        },
    };
}
