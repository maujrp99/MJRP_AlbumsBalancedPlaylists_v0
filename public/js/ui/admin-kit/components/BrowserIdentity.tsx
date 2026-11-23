// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
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

/** The icon the tab shows: the one sent, or the one the code carries. */
const iconOf = (values: KitValues, data?: Record<string, string>): string => imageOf(values, data?.iconKey ?? '')?.src ?? data?.standard ?? '';

/** The tab's title: in the language on screen, in the main one, or the place's own. */
function tabTitleOf(values: KitValues, data: Record<string, string> | undefined, language: string, main: string): string {
    const key = data?.titleKey ?? '';
    return textOf(values, key, language) || textOf(values, key, main) || data?.fallback || '';
}

export function BrowserIdentityTab({ values, language, data }: { values: KitValues; language: string; data?: Record<string, string> }) {
    const { ports, schema } = useKit();
    const src = iconOf(values, data);
    const title = tabTitleOf(values, data, language, schema.languages[0]);
    return (
        <div className={data?.wide ? 'ak-tabs wide' : 'ak-tabs'} role="img" aria-label={`${ports.texts.tabSample}: ${title}`}>
            {(['dark', 'light'] as const).map((theme) => (
                <span key={theme} className={`ak-tab ${theme}`} aria-hidden="true">
                    {src && <img src={src} alt="" width={16} height={16} />}
                    <span>{title}</span>
                </span>
            ))}
        </div>
    );
}
