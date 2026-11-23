// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The admin, built from a schema, a skin and the project's ports (ADR-0011; `^admin-kit-screen`). It holds the casca
 * (the side menu, the top bar with the language, «Tudo salvo» or «Alterações sem salvar», Salvar and Dia/Noite, the
 * publication card at the top of the content) and the states the critique asked for (P1-8): a read that failed is «Não carregou», never an empty
 * content; a save that failed is «Não salvou»; the conflict and the expired session have their own notice.
 *
 * Moving between sections does not leave the page, so nothing unsaved is lost. The address is the project's router's (F332):
 * the panel asks it where it is and where to go through `ports.navigation`, and hears from it when the back button moved it;
 * the kit never writes the browser's history nor the hash.
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { listByKey, sectionByPath, type KitSchema, type KitSection } from '../schema';
import { fill, type KitFailure, type KitLocation, type KitNavigation, type KitPorts, type KitPublication, type KitTexts } from '../ports';
import { changedKeys, itemsOf, textOf, type KitValues } from '../values';
import { hasRequired, placeOf, validate, type KitProblem } from '../validate';
import { MissingNotice, RequiredLegend, focusField, type MissingItem } from './Required';
import { Notice } from './bits';
import { KitContext, fieldAnchor, type KitExtension } from './context';
import { nameOf } from '../values';
import { saveValues, type KitSaveOutcome } from '../save';
import { markAfterSave, readAnswer, type SaveMark } from '../publication';
import { SectionView } from './SectionView';
import { land } from './land';
import { SiteMap } from './SiteMap';
import { safeHref as safeUrl } from '@mjrp/admin-kit-core';

export interface KitAppProps {
    schema: KitSchema;
    ports: KitPorts;
    brand: { name: string; small: string };
    /** The menu's group title and the links at its foot (the site, the other panel, sign out). */
    group: string;
    foot?: ReactNode;
    /** The overview's title and the line above its rows (the company's name, in this project). */
    overview: { title: string; subtitle: string; lead?: (values: KitValues) => ReactNode };
    extensions?: Record<string, KitExtension>;
    /** The skin's tone: night or day, remembered by the project. */
    tone: 'night' | 'day';
    onTone: (tone: 'night' | 'day') => void;
}

type Load = { state: 'loading' } | { state: 'failed'; message?: string } | { state: 'ready' };
type Save = { state: 'idle' } | { state: 'saving' } | { state: 'failed'; failure: KitFailure; message?: string } | { state: 'invalid' };

type Go = (path: string, itemId?: string, block?: string) => void;

/** Where the panel is: the router says, at the start and whenever the place changes outside the panel (the back button). */
function usePlace(navigation: KitNavigation) {
    const [where, setWhere] = useState<KitLocation>(() => navigation.where());
    useEffect(() => navigation.listen(() => setWhere(navigation.where())), [navigation]);
    const [menu, setMenu] = useState(false);
    const go: Go = useCallback((path, itemId, block) => {
        const target: KitLocation = { path, ...(itemId ? { itemId } : {}), ...(block ? { block } : {}) };
        navigation.go(target);
        setWhere(target);
        setMenu(false);
        requestAnimationFrame(() => { if (!land(block)) scrollTo(0, 0); });
    }, [navigation]);
    return { where, go, menu, setMenu };
}

/**
 * The save that is waiting to be published: the card shows from the save on (UAT-344) and leaves as `readAnswer` says (UAT-347,
 * UAT-349). `lastBuild` is the last answer that said something about the deploys; a failed query does not replace it.
 */
function usePublication(ports: KitPorts) {
    const [publication, setPublication] = useState<KitPublication>({ state: 'idle' });
    const afterSave = useRef<SaveMark | null>(null);
    const lastBuild = useRef<KitPublication | null>(null);
    const shown = useRef<KitPublication['state']>('idle');
    const askNow = useRef<() => void>(() => {});
    useEffect(() => {
        if (!ports.publication) return;
        let alive = true;
        const ask = async () => {
            const asked = Date.now();
            const now = await ports.publication!();
            if (!alive) return;
            if (now.state !== 'unknown') lastBuild.current = now;
            const step = readAnswer(now, asked, afterSave.current, shown.current, Date.now());
            afterSave.current = step.mark;
            if (step.card) {
                shown.current = step.card.state;
                setPublication(step.card);
            }
            if (step.askAgain) void ask();
        };
        askNow.current = () => { void ask(); };
        void ask();
        const timer = setInterval(ask, 20_000);
        return () => { alive = false; clearInterval(timer); askNow.current = () => {}; };
    }, [ports]);
    /** A save was done. A host with no build to follow (the last answer said so) gets no card: nothing will publish (UAT-347). */
    const onSaved = () => {
        const nothingToFollow = lastBuild.current?.state === 'idle' && lastBuild.current.none;
        if (!ports.publication || !ports.publishingAfterSave || nothingToFollow) return;
        afterSave.current = markAfterSave(lastBuild.current, Date.now());
        shown.current = 'publishing';
        setPublication({ state: 'publishing', message: ports.publishingAfterSave });
        askNow.current();
    };
    return { publication, onSaved };
}

