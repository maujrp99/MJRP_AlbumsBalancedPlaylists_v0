// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * A section of the site, as numbered blocks (`^pro-admin-deck-field`); a section that shows one item of a list (the case)
 * carries the bar of its steps at the top, held while scrolling, each step leading to its block
 * (`^pro-admin-case-sequence`).
 */
import { useEffect, useState } from 'react';
import { elementsOf, type KitBlock, type KitSchema, type KitSection, type KitStep } from '../schema';
import { itemsOf, withItem, type KitItem, type KitValues } from '../values';
import { Notice } from './bits';
import { useKit } from './context';
import { nameOf } from '../values';
import { ElementView } from './ElementView';
import { DndScope } from './dnd-scope';
import { READING_LINE, WithSectionIndex, type SectionIndexEntry } from './SectionIndex';
import { safeHref as safeUrl } from '@mjrp/admin-kit-core';

function BlockCard({ block, values, onChange, at }: { block: KitBlock; values: KitValues; onChange: (next: KitValues) => void; at: string[] }) {
    return (
        <section className="ak-blk" id={nameOf('blk', block.id)} aria-labelledby={block.title ? nameOf('blk', block.id, 't') : undefined}>
            {(block.number || block.title) && (
                <header className="ak-blk-h">
                    {block.number && <span className="ak-num">{block.number}</span>}
                    <span>
                        <b id={nameOf('blk', block.id, 't')}>{block.title}</b>
                        {block.subtitle && <p>{block.subtitle}</p>}
                    </span>
                </header>
            )}
            <div className="ak-fields">
                {block.elements.map((element) => <ElementView key={element.id} element={element} values={values} onChange={onChange} at={at} />)}
            </div>
        </section>
    );
}

function StepsBar({ steps, title, path, itemId }: { steps: KitStep[]; title?: string; path: string; itemId: string }) {
    const { ports, go } = useKit();
    const [current, setCurrent] = useState<string | undefined>(steps[0]?.block);
    useEffect(() => {
        // The step being read is the last one whose block has reached the reading line; at the end of the page, the last.
        const measure = () => {
            const reached = steps.filter((step) => {
                const block = document.getElementById(nameOf('blk', step.block));
                return block && block.getBoundingClientRect().top <= READING_LINE;
            });
            const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
            setCurrent((atEnd ? steps.at(-1) : reached.at(-1) ?? steps[0])?.block);
        };
        measure();
        addEventListener('scroll', measure, { passive: true });
        addEventListener('resize', measure);
        return () => { removeEventListener('scroll', measure); removeEventListener('resize', measure); };
    }, [steps]);
    return (
        <nav className="ak-steps" aria-label={ports.texts.sequence}>
            {title && <span className="ak-steps-t">{title}</span>}
            {steps.map((step) => (
                <a key={`${step.n}-${step.block}`} href={safeUrl(`#${nameOf('blk', step.block)}`) ?? '#'} aria-current={current === step.block ? 'step' : undefined}
                    onClick={(event) => { event.preventDefault(); go(path, itemId, nameOf('blk', step.block)); }}>
                    <span>{step.n}</span>{step.label}{step.effect && <small>{step.effect}</small>}
                </a>
            ))}
        </nav>
    );
}

/** The sections the index of a screen lists: the blocks that have a name, each leading to its card. */
const entriesOf = (blocks: KitBlock[]): SectionIndexEntry[] => blocks.filter((block) => block.title && block.inIndex !== false).map((block) => ({ id: nameOf('blk', block.id), title: block.title! }));

/** The steps of the model the item chose, and the bar's title, when the section's steps follow a model. */
function stepsOf(section: KitSection, item: KitItem): { steps?: KitStep[]; title?: string } {
    const model = section.steps ? item[section.steps.by] : undefined;
    if (!section.steps || typeof model !== 'string') return {};
    return { steps: section.steps.options[model], title: section.steps.titles?.[model] };
}

/** A step's block: the block with the step's number and name, and the step's own words for its lists (UAT-156: «+ Nova tela em camadas» in Elevar). */
const blockOfStep = (block: KitBlock, step: KitStep): KitBlock => ({
    ...block, number: step.n, title: step.label,
    ...(step.addLabel ? { elements: block.elements.map((element) => (element.kind === 'list' ? { ...element, addLabel: step.addLabel! } : element)) } : {}),
});

/**
 * With a model chosen, the blocks follow its steps (`^pro-admin-case-sequence`): the blocks that are no step come
 * first, then each step's block in the step's order, with the step's number and name. A block of another model is out.
 */
function blocksOf(section: KitSection, steps: KitStep[] | undefined): KitBlock[] {
    if (!steps) return section.blocks;
    const stepped = new Set(Object.values(section.steps?.options ?? {}).flat().map((step) => step.block));
    return [
        ...section.blocks.filter((block) => !stepped.has(block.id)),
        ...steps.flatMap((step) => section.blocks.filter((block) => block.id === step.block).map((block) => blockOfStep(block, step))),
    ];
}

/** «←»: back to the section that holds the list, on the list's block. */
function BackButton({ list }: { list: string }) {
    const { schema, ports, go } = useKit();
    const holder = holderOf(schema, list);
    return <p><button type="button" className="ak-btn sm" onClick={() => go(holder?.path ?? '', undefined, nameOf('blk', list))}>← {holder?.title ?? ports.texts.back}</button></p>;
}

export function SectionView({ section, values, onChange, itemId }: { section: KitSection; values: KitValues; onChange: (next: KitValues) => void; itemId?: string }) {
    const { ports } = useKit();
    const index = { heading: ports.texts.sectionIndex, label: ports.texts.sectionIndexLabel };
    if (!section.scope) {
        return (
            <WithSectionIndex entries={entriesOf(section.blocks)} {...index}>
                {section.blocks.map((block) => <BlockCard key={block.id} block={block} values={values} onChange={onChange} at={[]} />)}
            </WithSectionIndex>
        );
    }
    const list = section.scope.list;
    const item = itemsOf(values, list).find((candidate) => candidate.id === itemId);
    if (!item) {
        return <p className="ak-empty">{ports.texts.empty}</p>;
    }
    const change = (next: KitValues) => onChange(withItem(values, list, item.id, () => next as KitItem));
    const { steps, title: stepsTitle } = stepsOf(section, item);
    const shown = blocksOf(section, steps);
    return (
        <>
            <BackButton list={list} />
            {item.fresh && section.scope.freshNotice && <Notice tone="ok">{section.scope.freshNotice}</Notice>}
            {steps && <StepsBar steps={steps} title={stepsTitle} path={section.path} itemId={item.id} />}
            <DndScope values={item} onChange={change}>
                {/* With the bar of steps the page already has its index: the bar leads to each block (`^pro-admin-case-sequence`). */}
                <WithSectionIndex entries={steps ? [] : entriesOf(shown)} {...index}>
                    {shown.map((block) => <BlockCard key={block.id} block={block} values={item} onChange={change} at={[list, item.id]} />)}
                </WithSectionIndex>
            </DndScope>
        </>
    );
}

/** The section that holds the list a scoped section shows: where «←» goes, and its name on the button. */
function holderOf(schema: KitSchema, list: string): KitSection | undefined {
    return schema.sections.find((section) => !section.scope && elementsOf(section.blocks).some((element) => element.kind === 'list' && element.key === list));
}
