// @vitest-environment node
/**
 * F59 slice A (UAT-199): the published site does not hand out its source. The build is asked for
 * no source maps; scripts/deploy-site.sh also refuses to publish when a .map file is in dist/.
 */
import { describe, it, expect } from 'vitest'
import viteConfig from '../../vite.config.js'

describe('the build of the site', () => {
    it('makes no source maps', () => {
        expect(viteConfig.build.sourcemap).toBe(false)
    })
})
