/**
 * holdTexts - the words of the notice «the load is on hold» (F98, UAT-308).
 *
 * The model of the load (models/albumLoadState.js, `holdNotice`) gives DATA: the reason, the hour the load resumes at and the kind of
 * notice. It never writes a sentence, and models/ does not import i18n/. This file says it in the language the site speaks now (`t`, the
 * dictionaries `en/notices.js` and `pt/notices.js`), as askTexts.js and inventoryTexts.js do for their models. The English is the English
 * the model used to write, word for word (test/i18n/exportTexts.test.js holds the sentences of before).
 */
import { t } from './t.js'
import { clockText } from './dates.js'

const REASON_KEYS = Object.freeze({
    unauthorized: 'notices.hold.unauthorized',
    source_busy: 'notices.hold.sourceBusy',
    spotify_busy: 'notices.hold.spotifyBusy',
    rate_limited: 'notices.hold.serverBusy'
})

/**
 * @param {{ reason: string, until: number|null }} notice - what `holdNotice` gave
 * @param {(ms: number) => string} [formatTime] - the hour as it is written; none given: the hour in the language of the app
 * @returns {string}
 */
export function holdNoticeText(notice, formatTime = clockText) {
    const said = t(REASON_KEYS[notice.reason] || REASON_KEYS.rate_limited)
    return notice.until ? `${said} ${t('notices.hold.resumes', { time: formatTime(notice.until) })}` : said
}
