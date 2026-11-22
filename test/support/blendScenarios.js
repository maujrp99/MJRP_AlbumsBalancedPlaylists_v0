/**
 * The states of the Blend screen (/blend) that F83 wave 7b checks, written once so the screen as it was (hand-made: views/BlendingMenuView.js
 * and the four pieces under it) and the screen as it is (React: screens/blend/) are asked the same thing: the same series, the same clicks and
 * keys, and what stands in the page (`#app`, and the sheet of the phone when it is open) after each step, the focus, and everything the screen asked
 * of the world outside (the read of the series, the covers, the generation with its whole configuration, the toasts, the move to the playlists).
 *
 * `normalize` is the proof's of wave 7a (test/support/regenerateScenarios.js): the elements, the attributes in alphabetical order, the classes as a
 * set, the style as the browser writes it, the white space collapsed, and two text nodes side by side marked (the old HTML had one).
 *
 * Used by: reports/evidence/F83/wave-7b/capture-before.test.tsx (run once, on the hand-made screen, before it was touched; it wrote
 * test/fixtures/blendBeforeF83.json) and test/screens/blend/Blend.sameAsBefore.test.tsx (the React screen, against that file).
 */
export { normalize, focusMark } from './regenerateScenarios.js'

const album = (artist, title) => `${artist} - ${title}`

const FLOYD = { id: 's1', name: 'Floyd', albumQueries: [album('Pink Floyd', 'The Wall'), album('Pink Floyd', 'Animals'), album('Pink Floyd', 'Meddle'), album('Pink Floyd', 'Wish You Were Here')] }
// the other shapes a query has: an object with a name, one with an image, one with a cover; and a name that carries an entity
const RUSH = { id: 's2', name: 'Rush &amp; Friends', albumQueries: [{ name: 'Rush - 2112' }, { imageUrl: 'https://img.test/a.jpg' }, { coverUrl: 'https://img.test/b.jpg' }] }
const SOLO = { id: 's3', name: 'Solo', albumQueries: [album('Bjork', 'Homogenic')] }
const NOTHING = { id: 's4', name: 'Nothing yet', albumQueries: [] }
const THREE = [FLOYD, RUSH, SOLO]
const MANY = Array.from({ length: 12 }, (_, i) => ({ id: `m${i}`, name: `Series ${i}`, albumQueries: [album('A', `B${i}`), album('C', `D${i}`)] }))
const FIFTY = Array.from({ length: 50 }, (_, i) => ({ id: `p${i}`, name: i === 7 ? 'Rush &amp; Friends' : `Series ${i}`, albumQueries: ['A - B', 'C - D'] }))

const RECIPES = ['mjrp-balanced-cascade', 'top-n-popular', 'top-n-acclaimed', 'top-n-user']
const GENERATE = '#blend-generate-btn'
const BAR = '#blend-bar-btn'
const card = (id) => `.blend-series-card[data-series-id="${id}"]`
const recipe = (id) => `[data-recipe-id="${id}"]`

/** Opens on a series and a recipe: the ground of the scenarios that change an ingredient or generate. */
const ready = async (h, recipeId = 'top-n-popular') => {
    await h.click(card('s1'))
    await h.click(recipe(recipeId))
}

/**
 * Each scenario: a name, whether it is the phone, the world it opens in (`world`: series, db, load, cover, generate, progress, notices), the address
 * (`query`), and what it does once the screen is open. `h.snap(label, selector)` writes down `#app` (or the first element of the page that matches),
 * `h.note(label, text)` a text, `h.calls(label)` what the screen asked of the world since the last time, `h.focus()` where the focus is.
 */
