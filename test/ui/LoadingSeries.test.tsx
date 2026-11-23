/**
 * F79: the way the app says «your series are being read» is ONE piece for the Blend screen and the Albums screen (ui/LoadingSeries.tsx; on `main`
 * components/ui/LoadingSeries.js): the words on the phone, the spinner on the computer. The same markup the Blend always drew, in both dictionaries.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import fs from 'node:fs'
import path from 'node:path'
import { LoadingSeries, loadingSeriesText } from '../../public/js/ui/LoadingSeries'
import { t, setLocale, PREVIEW_KEY } from '../../public/js/i18n/t.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const draw = async (phone: boolean): Promise<HTMLElement> => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    await act(async () => { createRoot(host).render(<LoadingSeries phone={phone} />) })
    return host
}

describe('LoadingSeries, the piece of the Blend and of the Albums screen', () => {
    afterEach(async () => { document.body.innerHTML = ''; await setLocale('en'); window.localStorage.removeItem(PREVIEW_KEY) })

    it('on the computer it is the spinner the Blend always drew', async () => {
        const host = await draw(false)
        expect(host.innerHTML).toBe('<div class="flex items-center justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-2 border-orange-400 border-t-transparent"></div></div>')
    })

    it('on the phone it is «Loading your series…» in words', async () => {
        const host = await draw(true)
        expect(host.textContent).toBe('Loading your series…')
        expect(host.querySelector('.animate-spin')).toBeNull()
        expect(loadingSeriesText()).toBe('Loading your series…')
    })

    it('has a Portuguese text, the one the Blend already had («Carregando as suas séries…»)', async () => {
        window.localStorage.setItem(PREVIEW_KEY, 'pt') // Portuguese is closed in production: only the preview key opens it
        expect(await setLocale('pt')).toBe(true)
        expect(t('ui.loadingSeries.text')).toBe('Carregando as suas séries…')
    })

    it('both screens use it: neither writes the spinner or the words itself', () => {
        const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8')
        for (const file of ['public/js/screens/blend/SeriesStep.tsx', 'public/js/screens/blend/phone/PhoneStep.tsx', 'public/js/screens/albums/SeriesLoading.tsx']) {
            const source = read(file)
            expect(source, file).toContain('ui/LoadingSeries')
            expect(source, file).not.toContain('animate-spin')
            expect(source, file).not.toContain('Loading your series')
        }
    })
})
