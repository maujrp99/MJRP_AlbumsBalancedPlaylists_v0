/**
 * Every visible text of the entry page (F80, UAT-240, UAT-241): ONE dictionary, one entry per line,
 * in Portuguese (`pt`, the language the page is written in, so it reads without JavaScript) and in
 * English (`en`). A copy revision replaces strings here and nothing else.
 *
 * How the page uses it: the build (scripts/entryPage.mjs) writes the Portuguese into every element
 * marked `data-i18n="key"` (text or HTML), `data-i18n-aria="key"` (aria-label), `data-i18n-title`
 * (title) and `data-i18n-content` (a meta tag's content); lang.js swaps them for the language the
 * visitor chose. A few strings are put together by the script (the caption, the credits under the
 * records, the pause label): they are read with `t(key, lang)`.
 *
 * Kept in English in both languages, on purpose: the name (The Album Blender, the Blender), «Blend»
 * (the product's word, copy document D-01), «Playlists» (the word Brazilian listeners use), Apple
 * Music and Spotify (brands). A proposal text, to be revised by the owner on the copy-review page.
 * Pure: no browser API, no import.
 */

export const LANGS = Object.freeze(['pt', 'en'])

const pt = {
    // the document
    'meta.title': 'The Album Blender — para quem ouve álbuns inteiros',
    'meta.desc': 'O The Album Blender é um app web para quem ouve álbuns inteiros: monte séries com seus álbuns do momento, ranqueie as faixas e gere playlists equilibradas.',
    'meta.ogdesc': 'Monte séries com seus álbuns do momento, ranqueie as faixas, gere playlists equilibradas e conte suas mídias físicas.',
    // the menu and the top of the page
    'm.start': 'Criar', 'm.albums': 'Álbuns', 'm.blend': 'Blend', 'm.playlists': 'Playlists', 'm.inventory': 'Inventário',
    'menu.aria': 'Menu: cada item leva à história dele nesta página',
    'flip.aria': 'Virar o lado',
    'signin': 'Entrar', 'openapp': 'Abrir o app',
    'skip': 'Pular para o conteúdo', 'home.aria': 'The Album Blender, topo da página',
    'pause': 'Pausar o movimento', 'play': 'Retomar o movimento',
    'lang.aria': 'Idioma',
    // the first screen, without an account
    'h.title': 'Mergulhe nos álbuns que você ama.',
    'h.what': 'Seus álbuns do momento, numa playlist balanceada.',
    'h.para': 'Monte séries com seus álbuns do momento, ranqueie suas faixas e gere playlists equilibradas.',
    // the stories, one per item of the menu
    'k.start': 'Lado A · 1 — Criar', 'k.albums': 'Lado A · 2 — Álbuns', 'k.blend': 'Lado A · 3 — Blend',
    'k.playlists': 'Lado B · 1 — Playlists', 'k.inventory': 'Lado B · 2 — Inventário',
    't.start': 'Comece por um artista ou por uma lista.',
    'p.start': 'Digite um artista ou cole os álbuns que você quer ouvir. O Blender monta a série.',
    't.albums': 'Ranqueie as faixas do seu jeito.',
    'p.albums': 'Uma só ou várias, para cima ou para baixo. As outras ficam como estão e, ao juntar os álbuns, a playlist pode seguir a sua ordem.',
    'r.tag': 'Seu ranking · exemplo',
    'r.up': 'você subiu',
    'r.more': '+ 7 faixas',
    'r.note': 'Exemplo: uma faixa subiu para o topo.',
    'r.aria': 'Exemplo de ranking das faixas de The Velvet Underground & Nico',
    't.blend': 'Junte a série numa playlist só.',
    'p.blend': 'Escolha uma receita. O Blender pega faixas de cada álbum, sem deixar um álbum dominar os outros.',
    'f.title': 'Vire o lado',
    'f.line': 'No lado B fica o que você guarda: suas playlists e seu inventário.',
    't.playlists': 'Guarde as playlists que você curtiu.',
    'p.playlists': 'Toda playlist salva fica aqui, para ouvir de novo, refazer ou exportar para o Spotify ou a Apple Music.',
    't.inventory': 'Conte as mídias físicas da sua estante.',
    'p.inventory': 'Marque o que você tem em vinil, CD, fita cassete ou outro formato e veja uma estimativa de quanto vale a coleção.',
    // the doors of the stories, with an account
    'd.start': 'Começar uma série', 'd.albums': 'Ver seus álbuns', 'd.blend': 'Gerar uma playlist',
    'd.playlists': 'Ver suas playlists', 'd.inventory': 'Abrir o inventário',
    // the close
    'e.title': 'Coloque sua primeira série para tocar.',
    'e.what': 'Abra o app e comece uma série com um álbum que você ama. Entre na sua conta para salvá-la.',
    'ei.title': 'Coloque uma série nova para tocar.',
    // the stage, the records and the credits (Apple's identity: «Ouça no Apple Music» is its Portuguese badge)
    'stage.aria': 'Uma caixa de álbuns; a página puxa um álbum para a frente a cada parte',
    'c.src': 'Capa do Apple Music', 'c.listen': 'Ouça no Apple Music', 'c.newtab': ' (abre numa nova aba)',
    'c.src.fict': 'Álbum fictício · arte original', 'c.fictional': 'álbum fictício',
    'tag.fict': 'Álbuns fictícios · arte original',
    'credit.real': 'As capas vêm do Apple Music e são dos artistas e das gravadoras; todo álbum mostrado inteiro nesta página tem link para a página dele no Apple Music. Apple e Apple Music são marcas da Apple Inc., registradas nos EUA e em outros países.',
    'credit.fict': 'Os álbuns desta página são fictícios, com arte original feita para ela.',
    'footer.aria': 'Rodapé'
}

