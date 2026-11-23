// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * One dragging space for the lists of a group in the same scope (the chapters and the extra screens of a case,
 * `^pro-case-images`): an item dropped on the other list leaves its own and goes there, at the place it was dropped.
 * A list outside the group keeps its own dragging space. A role the item held in the list it leaves stays there (F85).
 */
import { createContext, useContext, type ReactNode } from 'react';
import {
    DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { itemsOf, withItemPassed, withMovedItem, type KitValues } from '../values';

const DndScopeContext = createContext(false);

export function useDndScope(): boolean {
    return useContext(DndScopeContext);
}

/** Where a drop lands: an item of a list (`data.list`, its index) or the list itself (its end). */
function placeOf(container: KitValues, data: Record<string, unknown> | undefined, id: string): { list: string; index: number } | null {
    const list = typeof data?.list === 'string' ? data.list : null;
    if (!list) return null;
    const items = itemsOf(container, list);
    const index = items.findIndex((item) => item.id === id);
    return { list, index: index === -1 ? items.length : index };
}

export function DndScope({ values, onChange, children }: { values: KitValues; onChange: (next: KitValues) => void; children: ReactNode }) {
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over) return;
        const from = placeOf(values, active.data.current, String(active.id));
        const to = placeOf(values, over.data.current, String(over.id));
        if (!from || !to) return;
        if (from.list === to.list) {
            if (from.index !== to.index) onChange(withMovedItem(values, from.list, from.index, to.index));
            return;
        }
        // A role picked in the list it leaves stays behind (F85): the dragged item's data names its flag.
        const drop = typeof active.data.current?.drops === 'string' ? active.data.current.drops : undefined;
        onChange(withItemPassed(values, from.list, to.list, String(active.id), to.index, drop));
    };
    return (
        <DndScopeContext.Provider value>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>{children}</DndContext>
        </DndScopeContext.Provider>
    );
}
