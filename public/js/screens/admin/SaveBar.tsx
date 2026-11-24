/**
 * The Painel's save bar (F82, REQ-09): the changes not saved with «Salvar» and «Descartar», the confirmation of what goes
 * live, saving, saved and live, refused by the check, failed with the reason, and the conflict between two devices
 * (as it was, the other, yours). The approved prototype is the reference (design/proposals/f82-cms/).
 */
import { t, tPlural } from '../../i18n/t.js'
import type { Locale } from './model'
import type { Panel, SaveState } from './usePanel'

type Conflict = Extract<SaveState, { step: 'conflict' }>

const SHOWN = 4

function Confirm({ panel }: { panel: Panel }) {
    const keys = panel.unsaved
    return (
        <div className="cms-msg conf" role="alertdialog" aria-label={t('admin.confirm.label')} data-state="confirm">
            <b>{tPlural('admin.confirm.title', keys.length, { count: keys.length })}</b>
            <span className="cms-keys">{keys.slice(0, SHOWN).join(' · ')}{keys.length > SHOWN ? ` ${t('admin.confirm.more', { count: keys.length - SHOWN })}` : ''}</span>
            <span className="cms-soft">{t('admin.confirm.note')}</span>
            <div className="cms-acts">
                <button type="button" className="ak-btn pri" data-act="save-confirm" onClick={panel.confirm}>{t('admin.confirm.go')}</button>
                <button type="button" className="ak-btn" data-act="save-back" onClick={panel.back}>{t('admin.confirm.back')}</button>
            </div>
        </div>
    )
}

function ConflictNotice({ state, panel }: { state: Conflict; panel: Panel }) {
    const shown = (text: string | null) => text ?? t('admin.conflict.codeText')
    return (
        <div className="cms-msg conf" role="alert" data-state="conflict">
            <b>{t('admin.conflict.title')}</b>
            {state.conflict.conflicts.map((entry) => (
                <div key={entry.key} className="cms-conflict">
                    <span className="cms-soft">{entry.key} · {t(`admin.lang.${state.locale satisfies Locale}`)}</span>
                    <div className="cms-conflict-grid">
                        <div><small>{t('admin.conflict.loaded')}</small>{shown(entry.loaded)}</div>
                        <div><small>{t('admin.conflict.other')}</small>{shown(entry.other)}</div>
                        <div><small>{t('admin.conflict.yours')}</small>{shown(entry.yours)}</div>
                    </div>
                </div>
            ))}
            <div className="cms-acts">
                <button type="button" className="ak-btn" data-act="conflict-mine" onClick={() => panel.resolve('mine')}>{t('admin.conflict.mine')}</button>
                <button type="button" className="ak-btn" data-act="conflict-theirs" onClick={() => panel.resolve('theirs')}>{t('admin.conflict.theirs')}</button>
            </div>
        </div>
    )
}

/** «Saving…», with the equalizer: the same words for the texts and for the crate. */
export function SavingMessage() {
    return <div className="cms-msg" role="status" data-state="saving"><span className="cms-eq" aria-hidden="true"><i /><i /><i /><i /><i /></span>{t('admin.save.saving')}</div>
}

/** A save that failed, with its reason in plain words and «Try again». */
export function FailedMessage({ reason, detail, onRetry }: { reason: string; detail: string; onRetry: () => void }) {
    return (
        <div className="cms-msg fail" role="alert" data-state="failed">
            <span>{t('admin.save.failed', { reason: t(`admin.save.reason.${reason}`, { detail }) })}</span>
            <button type="button" className="ak-btn sm" data-act="save-retry" onClick={onRetry}>{t('admin.save.retry')}</button>
        </div>
    )
}

function Message({ panel }: { panel: Panel }) {
    const state = panel.save
    switch (state.step) {
        case 'confirm': return panel.unsaved.length ? <Confirm panel={panel} /> : null
        case 'saving': return <SavingMessage />
        case 'saved': return <div className="cms-msg ok" role="status" data-state="saved">✓ {tPlural(state.approved ? 'admin.save.approved' : 'admin.save.saved', state.count, { count: state.count })}</div>
        case 'invalid': return <div className="cms-msg fail" role="alert" data-state="invalid">{tPlural('admin.save.invalid', state.count, { count: state.count })}</div>
        case 'failed': return <FailedMessage reason={state.reason} detail={state.detail} onRetry={panel.confirm} />
        case 'conflict': return <ConflictNotice state={state} panel={panel} />
        default: return null
    }
}

export function SaveBar({ panel }: { panel: Panel }) {
    const count = panel.unsaved.length
    const busy = panel.save.step === 'saving'
    const held = busy || panel.save.step === 'confirm' || panel.save.step === 'conflict'
    return (
        <div className={count ? 'cms-bar has' : 'cms-bar'} data-unsaved={count}>
            <div className="cms-bar-info" aria-live="polite">
                <b>{count ? tPlural('admin.bar.unsaved', count, { count }) : t('admin.bar.saved')}</b>
                <span>{count ? t('admin.bar.unsavedHint') : t('admin.bar.savedHint')}</span>
            </div>
            <div className="cms-acts">
                <button type="button" className="ak-btn pri" data-act="save" disabled={!count || held} onClick={panel.askSave}>{t('admin.bar.save')}</button>
                <button type="button" className="ak-btn" data-act="discard" disabled={!count || busy} onClick={panel.discard}>{t('admin.bar.discard')}</button>
            </div>
            <Message panel={panel} />
        </div>
    )
}
