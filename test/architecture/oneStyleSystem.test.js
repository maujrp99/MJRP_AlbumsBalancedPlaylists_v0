// @vitest-environment node
/**
 * Fitness function of F83 (REQ-05, risk R15): the design system is ported, not rewritten. The React screens use the same
 * stylesheets and the same classes as the hand-made ones; there is no second system of styles.
 *
 *   - no `*.module.css` (nor `.module.scss`) anywhere in the site;
 *   - no library of CSS in JavaScript, and no library of ready-made components, in package.json or in an import of the
 *     site (styled-components, emotion, stitches, vanilla-extract, MUI, Chakra, Ant Design, Mantine, Radix, shadcn, Headless UI...).
 *
 * The list of libraries is a net for the common ones, not a proof.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { siteFiles, importsOfFiles } from './support/siteImports.js'

const FORBIDDEN_PACKAGES = /^((styled-components|goober|linaria|jss|react-jss|antd|react-bootstrap|primereact|semantic-ui-react)(\/|$)|@(emotion|stitches|vanilla-extract|linaria|mui|material-ui|chakra-ui|ant-design|mantine|radix-ui|headlessui|fluentui|nextui-org|heroui)\/)/
const CSS_MODULE = /\.module\.(css|scss|sass|less)$/

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === 'node_modules' || entry.name === 'vendor') return []
    return entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
})

export const cssModulesIn = (files) => files.filter(file => CSS_MODULE.test(file))
export const forbiddenPackages = (names) => names.filter(name => FORBIDDEN_PACKAGES.test(name))

describe('one system of styles (F83)', () => {
    it('no CSS module in the site', () => {
        expect(cssModulesIn(walk(path.join(process.cwd(), 'public')))).toEqual([])
    })

    it('no library of CSS in JavaScript nor of ready-made components, in package.json or in an import', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'))
        expect(forbiddenPackages([...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})])).toEqual([])
        const imported = importsOfFiles(siteFiles()).map(load => load.specifier)
        expect(forbiddenPackages(imported)).toEqual([])
    })

    it('the wrong examples are accused', () => {
        expect(cssModulesIn(['public/js/screens/a/A.module.css', 'public/css/index.css'])).toEqual(['public/js/screens/a/A.module.css'])
        expect(forbiddenPackages(['react', 'styled-components', '@emotion/react', '@mui/material', 'antd', '@radix-ui/react-dialog', 'sortablejs'])).toEqual(['styled-components', '@emotion/react', '@mui/material', 'antd', '@radix-ui/react-dialog'])
    })
})
