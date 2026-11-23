// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The overview (`^pro-admin-map`): the site from top to bottom, one line per section, in the site's order, with how many
 * fields it has and their review states, and «Editar →».
 */
import type { ReactNode } from 'react';
import { elementsOf, type KitSchema, type KitSection } from '../schema';
import { fill } from '../ports';
import { itemsOf, stateOf, type KitValues } from '../values';
import { useKit } from './context';

/** The texts of a section: its own fields and every field of every item of its lists, with their review states. */
function countOf(schema: KitSchema, section: KitSection, values: KitValues): { fields: number; states: string } {
    const tally = new Map<string, number>();
    let fields = 0;
    const count = (container: KitValues, key: string) => {
        fields += 1;
        const state = stateOf(container, key);
        if (state && schema.states[state]) tally.set(state, (tally.get(state) ?? 0) + 1);
    };
    for (const element of elementsOf(section.blocks)) {
        if (element.kind === 'field') count(values, element.key);
        if (element.kind === 'list') {
            for (const item of itemsOf(values, element.key)) for (const field of element.fields) if (field.kind === 'field') count(item, field.key);
        }
    }
    const states = [...tally].map(([state, n]) => `${n} ${n === 1 ? schema.states[state].label : schema.states[state].plural ?? schema.states[state].label}`).join(' · ');
    return { fields, states };
}

/** `sections` are the ones as the content has them now (the order and the names a project's `arrange` gives); with none, the schema's. */
export function SiteMap({ values, lead, sections }: { values: KitValues; lead?: ReactNode; sections?: KitSection[] }) {
    const { schema, ports, go } = useKit();
    return (
        <>
            {lead}
            <nav className="ak-map" aria-label={schema.name}>
                {(sections ?? schema.sections).filter((section) => !section.hidden && section.path).map((section) => {
                    const { fields, states } = countOf(schema, section, values);
                    return (
                        <a key={section.id} className="ak-map-row" href={ports.hrefOf(section.path)}
                            onClick={(event) => { event.preventDefault(); go(section.path); }}>
                            <b>{section.title}</b>
                            <span>{fill(ports.texts.sectionCount, { fields, states: states || '—' })}</span>
                            <em>{ports.texts.openSection}</em>
                        </a>
                    );
                })}
            </nav>
        </>
    );
}
