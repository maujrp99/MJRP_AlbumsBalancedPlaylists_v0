// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/** One row of the list of fixed order (F158, `^cms-kit-fixed-order`): the grip, ↑ and ↓ as line drawings, the number of the place and the name. */
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KitOrderRow } from '../schema';
import { useKit } from './context';

const LINE = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
/** The icons are line drawings (SVG), not characters, as the approved CMS v33 draws them. */
const ICON = {
    grip: <svg width="16" height="16" viewBox="0 0 24 24" {...LINE} strokeWidth="3.2"><path d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01" /></svg>,
    up: <svg width="16" height="16" viewBox="0 0 24 24" {...LINE} strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>,
    down: <svg width="16" height="16" viewBox="0 0 24 24" {...LINE} strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>,
    off: <svg width="13" height="13" viewBox="0 0 24 24" {...LINE} strokeWidth="2"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4.4-1" /></svg>,
};

export function OrderRow({ id, row, index, total, moved, onMove }: { id: string; row: KitOrderRow; index: number; total: number; moved: boolean; onMove: (to: number, focus: 'up' | 'down' | 'grip') => void }) {
    const { ports } = useKit();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const off = row.tag !== undefined;
    return (
        <li ref={setNodeRef} data-order-id={id} style={{ transform: CSS.Transform.toString(transform), transition }} className={clsx('ak-row', 'ak-ord-row', off && 'off', moved && 'moved', isDragging && 'dragging')}>
            <div className="ak-row-h">
                <span className="ak-row-ctl">
                    <button type="button" className="ak-icon ak-grip" data-order="grip" aria-label={`${ports.texts.drag}: ${row.name}`} {...attributes} {...listeners}>{ICON.grip}</button>
                    <span className="ak-order">
                        <button type="button" className="ak-icon" data-order="up" aria-label={`${ports.texts.moveUp}: ${row.name}`} disabled={index === 0} onClick={() => onMove(index - 1, 'up')}>{ICON.up}</button>
                        <button type="button" className="ak-icon" data-order="down" aria-label={`${ports.texts.moveDown}: ${row.name}`} disabled={index === total - 1} onClick={() => onMove(index + 1, 'down')}>{ICON.down}</button>
                    </span>
                </span>
                <span className="ak-row-main">
                    <span className="ak-pos ak-ord-n" data-position>{row.number ?? '—'}</span>
                    <span className="ak-row-t">
                        <b>{row.name}</b>
                        <small className="ak-ord-d">
                            {off
                                ? <span className="ak-ord-tag">{ICON.off}{row.tag}</span>
                                : <>{row.swatch && <span className="ak-ord-sw" style={{ background: row.swatch }} aria-hidden="true" />}{row.detail}</>}
                        </small>
                    </span>
                </span>
            </div>
        </li>
    );
}