/** What a save that did not go through leaves on the screen. */
const saveOf = (outcome: Extract<KitSaveOutcome, { ok: false }>): Save => (outcome.reason === 'invalid' ? { state: 'invalid' } : { state: 'failed', failure: outcome.failure, message: outcome.message });

/** The content: read at the start, changed on the screen, saved on the version read. */
function useContent(schema: KitSchema, ports: KitPorts, onSaved: () => void) {
    const [load, setLoad] = useState<Load>({ state: 'loading' });
    const [saved, setSaved] = useState<KitValues>({});
    const [values, setValues] = useState<KitValues>({});
    const [version, setVersion] = useState('');
    const [save, setSave] = useState<Save>({ state: 'idle' });
    /** What the store holds now, read or just saved. */
    const stored = useCallback((clean: KitValues, read: string) => {
        setSaved(clean);
        setValues(clean);
        setVersion(read);
        setSave({ state: 'idle' });
    }, []);
    const apply = useCallback((result: Awaited<ReturnType<KitPorts['load']>>) => {
        if (!result.ok) {
            setLoad({ state: 'failed', message: result.message });
            return;
        }
        stored(result.value.values, result.value.version);
        setLoad({ state: 'ready' });
    }, [stored]);
    const read = useCallback(() => {
        setLoad({ state: 'loading' });
        void ports.load().then(apply);
    }, [ports, apply]);
    useEffect(() => {
        let alive = true;
        void ports.load().then((result) => { if (alive) apply(result); });
        return () => { alive = false; };
    }, [ports, apply]);
    // A gravação do botão e a de uma peça do projeto são a mesma: confere a regra, grava com a versão lida (F87, REQ-04).
    const persist = async (next: KitValues): Promise<boolean> => {
        setSave({ state: 'saving' });
        const outcome = await saveValues(schema, ports, next, version);
        if (!outcome.ok) {
            setSave(saveOf(outcome));
            return false;
        }
        stored(outcome.clean, outcome.version);
        onSaved();
        return true;
    };
    const change = (next: KitValues) => {
        setValues(next);
        if (save.state === 'failed') setSave({ state: 'idle' });
    };
    return { load, saved, values, save, read, persist, change };
}

/** Leaving the page with something unsaved asks first. */
function useUnsavedWarning(changes: number) {
    useEffect(() => {
        if (!changes) return;
        const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
        addEventListener('beforeunload', warn);
        return () => removeEventListener('beforeunload', warn);
    }, [changes]);
}

/**
 * A place that points to a block, opened from a saved link or a reload, or changed by the router, lands on it once the
 * blocks are drawn (UAT-197).
 */
function useLanding(ready: boolean, where: KitLocation) {
    useEffect(() => {
        if (!ready) return;
        const frame = requestAnimationFrame(() => land(where.block));
        return () => cancelAnimationFrame(frame);
    }, [ready, where.path, where.block]);
}

/** The sections as the content has them (F158): the menu follows the saved content, and the section on screen the content being edited. */
function useSections(schema: KitSchema, saved: KitValues, values: KitValues) {
    const menuSections = useMemo(() => (schema.arrange ? schema.arrange(saved) : schema.sections), [schema, saved]);
    const pageSections = useMemo(() => (schema.arrange ? schema.arrange(values) : schema.sections), [schema, values]);
    // Everything below reads the schema as the content has it, so a list of places names the sections as the menu does.
    const liveSchema = useMemo(() => (schema.arrange ? { ...schema, sections: pageSections } : schema), [schema, pageSections]);
    return { menuSections, pageSections, liveSchema };
}

/** The section the place points to, as the content has it now; none on the overview. */
function sectionAt(schema: KitSchema, pageSections: KitSection[], path: string): KitSection | undefined {
    if (!path) return undefined;
    return pageSections.find((candidate) => candidate.path === path) ?? sectionByPath(schema, path);
}

