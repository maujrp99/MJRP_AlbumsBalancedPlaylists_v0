/**
 * ItemForm - the body that the window to edit an item of the inventory and the window to add an album to it share (F83 wave 6b; the port of the two
 * hand-made windows, components/InventoryEditModal.js and InventoryAddModal.js, with the same HTML and the same classes): who the album is, its
 * format, the currency (BRL or USD), the price paid and the notes. The two differ in a few words and ids, and in what they start from.
 *
 * What the person types goes into `draft`, an object the window keeps (the footer reads it when «Save» is pressed): the fields are the browser's
 * own, not controlled by React (the hand-made ones were not), so what is typed is never written over. The only thing drawn from a change is the
 * prefix of the price in the window to add (R$ or $).
 */
import { useState } from 'react'
import { t } from '../../i18n/t.js'

/** What the person has chosen and typed, kept by the window that holds the form. */
export interface ItemDraft {
    format: string
    currency: string
    price: number | null
    notes: string
}

const FORMATS = ['cd', 'vinyl', 'cassette', 'dvd', 'bluray', 'digital']
const LABEL = 'block mb-2 text-sm font-medium text-gray-300'

/** What differs between the window to edit and the window to add: the ids, the names of the fields and the words. */
const KINDS = {
    edit: { format: 'edit-format', currency: 'edit-currency', notes: 'inventory.form.notesEdit', placeholder: 'inventory.form.notesEditPlaceholder' },
    add: { format: 'add-format', currency: 'add-currency', notes: 'inventory.form.notesAdd', placeholder: 'inventory.form.notesAddPlaceholder' }
}

export interface ItemFormProps {
    mode: 'edit' | 'add'
    draft: ItemDraft
    title: string
    /** The second line of the header: the artist (the window to add also says the year). */
    subtitle: string
    /** An item with no format (it came from a series, F71) shows «Not set» until the person chooses one: saving its notes invents no format. */
    allowNotSet?: boolean
    /** What the price field holds when the window opens (the window to edit). */
    initialPrice?: number | null
}

function FormatField({ id, adding, draft, allowNotSet }: { id: string; adding: boolean; draft: ItemDraft; allowNotSet: boolean }) {
    return (
        <div className="mb-4">
            <label className={LABEL} htmlFor={id}>
                {adding ? <>{`${t('inventory.form.format')} `}<span className="text-accent-primary">*</span></> : t('inventory.form.format')}
            </label>
            <select className="form-control w-full" id={id} defaultValue={draft.format} onChange={(event) => { draft.format = event.target.value }}>
                {allowNotSet ? <option value="">{t('inventory.form.notSet')}</option> : null}
                {FORMATS.map(value => <option key={value} value={value}>{t(`inventory.form.format.${value}`)}</option>)}
            </select>
        </div>
    )
}

function CurrencyField({ name, draft, onChosen }: { name: string; draft: ItemDraft; onChosen: (currency: string) => void }) {
    const radio = (value: string) => (
        <label key={value} className="flex items-center gap-2 cursor-pointer">
            <input
                type="radio"
                name={name}
                value={value}
                defaultChecked={draft.currency === value}
                className="form-radio text-accent-primary focus:ring-accent-primary"
                onChange={(event) => { if (event.target.checked) { draft.currency = value; onChosen(value) } }}
            />
            <span>{value}</span>
        </label>
    )
    return (
        <div className="mb-4">
            <label className={LABEL}>{t('inventory.form.currency')}</label>
            <div className="flex gap-4">{radio('BRL')}{radio('USD')}</div>
        </div>
    )
}

function PriceField({ draft, prefix, initial }: { draft: ItemDraft; prefix: string | null; initial: number | null }) {
    const input = (
        <input
            type="number"
            className={`form-control w-full${prefix ? ' pl-10' : ''}`}
            step="0.01"
            min="0"
            placeholder="0.00"
            defaultValue={initial ?? undefined}
            onInput={(event) => { draft.price = event.currentTarget.value ? parseFloat(event.currentTarget.value) : null }}
        />
    )
    return (
        <div className="mb-4">
            <label className={LABEL}>{t('inventory.form.price')}</label>
            {prefix ? <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{prefix}</span>{input}</div> : input}
        </div>
    )
}

function NotesField({ draft, label, placeholder }: { draft: ItemDraft; label: string; placeholder: string }) {
    return (
        <div className="mb-4">
            <label className={LABEL}>{label}</label>
            <textarea
                className="form-control w-full resize-none"
                rows={3}
                placeholder={placeholder}
                defaultValue={draft.notes}
                onInput={(event) => { draft.notes = event.currentTarget.value }}
            />
        </div>
    )
}

export function ItemForm({ mode, draft, title, subtitle, allowNotSet = false, initialPrice = null }: ItemFormProps) {
    const adding = mode === 'add'
    const kind = KINDS[mode]
    const [currency, setCurrency] = useState(draft.currency)
    return (
        <div>
            <div className="bg-surface-dark p-3 rounded-lg border border-surface-light mb-4">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
            <FormatField id={kind.format} adding={adding} draft={draft} allowNotSet={allowNotSet} />
            <CurrencyField name={kind.currency} draft={draft} onChosen={setCurrency} />
            <PriceField draft={draft} prefix={adding ? (currency === 'USD' ? '$' : 'R$') : null} initial={adding ? null : initialPrice} />
            <NotesField draft={draft} label={t(kind.notes)} placeholder={t(kind.placeholder)} />
            {adding ? <div className="hidden text-sm font-bold text-right px-6 pb-2 whitespace-nowrap" /> : null}
        </div>
    )
}
