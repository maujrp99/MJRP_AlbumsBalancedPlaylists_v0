/**
 * F87 (slice A, chosen by the MJRP on 2026-11-21): the site can be published on a Firebase Hosting
 * preview channel, apart from production. These tests read the script as text and run only its
 * `--help` and its refusals; none of them deploys anything.
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const scriptPath = path.resolve(__dirname, '../../scripts/deploy-preview.sh')
const read = file => fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8')
const code = () => read('scripts/deploy-preview.sh').split('\n').filter(l => !/^\s*#/.test(l)).join('\n').replace(/\\\n\s*/g, ' ')

describe('the preview deploy script', () => {
    it('exists and is executable', () => {
        expect(fs.existsSync(scriptPath)).toBe(true)
        expect(fs.statSync(scriptPath).mode & 0o111).not.toBe(0)
    })

    it('ends with firebase hosting:channel:deploy, with the channel and --expires 7d', () => {
        expect(code()).toMatch(/firebase hosting:channel:deploy "\$CHANNEL" --expires 7d/)
    })

    it('names the channel by an argument that defaults to staging', () => {
        expect(code()).toMatch(/CHANNEL="staging"/)
    })

    it('never runs the production deploy', () => {
        expect(code()).not.toMatch(/firebase deploy\b/)
        expect(code()).not.toMatch(/--only hosting\b/)
        expect(code()).not.toMatch(/gcloud/)
    })

    it('refuses the channel names that would be mistaken for production', () => {
        expect(code()).toMatch(/live/)
    })

    it('runs the same checks as the production deploy: lint, unit tests, build, bundle checks', () => {
        const body = code()
        for (const step of ['run_lint', 'run_unit_tests', 'build_site', 'verify_build']) {
            expect(body).toContain(step)
        }
    })

    it('shares the build and checks with deploy-site.sh instead of copying them', () => {
        expect(read('scripts/deploy-site.sh')).toMatch(/lib\/site-build\.sh/)
        expect(read('scripts/deploy-preview.sh')).toMatch(/lib\/site-build\.sh/)
        expect(fs.existsSync(path.resolve(__dirname, '../../scripts/lib/site-build.sh'))).toBe(true)
    })

    it('prints the address at the end', () => {
        expect(code()).toMatch(/Preview address|Channel URL/i)
    })

    it('answers --help without doing anything', () => {
        const run = spawnSync('bash', [scriptPath, '--help'], { encoding: 'utf8' })
        expect(run.status).toBe(0)
        expect(run.stdout).toMatch(/staging/)
    })

    it('has an npm script', () => {
        expect(JSON.parse(read('package.json')).scripts['deploy:preview']).toBe('./scripts/deploy-preview.sh')
    })
})