/** A section that shows one item takes the item's name as its title: the name in the language on screen, or in the main one. */
function scopedTitleOf(schema: KitSchema, section: KitSection | undefined, values: KitValues, itemId: string | undefined, language: string): string {
    if (!section?.scope) return '';
    const scoped = itemsOf(values, section.scope.list).find((item) => item.id === itemId);
    const list = listByKey(schema, section.scope.list);
    if (!scoped || !list) return '';
    return textOf(scoped, list.titleField, language) || textOf(scoped, list.titleField, schema.languages[0]);
}

/** The title of the screen and the line under it: the overview's, the section's, or the item's name with the section's below. */
function headingOf(section: KitSection | undefined, scopedTitle: string, values: KitValues, overview: KitAppProps['overview']): { title: string; subtitle?: string } {
    if (!section) return { title: overview.title, subtitle: overview.subtitle };
    if (scopedTitle) return { title: scopedTitle, subtitle: section.title };
    return { title: section.title, subtitle: section.subtitleOf ? section.subtitleOf(values) : section.subtitle };
}

/** The anchor of the field a problem is about; a field pinned to one language carries it. */
const anchorOf = (schema: KitSchema, problem: KitProblem) => fieldAnchor(problem.path, placeOf(schema, problem.path)?.pinned ? problem.language : undefined);

/** The required ones left empty (F125, the kit v1 piece), once each: what the notice lists, one button per field. */
function missingOf(schema: KitSchema, required: KitProblem[]): MissingItem[] {
    const items: MissingItem[] = [];
    for (const problem of required) {
        const item: MissingItem = {
            id: anchorOf(schema, problem),
            label: placeOf(schema, problem.path)?.label ?? problem.path.join('.'),
            ...(problem.language ? { lang: problem.language } : {}),
        };
        if (!items.some((known) => known.id === item.id && known.lang === item.lang)) items.push(item);
    }
    return items;
}

/** «Tudo salvo», «Salvando», «Alterações sem salvar» or, after a refusal, «Não salvou». */
function statusOf(t: KitTexts, refused: boolean, saving: boolean, changes: number): { text: string; className: string } {
    if (refused && t.required) return { text: t.required.notSaved, className: 'ak-savest err' };
    const className = changes ? 'ak-savest dirty' : 'ak-savest';
    if (saving) return { text: t.saving, className };
    if (!changes) return { text: t.saved, className };
    return { text: changes === 1 ? t.unsavedOne : fill(t.unsaved, { count: changes }), className };
}

export function KitApp(props: KitAppProps) {
    const { schema, ports } = props;
    const { where, go, menu, setMenu } = usePlace(ports.navigation);
    const [language, setLanguage] = useState(schema.languages[0]);
    const { publication, onSaved } = usePublication(ports);
    const { load, saved, values, save, read, persist, change } = useContent(schema, ports, onSaved);
    const changes = useMemo(() => changedKeys(saved, values).length, [saved, values]);
    const problems = useMemo(() => (save.state === 'invalid' ? validate(schema, values) : []), [save.state, schema, values]);
    useUnsavedWarning(changes);
    const ready = load.state === 'ready';
    useLanding(ready, where);
    const onSave = () => { void persist(values); };
    const { menuSections, pageSections, liveSchema } = useSections(schema, saved, values);
    const section = sectionAt(schema, pageSections, where.path);
    const heading = headingOf(section, scopedTitleOf(schema, section, values, where.itemId, language), values, props.overview);
    // The required ones left empty (F125): the notice with one button per field, «Não salvou», and the count on the language
    // that misses them. The other problems keep the summary of before.
    const refused = save.state === 'invalid' && problems.length > 0;
    const requiredProblems = problems.filter((problem) => problem.code === 'required');
    const goToMissing = (item: MissingItem) => {
        const problem = requiredProblems.find((candidate) => anchorOf(schema, candidate) === item.id);
        const place = problem ? placeOf(schema, problem.path) : null;
        if (item.lang) setLanguage(item.lang);
        if (place) go(place.section, place.itemId, item.id);
        // The item of a list opens after the next draw; then the cursor goes into the field.
        requestAnimationFrame(() => requestAnimationFrame(() => focusField(item.id)));
    };

    return (
        <KitContext.Provider value={{ schema: liveSchema, ports, language, extensions: props.extensions ?? {}, problems, go, saved, all: values, dirty: changes > 0, save: persist }}>
            <div className="ak" data-menu={menu ? 'open' : undefined}>
                <SideMenu brand={props.brand} group={props.group} overview={props.overview.title} foot={props.foot} sections={menuSections} where={where} section={section} ports={ports} go={go} />
                <div className="ak-main">
                    <header className="ak-top">
                        <button type="button" className="ak-btn ak-menu-btn" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰ {ports.texts.menu}</button>
                        <h1>{heading.title}{heading.subtitle && <small>{heading.subtitle}</small>}</h1>
                        <LanguageKeys languages={schema.languages} language={language} missing={refused ? requiredProblems : []} onPick={setLanguage} />
                        <SaveKeys t={ports.texts} refused={refused} saving={save.state === 'saving'} changes={changes} ready={ready} onSave={onSave} tone={props.tone} onTone={props.onTone} />
                    </header>
                    <main className="ak-pad">
                        <PublicationCard publication={publication} />
                        {load.state === 'failed' && <LoadFailure message={load.message} t={ports.texts} onRetry={read} />}
                        {save.state === 'failed' && <SaveFailure failure={save.failure} message={save.message} ports={ports} onRetry={onSave} onReload={read} />}
                        <LegendOf ready={ready} section={section} t={ports.texts} />
                        {refused && <Refusal t={ports.texts} problems={problems} missing={missingOf(schema, requiredProblems)} onGo={goToMissing} />}
                        {ready && <Screen section={section} values={values} onChange={change} itemId={where.itemId} overview={props.overview} sections={menuSections} />}
                    </main>
                </div>
            </div>
        </KitContext.Provider>
    );
}