const en = {
    'meta.title': 'The Album Blender — for people who listen to whole albums',
    'meta.desc': 'The Album Blender is a web app for people who listen to whole albums: build series from your albums of the moment, rank the tracks and make balanced playlists.',
    'meta.ogdesc': 'Build series from your albums of the moment, rank the tracks, make balanced playlists and count the physical media on your shelf.',
    'm.start': 'Create', 'm.albums': 'Albums', 'm.blend': 'Blend', 'm.playlists': 'Playlists', 'm.inventory': 'Inventory',
    'menu.aria': 'Menu: each item takes you to its story on this page',
    'flip.aria': 'Flip the record',
    'signin': 'Sign in', 'openapp': 'Open the app',
    'skip': 'Skip to content', 'home.aria': 'The Album Blender, top of the page',
    'pause': 'Pause motion', 'play': 'Play motion',
    'lang.aria': 'Language',
    'h.title': 'Dig through the albums you love.',
    'h.what': 'Your albums of the moment, in one balanced playlist.',
    'h.para': 'Build series from your albums of the moment, rank your tracks and make balanced playlists.',
    'k.start': 'Side A · 1 — Create', 'k.albums': 'Side A · 2 — Albums', 'k.blend': 'Side A · 3 — Blend',
    'k.playlists': 'Side B · 1 — Playlists', 'k.inventory': 'Side B · 2 — Inventory',
    't.start': 'Begin with one artist, or a list.',
    'p.start': 'Type an artist, or paste the albums you want to hear. The Blender builds the series.',
    't.albums': 'Rank your tracks, your way.',
    'p.albums': 'Just one or a few, up or down. The rest stay as they are, and when you bring the albums together, the playlist can follow your order.',
    'r.tag': 'Your ranking · example',
    'r.up': 'you moved it up',
    'r.more': '+ 7 tracks',
    'r.note': 'Example: one track moved to the top.',
    'r.aria': 'Example ranking of the tracks of The Velvet Underground & Nico',
    't.blend': 'Bring the series together in one playlist.',
    'p.blend': 'Pick a recipe. The Blender draws from every album, so no record takes over the rest.',
    'f.title': 'Flip the record',
    'f.line': 'Side B holds what you keep: your playlists and your inventory.',
    't.playlists': 'Keep the playlists you love.',
    'p.playlists': 'Every playlist you save waits here, to play again, regenerate or export to Spotify or Apple Music.',
    't.inventory': 'Count the physical media on your shelf.',
    'p.inventory': 'Mark what you own on vinyl, CD, cassette or another format, and see an estimate of what the collection is worth.',
    'd.start': 'Start a series', 'd.albums': 'See your albums', 'd.blend': 'Make a playlist',
    'd.playlists': 'See your playlists', 'd.inventory': 'Open your inventory',
    'e.title': 'Drop the needle on your first series.',
    'e.what': 'Open the app and start a series with one album you love. Sign in to keep it.',
    'ei.title': 'Drop the needle on a new series.',
    'stage.aria': 'A crate of albums; the page pulls one record forward for each part',
    'c.src': 'Artwork from Apple Music', 'c.listen': 'Listen on Apple Music', 'c.newtab': ' (opens in a new tab)',
    'c.src.fict': 'Fictional album · original art', 'c.fictional': 'fictional album',
    'tag.fict': 'Fictional albums · original art',
    'credit.real': 'Album artwork comes from Apple Music and belongs to the artists and labels; every record shown whole on this page links to its page on Apple Music. Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries.',
    'credit.fict': 'The albums on this page are fictional, with original artwork made for this page.',
    'footer.aria': 'Footer'
}

export const COPY = Object.freeze({ pt: Object.freeze(pt), en: Object.freeze(en) })

/** The keys of the dictionary (Portuguese is the reference; a test keeps English whole). */
export const copyKeys = () => Object.keys(COPY.pt)

/** One line, in the language asked; an unknown language falls back to Portuguese, an unknown key to the key itself. */
export function t(key, lang = 'pt') {
    const table = COPY[lang] || COPY.pt
    return table[key] ?? COPY.pt[key] ?? key
}
