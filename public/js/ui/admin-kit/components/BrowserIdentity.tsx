// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The tab of the browser as it will look (F113, S-142; from F101's `HarnessIconTab`, the admin v18 `^hs-icon-pick`): the
 * icon at 16 px and the tab's title, in the dark and the light theme, so the author sees the icon where it counts. One
 * piece for every place that has a tab: the project says which keys hold the icon and the title in a custom element's
 * `data` (`iconKey`, `titleKey`, `standard`), and a place with no icon sent shows the one the code carries.
 */
import { imageOf, textOf } from '../values';
import { useKit } from './context';
import type { KitValues } from '../values';

export function BrowserIdentityTab({ values, language, data }: { values: KitValues; language: string; data?: Record<string, string> }) {
    const { ports, schema } = useKit();
    const src = imageOf(values, data?.iconKey ?? '')?.src ?? data?.standard ?? '';
    const title = textOf(values, data?.titleKey ?? '', language) || textOf(values, data?.titleKey ?? '', schema.languages[0]) || data?.fallback || '';
    return (
        <div className={data?.wide ? 'ak-tabs wide' : 'ak-tabs'} role="img" aria-label={`${ports.texts.tabSample}: ${title}`}>
            {(['dark', 'light'] as const).map((theme) => (
                <span key={theme} className={`ak-tab ${theme}`} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- o kit não importa o Next (ADR-0011): o ícone a 16 px, como a aba o mostra */}
                    {src && <img src={src} alt="" width={16} height={16} />}
                    <span>{title}</span>
                </span>
            ))}
        </div>
    );
}
