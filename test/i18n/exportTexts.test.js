/**
 * F98 (UAT-307, UAT-308): the sentences of the two exports and of the «loading is paused» notice exist in English and in Portuguese, in the
 * voice of the product, and the files that say them (i18n/exportTexts.js, i18n/holdTexts.js) turn the codes of the services and of the
 * model into the words of the language spoken. What it does not prove: that the Portuguese is the one the owner wants (he approves texts in
 * the Painel).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { exportWindow as en } from '../../public/js/i18n/en/exportWindow.js'
import { exportWindow as pt } from '../../public/js/i18n/pt/exportWindow.js'
import { notices as noticesEn } from '../../public/js/i18n/en/notices.js'
import { notices as noticesPt } from '../../public/js/i18n/pt/notices.js'
import { setLocale, PREVIEW_KEY } from '../../public/js/i18n/t.js'
import { appleProgressText, appleSummaryNotice, appleFailureText } from '../../public/js/i18n/exportTexts.js'
import { holdNoticeText } from '../../public/js/i18n/holdTexts.js'
import { HoldReason, holdNotice } from '../../public/js/models/albumLoadState.js'

const NEW = (dictionary) => Object.keys(dictionary).filter(key => /^(appleReport|exportReport)\.|^spotifyWindow\.(progress|failure)\.|^notices\.(hold|export\.(apple|authorizing|folder|exporting))/.test(key))
const inPortuguese = async () => { localStorage.setItem(PREVIEW_KEY, 'pt'); expect(await setLocale('pt')).toBe(true) }

afterEach(async () => { await setLocale('en'); localStorage.removeItem(PREVIEW_KEY) })

describe('the texts of the exports and of the paused load (F98)', () => {
    it('there are new keys, the same in both languages', () => {
        expect(NEW(en).length).toBeGreaterThan(40)
        expect(NEW(noticesEn).length).toBeGreaterThanOrEqual(15)
        expect(NEW(pt).sort()).toEqual(NEW(en).sort())
        expect(NEW(noticesPt).sort()).toEqual(NEW(noticesEn).sort())
    })

    it('every new sentence is written in Portuguese, not carried over in English', () => {
        const same = [...NEW(en).filter(key => pt[key] === en[key]), ...NEW(noticesEn).filter(key => noticesPt[key] === noticesEn[key])]
        // a name with a detail has no word to translate
        expect(same).toEqual(['appleReport.failedItem'])
    })

    it('the product is named in full and with no article before it, and Portuguese never says «disco»', () => {
        const all = [...NEW(pt).map(key => pt[key]), ...NEW(noticesPt).map(key => noticesPt[key]), pt['spotifyWindow.refusedNote'], pt['spotifyWindow.refused']].join(' ')
        const english = [...NEW(en).map(key => en[key]), ...NEW(noticesEn).map(key => noticesEn[key]), en['spotifyWindow.refusedNote']].join(' ')
        expect(all.replace(/The Album Blender/g, '')).not.toMatch(/Blender/)
        expect(english.replace(/The Album Blender/g, '')).not.toMatch(/Blender/)
        expect(all).not.toMatch(/\b(o|do|no|ao|pelo) The Album Blender/i)
        expect(all).not.toMatch(/disco/i)
    })

    it('the refusal of Apple Music names the next step and never says «not found»', () => {
        expect(en['appleReport.failure.refusedNote']).toMatch(/subscription is active/)
        expect(en['appleReport.failure.refusedNote']).toMatch(/connect again/)
        expect(pt['appleReport.failure.refusedNote']).toMatch(/assinatura do Apple Music está ativa/)
        const refusal = ['appleReport.failure.refused', 'appleReport.failure.refusedNote', 'appleReport.failure.unchecked', 'appleReport.failure.unreachable']
        expect(refusal.map(key => `${en[key]} ${pt[key]}`).join(' ')).not.toMatch(/not found|não encontrad/i)
    })

    describe('the two texts of the refusal of Spotify the judge of F97 left (REQ-07)', () => {
        it('English says «only a few places»', () => {
            expect(en['spotifyWindow.refusedNote']).toContain('the list has only a few places')
            expect(en['spotifyWindow.refusedNote']).not.toContain('the list has few places')
        })

        it('the text is true for any 403: it names the test list as the most likely reason, not as the fact', () => {
            expect(en['spotifyWindow.refused']).toBe('Spotify did not allow this for your account')
            expect(pt['spotifyWindow.refused']).toBe('O Spotify não permitiu isto para a sua conta')
            expect(en['spotifyWindow.refusedNote']).toMatch(/The most likely reason: The Album Blender is in a limited test phase/)
            expect(pt['spotifyWindow.refusedNote']).toMatch(/O motivo mais provável: no Spotify, The Album Blender está numa fase de testes limitada/)
        })

        it('the step «ask the owner to add your e-mail» stays, in both languages', () => {
            expect(en['spotifyWindow.refusedNote']).toMatch(/Ask the owner of The Album Blender to add the e-mail of your Spotify account/)
            expect(pt['spotifyWindow.refusedNote']).toMatch(/Peça a quem cuida de The Album Blender para incluir o e-mail da sua conta do Spotify/)
        })
    })
})

describe('the words of the Apple Music export (i18n/exportTexts.js)', () => {
    it('the progress, step by step, in English', () => {
        expect(appleProgressText({ step: 'connecting' })).toBe('Connecting...')
        expect(appleProgressText({ step: 'authorizing' })).toBe('Authorizing...')
        expect(appleProgressText({ step: 'folder' })).toBe('Creating folder...')
        expect(appleProgressText({ step: 'exporting', name: '1. Mix - Hits' })).toBe('Exporting 1. Mix - Hits...')
    })

    it('the progress in Portuguese; the name of the playlist is never translated', async () => {
        await inPortuguese()
        expect(appleProgressText({ step: 'authorizing' })).toBe('Autorizando...')
        expect(appleProgressText({ step: 'exporting', name: '1. Mix - Hits' })).toBe('Exportando 1. Mix - Hits...')
    })

    it('each failure has its sentence in both languages', async () => {
        const kinds = ['not-configured', 'authorization', 'refused', 'unchecked', 'not-found', 'unreachable', 'error']
        const english = kinds.map(kind => appleFailureText({ kind }))
        await inPortuguese()
        const portuguese = kinds.map(kind => appleFailureText({ kind }))
        expect(new Set(english).size).toBe(kinds.length)
        english.forEach((text, index) => { expect(portuguese[index]).not.toBe(text); expect(text).not.toMatch(/^appleReport\./) })
    })

    it('what Apple Music itself said goes inside a sentence of the app', async () => {
        expect(appleFailureText({ kind: 'error', detail: 'network down' })).toBe('The export to Apple Music did not start: network down')
        await inPortuguese()
        expect(appleFailureText({ kind: 'error', detail: 'network down' })).toBe('A exportação para o Apple Music não começou: network down')
    })

    it('the notice of an export nobody was there to read, in Portuguese', async () => {
        await inPortuguese()
        expect(appleSummaryNotice({ created: [{ alreadyThere: false }], failed: [], empty: [], notCreated: [], notFound: [], unchecked: 0, failure: null }))
            .toEqual({ type: 'success', text: '1 playlist exportada para o Apple Music.' })
        expect(appleSummaryNotice({ created: [], failed: [], empty: [], notCreated: ['a'], notFound: [], unchecked: 2, failure: { kind: 'unchecked' } }))
            .toEqual({ type: 'error', text: 'Não foi possível falar com o Apple Music, então as suas faixas não puderam ser conferidas. Nada foi criado.' })
    })
})

describe('the words of the paused load (i18n/holdTexts.js, UAT-308)', () => {
    const at = () => '10:30'

    it('the English is the English the model used to write, word for word', () => {
        expect(holdNoticeText(holdNotice({ reason: HoldReason.UNAUTHORIZED, until: null }), at)).toBe('Your sign-in could not be confirmed. Sign in again to keep loading ratings.')
        expect(holdNoticeText(holdNotice({ reason: HoldReason.SOURCE_BUSY, until: 1000 }), at)).toBe('The ratings source asked to slow down. Loading ratings is paused. It resumes by itself at 10:30.')
        expect(holdNoticeText(holdNotice({ reason: HoldReason.SPOTIFY_BUSY, until: 1000 }), at)).toBe('Spotify asked to slow down. Loading popularity is paused. It resumes by itself at 10:30.')
        expect(holdNoticeText(holdNotice({ reason: HoldReason.RATE_LIMITED, until: 1000 }), at)).toBe('The server asked to slow down. Loading is paused. It resumes by itself at 10:30.')
        expect(holdNoticeText(holdNotice({ reason: HoldReason.RATE_LIMITED, until: null }), at)).toBe('The server asked to slow down. Loading is paused.')
    })

    it('in Portuguese every one of them is Portuguese', async () => {
        await inPortuguese()
        const texts = Object.values(HoldReason).map(reason => holdNoticeText(holdNotice({ reason, until: 1000 }), at))
        expect(texts.join(' ')).not.toMatch(/asked|paused|resumes|Sign in|Loading/i)
        expect(holdNoticeText(holdNotice({ reason: HoldReason.SPOTIFY_BUSY, until: 1000 }), at)).toBe('O Spotify pediu para ir mais devagar. O carregamento da popularidade está em pausa. Volta sozinho às 10:30.')
        expect(holdNoticeText(holdNotice({ reason: HoldReason.UNAUTHORIZED, until: null }), at)).toBe('Não foi possível confirmar o seu login. Entre de novo para continuar carregando as notas.')
    })

    it('never says an album failed: a hold is not a failure', async () => {
        for (const reason of Object.values(HoldReason)) expect(holdNoticeText(holdNotice({ reason, until: null }), at)).not.toMatch(/fail/i)
        await inPortuguese()
        for (const reason of Object.values(HoldReason)) expect(holdNoticeText(holdNotice({ reason, until: null }), at)).not.toMatch(/falh/i)
    })
})
