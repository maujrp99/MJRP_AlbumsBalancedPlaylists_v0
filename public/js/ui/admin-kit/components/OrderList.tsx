// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The list of fixed order (F158, S-173; `^cms-kit-fixed-order`, the CMS v33 approved on 2026-11-20): the rows of the list with create,
 * edit and remove, without «+ Novo» and without «Remover». Each row has the grip (the mouse drags at once, the finger after a
 * moment, as the lists of today), ↑ and ↓ (the keyboard's and the phone's way), the number of its place and its name. A sentence
 * under the list says, while a row is dragged, where it would drop (UAT-347), and after, the new place of whoever moved, for the
 * screen reader and for whoever sees; rows that left the saved place are marked. The kit knows no section: the project says what a row is and what its place gives (`KitOrder`).
 */
import { useRef, useState, type ReactNode } from 'react';
import {
    DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { KitOrder } from '../schema';
import { orderOf, withMovedId, type KitValues } from '../values';
import { useKit } from './context';
import { OrderRow } from './OrderRow';

export function OrderList({ element, values, onChange }: { element: KitOrder; values: KitValues; onChange: (next: KitValues) => void }) {
    const { saved } = useKit();
    const order = orderOf(values, element.key, element.initial);
    const was = orderOf(saved ?? values, element.key, element.initial);
    const [said, setSaid] = useState<ReactNode>(null);
    const list = useRef<HTMLOListElement>(null);
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const rowOf = (id: string, now: KitValues, ids: readonly string[]) => element.row(id, { values: now, order: ids });
    /** The sentence with the row's name in bold, wherever the project put it. */
    const say = (text: string, name: string) => {
        const at = text.indexOf(name);
        setSaid(at < 0 ? text : <>{text.slice(0, at)}<b>{name}</b>{text.slice(at + name.length)}</>);
    };

    const move = (from: number, to: number, focus?: 'up' | 'down' | 'grip') => {
        if (to < 0 || to >= order.length || to === from) return;
        const next = withMovedId(values, element.key, element.initial, from, to);
        const id = order[from];
        const now = orderOf(next, element.key, element.initial);
        say(element.moved(id, { values: next, order: now }), rowOf(id, next, now).name);
        onChange(next);
        // The row moved in the DOM, and the keyboard's place must follow it: the same button, or the grip when that one is now off.
        if (focus) requestAnimationFrame(() => {
            const row = list.current?.querySelector<HTMLElement>(`[data-order-id="${id}"]`);
            const button = row?.querySelector<HTMLButtonElement>(`[data-order="${focus}"]`);
            (button && !button.disabled ? button : row?.querySelector<HTMLElement>('[data-order="grip"]'))?.focus();
        });
    };
    // While dragging, the sentence says where the row would drop: the order as it would be with the row over the place it is now on.
    const onDrag = (active: UniqueIdentifier, over?: UniqueIdentifier) => {
        if (!element.dragging) return;
        const id = String(active);
        const from = order.indexOf(id);
        const to = over === undefined ? from : order.indexOf(String(over));
        const then = from < 0 || to < 0 ? order : arrayMove([...order], from, to);
        say(element.dragging(id, { values, order: then }), rowOf(id, values, order).name);
    };
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) {
            if (element.dragging) setSaid(null);
            return;
        }
        move(order.indexOf(String(active.id)), order.indexOf(String(over.id)));
    };
    return (
        <div className="ak-ord">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => onDrag(active.id)} onDragOver={({ active, over }) => onDrag(active.id, over?.id)} onDragEnd={onDragEnd}
                onDragCancel={() => { if (element.dragging) setSaid(null); }}>
                <SortableContext items={[...order]} strategy={verticalListSortingStrategy}>
                    <ol ref={list} className="ak-ord-list" aria-label={element.label}>
                        {order.map((id, index) => (
                            <OrderRow key={id} id={id} row={rowOf(id, values, order)} index={index} total={order.length}
                                moved={was.indexOf(id) !== index} onMove={(to, focus) => move(index, to, focus)} />
                        ))}
                    </ol>
                </SortableContext>
            </DndContext>
            <p className="ak-ord-said" role="status" aria-live="polite">{said}</p>
        </div>
    );
}
