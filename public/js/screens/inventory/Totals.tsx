/**
 * What the top of the inventory says of the values (F83 wave 6a; the port of views/renderers/InventoryValueHeader.js, F75): the strip under the title
 * with «Estimated value of what I own» and «To buy the rest», each with how many albums have a value, the choice of the currency (REQ-07, REQ-08)
 * and the lines under them (the rate used, that the rates did not come, where the Discogs data comes from); on the phone the same facts in two
 * short rows, and one button that opens the rest in a sheet. The money is written by the models; with nothing summed the total is a dash.
 */
import { t } from '../../i18n/t.js'
import { BASE_CURRENCY, CURRENCIES, DISCOGS_CREDIT, LOWEST_PRICES_NOTE, RATES_MISSING_TEXT, ownedNote, rateNote, toBuyNote } from '../../models/inventoryValue.js'
import { totalText } from '../../models/inventoryCard.js'
import type { InventoryController, Money, Total, ValueView } from './types'

const CURRENCY_BUTTON = 'text-xs px-2 py-1 rounded bg-surface-light hover:bg-surface-lighter border border-surface-light text-gray-300 hover:text-white transition-colors uppercase'
const NOTE = 'text-xs text-gray-400 w-full'

const usable = (code: string, money: Money): boolean => code === BASE_CURRENCY || Boolean(money.rates?.[code])

function Part({ id, label, total, money, note }: { id: string; label: string; total: Total; money: Money; note: string }) {
    return (
        <div className="flex flex-wrap items-center gap-2" data-total={id}>
            <span className="text-sm text-gray-400">{label}</span>
            {' '}
            <span className="text-lg font-bold text-accent-primary" data-role="sum">{totalText(total, money)}</span>
            {' '}
            <span className="text-xs text-gray-400" data-role="count">{note}</span>
        </div>
    )
}

/** The four currencies; one that has no rate today cannot be chosen, and says why. */
function CurrencyButtons({ money, onChoose }: { money: Money; onChoose: (code: string) => void }) {
    return (
        <span id="currencySelector" className="flex gap-1 md:ml-auto" role="group" aria-label={t('inventory.totals.currency')}>
            {CURRENCIES.map((code: string) => {
                const chosen = code === money.currency
                const off = !usable(code, money)
                return (
                    <button
                        key={code}
                        type="button"
                        data-currency={code}
                        className={CURRENCY_BUTTON}
                        aria-pressed={chosen}
                        style={chosen ? { borderColor: '#f97316', color: '#fff' } : undefined}
                        disabled={off}
                        title={off ? RATES_MISSING_TEXT : undefined}
                        onClick={() => onChoose(code)}
                    >{code}</button>
                )
            })}
        </span>
    )
}

function Notes({ known }: { known: ValueView }) {
    const { money } = known
    return (
        <>
            {money.currency !== BASE_CURRENCY ? <div className={NOTE} data-role="rate">{rateNote(money.currency, money.rates)}</div> : null}
            {money.ratesMissing ? <div className={NOTE} data-role="rates-missing" role="status">{RATES_MISSING_TEXT}</div> : null}
            {known.discogsShown ? (
                <div className={NOTE} data-role="discogs-credit">
                    <a className="underline hover:text-white" href="https://www.discogs.com/" target="_blank" rel="noopener">{DISCOGS_CREDIT}</a>
                    {` ${t('inventory.totals.discogsEach')}${known.lowestShown ? ` ${LOWEST_PRICES_NOTE}` : ''}`}
                </div>
            ) : null}
        </>
    )
}

/** The strip of the computer. */
export function Totals({ known, controller }: { known: ValueView; controller: InventoryController }) {
    const { totals, money } = known
    return (
        <div id="inventoryTotals" className="glass-panel p-4 mb-6 flex flex-wrap items-center gap-4">
            <Part id="owned" label={t('inventory.totals.owned')} total={totals.owned} money={money} note={ownedNote(totals.owned)} />
            <Part id="to-buy" label={t('inventory.totals.toBuy')} total={totals.toBuy} money={money} note={toBuyNote(totals.toBuy)} />
            <CurrencyButtons money={money} onChoose={(code) => controller.handleCurrencyChoice(code)} />
            <Notes known={known} />
        </div>
    )
}

/** The two short rows of the phone: «Owned $1,948» and «To buy $611» one above the other, the currency at their right, and under them the credit and the button of the sheet. */
export function PhoneTotals({ known, controller, onAbout }: { known: ValueView; controller: InventoryController; onAbout: () => void }) {
    const { totals, money } = known
    const line = (id: string, label: string, total: Total) => (
        <div className="inv-values__total" data-total={id}><span className="inv-values__label">{label}</span> <span className="inv-values__sum" data-role="sum">{totalText(total, money)}</span></div>
    )
    return (
        <div id="inventoryTotals" className="inv-values">
            <div className="inv-values__row">
                <div className="inv-values__totals">{line('owned', t('inventory.phone.owned'), totals.owned)}{line('to-buy', t('inventory.phone.toBuy'), totals.toBuy)}</div>
                <span id="currencySelector" className="phone-segmented inv-values__currency" role="group" aria-label={t('inventory.totals.currency')}>
                    {CURRENCIES.map((code: string) => (
                        <button key={code} type="button" data-currency={code} className={`phone-segmented__option${code === money.currency ? ' is-on' : ''}`} aria-pressed={code === money.currency} disabled={!usable(code, money)} onClick={() => controller.handleCurrencyChoice(code)}>{code}</button>
                    ))}
                </span>
            </div>
            {money.ratesMissing ? <div className="inv-values__note" data-role="rates-missing" role="status">{RATES_MISSING_TEXT}</div> : null}
            <div className="inv-values__foot">
                {known.discogsShown ? <a className="inv-values__credit" data-role="discogs-credit" href="https://www.discogs.com/" target="_blank" rel="noopener">{DISCOGS_CREDIT}</a> : null}
                <button type="button" className="inv-values__about" data-values-about="true" aria-haspopup="dialog" onClick={onAbout}>{known.sellerSettingsMissing ? t('inventory.phone.why') : t('inventory.phone.about')}</button>
            </div>
        </div>
    )
}
