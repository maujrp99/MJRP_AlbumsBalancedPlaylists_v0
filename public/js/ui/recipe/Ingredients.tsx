/**
 * Ingredients - the choices of a blend besides the recipe (F83 wave 7a): the Top #, how the tracks are grouped, how the playlists are
 * structured, the target duration and the ranking source. The same HTML and the same classes as the hand-made panel
 * (components/blend/BlendIngredientsPanel.js, deleted with the hand-made Blend screen in wave 7b); the Blend screen (screens/blend/) and the panel to
 * generate again (screens/playlists/RegeneratePanel.tsx) both use it. The pictures of the two screens (test/fixtures/blendBeforeF83.json, regenerateBeforeF83.json) keep it the same.
 *
 * The labels of the sections and the number of the slider are written as the hand-made template broke them in lines (`broken`, as ONE text node): the browser draws none of that
 * white space, but WebKit shapes the characters it is given, and the test of the playlists screen compares it. (The icon of «Ranking Source», `BarChart2`, is not in the icon table: nothing is drawn, as before, and its
 * label has the space before it too.)
 *
 * It has no store and no service: it is given the recipe and the choices, and gives back the new choices (`onChange`) each time one is made.
 * Which section a recipe shows is models/recipeIngredients.js; the words are the dictionary's (`ui.recipe.*`).
 *
 * What it does as the hand-made panel did:
 *   - a button draws the sections anew (a new `key`), so a button that was pressed is gone and the focus goes back to the page; the slider of
 *     the duration does not (it keeps the focus and its place) and only the number beside it changes;
 *   - the slider is heard by the event `input` on the element itself, because the `onChange` of React does not hear a value written by a script;
 *   - what is chosen for a recipe is not wiped when the recipe changes: the owner keeps the choices, and a section hidden by the new recipe still holds its value.
 *
 * F92 (REQ-10): «Deep cuts» shows a slider of how many of the most popular tracks of each album to skip (3 + X, inside the limits), heard as the
 * duration slider is (the event `input` on the element; it keeps the focus). A recipe made of blocks is not offered the shuffle.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { t } from '../../i18n/t.js'
import { broken } from './broken'
import { OUTPUT_MODES, RANKING_TYPES, SKIP_RANGE, TRACK_COUNTS, groupingsOf, ingredientsOf, showsDuration } from '../../models/recipeIngredients.js'
import type { Choices } from '../../models/recipeIngredients.js'

export type { Choices }

export interface IngredientsProps {
    /** The recipe chosen: what it shows is `ingredientsOf` (a recipe that is not known shows everything but the Top #). */
    recipeId: string | undefined
    choices: Choices
    onChange: (next: Choices) => void
    /** How many times the owner chose a recipe: each one draws the sections anew, as the hand-made panel did. */
    recipeChosen?: number
}

const CHOSEN = 'border-orange-400 bg-orange-400/20 ring-1 ring-orange-400'
const PLAIN = 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
const LABEL = 'block text-sm font-medium mb-3 text-muted'

/** `by_album` is `byAlbum`: the part of a dictionary key that names the option (a key has no underscore). */
const camel = (value: string): string => value.replace(/_(\w)/g, (_, letter: string) => letter.toUpperCase())

export function Ingredients({ recipeId, choices, onChange, recipeChosen = 0 }: IngredientsProps) {
    // a button draws the sections anew; the slider does not
    const [pressed, setPressed] = useState(0)
    const shown = ingredientsOf(recipeId)
    const choose = (change: Partial<Choices>) => { onChange({ ...choices, ...change }); setPressed(count => count + 1) }
    return (
        <div key={`${recipeChosen}.${pressed}`} className="space-y-6">
            {shown.trackCount ? <TopNumber chosen={choices.trackCount} onChoose={(trackCount) => choose({ trackCount })} /> : null}
            {shown.skip ? <Skip choices={choices} onChange={onChange} /> : null}
            {shown.groupingStrategy ? <Grouping options={groupingsOf(recipeId)} chosen={choices.groupingStrategy} onChoose={(groupingStrategy) => choose({ groupingStrategy })} /> : null}
            {shown.outputMode ? <Structure chosen={choices.outputMode} onChoose={(outputMode) => choose({ outputMode })} /> : null}
            {showsDuration(shown, choices.outputMode) ? <Duration choices={choices} onChange={onChange} /> : null}
            {shown.rankingType ? <Source chosen={choices.rankingType} onChoose={(rankingType) => choose({ rankingType })} /> : null}
        </div>
    )
}

