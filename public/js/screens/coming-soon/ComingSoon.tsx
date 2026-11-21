/**
 * ComingSoon - the placeholder screen for what is under development: /artists, /genres, /tracks (F83 wave 0, the canary).
 *
 * It was views/ComingSoonView.js, a template string. It draws the same elements with the same classes (the proof is in
 * test/screens/coming-soon/ComingSoon.test.tsx) and every text comes from the dictionary (i18n/en and i18n/pt, area
 * `comingSoon`). The address of the way back is not a text: it is not translated.
 */
import { Icon } from '../../ui/Icon'
import { useLocale } from '../../react-bridge/useLocale'
import { t } from '../../i18n/t.js'

export type ComingSoonKind = 'artists' | 'genres' | 'tracks'

/** The icon of each feature; the name and the description are in the dictionary under `comingSoon.<kind>`. */
const ICONS: Record<ComingSoonKind, string> = { artists: 'User', genres: 'Tag', tracks: 'Music' }

export function ComingSoon({ kind }: { kind: ComingSoonKind }) {
    useLocale() // draws again when the language changes
    return (
        <div className="container mx-auto px-4 py-16 min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md">
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center mb-6 animate-pulse">
                        <Icon name={ICONS[kind]} className="w-12 h-12 text-orange-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                        {t(`comingSoon.${kind}.name`)}
                    </h1>
                    <p className="text-muted text-lg mb-2">{t(`comingSoon.${kind}.description`)}</p>
                </div>

                <div className="glass-panel rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Icon name="Clock" className="w-5 h-5 text-orange-400" />
                        <span className="text-lg font-semibold">{t('comingSoon.badge')}</span>
                    </div>
                    <p className="text-sm text-muted">{t('comingSoon.message')}</p>
                </div>

                <a href="/albums" className="btn btn-primary" data-link="">
                    <Icon name="ArrowLeft" className="w-4 h-4" />
                    {t('comingSoon.back')}
                </a>
            </div>
        </div>
    )
}
