/**
 * F83 wave 6c (REQ-08): the sentences the models of the inventory used to write are said by `i18n/inventoryTexts.js` from the dictionary.
 *
 * What it proves: every key the file asks for exists in both dictionaries (and a plural has both forms); the English is the English of
 * before (the longer sentences are held here word for word, the rest in test/models/inventory*.test.js, which ask the same layer); and
 * in Portuguese the names of the statuses and of the orders, the labels and the notices of a run, the question of the series and the
 * end of the ratings come out in Portuguese, with the plural of the language, the numbers and the names kept. What it does not prove:
 * that the Portuguese is the one the owner wants (it is a proposal: the file says so).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import { setLocale, PREVIEW_KEY } from '../../public/js/i18n/t.js'
import { inventory as inventoryEn } from '../../public/js/i18n/en/inventory.js'
import { inventory as inventoryPt } from '../../public/js/i18n/pt/inventory.js'
import {
    statusLabel, statusCountLabel, statusChangeMessage, statusFilterOptions, statusSelectOptions, sortOptions, failureText, noValueText, valueLabel,
    discogsHint, discogsKindNote, lowestPricesNote, ratesMissingText, ownedNote, toBuyNote, rateNote, buyLinksNote, sellTradeSoon, valuesProgressText,
    readingNotice, waitingNotice, valuesOutcome, unkeptValueText, readFailedText, confirmationText, nothingToAddText, progressText, outcomeText,
    ratingsQuestion, ratingsProgressText, ratingsOutcome
} from '../../public/js/i18n/inventoryTexts.js'
import { DISCOGS_CREDIT } from '../../public/js/models/inventoryValue.js'
import { emptyCount } from '../../public/js/models/inventoryValueRun.js'

describe('every key the texts of the inventory ask for is in both dictionaries', () => {
    const source = fs.readFileSync('public/js/i18n/inventoryTexts.js', 'utf8')
    const keys = [...new Set([...source.matchAll(/'(inventory\.[A-Za-z.]+)'/g)].map(match => match[1]))]
    const known = (dictionary, key) => key in dictionary || (`${key}.one` in dictionary && `${key}.other` in dictionary)

    it('found the keys, and each has its English and its Portuguese text', () => {
        expect(keys.length).toBeGreaterThan(80)
        expect(keys.filter(key => !known(inventoryEn, key))).toEqual([])
        expect(keys.filter(key => !known(inventoryPt, key))).toEqual([])
    })
})

describe('in English the texts are the ones the models wrote', () => {
    it('the statuses, the order, the counts and the options', () => {
        expect(['owned', 'not-owned', 'wishlist', 'sold'].map(statusLabel)).toEqual(['Owned', 'Not Owned', 'Wishlist', 'Not Owned'])
        expect(statusCountLabel('owned', 3)).toBe('✓ 3 Owned')
        expect(statusChangeMessage('wishlist')).toBe('Moved to Wishlist')
        expect(statusFilterOptions().map(option => option.label)).toEqual(['All', 'Owned', 'Not Owned', 'Wishlist'])
        expect(statusSelectOptions().map(option => option.label)).toEqual(['Not Owned', '✓ Owned', '♡ Wishlist'])
        expect(sortOptions().map(option => option.label)).toEqual([
            'Artist (A-Z)', 'Artist (Z-A)', 'Avg Rating (↓)', 'Avg Rating (↑)', 'Avg Pop (↓)', 'Avg Pop (↑)', 'Value (↓)', 'Value (↑)', 'Newest', 'Oldest'
        ])
    })

    it('the values: a failure, a reason, the label, the kind, the notes of the totals and of the links', () => {
        expect(failureText('token_refused')).toBe('Discogs refused the token')
        expect(failureText('whatever')).toBe('The value could not be read')
        expect(noValueText({ origin: null, reason: 'source_off' })).toBe('No value yet')
        expect(noValueText({ origin: null, reason: 'no_cd_edition' })).toBe('No CD edition found')
        expect(noValueText({ origin: null, reason: 'failed', failure: 'sign_in' })).toBe('Sign in to read values')
        expect(valueLabel({ owned: true })).toBe('In my collection · worth')
        expect(discogsKindNote({ basis: 'lowest_for_sale' })).toBe('Lowest asking price for this CD edition on Discogs')
        expect(discogsHint({ readAt: '2026-11-18T14:05:00.000Z' })).toMatch(/^Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition, read on 18 Nov 2026, \d\d:\d\d\.$/)
        expect(discogsHint({ readAt: 'bad' })).toBe('Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition.')
        expect(lowestPricesNote()).toBe('Discogs values are lowest asking prices for now.')
        expect(ratesMissingText()).toBe('Exchange rates are not available: values are shown in USD.')
        expect(ownedNote({ valued: 3, total: 14 })).toBe('3 of 14 owned albums have a value')
        expect(toBuyNote({ valued: 9, total: 197 })).toBe('9 of 197 albums have a value')
        expect(rateNote('BRL', { BRL: 5.89 })).toBe("Converted from USD at today's rate (1 USD = 5.89 BRL).")
        expect(buyLinksNote()).toBe('Each link opens the store on this album, on CD. The app earns nothing from these links today.')
        expect(sellTradeSoon()).toBe('Selling and trading between collectors: not in the app yet')
    })

    it('"Update values": the button, the two notices and the end', () => {
        expect(valuesProgressText({ done: 86, total: 211 })).toBe('Reading values… 86 of 211')
        expect(readingNotice({ done: 86, total: 211 })).toEqual({ strong: 'Reading values… 86 of 211.', rest: 'You can keep using the inventory. This takes about 13 minutes for 211 albums.', action: 'Stop' })
        expect(readingNotice({ done: 0, total: 1 }).rest).toBe('You can keep using the inventory. This takes about a minute for 1 album.')
        expect(waitingNotice(1)).toEqual({ strong: '1 album is waiting for a value.', rest: 'Reading it takes about a minute.', action: 'Read it now' })
        expect(waitingNotice(2)).toEqual({ strong: '2 albums are waiting for a value.', rest: 'Reading them takes about a minute.', action: 'Read them now' })
        expect(valuesOutcome({ ...emptyCount(211), done: 211, read: 180, noEdition: 12, noSuggestion: 4, failed: { no_answer: 10, limit: 5 } })).toEqual({
            ok: false,
            text: 'Values read for 180 of 211 albums. 12 albums have no CD edition on Discogs. Discogs suggests no price for 4 albums. 15 albums could not be read: Discogs did not answer (10), Discogs limit reached (5).'
        })
        expect(valuesOutcome({ ...emptyCount(1), done: 1, read: 0, noEdition: 1, unkept: 1, stopped: 'off' }).text).toBe(
            'Values read for 0 of 1 album. 1 album has no CD edition on Discogs. 1 value could not be saved to your inventory. This browser keeps it for six hours; Update values tries to save it again. Discogs values were turned off on the server, so the reading stopped.'
        )
        expect(unkeptValueText()).toBe('The value was read but not saved to your inventory. This browser keeps it for six hours; Update values tries to save it again.')
        expect(readFailedText('limit')).toBe('Discogs limit reached. The value was not read.')
    })

    it('"Add the albums of my series" and "Update ratings"', () => {
        const plan = { toAdd: [{}, {}], seriesCount: 3, alreadyThere: 1, repeated: 2, incomplete: 1 }
        expect(confirmationText(plan)).toBe('2 albums from your 3 series will be added as Not Owned. 1 album already in your inventory stays as it is. 2 entries that repeat an album of another series are added once. 1 entry with no artist or no title is left out.')
        expect(nothingToAddText({ alreadyThere: 0 })).toBe('Your series have no albums to add. Nothing was added.')
        expect(progressText({ added: 0, total: 1 })).toBe('Adding 1 album…')
        expect(progressText({ added: 4, total: 9 })).toBe('Adding albums… 4 of 9')
        expect(outcomeText({ added: 3, total: 3, error: null, reloaded: false })).toEqual({ ok: true, text: 'Added 3 albums as Not Owned. Reload the page to see them.' })
        expect(outcomeText({ added: 2, total: 5, error: 'x' }).text).toBe('Added 2 of 5 albums as Not Owned, then a write failed. 3 albums were not added: run the action again to add the rest.')
        expect(ratingsQuestion(211)).toEqual({ title: 'Update ratings?', message: 'Read the ratings of 211 albums? This can take a few minutes.', confirmText: 'Read ratings' })
        expect(ratingsProgressText({ phase: 'saving' })).toBe('Saving ratings…')
        expect(ratingsOutcome({ total: 1, planned: 1, saved: 1, error: null, notFound: 0, withoutRatings: 1, popularityNotConnected: 1, unanswered: 1, covers: 1 }).text).toBe(
            'Ratings updated for 1 of 1 album. 1 album had no ratings at its sources. Spotify is not connected: popularity was not read for 1 album. A source did not answer for 1 album: the numbers it had before were kept. 1 album got its cover.'
        )
    })
})

describe('in Portuguese the same codes come out in Portuguese', () => {
    beforeEach(async () => { window.localStorage.setItem(PREVIEW_KEY, 'pt'); expect(await setLocale('pt')).toBe(true) })
    afterEach(async () => { window.localStorage.removeItem(PREVIEW_KEY); await setLocale('en') })

    it('the statuses, the orders and the labels of a value', () => {
        expect(statusCountLabel('owned', 3)).toBe('✓ 3 Tenho')
        expect(statusFilterOptions().map(option => option.label)).toEqual(['Todos', 'Tenho', 'Não tenho', 'Desejos'])
        expect(statusChangeMessage('wishlist')).toBe('Movido para a lista de desejos')
        expect(sortOptions().map(option => option.label).slice(0, 3)).toEqual(['Artista (A-Z)', 'Artista (Z-A)', 'Nota média (↓)'])
        expect(noValueText({ origin: null, reason: 'waiting' })).toBe('Esperando um valor')
        expect(noValueText({ origin: null, reason: 'failed', failure: 'limit' })).toBe('Limite do Discogs atingido')
        expect(valueLabel({ owned: null })).toBe('Ainda não é meu · custa')
        expect(ownedNote({ valued: 3, total: 14 })).toBe('3 de 14 álbuns que tenho têm valor')
    })

    it('the notices of a run say the numbers and the plural in Portuguese', () => {
        expect(waitingNotice(1)).toEqual({ strong: '1 álbum está esperando um valor.', rest: 'Ler leva cerca de um minuto.', action: 'Ler agora' })
        expect(waitingNotice(2).strong).toBe('2 álbuns estão esperando um valor.')
        expect(readingNotice({ done: 86, total: 211 }).rest).toBe('Você pode continuar usando o inventário. Isso leva cerca de 13 minutos para 211 álbuns.')
        expect(valuesOutcome({ ...emptyCount(211), done: 211, read: 180, noEdition: 12, failed: { no_answer: 10, limit: 5 } }).text).toBe(
            'Valores lidos para 180 de 211 álbuns. 12 álbuns não têm edição em CD no Discogs. 15 álbuns não puderam ser lidos: O Discogs não respondeu (10), Limite do Discogs atingido (5).'
        )
        expect(readFailedText('sign_in')).toBe('Entre para ler os valores. O valor não foi lido.')
    })

    it('the question of the series, its end, and the ratings', () => {
        expect(confirmationText({ toAdd: [{}], seriesCount: 2, alreadyThere: 0, repeated: 0, incomplete: 0 })).toBe('1 álbum das suas 2 séries será adicionado como Não tenho.')
        expect(outcomeText({ added: 2, total: 5, error: 'x' }).text).toBe('2 de 5 álbuns adicionados como Não tenho; depois uma gravação falhou. 3 álbuns não foram adicionados: rode a ação de novo para adicionar o resto.')
        expect(ratingsQuestion(30).confirmText).toBe('Ler notas')
        expect(ratingsOutcome({ total: 5, planned: 5, saved: 5, error: null, notFound: 0, withoutRatings: 0, popularityNotConnected: 5, unanswered: 0 }).text).toBe(
            'Notas atualizadas para 5 de 5 álbuns. O Spotify não está conectado: a popularidade não foi lida para 5 álbuns.'
        )
    })

    it('the credit the terms of Discogs ask for stays English in Portuguese, and is in no dictionary', () => {
        expect(DISCOGS_CREDIT).toBe('Data provided by Discogs.')
        expect(Object.values(inventoryPt).some(text => text.includes('Data provided by Discogs'))).toBe(false)
        expect(Object.values(inventoryEn).some(text => text.includes('Data provided by Discogs'))).toBe(false)
    })
})