function TopNumber({ chosen, onChoose }: { chosen: number; onChoose: (count: number) => void }) {
    return (
        <div>
            <label className={LABEL}>
                <Icon name="Music" className="w-4 h-4 inline mr-2" />{broken(t('ui.recipe.topNumber.label'), 0, 16)}
            </label>
            <div className="grid grid-cols-5 gap-2">
                {TRACK_COUNTS.map(n => (
                    <button
                        key={n}
                        type="button"
                        className={`blend-track-count-btn px-3 py-2 rounded-lg border transition-all duration-200 text-center ${chosen === n ? 'border-orange-400 bg-orange-400/20 text-orange-400 ring-1 ring-orange-400' : PLAIN}`}
                        data-count={n}
                        onClick={() => onChoose(n)}
                    >
                        <span className="font-semibold text-sm">{t('ui.recipe.topNumber.option', { n })}</span>
                    </button>
                ))}
            </div>
            <p className="text-xs text-muted mt-2">{t('ui.recipe.topNumber.hint')}</p>
        </div>
    )
}

function Duration({ choices, onChange }: { choices: Choices; onChange: (next: Choices) => void }) {
    const slider = useRef<HTMLInputElement>(null)
    // the number beside the slider is written with the space at its ends the hand-made HTML had, until the slider moves: then the hand-made panel wrote «90m» in its place
    const [moved, setMoved] = useState(false)
    const duration = choices.duration || 60
    // the attribute `value` of the slider is the one it was drawn with and stays (the hand-made panel wrote it once; a draw anew writes it again, here a new key)
    const [drawnWith] = useState(duration)
    // the slider is heard on the element, by the event `input`; it reads the owner's latest choices and callback
    const latest = useRef({ choices, onChange })
    latest.current = { choices, onChange }
    useLayoutEffect(() => {
        const input = slider.current
        if (!input) return undefined
        // the value is written once the min and the max are on the element: a value written before them is held to the 0-100 of a range with no max
        input.value = String(drawnWith)
        const heard = () => {
            const next = { ...latest.current.choices, duration: parseInt(input.value) }
            latest.current = { ...latest.current, choices: next }
            setMoved(true)
            latest.current.onChange(next)
        }
        input.addEventListener('input', heard)
        return () => input.removeEventListener('input', heard)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the slider is made once for each draw of the section; what it reads is in `latest`
    }, [])
    return (
        <div>
            <label className={LABEL}>
                <Icon name="Clock" className="w-4 h-4 inline mr-2" />{broken(t('ui.recipe.duration.label'), 0, 16)}
            </label>
            <div className="flex items-center gap-4">
                <input
                    ref={slider}
                    type="range"
                    min="30"
                    max="180"
                    step="5"
                    id="blend-duration-slider"
                    defaultValue={drawnWith}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-400"
                />
                <span id="blend-duration-display" className="text-2xl font-bold text-orange-400 w-12 text-center">{moved ? t('ui.recipe.duration.value', { minutes: duration }) : broken(t('ui.recipe.duration.value', { minutes: duration }), 24, 20)}</span>
            </div>
            <p className="text-xs text-muted mt-2">{t('ui.recipe.duration.hint')}</p>
        </div>
    )
}

/** The skip of «Deep cuts» (F92, REQ-10): a slider from 3 to the limit; the number beside it is the skip chosen. It keeps the focus while it moves. */
function Skip({ choices, onChange }: { choices: Choices; onChange: (next: Choices) => void }) {
    const slider = useRef<HTMLInputElement>(null)
    const skip = Math.min(Math.max(choices.skip ?? SKIP_RANGE.min, SKIP_RANGE.min), SKIP_RANGE.max)
    const [drawnWith] = useState(skip)
    // the number beside the slider follows the slider itself (the owner may draw again later)
    const [value, setValue] = useState(skip)
    const latest = useRef({ choices, onChange })
    latest.current = { choices, onChange }
    useLayoutEffect(() => {
        const input = slider.current
        if (!input) return undefined
        input.value = String(drawnWith)
        const heard = () => {
            const next = { ...latest.current.choices, skip: parseInt(input.value) }
            latest.current = { ...latest.current, choices: next }
            setValue(next.skip)
            latest.current.onChange(next)
        }
        input.addEventListener('input', heard)
        return () => input.removeEventListener('input', heard)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the slider is made once for each draw of the section; what it reads is in `latest`
    }, [])
    return (
        <div>
            <label className={LABEL} htmlFor="blend-skip-slider">
                <Icon name="Compass" className="w-4 h-4 inline mr-2" />{t('ui.recipe.skip.label')}
            </label>
            <div className="flex items-center gap-4">
                <input
                    ref={slider}
                    type="range"
                    min={SKIP_RANGE.min}
                    max={SKIP_RANGE.max}
                    step="1"
                    id="blend-skip-slider"
                    defaultValue={drawnWith}
                    aria-valuetext={t('ui.recipe.skip.valueText', { n: value })}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-400"
                />
                <span id="blend-skip-display" className="text-2xl font-bold text-orange-400 w-12 text-center">{value}</span>
            </div>
            <p className="text-xs text-muted mt-2">{t('ui.recipe.skip.hint', { min: SKIP_RANGE.min, max: SKIP_RANGE.max })}</p>
        </div>
    )
}

