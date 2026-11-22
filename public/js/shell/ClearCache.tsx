/**
 * ClearCache - «Clear album cache» asks first (finding 20 of the UX audit), clears, says so and loads the app again. One place for the two menus
 * that offer it: the phone's sheet and the computer's panel (F88; F83 sync of main: was components/navigation/clearCache.js). A bottom sheet
 * (the motor of the phone's Sheet, ui/SheetWindow) with the question, «Cancel» and «Clear cache».
 */
import { useState } from 'react'
import { useSheetWindow } from '../ui/SheetWindow'
import toast from '../stores/toasts.js'
import { t } from '../i18n/t.js'
import { useShell } from './context'

function ClearCacheMessage() {
    return <p className="phone-menu__message">{t('shell.menu.clearMessage')}</p>
}

/** The two buttons of the question: «Cancel», and «Clear cache», which clears, says so and loads the app again. */
function ClearCacheActions({ close }: { close: () => void }) {
    const { clearCaches, reload } = useShell()
    const [busy, setBusy] = useState(false)
    const clear = async () => {
        setBusy(true)
        try {
            // Only the album caches: the logins and the choices of the screens stay
            await clearCaches()
        } catch (error) {
            console.error('[PhoneMenu] Clear cache failed:', error)
            toast.error(t('shell.menu.clearFailed'))
            setBusy(false)
            return
        }
        close()
        toast.success(t('shell.menu.cleared'))
        setTimeout(reload, 1000)
    }
    return (
        <>
            <button type="button" className="btn btn-secondary" onClick={close}>{t('shell.menu.cancel')}</button>
            <button type="button" className="btn btn-danger" data-action="clear-cache" disabled={busy} onClick={clear}>{t('shell.menu.clear')}</button>
        </>
    )
}

/** The sheet with the question; `layer` is where it is drawn: put it in the part that asks. */
export function useClearCacheQuestion() {
    const question = useSheetWindow()
    const ask = () => question.show({
        id: 'phone-clear-cache',
        title: t('shell.menu.clearTitle'),
        closeLabel: t('shell.sheet.close'),
        render: () => <ClearCacheMessage />,
        footer: (close) => <ClearCacheActions close={close} />
    })
    return { ask, layer: question.layer }
}
