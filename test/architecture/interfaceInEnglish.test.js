// @vitest-environment node
/**
 * Fitness function of F63 (UAT-192): the interface of the app speaks one language, English.
 *
 * It reads every string and template of public/js (comments are not read: the tokens come from
 * espree, the parser ESLint uses) and fails on text that is Portuguese:
 *   - a letter with an accent of Portuguese (ã, õ, ç, á, é, í, ó, ú, â, ê, ô, à);
 *   - a word that exists in Portuguese and not in English (a short list, below).
 *
 * It is a pragmatic check, not a translator: Portuguese written with none of those letters or words
 * passes, and it cannot tell a text of the screen from a text of the console (both are checked).
 * A name that is not Portuguese text (an artist, an album, a genre keyword of the catalog, the name
 * of the person in a recipe) goes in ALLOWED, with what it is.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { tokensOf, listSourceFiles } from './support/parseSource.js'

const JS_ROOT = path.join(process.cwd(), 'public/js')

/** Text that has those letters or words and is not Portuguese prose. Each one says what it is. */
const ALLOWED = [
    'eletrônica', // genre keyword as the catalog writes it (album type classifier)
    'electrónica', // the same, in Spanish
    "Zé's", // the owner's name, in the name of his recipes ("Zé's Balanced Playlists")
    "Zé\\'s" // the same, as the source writes it inside single quotes
]

const PORTUGUESE_LETTERS = /[ãõçáéíóúâêôàÃÕÇÁÉÍÓÚÂÊÔÀ]/

/** Words of Portuguese that are not words of English (nor of the code: class names, keys, ids). */
const PORTUGUESE_WORDS = [
    'faixa', 'faixas', 'cada', 'voce', 'selecione', 'curadoria', 'melhores', 'mesclando', 'pessoas',
    'realmente', 'ouvem', 'algoritmo', 'distribui', 'rodizio', 'zigue', 'curtas', 'combinadas',
    'automaticamente', 'versao', 'separada', 'estavel', 'testado', 'comparacao', 'simples',
    'variedade', 'entre', 'favoritas', 'popularidade', 'baseadas', 'aclamadas', 'balanceado',
    'balanceadas', 'revisada', 'hibrida', 'salvar', 'salvo', 'carregando', 'nenhum', 'nenhuma',
    'sucesso', 'aguarde', 'erro', 'falhou', 'tente', 'novamente', 'criar', 'criado', 'criada',
    'excluir', 'remover', 'adicionar', 'cancelar', 'confirmar', 'voltar', 'buscar', 'obrigatorio',
    'vazio', 'vazia', 'aqui', 'agora', 'ainda', 'muito', 'seus', 'suas', 'isso', 'esse', 'essa',
    'pelo', 'pela', 'nao', 'sao', 'uma', 'das', 'dos', 'com', 'sem', 'para', 'mais'
]
// "com", "sem", "para", "das", "dos", "mais" also appear in addresses, names and other languages:
// they count only between two other words of text ("playlists para maxima", never "spotify.com").
const NEEDS_NEIGHBOURS = new Set(['com', 'sem', 'para', 'das', 'dos', 'mais', 'entre', 'uma', 'erro', 'simples'])

const plainWords = PORTUGUESE_WORDS.filter(word => !NEEDS_NEIGHBOURS.has(word))
const PLAIN_WORD = new RegExp(`(?<![\\w./-])(?:${plainWords.join('|')})(?![\\w./-])`, 'i')
const WORD_IN_A_SENTENCE = new RegExp(`[a-z] (?:${[...NEEDS_NEIGHBOURS].join('|')}) [a-z]`, 'i')

/**
 * Where Portuguese may live (F83, F81): only the dictionary of that language. The code speaks English; every visible text
 * comes from the dictionary (the constitution's art. I.2, as amended by the MJRP on 2026-11-21). Everything else is read.
 */
const PORTUGUESE_HOUSE = 'i18n/pt/'

/** Every .js, .ts and .tsx file the check reads, absolute. */
const jsFiles = (dir) => listSourceFiles(dir)
    .filter(file => !file.split(path.sep).join('/').startsWith(PORTUGUESE_HOUSE))
    .map(file => path.join(dir, file))

const withoutAllowed = (text) => ALLOWED.reduce((left, allowed) => left.split(allowed).join(''), text)

/** @returns {string|null} why the text is Portuguese, or null */
export function portugueseIn(text) {
    const checked = withoutAllowed(text)
    if (PORTUGUESE_LETTERS.test(checked)) return 'a letter with a Portuguese accent'
    const word = PLAIN_WORD.exec(checked) || WORD_IN_A_SENTENCE.exec(checked)
    return word ? `the Portuguese word "${word[0].trim()}"` : null
}

function findings(file) {
    const code = fs.readFileSync(file, 'utf8')
    const tokens = tokensOf(code, file)
    return tokens
        .filter(token => token.type === 'String' || token.type === 'Template' || token.type === 'JSXText')
        .map(token => ({ token, why: portugueseIn(token.value) }))
        .filter(found => found.why)
        .map(({ token, why }) => `${path.relative(process.cwd(), file)}:${token.loc.start.line} ${why}: ${token.value.slice(0, 90)}`)
}

describe('the interface speaks English (F63, UAT-192)', () => {
    it('the check itself tells Portuguese from English', () => {
        expect(portugueseIn('Rank #1 de cada álbum')).not.toBeNull()
        expect(portugueseIn('Curadoria MJRP Balanced Cascade')).not.toBeNull()
        expect(portugueseIn('Selecione suas faixas favoritas')).not.toBeNull()
        expect(portugueseIn('distribui faixas em zigue-zague entre as playlists para variedade')).not.toBeNull()
        expect(portugueseIn('S-Draft Balanceado')).not.toBeNull()

        expect(portugueseIn('Rank #1 from each album')).toBeNull()
        expect(portugueseIn("[MJRP] Zé's Balanced Playlists")).toBeNull()
        expect(portugueseIn('https://accounts.spotify.com/authorize?')).toBeNull()
        expect(portugueseIn('flex items-center gap-2 mais-not-a-class')).toBeNull()
        expect(portugueseIn('Failed to connect to Spotify')).toBeNull()
    })

    it('it reads .tsx (F83): Portuguese in a React file is accused; the Portuguese dictionary is the one house for it', () => {
        const fixture = path.join(process.cwd(), 'test/architecture/fixtures/typescript/portugueseText.tsx')
        expect(findings(fixture)).toHaveLength(1)
        const root = path.join(process.cwd(), 'test/architecture/fixtures')
        expect(jsFiles(root).map(file => path.relative(root, file))).toContain('typescript/portugueseText.tsx')
        expect(PORTUGUESE_HOUSE).toBe('i18n/pt/')
    })

    it('no string of public/js is in Portuguese', () => {
        const found = jsFiles(JS_ROOT).flatMap(findings)

        expect(found).toEqual([])
    })
})
