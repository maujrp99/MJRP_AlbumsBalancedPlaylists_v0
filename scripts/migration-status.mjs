// The scoreboard of the migration of the site's screens to React (F83 TASK-09, REQ-03, REQ-09; proposal § 4.6, item 4).
//
//   node scripts/migration-status.mjs [--json] [--root public/js]
//
// Prints what is left: the screens and components made by hand (files and lines, against the list of the day the migration
// began), the React files, the bridges to old pieces, and the texts written outside the dictionary. The numbers go to the log
// entry of each wave, and the lists that only shrink are guarded by the architecture tests (handMadeScreensOnlyShrink,
// bridgesOnlyShrink); this is the reading for people. It writes nothing.
//
// What it does not say: whether a screen «redesigned» was born in React (review), and the count of texts is a heuristic
// (scripts/lib/stringSites.mjs): good to about ten per cent, it does not see a text that arrives by a variable.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HAND_MADE } from '../test/architecture/handMadeScreensBaseline.js'
import { countSites } from './lib/stringSites.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = path.join(ROOT, 'public/js')
const HAND_MADE_FOLDERS = ['views', 'components']
const TEXT_FOLDERS = ['views', 'components', 'controllers'] // where the hand-made texts are (the spike counted these three)
const REACT_FOLDERS = ['screens', 'ui', 'shell', 'react-bridge']
const LEGACY = 'react-bridge/legacy/'

const posix = (file) => file.split(path.sep).join('/')

function walk(dir) {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name)
        return entry.isDirectory() ? walk(full) : [full]
    })
}

const filesIn = (root, folder, pattern) => walk(path.join(root, folder)).map(file => posix(path.relative(root, file))).filter(file => pattern.test(file) && !file.endsWith('.d.ts'))
const linesOf = (root, file) => (fs.readFileSync(path.join(root, file), 'utf8').match(/\n/g) || []).length
const sitesOf = (root, file) => countSites(fs.readFileSync(path.join(root, file), 'utf8'), file).length

/** What is left to migrate, read from the tree under `root` (public/js). `baseline` is the list of the day the migration began. */
export function statusOf(root = SITE, { baseline = HAND_MADE } = {}) {
    const insideFolders = HAND_MADE_FOLDERS.flatMap(folder => filesIn(root, folder, /\.(js|ts|tsx)$/))
    const outside = Object.keys(baseline).filter(file => !HAND_MADE_FOLDERS.some(folder => file.startsWith(`${folder}/`)) && fs.existsSync(path.join(root, file)))
    const handMadeFiles = [...insideFolders, ...outside]
    const baselineFiles = Object.keys(baseline)

    const reactFiles = REACT_FOLDERS.flatMap(folder => filesIn(root, folder, /\.(ts|tsx)$/))
    const byFolder = Object.fromEntries(REACT_FOLDERS.map(folder => [folder, reactFiles.filter(file => file.startsWith(`${folder}/`)).length]))

    const bridgeFiles = reactFiles.filter(file => file.startsWith(LEGACY))
    const everySource = walk(root).map(file => posix(path.relative(root, file))).filter(file => /\.(js|ts|tsx)$/.test(file))
    const bridgeUses = everySource.filter(file => !file.startsWith(LEGACY) && /react-bridge\/legacy\//.test(fs.readFileSync(path.join(root, file), 'utf8')))

    const handMadeTexts = TEXT_FOLDERS.flatMap(folder => filesIn(root, folder, /\.js$/)).reduce((sum, file) => sum + sitesOf(root, file), 0)
    const reactTexts = reactFiles.filter(file => file.endsWith('.tsx')).reduce((sum, file) => sum + sitesOf(root, file), 0)

    return {
        handMade: {
            files: handMadeFiles.length,
            lines: handMadeFiles.reduce((sum, file) => sum + linesOf(root, file), 0),
            baselineFiles: baselineFiles.length,
            baselineLines: Object.values(baseline).reduce((sum, lines) => sum + lines, 0),
            migratedFiles: baselineFiles.filter(file => !fs.existsSync(path.join(root, file))).length
        },
        react: {
            files: reactFiles.length,
            lines: reactFiles.reduce((sum, file) => sum + linesOf(root, file), 0),
            byFolder
        },
        bridges: { files: bridgeFiles.length, uses: bridgeUses.length },
        texts: { handMade: handMadeTexts, react: reactTexts, total: handMadeTexts + reactTexts }
    }
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

/** The status as the lines the wave's log entry quotes. */
export function formatStatus(status, date = new Date().toISOString().slice(0, 10)) {
    const { handMade, react, bridges, texts } = status
    const row = (label, value) => `${label.padEnd(30)}${value}`
    return [
        `Migration status (F83), ${date}`,
        row('hand-made screens', `${plural(handMade.files, 'file')}, ${handMade.lines} lines  (the day it began: ${handMade.baselineFiles} files, ${handMade.baselineLines} lines; ${plural(handMade.migratedFiles, 'file')} gone)`),
        row('React screens and pieces', `${plural(react.files, 'file')}, ${react.lines} lines  (${Object.entries(react.byFolder).map(([folder, count]) => `${folder} ${count}`).join(', ')})`),
        row('bridges to old pieces', `${plural(bridges.files, 'file')} in react-bridge/legacy/, used by ${plural(bridges.uses, 'file')}`),
        row('texts outside the dictionary', `${texts.total}  (hand-made ${texts.handMade}, React ${texts.react}; a count good to about 10%)`)
    ].join('\n')
}

function main(argv) {
    const args = argv.slice(2)
    const rootIndex = args.indexOf('--root')
    const root = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : SITE
    const status = statusOf(root)
    console.log(args.includes('--json') ? JSON.stringify(status, null, 2) : formatStatus(status))
    return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv))
