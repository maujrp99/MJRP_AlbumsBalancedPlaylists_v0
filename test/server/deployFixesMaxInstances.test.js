/**
 * F78, REQ-18: the server has a known worst case. The limit per person lives in the memory of each
 * Cloud Run instance (server/lib/rateLimit.js), so the real ceiling is the limit times the number
 * of instances; the deploy fixes that number (`--max-instances`), or the ceiling is whatever Cloud
 * Run allows. This test fails when the deploy command does not fix it.
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const script = fs.readFileSync(path.resolve(__dirname, '../../scripts/deploy-server.sh'), 'utf8')
// The deploy command, with its continuation lines joined
const deployCommand = () => {
    const joined = script.replace(/\\\n\s*/g, ' ')
    return joined.split('\n').find(line => /gcloud run deploy\b/.test(line) && !/^\s*#/.test(line)) || ''
}

describe('the server deploy fixes the most instances Cloud Run may start', () => {
    it('the gcloud run deploy command carries --max-instances with a whole number', () => {
        expect(deployCommand()).toMatch(/--max-instances[ =]"?\$\{?MAX_INSTANCES\}?"?|--max-instances[ =]\d+/)
    })

    it('the number is small and said once, with its reason beside it', () => {
        const fixed = /^MAX_INSTANCES="\$\{MAX_INSTANCES:-(\d+)\}"/m.exec(script)
        expect(fixed).not.toBeNull()
        const instances = Number(fixed[1])
        expect(instances).toBeGreaterThanOrEqual(1)
        expect(instances).toBeLessThanOrEqual(5)
        const lines = script.split('\n')
        const at = lines.findIndex(line => line.startsWith('MAX_INSTANCES='))
        const reason = lines.slice(Math.max(0, at - 8), at).join('\n')
        expect(reason).toMatch(/rateLimit|per person/)
    })

    it('the dry run says the number it would deploy with', () => {
        expect(script).toMatch(/max instances[^\n]*\$MAX_INSTANCES|\$MAX_INSTANCES[^\n]*max instances/i)
    })
})
