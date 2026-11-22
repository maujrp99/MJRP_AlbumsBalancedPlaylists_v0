/**
 * The Blend screen (/blend) in React (F83 wave 7b; the old BlendingMenuView and the four pieces under it): «The Blending Menu», four steps in
 * the metaphor of a bar: 1. choose the mix (a series of albums), 2. the recipe, 3. the ingredients, 4. «Blend it!», which asks the controller to generate
 * and takes the person to the playlists screen. One screen, drawn for the computer (the list of series in a box, the button) or for the phone (a row and
 * a sheet, an action bar).
 *
 * The state is ONE: the series chosen, the recipe, the ingredients, whether it is blending and what the result area says. (The hand-made screen kept
 * the choice in four places, and the recipe and the ingredients each in a piece that drew itself.) The series and their covers are the visit's
 * (blendVisit.ts), read once when the route opens; this screen listens to it and draws again when something comes, nothing else.
 *
 * What it does as the hand-made screen did:
 *   - choosing a series or a recipe, a button of the ingredients, or turning the phone, drew the page anew and the focus went back to the page; the slider
 *     of the duration did not (it keeps the focus). The covers that arrive do NOT let the focus go: the one difference on purpose (see SeriesStep.tsx);
 *   - the step 3 is never the current one (from 2 the stepper goes to 4); the summary says «auto mode» even when the recipe does not use it; the ingredients
 *     are not wiped when the recipe changes and a hidden one is still handed to the generation (defects kept: a migration fixes nothing);
 *   - the result area (the progress, or a failure in red) stays until the page is drawn anew by a choice;
 *   - «Blend it!» asks the controller with the recipe and the five keys of the ingredients; the notices of the load are warnings of ten seconds, then a
 *     success, then the move to /playlists?seriesId=… (by the bridge, after this draw, from the click and never from an effect).
 */
import { useState, useSyncExternalStore } from 'react'
import { Icon } from '../../ui/Icon'
import { RecipeCards, recipeKeyOf, type RecipeOfCard } from '../../ui/recipe/RecipeCards'
import { Ingredients, type Choices } from '../../ui/recipe/Ingredients'
import { broken } from '../../ui/recipe/broken'
import { t, tPlural } from '../../i18n/t.js'
import { getAllAlgorithms } from '../../algorithms/index.js'
import { recipesOf } from '../../models/recipeLooks.js'
import { DEFAULT_CHOICES, configOf } from '../../models/recipeIngredients.js'
import { navigate } from '../../react-bridge/navigation'
import { useFocusLikeAfterAnewDraw } from '../../react-bridge/useFocusLikeAfterAnewDraw'
import { useLocale } from '../../react-bridge/useLocale'
import { usePhone } from '../../react-bridge/usePhone'
import toast from '../../components/Toast.js'
import { blendingController } from '../../controllers/BlendingController.js'
import { SeriesStep } from './SeriesStep'
import { PhoneBar, PhoneStep } from './phone/PhoneStep'
import type { BlendVisit } from './blendVisit'
import type { BlendingController, Results, Series } from './types'

/** How long a notice about what the load left out stays: it is read on the next screen. */
const NOTICE_MS = 10000

const STEPS = [
    { num: 1, key: 'mix', icon: 'Disc' },
    { num: 2, key: 'recipe', icon: 'FileText' },
    { num: 3, key: 'ingredients', icon: 'List' },
    { num: 4, key: 'blend', icon: 'Sparkles' }
]

const BADGE = 'text-xs text-muted px-2 py-1 bg-white/5 rounded-full'