function Structure({ chosen, onChoose }: { chosen: string; onChoose: (value: string) => void }) {
    return (
        <div>
            <label className={LABEL}>
                <Icon name="LayoutGrid" className="w-4 h-4 inline mr-2" />{broken(t('ui.recipe.structure.label'), 0, 16)}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {OUTPUT_MODES.map(({ value, icon }) => (
                    <WideOption key={value} cls="blend-output-btn" attribute={{ 'data-output': value }} icon={icon} isChosen={chosen === value} label={t(`ui.recipe.structure.${value}.label`)} description={t(`ui.recipe.structure.${value}.description`)} onPress={() => onChoose(value)} />
                ))}
            </div>
        </div>
    )
}

function Source({ chosen, onChoose }: { chosen: string; onChoose: (value: string) => void }) {
    return (
        <div>
            <label className={LABEL}>
                <Icon name="BarChart2" className="w-4 h-4 inline mr-2" />{broken(t('ui.recipe.source.label'), 20, 16)}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {RANKING_TYPES.map(({ value, icon }) => (
                    <WideOption key={value} cls="blend-ranking-btn" attribute={{ 'data-ranking': value }} icon={icon} isChosen={chosen === value} label={t(`ui.recipe.source.${value}.label`)} description={t(`ui.recipe.source.${value}.description`)} onPress={() => onChoose(value)} />
                ))}
            </div>
        </div>
    )
}

interface WideOptionProps {
    cls: string
    attribute: Record<string, string>
    icon: string
    isChosen: boolean
    label: string
    description: string
    onPress: () => void
}

/** The option of the structure and of the ranking source: an icon in a square, the label and, under it, what it does. */
function WideOption({ cls, attribute, icon, isChosen, label, description, onPress }: WideOptionProps) {
    return (
        <button type="button" className={`${cls} p-4 rounded-lg border text-left transition-all duration-200 ${isChosen ? CHOSEN : PLAIN}`} {...attribute} onClick={onPress}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-surface/60 flex items-center justify-center ${isChosen ? 'text-orange-400' : 'text-muted'}`}>
                    <Icon name={icon} className="w-5 h-5" />
                </div>
                <div>
                    <span className={`font-medium block ${isChosen ? 'text-orange-400' : ''}`}>{label}</span>
                    <span className="text-xs text-muted">{description}</span>
                </div>
            </div>
        </button>
    )
}

function Grouping({ options, chosen, onChoose }: { options: ReadonlyArray<{ value: string; icon: string }>; chosen: string; onChoose: (value: string) => void }) {
    return (
        <div>
            <label className={LABEL}>
                <Icon name="Layers" className="w-4 h-4 inline mr-2" />{broken(t('ui.recipe.grouping.label'), 0, 16)}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {options.map(({ value, icon }) => (
                    <button
                        key={value}
                        type="button"
                        className={`blend-grouping-btn p-3 rounded-lg border text-left transition-all duration-200 ${chosen === value ? CHOSEN : PLAIN}`}
                        data-grouping={value}
                        onClick={() => onChoose(value)}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className={chosen === value ? 'text-orange-400' : 'text-muted'}>
                                <Icon name={icon} className="w-4 h-4" />
                            </div>
                            <span className={`font-medium text-sm ${chosen === value ? 'text-orange-400' : ''}`}>{t(`ui.recipe.grouping.${camel(value)}.label`)}</span>
                        </div>
                        <span className="text-[10px] text-muted block leading-tight">{t(`ui.recipe.grouping.${camel(value)}.description`)}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
