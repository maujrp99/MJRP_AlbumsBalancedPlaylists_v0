/**
 * LanguageRows - the language selector of the app (F81, REQ-04): a title and one row for each language, in the account panel of the computer
 * and in the menu of the phone, made of the rows those two menus already have. Each language is written in its own language (it is how who
 * reads only that one finds it), with its code beside it; the one spoken now carries the mark and `aria-pressed`.
 *
 * Picking one changes the whole app where it is, with no reload (every screen listens to the language: react-bridge/useLocale), sets the
 * page's `lang`, keeps the choice on the device (i18n/language.js) and leaves the focus on the row picked.
 */
import { useId } from 'react'
import { Icon } from '../ui/Icon'
import { t } from '../i18n/t.js'
import { HTML_LANG, chooseLanguage } from '../i18n/language.js'
import { useLocale } from '../react-bridge/useLocale'

/** Portuguese first: the app is born in Brazil. */
const LANGUAGES = ['pt', 'en'] as const
type Language = (typeof LANGUAGES)[number]

const SHAPES = {
    panel: { section: 'top-panel__section', row: 'top-panel__row', icon: 'w-4 h-4' },
    sheet: { section: 'phone-menu__section', row: 'phone-menu__row', icon: 'phone-menu__icon' }
} as const

async function pick(language: Language, row: HTMLButtonElement): Promise<void> {
    await chooseLanguage(language)
    // a click does not give a button the focus in every browser (Safari), and the row is the same element after the change
    row.focus()
}

/** `where`: the menu it is drawn in, whose rows it takes. */
export function LanguageRows({ where }: { where: keyof typeof SHAPES }) {
    const current = useLocale()
    const title = useId()
    const shape = SHAPES[where]
    return (
        <>
            <div className={shape.section} id={title}>{t('shell.lang.title')}</div>
            <div role="group" aria-labelledby={title} data-language-picker="">
                {LANGUAGES.map(language => (
                    <button key={language} type="button" className={`${shape.row} lang-row`} data-lang={language} lang={HTML_LANG[language]} aria-pressed={current === language} onClick={(event) => { void pick(language, event.currentTarget) }}>
                        <Icon name="Check" className={`${shape.icon} lang-row__check`} />
                        <span className="lang-row__name">{t(`shell.lang.${language}`)}</span>
                        <span className="lang-row__code" aria-hidden="true">{language.toUpperCase()}</span>
                    </button>
                ))}
            </div>
        </>
    )
}
