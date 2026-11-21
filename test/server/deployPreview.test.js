/**
 * F87 (slice A, chosen by the MJRP on 2026-11-21): the site can be published on a Firebase Hosting
 * preview channel, apart from production. These tests read the script as text and run only its
 * `--help` and its refusals; none of them deploys anything.
 */
// @vitest-environment node
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'

const scriptPath = path.resolve(__dirname, '../../scripts/deploy-preview.sh')
const read = file => fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8')

// Hermetic fixture: the deploy scripts also run their unit tests inside an exported copy of the
// branch that is not a git repository, so the refusals are tested in a temporary repository
// built here, with a copy of the scripts, never in the surrounding checkout.
let fixture
const fixtureRepo = () => {
    if (fixture) return fixture
    fixture = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'f87-fixture-'))
    fs.cpSync(path.resolve(__dirname, '../../scripts'), path.join(fixture, 'scripts'), { recursive: true })
    fs.writeFileSync(path.join(fixture, 'package.json'), '{}\n')
    const git = (...args) => spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], { cwd: fixture, encoding: 'utf8' })
    git('init', '-q', '-b', 'main')
    git('add', '-A')
    git('commit', '-q', '-m', 'fixture')
    return fixture
}
const runIn = (script, args) => spawnSync('bash', [path.join(fixtureRepo(), 'scripts', script), ...args], { encoding: 'utf8', cwd: fixtureRepo() })
afterAll(() => { if (fixture) fs.rmSync(fixture, { recursive: true, force: true }) })

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

    it('accepts --branch and says so in the usage header', () => {
        const run = spawnSync('bash', [scriptPath, '--help'], { encoding: 'utf8' })
        expect(run.stdout).toMatch(/--branch <branch>/)
        expect(code()).toMatch(/--branch\)/)
    })

    it('refuses a branch that does not exist locally, with a plain message', () => {
        const run = runIn('deploy-preview.sh', ['--branch', 'no-such-branch-f87-xyz'])
        expect(run.status).not.toBe(0)
        expect(run.stderr).toMatch(/no local branch named 'no-such-branch-f87-xyz'/)
    })

    it('refuses --branch without a name', () => {
        const run = runIn('deploy-preview.sh', ['--branch'])
        expect(run.status).not.toBe(0)
        expect(run.stderr).toMatch(/--branch needs a branch name/)
    })

    it('prints the branch and the commit at the start and at the end, with the channel', () => {
        expect(code()).toMatch(/branch %s at commit %s/)
        expect(code()).toMatch(/Preview published: branch %s, commit %s, channel %s/)
    })

    it('reads the .env the way it does today and never copies or prints it', () => {
        expect(code()).toContain('find_env_file')
        expect(code()).not.toMatch(/cp .*\.env|cat .*ENV_FILE/)
    })
})

describe('production publishes only main', () => {
    it('refuses deploy-site.sh --branch x', () => {
        const run = runIn('deploy-site.sh', ['--branch', 'x'])
        expect(run.status).not.toBe(0)
        expect(run.stderr).toMatch(/unknown argument: --branch/)
    })

    it('deploy-site.sh has no --branch option in its code', () => {
        const body = read('scripts/deploy-site.sh').split('\n').filter(l => !/^\s*#/.test(l)).join('\n')
        expect(body).not.toMatch(/--branch/)
    })
})
