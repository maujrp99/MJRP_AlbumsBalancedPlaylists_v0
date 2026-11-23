/**
 * askTexts - the words of an ask for albums (F83 wave 8d). The rules of an ask (models/albumAsk.js) give DATA: a code and the numbers
 * (`askNoticeParts`, `noAlbumsPart`, `askProgressPart`); they never write a sentence, and models/ does not import i18n/. This file says
 * those parts in the language the site speaks now (`t`, `tPlural`, the dictionaries `en/notices.js` and `pt/notices.js`). The English is
 * the English the model used to write, word for word (test/i18n/askTexts.test.js holds the sentences of before).
 */
import { t, tPlural } from './t.js'
import { AskFailure, SourceGap, askNoticeParts, askProgressPart, noAlbumsPart } from '../models/albumAsk.js'

const REASON_KEYS = Object.freeze({
    [AskFailure.NOT_FOUND]: 'ask.reason.notFound',
    [AskFailure.TIMEOUT]: 'ask.reason.timeout',
    [AskFailure.NETWORK]: 'ask.reason.network',
    [AskFailure.ON_HOLD]: 'ask.reason.onHold'
})

const GAP_KEYS = Object.freeze({
    [SourceGap.FAILED]: 'ask.gap.failed',
    [SourceGap.EMPTY]: 'ask.gap.empty',
    [SourceGap.WAITING]: 'ask.gap.waiting',
    [SourceGap.NOT_CONNECTED]: 'ask.gap.notConnected'
})

const SOURCE_KEYS = Object.freeze({ acclaim: 'ask.source.acclaim', popularity: 'ask.source.popularity', userRanking: 'ask.source.userRanking' })

const albums = (count) => tPlural('ask.albums', count)

/** «A, B, C and 2 more»: each name is its label, with the reason in brackets for an album that was left out. */
function namesText({ shown, more }) {
    const text = shown.map(item => (item.reason
        ? t('ask.names.withReason', { label: item.label, reason: REASON_KEYS[item.reason] ? t(REASON_KEYS[item.reason]) : item.reason })
        : item.label)).join(', ')
    return more > 0 ? t('ask.names.more', { shown: text, rest: more }) : text
}

function sourceText(part) {
    const known = SOURCE_KEYS[part.source]
    const name = known ? t(`${known}.name`) : part.source
    const verb = known ? t(`${known}.verb`) : t('ask.source.verb')
    const gaps = part.gaps.map(item => tPlural(GAP_KEYS[item.gap], item.count, { count: item.count })).join(', ')
    const missing = t('ask.source.line', { name, verb, count: part.count, ready: part.ready, albums: albums(part.ready), gaps, names: namesText(part.names) })
    return part.fallback ? `${missing} ${tPlural('ask.fallback', part.count, { fallback: part.fallback })}` : missing
}

/** What to tell the person about an ask served with something missing: a line for the albums left out, a line for each source missing. */
export function askNotices(result, fallbacks = {}) {
    return askNoticeParts(result, fallbacks).map(part => (part.code === 'failed'
        ? tPlural('ask.failed', part.count, { count: part.count, total: part.total, albums: albums(part.total), names: namesText(part.names) })
        : sourceText(part)))
}

/** What to say when an ask ended with no album at all. */
export function noAlbumsMessage(result) {
    const part = noAlbumsPart(result)
    return part.code === 'empty' ? t('ask.empty') : t('ask.none', { total: part.total, albums: albums(part.total), names: namesText(part.names) })
}

/** The line a screen shows while it waits for an ask. */
export function askProgressText(progress) {
    const part = askProgressPart(progress)
    return part.code === 'loading'
        ? t('ask.progress.loading', { settled: part.settled, total: part.total })
        : t('ask.progress.waiting', { waiting: part.waiting, total: part.total, albums: albums(part.total) })
}
