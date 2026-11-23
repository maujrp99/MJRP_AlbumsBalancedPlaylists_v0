// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * A list with create, edit, order and remove (`^pro-admin-list-crud`): «+ Novo …» at the end puts the new item there,
 * empty, open, with the cursor in it; the order changes by dragging the grip or with ↑ ↓ (the keyboard and the phone's
 * way); «Remover» asks on the button itself and goes back by itself after 4 seconds. A list with the switch puts each item
 * on or off the air, and «Na página» shows the live ones in order.
 */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
    DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useDroppable, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KitList } from '../schema';
import { useDndScope } from './dnd-scope';
import { fill, type KitPorts } from '../ports';
import { imageOf, itemsOf, newItemId, stateOf, textOf, roleOf, withItem, withItemPassed, withMovedItem, withNewItem, withRole, withUnique, withoutItem, type KitImageValue, type KitItem, type KitValues } from '../values';
import { Badge, OrderButtons, Switch } from './bits';
import { problemsAt, useKit } from './context';
import { nameOf } from '../values';
import { ElementView } from './ElementView';
import { ImageSlot, sizeOf } from './inputs';

/** How long «Confirmar: remover» waits before it goes back to «Remover». */
export const CONFIRM_MS = 4000;

function titleOf(item: KitItem, key: string, language: string, main: string): string {
    const own = item[key];
    if (typeof own === 'string') return own;
    // An image as the title (the wall's): its file's name.
    if (own && typeof own === 'object' && typeof (own as { src?: unknown }).src === 'string') return String((own as { src: string }).src).split('/').pop() ?? '';
    return textOf(item, key, language) || textOf(item, key, main);
}

/** The item's name in the row: its title, or the field that names it when the title is empty. */
const rowTitleOf = (list: KitList, item: KitItem, language: string, main: string): string => titleOf(item, list.titleField, language, main) || (list.fallbackTitle ? titleOf(item, list.fallbackTitle, language, main) : '');

/** The first letters of the two first words: what a thumbnail with no image shows. */
const initialsOf = (title: string): string => (title || '?').split(/\s+/).slice(0, 2).map((word) => word[0]).join('');

/** The item's small image and what the project says of it (below the least size, out of proportion). */
function thumbOf(list: KitList, item: KitItem, ports: KitPorts): { thumb: KitImageValue | null; warnings: string[] } {
    const thumb = list.thumb ? imageOf(item, list.thumb) : null;
    const thumbSlot = list.fields.find((field) => field.kind === 'image' && field.key === list.thumb);
    const warnings = thumb && thumbSlot?.kind === 'image' ? ports.describeImage?.(thumbSlot.slot, thumb) ?? [] : [];
    return { thumb, warnings };
}

/** «Remover» asks on the button itself and goes back to «Remover» by itself after `CONFIRM_MS`. */
function useConfirmedRemove(onRemove: () => void) {
    const [confirming, setConfirming] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    const remove = () => {
        if (!confirming) {
            setConfirming(true);
            timer.current = setTimeout(() => setConfirming(false), CONFIRM_MS);
            return;
        }
        if (timer.current) clearTimeout(timer.current);
        onRemove();
    };
    return { confirming, remove };
}

/** A new item opens with the cursor in its first field. */
function useFirstFieldFocus(fresh: boolean, open: boolean) {
    const fields = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (fresh && open) fields.current?.querySelector<HTMLElement>('input, textarea')?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the new item opens: afterwards the author moves the cursor himself
    }, []);
    return fields;
}

type Role = ReturnType<typeof roleOf>;

function RowThumb({ list, thumb, title }: { list: KitList; thumb: KitImageValue | null; title: string }) {
    const { ports } = useKit();
    if (!list.thumb) return null;
    return (
        <span className={clsx('ak-row-thumb', list.thumbShape)} aria-hidden="true">
            {thumb ? <img src={thumb.src} alt="" style={thumb.position ? { objectPosition: thumb.position } : undefined} />
                : list.thumbShape === 'wide' ? ports.texts.noImage : initialsOf(title)}
        </span>
    );
}

function RowTitle({ list, title, summary, role, thumb }: { list: KitList; title: string; summary: string; role: Role; thumb: KitImageValue | null }) {
    const { ports } = useKit();
    return (
        <span className="ak-row-t">
            {/* The role's badge sits beside the title, as in the admin v12 (F85): it does not push the row's actions down. */}
            <b>{title || '—'}{role && list.roles && <> <Badge tone="accent">{fill(list.roles.badge, { role: role.label })}</Badge></>}</b>
            {summary && <small>{summary}</small>}
            {list.thumbShape === 'wide' && thumb?.width && thumb.height ? <small className="ak-measure">{fill(ports.texts.measure, { width: thumb.width, height: thumb.height, size: sizeOf(thumb.bytes) })}</small> : null}
        </span>
    );
}

