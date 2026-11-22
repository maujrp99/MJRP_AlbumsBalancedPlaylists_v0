/**
 * The notices of the values, between the totals and the filters (F83 wave 6a; the port of renderNotices and renderPhoneNotices): a run of «Update
 * values» under way, with «Stop»; or how many albums wait for a value, with «Read them now» (REQ-09); and, on the computer, that Discogs
 * suggests prices only to accounts with seller settings filled in. With the Discogs values off there is no notice and no mention of Discogs.
 */
import { t } from '../../i18n/t.js'
import { SourceState } from '../../models/inventoryValue.js'
import { readingNotice, waitingNotice } from '../../i18n/inventoryTexts.js'
import type { InventoryController, ValueView } from './types'

interface NoticeText {
    strong: string
    rest: string
    action: string
}

function Notice({ id, text, action, onPress }: { id: string; text: NoticeText; action: string; onPress: () => void }) {
    return (
        <div id={id} className="glass-panel p-4 mb-6 flex flex-wrap items-center justify-between gap-3" role="status">
            <span className="text-sm text-white"><strong>{text.strong}</strong>{` ${text.rest}`}</span>
            {' '}
            <button type="button" className="btn btn-secondary whitespace-nowrap" data-notice-action={action} onClick={onPress}>{text.action}</button>
        </div>
    )
}

/** Discogs refuses price suggestions to an account with no seller settings: said once, with what the values are meanwhile and where to fill the settings in. */
export function SellerSettings() {
    return (
        <div id="valuesSellerSettingsNotice" className="glass-panel p-4 mb-6" role="status">
            <span className="text-sm text-white">
                <strong>{t('inventory.seller.strong')}</strong>{` ${t('inventory.seller.rest')} `}
                <a className="text-accent-primary underline" href="https://www.discogs.com/settings/seller" target="_blank" rel="noopener">discogs.com/settings/seller</a>
                {t('inventory.seller.after')}
            </span>
        </div>
    )
}

export function Notices({ known, controller }: { known: ValueView; controller: InventoryController }) {
    if (known.source !== SourceState.ON) return null
    return (
        <>
            {known.run.busy
                ? <Notice id="valuesReadingNotice" text={readingNotice(known.run.count as { done: number; total: number })} action="stop-values" onPress={() => controller.handleStopValues()} />
                : known.waiting > 0 ? <Notice id="valuesWaitingNotice" text={waitingNotice(known.waiting)} action="read-values" onPress={() => { void controller.handleUpdateValues({ onlyNeverRead: true }) }} /> : null}
            {known.sellerSettingsMissing ? <SellerSettings /> : null}
        </>
    )
}

/** One notice of the phone: one line and its button (the seller settings are in the sheet). */
export function PhoneNotices({ known, controller }: { known: ValueView; controller: InventoryController }) {
    if (known.source !== SourceState.ON) return null
    const row = (id: string, text: NoticeText, action: string, onPress: () => void) => (
        <div id={id} className="inv-notice" role="status"><span className="inv-notice__text">{text.strong}</span><button type="button" className="inv-notice__action" data-notice-action={action} onClick={onPress}>{text.action}</button></div>
    )
    if (known.run.busy) return row('valuesReadingNotice', readingNotice(known.run.count as { done: number; total: number }), 'stop-values', () => controller.handleStopValues())
    return known.waiting > 0 ? row('valuesWaitingNotice', waitingNotice(known.waiting), 'read-values', () => { void controller.handleUpdateValues({ onlyNeverRead: true }) }) : null
}
