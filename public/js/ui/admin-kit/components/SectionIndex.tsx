// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The index of a long screen's sections, as a vertical timeline beside the blocks (F112, S-141; `^panel-section-index`):
 * a dot per section joined by a thin line, the dot of the section being read filled. The same piece serves both panels:
 * it takes the sections as `{ id, title }` (the id of the element on the page) and the two texts, so it needs neither the
 * kit's context nor a skin of its own beyond the `--ak-*` tokens.
 *
 * A screen with fewer than two sections shows no index (`^panel-section-index-none`), and on a phone the index is hidden
 * by the style (`^panel-section-index-phone`). A click opens the section if it is a collapsed `details`, scrolls to it and
 * moves the focus to it (`^panel-section-index-opens`); the clicked item stays marked until the person scrolls on their
 * own, because at the end of the page the scroll never reaches the last sections (`^panel-section-index-active`).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { safeHref as safeUrl } from '@mjrp/admin-kit-core';

export interface SectionIndexEntry {
    /** The id of the element the item leads to. */
    id: string;
    /** The name shown in the index. */
    title: string;
}

/** The line where a section counts as the one being read: the same as the bar of the steps (`SectionView`). */
export const READING_LINE = 200;
/** How far below the top the section lands when the index leads to it: under the top bar. */
const LANDING = 84;

/** The nearest ancestor that scrolls on its own, or the window. */
function scrollerOf(element: HTMLElement): HTMLElement | Window {
    for (let node = element.parentElement; node; node = node.parentElement) {
        const overflow = getComputedStyle(node).overflowY;
        if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) return node;
    }
    return window;
}

/** Which entry is the one being read: the last whose element has reached the reading line; at the end of the page, the last. */
function readingNow(entries: SectionIndexEntry[], area: HTMLElement | Window): number {
    const atEnd = area === window
        ? innerHeight + scrollY >= document.documentElement.scrollHeight - 4
        : (area as HTMLElement).clientHeight + (area as HTMLElement).scrollTop >= (area as HTMLElement).scrollHeight - 4;
    if (atEnd) return entries.length - 1;
    let at = 0;
    entries.forEach((entry, i) => {
        const element = document.getElementById(entry.id);
        if (element && element.getBoundingClientRect().top <= READING_LINE) at = i;
    });
    return at;
}

export function SectionIndex({ entries, heading, label }: { entries: SectionIndexEntry[]; heading: string; label: string }) {
    const navRef = useRef<HTMLElement>(null);
    const [current, setCurrent] = useState(0);
    // The item the person clicked, held until they scroll by their own hand (wheel, touch, key).
    const pinned = useRef<number | null>(null);
    // The measure reads the entries of the latest render, so the listeners are set once.
    const latest = useRef(entries);
    useEffect(() => { latest.current = entries; });
    const key = entries.map((entry) => entry.id).join('|');

    const measure = useCallback(() => {
        if (!navRef.current) return;
        setCurrent(pinned.current ?? readingNow(latest.current, scrollerOf(navRef.current)));
    }, []);

    useEffect(() => {
        const release = () => { if (pinned.current !== null) { pinned.current = null; measure(); } };
        // The first reading waits for the frame: the blocks are on the page by then, and no state is set inside the effect.
        const first = requestAnimationFrame(measure);
        addEventListener('scroll', measure, { passive: true, capture: true });
        addEventListener('resize', measure);
        document.addEventListener('toggle', measure, true);
        (['wheel', 'touchmove', 'keydown'] as const).forEach((name) => addEventListener(name, release, { passive: true }));
        return () => {
            cancelAnimationFrame(first);
            removeEventListener('scroll', measure, true);
            removeEventListener('resize', measure);
            document.removeEventListener('toggle', measure, true);
            (['wheel', 'touchmove', 'keydown'] as const).forEach((name) => removeEventListener(name, release));
        };
    }, [measure, key]);

    const lead = (index: number) => {
        const target = document.getElementById(entries[index].id);
        if (!target || !navRef.current) return;
        if (target instanceof HTMLDetailsElement) target.open = true;
        const area = scrollerOf(navRef.current);
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const options: ScrollToOptions = { top: target.getBoundingClientRect().top - LANDING, behavior: reduced ? 'auto' : 'smooth' };
        area.scrollBy(options);
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        pinned.current = index;
        setCurrent(index);
    };

    return (
        <nav className="ak-ix" ref={navRef} aria-label={label}>
            <p className="ak-ix-h">{heading}</p>
            <ol>
                {entries.map((entry, i) => (
                    <li key={entry.id}>
                        <a href={safeUrl(`#${entry.id}`) ?? '#'} aria-current={current === i ? 'location' : undefined}
                            onClick={(event) => { event.preventDefault(); lead(i); }}>{entry.title}</a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

/**
 * The screen's blocks with the index beside them when there are two or more sections; with fewer, the blocks alone,
 * as they were. The blocks keep their own column gap, so a screen without the index looks as before.
 */
export function WithSectionIndex({ entries, heading, label, children, lead }: { entries: SectionIndexEntry[]; heading: string; label: string; children: ReactNode; lead?: ReactNode }) {
    // A `lead` (the dictionary's search, UAT-244) heads the column of the blocks and is the first thing the index lines up with. It
    // must keep its place when a search leaves one section only, or typing would lose the focus: the wrapper stays, the index goes.
    if (lead !== undefined) {
        const indexed = entries.length >= 2;
        return (
            <div className={indexed ? 'ak-ix-wrap' : 'ak-ix-wrap solo'}>
                {indexed ? <SectionIndex entries={entries} heading={heading} label={label} /> : null}
                <div className="ak-ix-body">{lead}{children}</div>
            </div>
        );
    }
    if (entries.length < 2) return <>{children}</>;
    return (
        <div className="ak-ix-wrap">
            <SectionIndex entries={entries} heading={heading} label={label} />
            <div className="ak-ix-body">{children}</div>
        </div>
    );
}
