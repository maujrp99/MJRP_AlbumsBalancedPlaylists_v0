// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * Sections of a schema on a screen that is not a KitApp (F113): the Garden's panel has its own casca and its own save, and
 * shows the kit's blocks inside it, with the same elements, the same rule and the same ports. The caller keeps the values
 * and the save; this only draws.
 */
import type { ReactNode } from 'react';
import type { KitPorts } from '../ports';
import type { KitSchema } from '../schema';
import type { KitValues } from '../values';
import { validate } from '../validate';
import { KitContext, type KitExtension } from './context';
import { SectionView } from './SectionView';

export function KitScreen({ schema, ports, section, values, onChange, extensions, language, showProblems }: {
    schema: KitSchema;
    ports: KitPorts;
    section: string;
    values: KitValues;
    onChange: (next: KitValues) => void;
    extensions: Record<string, KitExtension>;
    language: string;
    showProblems?: boolean;
}): ReactNode {
    const found = schema.sections.find((candidate) => candidate.id === section);
    if (!found) return null;
    const problems = showProblems ? validate(schema, values) : [];
    return (
        <KitContext.Provider value={{ schema, ports, language, extensions, problems, go: () => undefined, saved: values, dirty: false }}>
            <div className="ak-screen">
                <SectionView section={found} values={values} onChange={onChange} />
            </div>
        </KitContext.Provider>
    );
}