/** The review state of the title field, as a badge in the row. */
function StateBadge({ list, item }: { list: KitList; item: KitItem }) {
    const { schema } = useKit();
    const state = list.titleState ? stateOf(item, list.titleField) : undefined;
    if (!state || !schema.states[state]) return null;
    return <Badge tone={schema.states[state].tone}>{schema.states[state].label}</Badge>;
}

function RowBadges({ list, item, thumb, warnings, flagged }: { list: KitList; item: KitItem; thumb: KitImageValue | null; warnings: string[]; flagged: boolean }) {
    const { ports } = useKit();
    return (
        <>
            {list.thumbShape === 'wide' && thumb && (warnings.length ? warnings.map((warning) => <Badge key={warning} tone="warn">{warning}</Badge>) : <Badge tone="accent">{ports.texts.ready}</Badge>)}
            <StateBadge list={list} item={item} />
            {list.badges?.filter((badge) => item[badge.key] === badge.value).map((badge) => <Badge key={`${badge.key}-${badge.value}`} tone={badge.tone}>{badge.label}{list.badgeDetail?.(item) ?? ''}</Badge>)}
            {item.fresh && <Badge tone="new">{list.freshLabel ?? ports.texts.fresh}</Badge>}
            {flagged && <Badge tone="err">!</Badge>}
        </>
    );
}

/** On or off the air, in the list's own words, and what «off» means. */
function LiveSwitch({ list, live, onChange }: { list: KitList; live: boolean; onChange: (on: boolean) => void }) {
    const { ports } = useKit();
    if (!list.live) return null;
    return (
        <>
            <Switch on={live} label={live ? list.live.on ?? ports.texts.live : list.live.off ?? ports.texts.offAir} onChange={onChange} />
            {!live && list.offHint && <span className="ak-hint">{list.offHint}</span>}
        </>
    );
}

/** Each selector is named by its chapter («Na chegada: O resultado»), so a screen reader tells the five apart. */
function RoleSelect({ roles, role, title, onRole }: { roles: NonNullable<KitList['roles']>; role: Role; title: string; onRole: (value: string) => void }) {
    return (
        <label className="ak-role">
            <span>{roles.label}</span>
            {role?.fixed ? (
                <select className="ak-input" aria-label={`${roles.label}: ${title || '—'}`} value="" disabled><option value="">{role.label}</option></select>
            ) : (
                <select className="ak-input" aria-label={`${roles.label}: ${title || '—'}`} value={role?.value ?? ''} onChange={(event) => onRole(event.target.value)}>
                    <option value="">{roles.none}</option>
                    {roles.pick.map((pick) => <option key={pick.value} value={pick.value}>{pick.label}</option>)}
                </select>
            )}
        </label>
    );
}

function RowActions({ list, item, title, role, live, shown, confirming, onOpen, onChange, onRole, onMoveTo, onRemove }: {
    list: KitList; item: KitItem; title: string; role: Role; live: boolean; shown: boolean; confirming: boolean;
    onOpen: (open: boolean) => void; onChange: (item: KitItem) => void; onRole: (value: string) => void; onMoveTo: (list: string) => void; onRemove: () => void;
}) {
    const { ports, go } = useKit();
    return (
        <span className="ak-row-acts">
            {list.unique && (
                <label className="ak-check">
                    <input type="radio" name={`${list.key}-${list.unique.key}`} checked={item[list.unique.key] === true}
                        onChange={() => onChange({ ...item, [list.unique!.key]: true })} />
                    <span>{list.unique.label}</span>
                </label>
            )}
            <LiveSwitch list={list} live={live} onChange={(on) => onChange({ ...item, live: on })} />
            {list.opens && <button type="button" className="ak-btn sm pri" onClick={() => go(list.opens!.section, item.id)}>{list.opens.label}</button>}
            {list.roles && <RoleSelect roles={list.roles} role={role} title={title} onRole={onRole} />}
            {list.moveTo?.map((target) => <button key={target.list} type="button" className="ak-btn sm" onClick={() => onMoveTo(target.list)}>{target.label}</button>)}
            <button type="button" className="ak-btn sm" aria-expanded={shown} onClick={() => onOpen(!shown)}>{shown ? ports.texts.close : ports.texts.edit}</button>
            <button type="button" className={clsx('ak-btn sm', confirming ? 'confirm' : 'danger')} onClick={onRemove}>
                {confirming ? `${ports.texts.confirmRemove}${list.removeAlso ? ` ${list.removeAlso}` : ''}` : ports.texts.remove}
            </button>
        </span>
    );
}

