// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/** One element of a block, drawn by its kind; a custom piece comes from the project's extensions, by id. */
import type { KitElement } from '../schema';
import type { KitValues } from '../values';
import { useKit } from './context';
import { ChoiceInput, FieldInput, FlagInput, ImageSlot } from './inputs';
import { BrowserIdentityTab } from './BrowserIdentity';
import { ListView } from './ListView';
import { OrderList } from './OrderList';

export function ElementView({ element, values, onChange, at }: { element: KitElement; values: KitValues; onChange: (next: KitValues) => void; at: string[] }) {
    const { extensions, language, saved, dirty, save } = useKit();
    switch (element.kind) {
        case 'field': return <FieldInput element={element} values={values} onChange={onChange} at={at} />;
        case 'flag': return <FlagInput element={element} values={values} onChange={onChange} at={at} />;
        case 'choice': return <ChoiceInput element={element} values={values} onChange={onChange} at={at} />;
        case 'image': return <ImageSlot element={element} values={values} onChange={onChange} at={at} />;
        case 'list': {
            const draw = element.view ? extensions[element.view] : undefined;
            if (draw) return <>{draw({ values, onChange, language, saved: saved ?? values, dirty: dirty ?? false, save: save ?? (async () => false) })}</>;
            return <ListView list={element} values={values} onChange={onChange} at={at} />;
        }
        case 'order': return <OrderList element={element} values={values} onChange={onChange} />;
        case 'note': return <p className={element.tone === 'warn' ? 'ak-note warn' : 'ak-note'}>{element.text}</p>;
        case 'custom': {
            // The tab sample is the kit's own piece (F113): every place that has a tab says its keys in `data`.
            if (element.id === 'browser-identity-tab') return <BrowserIdentityTab values={values} language={language} data={element.data} />;
            const draw = extensions[element.id];
            return draw ? <>{draw({ values, onChange, language, saved: saved ?? values, dirty: dirty ?? false, save: save ?? (async () => false) })}</> : null;
        }
    }
}