export const SCENARIOS = [
    // ---- the computer: step 1 --------------------------------------------------------------------------------------------------------------------
    { name: 'the series are loading', world: { series: THREE, load: 'wait' }, run: async (h) => { h.snap('loading'); h.calls('asked'); h.loaded(); await h.settle(); h.snap('loaded') } },
    { name: 'no series', world: { series: [] }, run: async (h) => { h.snap('empty'); h.calls('asked') } },
    { name: 'a read that fails falls to no series', world: { series: THREE, load: 'fails' }, run: async (h) => { h.snap('empty'); h.calls('asked') } },
    { name: 'a visitor (no database) reads what the store has', world: { series: THREE, db: null }, run: async (h) => { h.snap('list'); h.calls('asked') } },
    { name: 'one series', world: { series: [SOLO] }, run: async (h) => { h.snap('list'); await h.click(card('s3')); h.snap('chosen') } },
    { name: 'a series with no album', world: { series: [NOTHING, SOLO] }, run: async (h) => { h.snap('list') } },
    { name: 'many series, the covers waiting and then arrived', world: { series: MANY, cover: 'wait' }, run: async (h) => {
        h.snap('covers waiting'); h.calls('asked')
        h.focusOn(card('m3')); await h.arrive(); await h.settle()
        h.snap('covers arrived'); h.note('focus after the covers came', h.focus())
        h.focusOn(card('m3')); await h.click(card('m5')); h.note('focus after a card was chosen', h.focus()); h.snap('chosen')
    } },
    { name: 'the covers of every shape of query', world: { series: THREE }, run: async (h) => { h.snap('list with covers'); h.calls('asked') } },
    { name: 'the covers are not in the local set', world: { series: THREE, cover: 'none' }, run: async (h) => { h.snap('list with the stand-in covers') } },
    { name: 'a series chosen by a click', world: { series: THREE }, run: async (h) => {
        h.focusOn(card('s2')); await h.click(card('s2')); h.snap('chosen'); h.note('focus after the click', h.focus())
    } },
    { name: 'a series chosen by Enter', world: { series: THREE }, run: async (h) => {
        h.focusOn(card('s1')); await h.key(card('s1'), 'Enter'); h.snap('chosen'); h.note('focus after Enter', h.focus())
    } },
    { name: 'a series chosen by Space', world: { series: THREE }, run: async (h) => {
        h.focusOn(card('s3')); await h.key(card('s3'), ' '); h.snap('chosen'); h.note('focus after Space', h.focus())
        await h.key(card('s1'), 'a'); h.snap('another key does nothing')
    } },
    { name: 'the entity select: the three that wait are off', world: { series: THREE }, run: async (h) => { h.snap('select', '#blend-entity-select') } },
    // ---- the address ----------------------------------------------------------------------------------------------------------------------------
    { name: 'opened from a series', world: { series: MANY }, query: { seriesId: 'm9' }, run: async (h) => {
        h.snap('chosen, the recipes unlocked'); h.note('scrolled to', h.scrolled()); h.calls('asked')
        await h.click(card('m1')); h.snap('another chosen afterwards'); h.note('scrolled after', h.scrolled())
    } },
    { name: 'opened from a series that does not exist', world: { series: THREE }, query: { seriesId: 'gone' }, run: async (h) => { h.snap('none chosen') } },
    { name: 'opened from a series while the person is a visitor', world: { series: THREE, db: null }, query: { seriesId: 's2' }, run: async (h) => { h.snap('chosen') } },
    // ---- the recipes ----------------------------------------------------------------------------------------------------------------------------
    { name: 'each recipe chosen', world: { series: THREE }, run: async (h) => {
        await h.click(card('s1')); h.snap('step 2 open')
        for (const id of RECIPES) { h.focusOn(recipe(id)); await h.click(recipe(id)); h.snap(id); h.note(`focus after ${id}`, h.focus()) }
    } },
    // ---- the ingredients ------------------------------------------------------------------------------------------------------------------------
    { name: 'each ingredient of a Top N recipe', world: { series: THREE }, run: async (h) => {
        await ready(h, 'top-n-user')
        for (const n of [1, 5, 10]) { h.focusOn(`.blend-track-count-btn[data-count="${n}"]`); await h.click(`.blend-track-count-btn[data-count="${n}"]`); h.snap(`Top ${n}`); h.note(`focus after Top ${n}`, h.focus()) }
        for (const value of ['by_album', 'flat_ranked', 'artist_rank', 'ranked_interleave', 'shuffle']) { await h.click(`.blend-grouping-btn[data-grouping="${value}"]`); h.snap(value) }
        for (const value of ['single', 'multiple', 'auto']) { await h.click(`.blend-output-btn[data-output="${value}"]`); h.snap(`structure ${value}`) }
    } },
    { name: 'the ranking source of the balanced recipe', world: { series: THREE }, run: async (h) => {
        await ready(h, 'mjrp-balanced-cascade')
        for (const value of ['spotify', 'bea', 'combined']) { await h.click(`.blend-ranking-btn[data-ranking="${value}"]`); h.snap(value) }
    } },
    { name: 'the slider of the duration', world: { series: THREE }, run: async (h) => {
        await ready(h, 'mjrp-balanced-cascade')
        h.focusOn('#blend-duration-slider'); await h.slide('#blend-duration-slider', 90)
        h.snap('slider at 90'); h.note('focus after the slider', h.focus())
        await h.click('.blend-ranking-btn[data-ranking="bea"]'); h.snap('a button drew the ingredients again')
        await h.slide('#blend-duration-slider', 30); await h.slide('#blend-duration-slider', 180); h.snap('slider at 180')
    } },
    { name: 'Multiple: the button of the blend is in the plural', world: { series: THREE }, run: async (h) => {
        await ready(h, 'top-n-popular'); await h.click('.blend-output-btn[data-output="multiple"]'); h.snap('multiple')
        await h.click('.blend-output-btn[data-output="single"]'); h.snap('single')
    } },
    { name: 'the steps that are locked', world: { series: THREE }, run: async (h) => {
        h.snap('step 1 only')
        await h.click(card('s1')); h.snap('series only')
    } },
    // ---- generating -----------------------------------------------------------------------------------------------------------------------------
    { name: 'generating: busy, the progress, the success and the move', world: { series: THREE, generate: 'hold', progress: ['Loading albums 1/4', 'Loading albums 3/4', 'Generating playlists with top-n-popular...'] }, run: async (h) => {
        await ready(h); await h.click('.blend-output-btn[data-output="multiple"]'); await h.click('.blend-track-count-btn[data-count="7"]')
        await h.click(GENERATE); h.snap('busy'); h.snap('progress', '#blend-results'); h.calls('asked')
        h.release(); await h.settle(); h.snap('after'); h.calls('what the screen asked of the world after it')
    } },
    { name: 'generating with the notices of the load', world: { series: THREE, notices: ['2 albums were left out: A, B', 'No BestEverAlbums rating for C'], count: 1 }, run: async (h) => {
        await ready(h, 'top-n-acclaimed'); await h.click(GENERATE); await h.settle(); h.calls('asked'); h.snap('after')
    } },
    { name: 'generating with the balanced recipe sends the five keys', world: { series: THREE }, run: async (h) => {
        await ready(h, 'mjrp-balanced-cascade'); await h.click(GENERATE); await h.settle(); h.calls('asked')
    } },
    { name: 'an option hidden by the next recipe still goes to the generation', world: { series: THREE }, run: async (h) => {
        await ready(h, 'top-n-popular'); await h.click('.blend-track-count-btn[data-count="7"]'); await h.click('.blend-grouping-btn[data-grouping="artist_rank"]'); await h.click('.blend-output-btn[data-output="single"]')
        await h.click(recipe('mjrp-balanced-cascade')); h.snap('balanced'); await h.click(GENERATE); await h.settle(); h.calls('asked')
    } },
    { name: 'no album is ready', world: { series: THREE, generate: 'none' }, run: async (h) => {
        await ready(h); await h.click(GENERATE); await h.settle(); h.snap('results', '#blend-results'); h.snap('button'); h.calls('asked')
    } },
    { name: 'the generation fails', world: { series: THREE, generate: 'fails' }, run: async (h) => {
        await ready(h); await h.click(GENERATE); await h.settle(); h.snap('results', '#blend-results'); h.calls('asked')
        await h.click(recipe('top-n-user')); h.snap('after the next full draw')
    } },
    { name: 'the person leaves while the albums load', world: { series: THREE, generate: 'cancel' }, run: async (h) => {
        await ready(h); await h.click(GENERATE); h.snap('busy'); await h.leave(); await h.settle(); h.calls('asked')
    } },
    { name: 'leaving and coming back forgets what was chosen', world: { series: THREE }, run: async (h) => {
        await ready(h); await h.click('.blend-track-count-btn[data-count="9"]'); await h.leave(); await h.reopen(); h.snap('after returning'); h.calls('asked')
    } },
    // ---- the phone ------------------------------------------------------------------------------------------------------------------------------
    { name: 'the phone: the row while the series load', phone: true, world: { series: THREE, load: 'wait' }, run: async (h) => { h.snap('loading'); h.loaded(); await h.settle(); h.snap('loaded') } },
    { name: 'the phone: no series', phone: true, world: { series: [] }, run: async (h) => { h.snap('empty') } },
    { name: 'the phone: nothing chosen, then one chosen through the sheet', phone: true, world: { series: FIFTY }, run: async (h) => {
        h.snap('no choice'); await h.click('#blend-series-pick'); h.snap('sheet open', '.sheet'); h.note('focus in the sheet', h.focus())
        await h.search('series 1'); h.snap('narrowed', '.sheet'); await h.search('rush & fr'); h.snap('one name with an entity', '.sheet'); await h.search('zzz'); h.snap('no result', '.sheet')
        await h.search('series 42'); await h.click('.blend-sheet__row'); await h.settle(); h.snap('chosen'); h.note('sheet open after the choice', String(Boolean(document.querySelector('.sheet')))); h.note('focus after the choice', h.focus())
    } },
    { name: 'the phone: the covers arrive with the sheet open and a search kept', phone: true, world: { series: THREE, cover: 'wait' }, run: async (h) => {
        await h.click('#blend-series-pick'); await h.search('floyd'); h.snap('before', '.sheet')
        await h.arrive(); await h.settle(); h.snap('after the covers came', '.sheet'); h.note('the search is kept', document.querySelector('.blend-sheet__search').value)
        h.snap('the page', '#app')
    } },
    { name: 'the phone: the series of a name with an entity is decoded', phone: true, world: { series: THREE }, run: async (h) => {
        await h.click('#blend-series-pick'); await h.click('.blend-sheet__row[data-series-id="s2"]'); await h.settle(); h.snap('chosen')
    } },
    { name: 'the phone: the note of the bar in each step and Blending…', phone: true, world: { series: THREE, generate: 'hold' }, run: async (h) => {
        h.snap('bar one', '#blend-phone-bar'); await h.click('#blend-series-pick'); await h.click('.blend-sheet__row[data-series-id="s1"]'); await h.settle(); h.snap('bar two', '#blend-phone-bar')
        await h.click(recipe('top-n-popular')); h.snap('bar three', '#blend-phone-bar'); h.snap('page'); h.focusOn(BAR)
        await h.click(BAR); h.snap('blending', '#blend-phone-bar'); h.note('focus', h.focus()); h.calls('asked'); h.release(); await h.settle(); h.snap('after', '#blend-phone-bar'); h.calls('after')
    } },
    { name: 'the phone: the bar takes the same path as the button', phone: true, world: { series: THREE }, query: { seriesId: 's2' }, run: async (h) => {
        await h.click(recipe('mjrp-balanced-cascade')); await h.slide('#blend-duration-slider', 120); h.snap('bar', '#blend-phone-bar'); await h.click(BAR); await h.settle(); h.calls('asked')
    } },
    { name: 'the phone: the recipes in one column and the ingredients', phone: true, world: { series: THREE }, query: { seriesId: 's1' }, run: async (h) => {
        h.snap('step 2'); await h.click(recipe('top-n-popular')); h.snap('step 3')
    } },
    { name: 'a turn of the phone keeps what was chosen', world: { series: THREE }, run: async (h) => {
        await ready(h); await h.click('.blend-track-count-btn[data-count="6"]'); h.snap('computer')
        await h.turn(true); h.snap('phone'); await h.turn(false); h.snap('computer again')
    } },
    { name: 'a turn of the phone with the sheet open closes it', phone: true, world: { series: THREE }, run: async (h) => {
        await h.click('#blend-series-pick'); await h.turn(false); h.snap('computer'); h.note('sheet', String(Boolean(document.querySelector('.sheet--full'))))
    } }
]

export const keyOf = (scenario) => `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`
