/**
 * LoadingSeries - the way the app says «your series are being read» (F79; the port of components/ui/LoadingSeries.js of `main`). The Blend screen
 * and the Albums screen say it with the same words and the same spinner: the words on the phone, the spinner on the computer. One piece for both
 * screens, so the two cannot drift apart.
 */
import { t } from '../i18n/t.js'

/** The words of the phone. */
export const loadingSeriesText = (): string => t('ui.loadingSeries.text')

/** The spinner of the computer (as the Blend screen has always drawn it). */
export function LoadingSeriesSpinner() {
    return (
        <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-400 border-t-transparent"></div>
        </div>
    )
}

/** The words on the phone, the spinner on the computer. */
export function LoadingSeries({ phone }: { phone: boolean }) {
    return phone ? <p className="text-muted text-center py-8">{loadingSeriesText()}</p> : <LoadingSeriesSpinner />
}
