// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
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
import { listByKey, sectionByPath, type KitSchema } from '../schema';
import { fill, type KitFailure, type KitLocation, type KitPorts, type KitPublication } from '../ports';
import { changedKeys, itemsOf, textOf, type KitValues } from '../values';
import { hasRequired, placeOf, validate } from '../validate';
import { MissingNotice, RequiredLegend, focusField, type MissingItem } from './Required';
import { Notice } from './bits';
import { KitContext, fieldAnchor, type KitExtension } from './context';
import { saveValues } from '../save';
import { markAfterSave, readAnswer, type SaveMark } from '../publication';
import { SectionView } from './SectionView';
import { land } from './land';
import { SiteMap } from './SiteMap';

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

export function KitApp(props: KitAppProps) {
    const { schema, ports } = props;
    const navigation = ports.navigation;
    // Where the panel is: the router says, at the start and whenever the place changes outside the panel (the back button).
    const [where, setWhere] = useState<KitLocation>(() => navigation.where());
    useEffect(() => navigation.listen(() => setWhere(navigation.where())), [navigation]);
    const [language, setLanguage] = useState(schema.languages[0]);
    const [load, setLoad] = useState<Load>({ state: 'loading' });
    const [saved, setSaved] = useState<KitValues>({});
    const [values, setValues] = useState<KitValues>({});
    const [version, setVersion] = useState('');
    const [save, setSave] = useState<Save>({ state: 'idle' });
    const [publication, setPublication] = useState<KitPublication>({ state: 'idle' });
    const [menu, setMenu] = useState(false);
    // The block the place points to (`blk-<id>`): the submenu marks it.
    const anchor = where.block ?? '';

    const apply = useCallback((result: Awaited<ReturnType<KitPorts['load']>>) => {
        if (!result.ok) {
            setLoad({ state: 'failed', message: result.message });
            return;
        }
        setSaved(result.value.values);
        setValues(result.value.values);
        setVersion(result.value.version);
        setSave({ state: 'idle' });
        setLoad({ state: 'ready' });
    }, []);
    const read = useCallback(() => {
        setLoad({ state: 'loading' });
        void ports.load().then(apply);
    }, [ports, apply]);
    useEffect(() => {
        let alive = true;
        void ports.load().then((result) => { if (alive) apply(result); });
        return () => { alive = false; };
    }, [ports, apply]);

    // The save that is waiting to be published: the card shows from the save on (UAT-344) and leaves as `readAnswer` says (UAT-347,
    // UAT-349). `lastBuild` is the last answer that said something about the deploys; a failed query does not replace it.
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

    const changes = useMemo(() => changedKeys(saved, values).length, [saved, values]);
    const problems = useMemo(() => (save.state === 'invalid' ? validate(schema, values) : []), [save.state, schema, values]);

    useEffect(() => {
        if (!changes) return;
        const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
        addEventListener('beforeunload', warn);
        return () => removeEventListener('beforeunload', warn);
    }, [changes]);

    const go = useCallback((path: string, itemId?: string, block?: string) => {
        const target: KitLocation = { path, ...(itemId ? { itemId } : {}), ...(block ? { block } : {}) };
        navigation.go(target);
        setWhere(target);
        setMenu(false);
        requestAnimationFrame(() => { if (!land(block)) scrollTo(0, 0); });
    }, [navigation]);

    // A place that points to a block, opened from a saved link or a reload, or changed by the router, lands on it once the
    // blocks are drawn (UAT-197).
    const ready = load.state === 'ready';
    useEffect(() => {
        if (!ready) return;
        const frame = requestAnimationFrame(() => land(where.block));
        return () => cancelAnimationFrame(frame);
    }, [ready, where.path, where.block]);

    // A gravação do botão e a de uma peça do projeto são a mesma: confere a regra, grava com a versão lida (F87, REQ-04).
    const persist = async (next: KitValues): Promise<boolean> => {
        setSave({ state: 'saving' });
        const outcome = await saveValues(schema, ports, next, version);
        if (!outcome.ok) {
            setSave(outcome.reason === 'invalid' ? { state: 'invalid' } : { state: 'failed', failure: outcome.failure, message: outcome.message });
            return false;
        }
        setSaved(outcome.clean);
        setValues(outcome.clean);
        setVersion(outcome.version);
        setSave({ state: 'idle' });
        // A host with no build to follow (the last answer said so) gets no card: nothing will publish (UAT-347).
        if (ports.publication && ports.publishingAfterSave && !(lastBuild.current?.state === 'idle' && lastBuild.current.none)) {
            afterSave.current = markAfterSave(lastBuild.current, Date.now());
            shown.current = 'publishing';
            setPublication({ state: 'publishing', message: ports.publishingAfterSave });
            askNow.current();
        }
        return true;
    };
    const onSave = async () => { await persist(values); };

    const change = (next: KitValues) => {
        setValues(next);
        if (save.state === 'failed') setSave({ state: 'idle' });
    };

    // The sections as the content has them (F158): the menu follows the saved content, and the section on screen the content being edited.
    const menuSections = useMemo(() => (schema.arrange ? schema.arrange(saved) : schema.sections), [schema, saved]);
    const pageSections = useMemo(() => (schema.arrange ? schema.arrange(values) : schema.sections), [schema, values]);
    // Everything below reads the schema as the content has it, so a list of places names the sections as the menu does.
    const liveSchema = useMemo(() => (schema.arrange ? { ...schema, sections: pageSections } : schema), [schema, pageSections]);
    const section = where.path ? pageSections.find((candidate) => candidate.path === where.path) ?? sectionByPath(schema, where.path) : undefined;
    // A section that shows one item takes the item's name as its title, and its own name below.
    const scoped = section?.scope ? itemsOf(values, section.scope.list).find((item) => item.id === where.itemId) : undefined;
    const scopedList = section?.scope ? listByKey(schema, section.scope.list) : undefined;
    const scopedTitle = scoped && scopedList ? textOf(scoped, scopedList.titleField, language) || textOf(scoped, scopedList.titleField, schema.languages[0]) : '';
    const title = scopedTitle || (section ? section.title : props.overview.title);
    const subtitle = scopedTitle ? section!.title : section ? (section.subtitleOf ? section.subtitleOf(values) : section.subtitle) : props.overview.subtitle;
    const t = ports.texts;
    // The required ones left empty (F125, the kit v1 piece): the notice with one button per field, «Não salvou», and the count on
    // the language that misses them. The other problems keep the summary of before.
    const refused = save.state === 'invalid' && problems.length > 0;
    const requiredProblems = problems.filter((problem) => problem.code === 'required');
    const otherProblems = problems.filter((problem) => problem.code !== 'required');
    const missingItems: MissingItem[] = [];
    for (const problem of requiredProblems) {
        const place = placeOf(schema, problem.path);
        const item: MissingItem = {
            id: fieldAnchor(problem.path, place?.pinned ? problem.language : undefined),
            label: place?.label ?? problem.path.join('.'),
            ...(problem.language ? { lang: problem.language } : {}),
        };
        if (!missingItems.some((known) => known.id === item.id && known.lang === item.lang)) missingItems.push(item);
    }
    const missingIn = (code: string) => requiredProblems.filter((problem) => problem.language === code).length;
    const goToMissing = (item: MissingItem) => {
        const problem = requiredProblems.find((candidate) => fieldAnchor(candidate.path, placeOf(schema, candidate.path)?.pinned ? candidate.language : undefined) === item.id);
        const place = problem ? placeOf(schema, problem.path) : null;
        if (item.lang) setLanguage(item.lang);
        if (place) go(place.section, place.itemId, item.id);
        // The item of a list opens after the next draw; then the cursor goes into the field.
        requestAnimationFrame(() => requestAnimationFrame(() => focusField(item.id)));
    };
    const status = refused && t.required ? t.required.notSaved : save.state === 'saving' ? t.saving : changes ? (changes === 1 ? t.unsavedOne : fill(t.unsaved, { count: changes })) : t.saved;
    const statusClass = refused && t.required ? 'ak-savest err' : changes ? 'ak-savest dirty' : 'ak-savest';

    return (
        <KitContext.Provider value={{ schema: liveSchema, ports, language, extensions: props.extensions ?? {}, problems, go, saved, all: values, dirty: changes > 0, save: persist }}>
            <div className="ak" data-menu={menu ? 'open' : undefined}>
                <aside className="ak-side" aria-label={props.group}>
                    <span className="ak-logo"><b>{props.brand.name}</b><small>{props.brand.small}</small></span>
                    <p className="ak-group">{props.group}</p>
                    <nav className="ak-nav">
                        <a href={ports.hrefOf('')} aria-current={!where.path ? 'page' : undefined} onClick={(event) => { event.preventDefault(); go(''); }}>{props.overview.title}</a>
                        {menuSections.filter((item) => !item.hidden).map((item) => {
                            const here = where.path === item.path || (section?.scope && item.blocks.some((block) => block.elements.some((element) => element.kind === 'list' && element.key === section.scope!.list)));
                            const parts = item.subnav && where.path === item.path ? item.blocks.filter((block) => item.subnav!.includes(block.id)) : [];
                            return (
                                <Fragment key={item.id}>
                                    <a href={ports.hrefOf(item.path)} aria-current={here ? 'page' : undefined}
                                        onClick={(event) => { event.preventDefault(); go(item.path); }}>{item.menuTitle ?? item.title}</a>
                                    {parts.length > 0 && (
                                        <div className="ak-subnav" role="group" aria-label={item.title}>
                                            {parts.map((block) => (
                                                <a key={block.id} href={`${ports.hrefOf(item.path)}#blk-${block.id}`} aria-current={anchor === `blk-${block.id}` ? 'location' : undefined}
                                                    onClick={(event) => { event.preventDefault(); go(item.path, undefined, `blk-${block.id}`); }}>{block.title}</a>
                                            ))}
                                        </div>
                                    )}
                                </Fragment>
                            );
                        })}
                    </nav>
                    {props.foot && <div className="ak-side-end">{props.foot}</div>}
                </aside>
                <div className="ak-main">
                    <header className="ak-top">
                        <button type="button" className="ak-btn ak-menu-btn" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰ {t.menu}</button>
                        <h1>{title}{subtitle && <small>{subtitle}</small>}</h1>
                        {schema.languages.length > 1 && (
                            <span className="ak-seg" role="group">
                                {schema.languages.map((code) => (
                                    <button key={code} type="button" className="rq-lang" aria-pressed={language === code} aria-label={code.toUpperCase()} data-miss={refused && missingIn(code) ? missingIn(code) : undefined}
                                        onClick={() => setLanguage(code)}>{code.toUpperCase()}</button>
                                ))}
                            </span>
                        )}
                        <span className={statusClass} aria-live="polite">{status}</span>
                        <button type="button" className="ak-btn pri" disabled={!changes || save.state === 'saving' || load.state !== 'ready'} onClick={() => void onSave()}>{t.save}</button>
                        <button type="button" className="ak-btn" onClick={() => props.onTone(props.tone === 'night' ? 'day' : 'night')}>{props.tone === 'night' ? t.day : t.night}</button>
                    </header>
                    <main className="ak-pad">
                        {/* The publication: a card at the top of the content, below the header (the CMS v33; UAT-347), not a band above it. */}
                        {publication.state !== 'idle' && <div className={{ failed: 'ak-notice err', unknown: 'ak-notice warn', publishing: 'ak-notice' }[publication.state]} role="status">{publication.message}</div>}
                        {load.state === 'failed' && <Notice tone="err" action={<button type="button" className="ak-btn" onClick={read}>{t.retry}</button>}>{load.message ? `${t.loadFailed} ${load.message}` : t.loadFailed}</Notice>}
                        {save.state === 'failed' && <SaveFailure failure={save.failure} message={save.message} ports={ports} onRetry={() => void onSave()} onReload={read} />}
                        {/* The legend of the * on a screen with a required field (F125). */}
                        {load.state === 'ready' && section && t.required && hasRequired(section.blocks) && <RequiredLegend t={t.required} />}
                        {refused && t.required && <MissingNotice items={missingItems} t={t.required} onGo={goToMissing} />}
                        {refused && (otherProblems.length > 0 || !t.required) && (
                            <Notice tone="err">{fill(t.problems.summary ?? '{count}', { count: t.required ? otherProblems.length : problems.length })}</Notice>
                        )}
                        {load.state === 'ready' && (section
                            ? <SectionView section={section} values={values} onChange={change} itemId={where.itemId} />
                            : <SiteMap values={values} lead={props.overview.lead?.(values)} sections={menuSections} />)}
                    </main>
                </div>
            </div>
        </KitContext.Provider>
    );
}

function SaveFailure({ failure, message, ports, onRetry, onReload }: { failure: KitFailure; message?: string; ports: KitPorts; onRetry: () => void; onReload: () => void }) {
    const t = ports.texts;
    if (failure === 'conflict') return <Notice tone="warn" action={<button type="button" className="ak-btn" onClick={onReload}>{t.reload}</button>}>{t.conflict}</Notice>;
    if (failure === 'session-expired') return <Notice tone="warn" action={<a className="ak-btn" href={ports.signInHref}>{t.signIn}</a>}>{t.sessionExpired}</Notice>;
    if (failure === 'refused') return <Notice tone="err">{message ?? t.refused}</Notice>;
    return <Notice tone="err" action={<button type="button" className="ak-btn" onClick={onRetry}>{t.retry}</button>}>{message ? `${t.saveFailed} ${message}` : t.saveFailed}</Notice>;
}
