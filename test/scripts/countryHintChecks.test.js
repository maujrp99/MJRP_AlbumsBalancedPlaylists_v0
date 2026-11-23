// @vitest-environment node
/**
 * F81 (the judge's P2-8): the publication checks the country hint. Firebase Hosting answers a missing file with app.html and status 200,
 * so a build without dist/country.json or dist/geo/ALL_br/country.json would publish quietly and every visitor would fall to the language
 * of the browser. `verify_build` (scripts/lib/site-build.sh, shared by the production and the preview publication) refuses such a build,
 * and `verify_production` (scripts/deploy-site.sh) reads the live /country.json.
 *
 * The shell functions are run for real, sourced from the two libraries, on a folder made here.
 */
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { countryHintFiles } from '../../scripts/countryHint.mjs'

const root = path.resolve(__dirname, '../..')
const made = []
afterAll(() => made.forEach(dir => fs.rmSync(dir, { recursive: true, force: true })))

/** A dist/ with the files given (path -> text). */
function distWith(files) {
    const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'f81-hint-'))
    made.push(dir)
    for (const [file, body] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
        fs.writeFileSync(path.join(dir, file), body)
    }
    return dir
}
const sourced = (call, args = [], input = '') => spawnSync('bash', ['-c', `set -euo pipefail; . "${root}/scripts/lib/deploy-common.sh"; . "${root}/scripts/lib/site-build.sh"; ${call}`, 'bash', ...args], { encoding: 'utf8', input })
const check = (files) => sourced('verify_country_hint "$1"', [distWith(files)])

describe('the build verification checks the country hint (F81)', () => {
    it('passes on the two files the build writes', () => {
        const run = check(countryHintFiles())
        expect(run.status, run.stderr).toBe(0)
        expect(run.stdout).toMatch(/ok: the country hint/)
    })

    it.each([
        ['the common file is missing', { 'geo/ALL_br/country.json': '{"country":"br"}\n' }, /dist\/country\.json/],
        ['the file of Brazil is missing', { 'country.json': '{"country":""}\n' }, /dist\/geo\/ALL_br\/country\.json/],
        ['the common file is not JSON', { 'country.json': '<!doctype html>', 'geo/ALL_br/country.json': '{"country":"br"}\n' }, /dist\/country\.json/],
        ['the common file has no country', { 'country.json': '{}', 'geo/ALL_br/country.json': '{"country":"br"}\n' }, /dist\/country\.json/],
        ['the common file names a country', { 'country.json': '{"country":"br"}', 'geo/ALL_br/country.json': '{"country":"br"}\n' }, /dist\/country\.json/],
        ['the file of Brazil does not say Brazil', { 'country.json': '{"country":""}', 'geo/ALL_br/country.json': '{"country":""}\n' }, /dist\/geo\/ALL_br\/country\.json/],
        ['the country is not text', { 'country.json': '{"country":7}', 'geo/ALL_br/country.json': '{"country":"br"}\n' }, /dist\/country\.json/]
    ])('refuses the build when %s', (_name, files, names) => {
        const run = check(files)
        expect(run.status).toBe(1)
        expect(run.stderr).toMatch(/ERROR/)
        expect(run.stderr).toMatch(names)
    })

    it('reads a hint from what a server answered: the country, or a refusal for anything that is not the hint', () => {
        expect(sourced('country_hint_of', [], '{"country":"br"}\n')).toMatchObject({ status: 0, stdout: 'br' })
        expect(sourced('country_hint_of', [], '{"country":""}')).toMatchObject({ status: 0, stdout: '' })
        expect(sourced('country_hint_of', [], '{"country":"BR"}')).toMatchObject({ status: 0, stdout: 'br' })
        for (const answer of ['<!doctype html><html></html>', '', '{}', '{"country":7}', '[]', 'null']) expect(sourced('country_hint_of', [], answer).status, answer).not.toBe(0)
    })

    it('verify_build calls it, so the production AND the preview publication run it', () => {
        const shared = fs.readFileSync(path.join(root, 'scripts/lib/site-build.sh'), 'utf8')
        expect(shared.slice(shared.indexOf('verify_build() {'), shared.indexOf('\n}\n', shared.indexOf('verify_build() {')))).toMatch(/^\s+verify_country_hint "\$dist"$/m)
    })
})

describe('the production verification reads the live hint (F81)', () => {
    const script = fs.readFileSync(path.join(root, 'scripts/deploy-site.sh'), 'utf8')
    const body = script.slice(script.indexOf('verify_production() {'), script.indexOf('\n}\n', script.indexOf('verify_production() {')))

    it('asks the site for /country.json and stops, with the way back, when the answer is not the hint', () => {
        expect(body).toMatch(/"\$SITE_URL\/country\.json"/)
        expect(body).toMatch(/country_hint_of/)
        expect(body).toMatch(/print_rollback; die "the live \/country\.json/)
    })

    it('asks again as a visitor in Brazil (the test cookie of Firebase Hosting) and warns when the answer is not Brazil', () => {
        expect(body).toMatch(/firebase-country-override=br/)
        expect(body).toMatch(/warn "the live \/country\.json does not answer Brazil/)
    })
})