function Row({ list, item, index, total, position, open, onOpen, onChange, onRole, onMove, onMoveTo, onRemove, at }: {
    list: KitList; item: KitItem; index: number; total: number; position: string; open: boolean; at: string[];
    onOpen: (open: boolean) => void; onChange: (item: KitItem) => void; onRole: (value: string) => void; onMove: (to: number) => void; onMoveTo: (list: string) => void; onRemove: () => void;
}) {
    const { schema, language, ports, problems } = useKit();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !list.ordered, data: { list: list.key, drops: list.roles?.key } });
    const { confirming, remove } = useConfirmedRemove(onRemove);
    const fields = useFirstFieldFocus(Boolean(item.fresh), open);
    const main = schema.languages[0];
    const title = rowTitleOf(list, item, language, main);
    const summary = list.summaryField ? titleOf(item, list.summaryField, language, main) : '';
    const live = list.live ? item.live === true : true;
    const mine = problemsAt(problems, [...at, item.id]);
    // An item with a required text left empty stays open after a refused save, so the notice can lead to the field (F125).
    const shown = open || mine.some((problem) => problem.code === 'required');
    const { thumb, warnings } = thumbOf(list, item, ports);
    // The role the item plays elsewhere (F85, `^pro-case-arrival-mark`): fixed by its position, or picked in the row.
    const role = list.roles ? roleOf(item, index, list.roles) : null;
    return (
        <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={clsx('ak-row', !live && 'off', isDragging && 'dragging')}>
            <div className="ak-row-h">
                {/* The controls and the rest of the row are two groups, so the phone can set the controls in a column beside the title (UAT-153); on a wide screen they dissolve into the row. */}
                <span className="ak-row-ctl">
                    {list.ordered && (
                        <>
                            <button type="button" className="ak-icon ak-grip" aria-label={ports.texts.drag} {...attributes} {...listeners}>⋮⋮</button>
                            <OrderButtons index={index} total={total} onMove={onMove} up={ports.texts.moveUp} down={ports.texts.moveDown} />
                        </>
                    )}
                    <span className="ak-pos" data-position>{position}</span>
                </span>
                <span className="ak-row-main">
                    <RowThumb list={list} thumb={thumb} title={title} />
                    <RowTitle list={list} title={title} summary={summary} role={role} thumb={thumb} />
                    <RowBadges list={list} item={item} thumb={thumb} warnings={warnings} flagged={mine.length > 0} />
                    <RowActions list={list} item={item} title={title} role={role} live={live} shown={shown} confirming={confirming}
                        onOpen={onOpen} onChange={onChange} onRole={onRole} onMoveTo={onMoveTo} onRemove={remove} />
                </span>
            </div>
            {shown && (
                <div className="ak-row-b" ref={fields}>
                    {list.fields.map((field) => (
                        <ElementView key={field.id} element={field} values={item} at={[...at, item.id]} onChange={(next) => onChange(next as KitItem)} />
                    ))}
                </div>
            )}
        </li>
    );
}

