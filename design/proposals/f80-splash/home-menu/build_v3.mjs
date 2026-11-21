/**
 * F80 · «A barra é o menu» v3, 2026-11-21: the Portuguese copy revised as Brazilian Portuguese written for a music
 * lover, after the owner's review of v2 («Cada faixa Conta em pt está estranho»; «ponha é feio, melhor coloque»;
 * «eu revisaria todo esse copy»; on the ranking, «tem que ser Ranqueie/ordene e o uso do blend aqui nao é adequado,
 * pode ser "junte" ou agrupe»; on Playlists, «exporta só para o spotify?»; on the inventory, «Conte as midias
 * fisicas da sua estante»).
 *
 * Everything visual is v2's: this script reads the built v2 page and changes only the text (the dictionary the
 * language switch reads, and the Portuguese the page is written in). The hero is the owner's own text.
 *
 * Claims checked against the app's code (public/js):
 * - the ranking: UserRankingStrategy sorts by the person's rank; unranked tracks keep their place after the ranked
 *   ones (rank 999) or the album's order; the recipe «Top Tracks by My Own Ranking» (TopNUserAlgorithm) uses it.
 * - the export: PlaylistsExport.js (JSON, Apple Music) and SpotifyExportModal.js (Spotify).
 * - the inventory formats: InventoryAddModal (CD, Vinyl, Cassette), InventoryEditModal (+ DVD, Blu-ray, Digital).
 *
 * Usage: node design/proposals/f80-splash/home-menu/build_v3.mjs
 * Writes: design/inception/splash-menu-bar-v3.html (never over an existing file unless V3_REBUILD=1).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../../../..')
const SRC = path.join(REPO, 'design/inception/splash-menu-bar-v2.html')
const OUT = 'design/inception/splash-menu-bar-v3.html'

// v3: only the lines that change. [Portuguese, English]; English changes only where the meaning changed.
const CHANGES = {
    'h.kick': ['The Album Blender · um app web para quem ama discos', 'The Album Blender · a web app for record lovers'],
    // the hero, written by the owner (2026-11-21): «Mergulhe nos álbuns que você ama. Seus álbuns do momento, numa playlist
    // balanceada»; «Embaixo: Monte séries com seus álbuns do momento, ranqueie suas faixas e gere playlists equilibradas…».
    // His words exactly where he wrote them («balanceada» in the line, «equilibradas» in the text). English: a proposal.
    'h.title': ['Mergulhe nos álbuns que você ama. <em>Seus álbuns do momento, numa playlist balanceada.</em>',
        'Dig through the albums you love. <em>Your albums of the moment, in one balanced playlist.</em>'],
    'h.what': ['Monte séries com seus álbuns do momento, ranqueie suas faixas e gere playlists equilibradas.',
        'Build series from your albums of the moment, rank your tracks and make balanced playlists.'],
    'hi.kick': ['De volta aos discos', 'Back to the records'],
    'p.start': ['Digite um artista ou cole os álbuns que você quer ouvir. O Blender monta a série.',
        'Type an artist, or paste the albums you want to hear. The Blender builds the series.'],
    't.albums': ['Ranqueie as faixas do seu jeito.', null],
    'p.albums': ['Uma só ou várias, para cima ou para baixo. As outras ficam como estão e, ao juntar os álbuns, a playlist pode seguir a sua ordem.',
        'Just one or a few, up or down. The rest stay as they are, and when you bring the albums together, the playlist can follow your order.'],
    't.blend': ['Junte a série numa playlist só.', 'Bring the series together in one playlist.'],
    'p.blend': ['Escolha uma receita. O Blender pega faixas de cada álbum, sem deixar um disco dominar os outros.',
        'Pick a recipe. The Blender draws from every album, so no record takes over the rest.'],
    't.playlists': ['Guarde as playlists que você curtiu.', 'Keep the playlists you love.'],
    'p.playlists': ['Toda playlist salva fica aqui, para ouvir de novo, refazer ou exportar para o Spotify ou a Apple Music.',
        'Every playlist you save waits here, to play again, regenerate or export to Spotify or Apple Music.'],
    't.inventory': ['Conte as mídias físicas da sua estante.', 'Count the physical media on your shelf.'],
    'p.inventory': ['Marque o que você tem em vinil, CD, fita cassete ou outro formato e veja uma estimativa de quanto vale a coleção.',
        'Mark what you own on vinyl, CD, cassette or another format, and see an estimate of what the collection is worth.'],
    'd.blend': ['Gerar uma playlist', 'Make a playlist'],
    'e.title': ['Coloque sua primeira série para tocar.', null],
    'e.what': ['Abra o app e comece uma série com um álbum que você ama. Entre na sua conta para salvá-la.', null],
    'ei.title': ['Coloque uma série nova para tocar.', null],
}

let html = fs.readFileSync(SRC, 'utf8')
const m = html.match(/  const T = (\{.*\})\n/)
if (!m) throw new Error('dictionary not found')
const T = JSON.parse(m[1])
const before = {}
for (const [k, [pt, en]] of Object.entries(CHANGES)) {
    if (!T[k]) throw new Error('no key ' + k)
    before[k] = [...T[k]]
    T[k] = [pt, en ?? T[k][1]]
}
html = html.replace(m[0], () => `  const T = ${JSON.stringify(T)}\n`)
// the Portuguese the page is written in
for (const k of Object.keys(CHANGES)) {
    const a = `data-i18n="${k}">${before[k][0]}<`, b = `data-i18n="${k}">${T[k][0]}<`
    if (!html.includes(a)) throw new Error('not on the page: ' + k)
    html = html.split(a).join(b)
}
for (const bad of ['Ponha', 'ponha', 'Cada faixa', 'TITLES', 'Misture', 'misture', 'os Blends', 'Fazer um Blend', 'o Blend pode']) {
    const at = html.indexOf(bad)
    if (at >= 0) throw new Error('left in v3: ' + bad + ' … ' + html.slice(at - 40, at + 40))
}
const p = path.join(REPO, OUT)
if (fs.existsSync(p) && !process.env.V3_REBUILD) throw new Error('exists: ' + OUT + ' (V3_REBUILD=1 only before it is shown)')
fs.writeFileSync(p, html)
console.log(OUT, Math.round(Buffer.byteLength(html) / 1024) + ' KB')
for (const k of Object.keys(CHANGES)) console.log(`${k}\n  PT: ${before[k][0]} → ${T[k][0]}\n  EN: ${before[k][1]} → ${T[k][1]}`)