/** The side menu: the brand, the overview, each section with its blocks under it when the project says so, and the foot. */
function SideMenu({ brand, group, overview, foot, sections, where, section, ports, go }: {
    brand: KitAppProps['brand']; group: string; overview: string; foot?: ReactNode; sections: KitSection[]; where: KitLocation; section: KitSection | undefined; ports: KitPorts; go: Go;
}) {
    return (
        <aside className="ak-side" aria-label={group}>
            <span className="ak-logo"><b>{brand.name}</b><small>{brand.small}</small></span>
            <p className="ak-group">{group}</p>
            <nav className="ak-nav">
                <a href={safeUrl(ports.hrefOf('')) ?? '#'} aria-current={!where.path ? 'page' : undefined} onClick={(event) => { event.preventDefault(); go(''); }}>{overview}</a>
                {sections.filter((item) => !item.hidden).map((item) => <MenuEntry key={item.id} item={item} where={where} section={section} ports={ports} go={go} />)}
            </nav>
            {foot && <div className="ak-side-end">{foot}</div>}
        </aside>
    );
}

/** Whether the section on screen shows one item of a list this menu entry holds: the entry stays marked. */
const holdsListOf = (item: KitSection, section: KitSection | undefined): boolean => !!section?.scope && item.blocks.some((block) => block.elements.some((element) => element.kind === 'list' && element.key === section.scope!.list));

function MenuEntry({ item, where, section, ports, go }: { item: KitSection; where: KitLocation; section: KitSection | undefined; ports: KitPorts; go: Go }) {
    const here = where.path === item.path || holdsListOf(item, section);
    const parts = item.subnav && where.path === item.path ? item.blocks.filter((block) => item.subnav!.includes(block.id)) : [];
    // The block the place points to (`blk-<id>`): the submenu marks it.
    const anchor = where.block ?? '';
    return (
        <Fragment>
            <a href={safeUrl(ports.hrefOf(item.path)) ?? '#'} aria-current={here ? 'page' : undefined}
                onClick={(event) => { event.preventDefault(); go(item.path); }}>{item.menuTitle ?? item.title}</a>
            {parts.length > 0 && (
                <div className="ak-subnav" role="group" aria-label={item.title}>
                    {parts.map((block) => (
                        <a key={block.id} href={safeUrl(`${ports.hrefOf(item.path)}#${nameOf('blk', block.id)}`) ?? '#'} aria-current={anchor === nameOf('blk', block.id) ? 'location' : undefined}
                            onClick={(event) => { event.preventDefault(); go(item.path, undefined, nameOf('blk', block.id)); }}>{block.title}</a>
                    ))}
                </div>
            )}
        </Fragment>
    );
}

