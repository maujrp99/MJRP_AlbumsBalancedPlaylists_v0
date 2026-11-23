// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * Brings a block (or a field) to the top, below the top bar, which wraps to more lines on a phone (UAT-194). It only
 * scrolls: the address is the router's (F332), so nothing here writes the hash.
 */
export function land(anchor?: string): boolean {
    const target = anchor ? document.getElementById(anchor) : null;
    if (!target) return false;
    const bar = document.querySelector('.ak-top')?.getBoundingClientRect().height ?? 0;
    if (bar + 12 > (parseFloat(getComputedStyle(target).scrollMarginTop) || 0)) target.style.scrollMarginTop = `${Math.ceil(bar + 12)}px`;
    target.scrollIntoView();
    return true;
}
