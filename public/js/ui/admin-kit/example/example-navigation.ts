// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * A navigation port with no browser (F332, TASK-05): the places kept in memory, as a router would keep them. The kit's
 * tests hand it to the panel to prove it moves only through the port; a project writes its own over its router (the
 * MJRPpersonal over Next's, the V0 over its own), with the same three calls.
 */
import type { KitNavigation, KitLocation } from '../ports';

export interface MemoryNavigation extends KitNavigation {
    /** Every move the panel asked for, in order. */
    moves: Array<{ target: KitLocation; replace: boolean }>;
    /** The back button. */
    back(): void;
}

export function memoryNavigation(initial: KitLocation): MemoryNavigation {
    const entries: KitLocation[] = [initial];
    const listeners = new Set<() => void>();
    const tell = () => { for (const listener of [...listeners]) listener(); };
    const moves: MemoryNavigation['moves'] = [];
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