/** The faixa of the four steps: the current one in orange, the done ones in green with a check. The step 3 is never the current one (a defect kept). */
function Stepper({ hasSeries, hasRecipe }: { hasSeries: boolean; hasRecipe: boolean }) {
    let current = 1
    if (hasSeries) current = 2
    if (hasRecipe) current = 3
    if (hasSeries && hasRecipe) current = 4
    return (
        <div className="inline-flex items-center gap-2 md:gap-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 blend-stepper">
            {STEPS.map((step, index) => {
                const isActive = step.num === current
                const isDone = step.num < current
                const stepClass = isDone ? 'bg-green-500 text-white border-green-500' : isActive ? 'bg-orange-400 text-black border-orange-400 shadow-lg shadow-orange-400/30' : 'bg-white/5 text-muted border-white/20'
                const labelClass = isDone ? 'text-green-400' : isActive ? 'text-orange-400 font-bold' : 'text-muted'
                return (
                    <div key={step.num} className="flex items-center gap-1 md:gap-2 blend-stepper__step" aria-current={isActive ? 'step' : undefined}>
                        <div className="flex flex-col items-center blend-stepper__mark">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center text-sm transition-all ${stepClass}`}>
                                {isDone ? broken('✓', 28, 24) : <Icon name={step.icon} className="w-2/3 h-2/3" />}
                            </div>
                            <span className={`text-[10px] md:text-xs mt-1 blend-stepper__label ${labelClass}`}>{t(`blend.stepper.${step.key}`)}</span>
                        </div>
                        {index < STEPS.length - 1 ? <div className={`w-4 md:w-8 h-0.5 blend-stepper__line ${isDone ? 'bg-green-500' : 'bg-white/20'}`}></div> : null}
                    </div>
                )
            })}
        </div>
    )
}

function Heading({ icon, title, step }: { icon: string; title: string; step: number }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 text-orange-400 flex items-center justify-center"><Icon name={icon} className="w-full h-full" /></div>
            <h2 className="text-xl font-bold">{title}</h2>
            <span className={BADGE}>{t('blend.step', { n: step })}</span>
        </div>
    )
}

function Locked({ title, step, about }: { title: string; step: number; about: string }) {
    return (
        <>
            <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <h2 className="text-xl font-medium text-muted">{title}</h2>
                <span className={BADGE}>{t('blend.step', { n: step })}</span>
            </div>
            <p className="text-sm text-muted mt-2">{about}</p>
        </>
    )
}

/** The words that name a recipe on this screen: by its id, from the dictionary (what a generation writes into a batch name stays the metadata's). */
const recipeName = (recipe: RecipeOfCard): string => t(`blend.recipes.${recipeKeyOf(recipe.id)}.name`)

interface Props {
    visit: BlendVisit
}

export function Blend({ visit }: Props) {
    useSyncExternalStore(visit.subscribe, visit.getVersion)
    useLocale()
    const phone = usePhone()
    // the page drawn anew by something the person did: the focus goes back to the page (the covers that arrive are not that)
    const [draws, setDraws] = useState(0)
    const drawnAnew = () => setDraws(count => count + 1)
    // the sections of the ingredients drawn anew by a choice of series or recipe or a turn (a button of their own draws them anew by itself, the slider does not)
    const [ingredientDraws, setIngredientDraws] = useState(0)
    useFocusLikeAfterAnewDraw({ keep: (held) => held.id === 'blend-duration-slider', after: draws })

    // undefined: the person chose nothing yet (the series of the address, if any, is the one chosen)
    const [picked, setPicked] = useState<Series | null | undefined>(undefined)
    const chosen = picked === undefined ? visit.fromAddress : picked
    const [recipeId, setRecipeId] = useState<string | null>(null)
    const [choices, setChoices] = useState<Choices>({ ...DEFAULT_CHOICES })
    const [generating, setGenerating] = useState(false)
    const [results, setResults] = useState<Results>(null)

    // turning the phone draws the page anew (the result area is wiped, as the hand-made screen did)
    const [wasPhone, setWasPhone] = useState(phone)
    if (wasPhone !== phone) {
        setWasPhone(phone)
        setResults(null)
        setIngredientDraws(count => count + 1)
        drawnAnew()
    }

    const recipes: RecipeOfCard[] = recipesOf(getAllAlgorithms())
    const recipe = recipes.find(candidate => candidate.id === recipeId) ?? null
    const ready = Boolean(chosen && recipe)

    const choose = (series: Series) => { setPicked(series); setResults(null); setIngredientDraws(count => count + 1); drawnAnew() }
    const chooseEntity = (entity: string) => { setPicked(null); setResults(null); setIngredientDraws(count => count + 1); drawnAnew(); visit.setEntity(entity) }
    const chooseRecipe = (next: RecipeOfCard) => { setRecipeId(next.id); setResults(null); setIngredientDraws(count => count + 1); drawnAnew() }
    const change = (next: Choices) => {
        setChoices(next)
        drawnAnew()
    }

    const generate = async () => {
        if (!chosen || !recipe) return
        setGenerating(true)
        drawnAnew()
        const signal = visit.beginGeneration()
        try {
            const config = { algorithmId: recipe.id, ...configOf(choices) }
            const result = await (blendingController as unknown as BlendingController).generateFromSeries(chosen.id, config, {
                onProgress: (message) => setResults({ kind: 'progress', message }),
                signal
            })
            // what the load left out (albums that failed, sources missing) is said before the result
            result.notices.forEach((notice: string) => toast.warning(notice, NOTICE_MS))
            toast.success(tPlural('blend.generated', result.playlists.length, { count: result.playlists.length }))
            navigate(`/playlists?seriesId=${chosen.id}`)
        } catch (error) {
            if ((error as Error | undefined)?.name === 'BlendCancelledError') return // the person left: nothing to show
            console.error('[Blend] Generation error:', error)
            setResults({ kind: 'error', message: (error as Error | undefined)?.message || t('blend.failed') })
        } finally {
            setGenerating(false)
            drawnAnew()
        }
    }

    const barNote = !chosen ? t('blend.bar.step1') : !recipe ? t('blend.bar.step2') : t('blend.bar.ready', { recipe: recipeName(recipe), duration: choices.duration })
    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="text-center mb-8 blend-head">
                <div className="inline-flex items-center gap-3 mb-3">
                    <span className="text-4xl">🍹</span>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">{t('blend.title')}</h1>
                </div>
                <p className="text-muted text-lg mb-6 blend-head__motto">{t('blend.motto')}</p>
                <Stepper hasSeries={Boolean(chosen)} hasRecipe={Boolean(recipe)} />
            </div>

            <section className="glass-panel rounded-2xl p-6 mb-6">
                <Heading icon="Disc" title={t('blend.step1.title')} step={1} />
                {phone
                    ? <PhoneStep visit={visit} chosen={chosen} onChoose={choose} onEntity={chooseEntity} />
                    : <SeriesStep visit={visit} chosen={chosen} onChoose={choose} onEntity={chooseEntity} />}
            </section>

            {chosen ? (
                <section className="glass-panel rounded-2xl p-6 mb-6 animate-fadeIn">
                    <Heading icon="FileText" title={t('blend.step2.title')} step={2} />
                    <div id="blend-recipe-cards">
                        <RecipeCards recipes={recipes} selectedId={recipeId} onSelect={chooseRecipe} />
                    </div>
                </section>
            ) : (
                <section className="glass-panel rounded-2xl p-6 mb-6 opacity-40">
                    <Locked title={t('blend.step2.title')} step={2} about={t('blend.step2.locked')} />
                </section>
            )}

            {recipe ? (
                <section className="glass-panel rounded-2xl p-6 mb-6 animate-fadeIn">
                    <Heading icon="List" title={t('blend.step3.title')} step={3} />
                    <div id="blend-ingredients-panel">
                        <Ingredients recipeId={recipe.id} choices={choices} onChange={change} recipeChosen={ingredientDraws} />
                    </div>
                </section>
            ) : null}

            {recipe && chosen ? (
                <section className="glass-panel rounded-2xl p-6 border-2 border-orange-400/30 animate-fadeIn">
                    <Heading icon="Sparkles" title={t('blend.step4.title')} step={4} />
                    <div id="blend-generate-section" className="text-center py-4">
                        <div className="space-y-4">
                            <button
                                id="blend-generate-btn"
                                className="tech-btn-primary px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                disabled={generating}
                                onClick={() => { void generate() }}
                            >
                                {generating ? (
                                    <span className="inline-flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        {broken(t('blend.generate.busy'), 31, 27)}
                                    </span>
                                ) : (
                                    <>
                                        <Icon name="Sparkles" className="w-5 h-5 inline mr-2" />
                                        {broken(t(choices.outputMode === 'multiple' ? 'blend.generate.multiple' : 'blend.generate.one'), 0, 16)}
                                    </>
                                )}
                            </button>
                            <p className="text-sm text-muted">
                                {`\n${' '.repeat(24)}${t('blend.summary.using')} `}
                                <strong>{recipeName(recipe)}</strong>
                                {` ${t('blend.summary.on')} \n${' '.repeat(24)}`}
                                <strong>{chosen.name}</strong>
                                {`\n${' '.repeat(24)}${t('blend.summary.settings', { duration: choices.duration, mode: t(`blend.mode.${choices.outputMode}`) })}\n${' '.repeat(20)}`}
                            </p>
                        </div>
                    </div>
                </section>
            ) : chosen ? (
                <section className="glass-panel rounded-2xl p-6 opacity-40">
                    <Locked title={t('blend.step4.title')} step={4} about={t('blend.step4.locked')} />
                </section>
            ) : null}

            <section id="blend-results" className={results ? 'mt-8' : 'mt-8 hidden'}>
                {results?.kind === 'progress' ? (
                    <div className="glass-panel rounded-2xl p-6 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-3 border-orange-400 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-muted">{results.message}</p>
                    </div>
                ) : results?.kind === 'error' ? (
                    <div className="glass-panel rounded-2xl p-6 border-2 border-red-400/30">
                        <div className="flex items-center gap-3 text-red-400">
                            <Icon name="AlertCircle" className="w-6 h-6" />
                            <span className="font-semibold">{results.message}</span>
                        </div>
                    </div>
                ) : null}
            </section>
            {phone ? <PhoneBar note={barNote} ready={ready} generating={generating} onGenerate={() => { void generate() }} /> : null}
        </div>
    )
}