/** The language of the screen; after a refused save, each language carries the count of the required ones it misses. */
function LanguageKeys({ languages, language, missing, onPick }: { languages: readonly string[]; language: string; missing: KitProblem[]; onPick: (code: string) => void }) {
    if (languages.length <= 1) return null;
    const missingIn = (code: string) => missing.filter((problem) => problem.language === code).length;
    return (
        <span className="ak-seg" role="group">
            {languages.map((code) => (
                <button key={code} type="button" className="rq-lang" aria-pressed={language === code} aria-label={code.toUpperCase()} data-miss={missingIn(code) || undefined}
                    onClick={() => onPick(code)}>{code.toUpperCase()}</button>
            ))}
        </span>
    );
}

/** «Tudo salvo» or «Alterações sem salvar», Salvar and Dia/Noite. */
function SaveKeys({ t, refused, saving, changes, ready, onSave, tone, onTone }: {
    t: KitTexts; refused: boolean; saving: boolean; changes: number; ready: boolean; onSave: () => void; tone: KitAppProps['tone']; onTone: KitAppProps['onTone'];
}) {
    const status = statusOf(t, refused, saving, changes);
    return (
        <>
            <span className={status.className} aria-live="polite">{status.text}</span>
            <button type="button" className="ak-btn pri" disabled={!changes || saving || !ready} onClick={onSave}>{t.save}</button>
            <button type="button" className="ak-btn" onClick={() => onTone(tone === 'night' ? 'day' : 'night')}>{tone === 'night' ? t.day : t.night}</button>
        </>
    );
}

/** The publication: a card at the top of the content, below the header (the CMS v33; UAT-347), not a band above it. */
function PublicationCard({ publication }: { publication: KitPublication }) {
    if (publication.state === 'idle') return null;
    return <div className={{ failed: 'ak-notice err', unknown: 'ak-notice warn', publishing: 'ak-notice' }[publication.state]} role="status">{publication.message}</div>;
}

/** A read that failed is «Não carregou», never an empty content. */
function LoadFailure({ message, t, onRetry }: { message?: string; t: KitTexts; onRetry: () => void }) {
    return <Notice tone="err" action={<button type="button" className="ak-btn" onClick={onRetry}>{t.retry}</button>}>{message ? `${t.loadFailed} ${message}` : t.loadFailed}</Notice>;
}

/** The legend of the * on a screen with a required field (F125). */
function LegendOf({ ready, section, t }: { ready: boolean; section: KitSection | undefined; t: KitTexts }) {
    if (!ready || !section || !t.required || !hasRequired(section.blocks)) return null;
    return <RequiredLegend t={t.required} />;
}

/** A save refused by the rule: the notice of the required ones left empty, and the summary of the other problems. */
function Refusal({ t, problems, missing, onGo }: { t: KitTexts; problems: KitProblem[]; missing: MissingItem[]; onGo: (item: MissingItem) => void }) {
    // Without the words of the required piece, every problem goes into the summary, as before it.
    const summed = t.required ? problems.filter((problem) => problem.code !== 'required') : problems;
    return (
        <>
            {t.required && <MissingNotice items={missing} t={t.required} onGo={onGo} />}
            {(summed.length > 0 || !t.required) && <Notice tone="err">{fill(t.problems.summary ?? '{count}', { count: summed.length })}</Notice>}
        </>
    );
}

function SaveFailure({ failure, message, ports, onRetry, onReload }: { failure: KitFailure; message?: string; ports: KitPorts; onRetry: () => void; onReload: () => void }) {
    const t = ports.texts;
    if (failure === 'conflict') return <Notice tone="warn" action={<button type="button" className="ak-btn" onClick={onReload}>{t.reload}</button>}>{t.conflict}</Notice>;
    if (failure === 'session-expired') return <Notice tone="warn" action={<a className="ak-btn" href={safeUrl(ports.signInHref) ?? '#'}>{t.signIn}</a>}>{t.sessionExpired}</Notice>;
    if (failure === 'refused') return <Notice tone="err">{message ?? t.refused}</Notice>;
    return <Notice tone="err" action={<button type="button" className="ak-btn" onClick={onRetry}>{t.retry}</button>}>{message ? `${t.saveFailed} ${message}` : t.saveFailed}</Notice>;
}

/** The content, once read: the section the place points to, or the map of the site. */
function Screen({ section, values, onChange, itemId, overview, sections }: {
    section: KitSection | undefined; values: KitValues; onChange: (next: KitValues) => void; itemId?: string; overview: KitAppProps['overview']; sections: KitSection[];
}) {
    if (section) return <SectionView section={section} values={values} onChange={onChange} itemId={itemId} />;
    return <SiteMap values={values} lead={overview.lead?.(values)} sections={sections} />;
}