export function ListView({ list, values, onChange, at }: { list: KitList; values: KitValues; onChange: (next: KitValues) => void; at: string[] }) {
    const { schema, language, ports, go } = useKit();
    const items = itemsOf(values, list.key);
    const [open, setOpen] = useState<Set<string>>(() => new Set());
    const [picked, setPicked] = useState('');
    // In a group, the lists share the dragging space of their scope (`DndScope`), and the list itself takes a drop at its end.
    const shared = useDndScope() && list.group !== undefined;
    const { setNodeRef: dropRef } = useDroppable({ id: `list:${list.key}`, data: { list: list.key }, disabled: !shared });
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const toggle = (id: string, show: boolean) => setOpen((now) => {
        const next = new Set(now);
        if (show) next.add(id);
        else next.delete(id);
        return next;
    });
    const add = () => {
        const next = withNewItem(values, list);
        const created = itemsOf(next, list.key).at(-1)!;
        onChange(next);
        // A list whose items open a page of their own takes the author there (a new project, to its empty case).
        if (list.opens && list.openOnAdd) go(list.opens.section, created.id);
        else toggle(created.id, true);
    };
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        const from = items.findIndex((item) => item.id === active.id);
        const to = items.findIndex((item) => item.id === over.id);
        onChange(withMovedItem(values, list.key, from, to));
    };
    // «Mover para Mais telas»: at the end of the other list, leaving behind the role it held here (F85, REQ-02).
    const moveTo = (target: string, id: string) => onChange(withItemPassed(values, list.key, target, id, undefined, list.roles?.key));
    // «Usar uma tela do caso»: the images already in the scope, from its lists and its own keys, once each.
    const choices = list.pick ? list.pick.sources.flatMap((source) => (source.list
        ? itemsOf(values, source.list).map((item) => imageOf(item, source.key))
        : [imageOf(values, source.key)])).filter((image): image is KitImageValue => image !== null)
        .filter((image, index, all) => all.findIndex((other) => other.src === image.src) === index) : [];
    const pick = () => {
        const image = choices.find((choice) => choice.src === picked);
        if (!image || !list.pick) return;
        onChange({ ...values, [list.key]: [...items, { id: newItemId(), fresh: true, [list.pick.field]: image }] });
        setPicked('');
    };
    const change = (item: KitItem) => {
        const before = items.find((current) => current.id === item.id);
        if (list.unique && item[list.unique.key] === true && before?.[list.unique.key] !== true) {
            onChange(withItem(withUnique(values, list.key, list.unique.key, item.id), list.key, item.id, () => item));
            return;
        }
        onChange(withItem(values, list.key, item.id, () => item));
    };
    const main = schema.languages[0];
    const live = items.filter((item) => (list.live ? item.live === true : true));
    const atList = [...at, list.key];
    // The position the page shows: an item off the air does not count.
    let counted = 0;
    const positions = items.map((item) => (!list.live || item.live === true ? String(++counted).padStart(2, '0') : '—'));
    const body = (
        <div className="ak-list">
            {items.length === 0 && <p className="ak-empty">{list.empty}</p>}
            {(() => {
                const sortable = (
                    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                        <ol ref={shared ? dropRef : undefined} className="ak-list" style={{ margin: 0, padding: 0, listStyle: 'none', minHeight: shared ? 24 : undefined }} aria-label={list.label}>
                            {items.map((item, index) => (
                                <Row key={item.id} list={list} item={item} index={index} total={items.length} at={atList} position={positions[index]}
                                    open={open.has(item.id)} onOpen={(show) => toggle(item.id, show)} onChange={change}
                                    onRole={(value) => onChange(withRole(values, list, item.id, value))}
                                    onMove={(to) => onChange(withMovedItem(values, list.key, index, to))}
                                    onMoveTo={(target) => moveTo(target, item.id)}
                                    onRemove={() => onChange(withoutItem(values, list.key, item.id))} />
                            ))}
                        </ol>
                    </SortableContext>
                );
                return shared ? sortable : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>{sortable}</DndContext>;
            })()}
            {(list.max === undefined || items.length < list.max) && <button type="button" className="ak-btn ak-add" onClick={add}>{list.addLabel}</button>}
            {list.directUpload && (
                <div className="ak-direct">
                    <ImageSlot element={{ kind: 'image', id: nameOf(list.key, 'direct'), label: list.directUpload.label, key: list.directUpload.field, slot: list.directUpload.slot }}
                        values={{}} at={atList}
                        onChange={(sent) => onChange({ ...values, [list.key]: [...items, { id: newItemId(), fresh: true, [list.directUpload!.field]: sent[list.directUpload!.field] }] })} />
                </div>
            )}
            {list.pick && choices.length > 0 && (
                <span className="ak-img-acts">
                    <select className="ak-input" style={{ width: 'auto' }} aria-label={list.pick.label} value={picked} onChange={(event) => setPicked(event.target.value)}>
                        <option value="">{list.pick.label}</option>
                        {choices.map((choice) => <option key={choice.src} value={choice.src}>{choice.src.split('/').pop()}</option>)}
                    </select>
                    <button type="button" className="ak-btn sm" disabled={!picked} onClick={pick}>{ports.texts.usePicked}</button>
                </span>
            )}
        </div>
    );
    if (!list.preview) return body;
    return (
        <div className="ak-split">
            {body}
            <aside className="ak-preview" aria-live="polite">
                <b>{fill(ports.texts.onPage, { title: list.preview.title })}</b>
                <ol>
                    {live.map((item, index) => (
                        <li key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><span>{titleOf(item, list.titleField, language, main) || '—'}{list.summaryField && titleOf(item, list.summaryField, language, main) && <small>{titleOf(item, list.summaryField, language, main)}</small>}</span></li>
                    ))}
                </ol>
            </aside>
        </div>
    );
}
