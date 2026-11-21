/**
 * F86 — the copy rules on the design-system page: the voice, the words the MJRP decided, and the ruler of
 * copy volume. Each line names where it comes from; nothing here is new.
 *
 *   voice  — docs/specs/design-system.md § Voz e tom, and the MJRP's words of 2026-11-21 (docs/log.md,
 *            «F80: a home em português, v3», 13:50, and «v2», 13:31)
 *   words  — the same log entries, and «F85: o item do menu se chama «Start», e «Inicie» em português» (09:30)
 *   ruler  — reports/research/2026-11-21-copy-volume-ruler.md § 6 (a proposal of that research, revisable);
 *            the bad examples are today's texts from § 7 and design/copy/album-blender-copy.md
 * The full list of the site's texts is the copy review page, linked, never copied here.
 *
 * Read by build-design-system.mjs.
 */
export const COPY_REVIEW_URL = 'https://claude.ai/artifact/DDE57759QtWJkM4qKVHzBF'

export const voice = [
  'Curto e direto. No botão, o verbo da ação: «Create series», «Blend it now».',
  'Português do Brasil como se fala, nunca tradução ao pé da letra.',
  'Dado de exemplo diz que é exemplo; dado real diz de onde vem.'
]

/** say: the word to use; not: what it replaces; his: the MJRP's own words (2026-11-21). */
export const words = [
  { say: 'ranqueie, do seu jeito', not: 'classifique cada faixa', his: 'ele ranqueia o que ele quer' },
  { say: 'coloque', not: 'ponha', his: 'ponha é feio, melhor coloque' },
  { say: 'Blend, só como nome do produto e do menu; o verbo é junte ou agrupe', not: 'misture; blend como verbo', his: 'o uso do blend aqui nao é adequado, pode ser "junte" ou agrupe' },
  { say: 'mídias físicas', not: 'os discos que você tem', his: 'Conte as midias fisicas da sua estante' },
  { say: 'Inicie, em português; Start, em inglês (o item do menu)', not: 'Home, Início', his: 'pode ser Starte e Inicie em pt' },
  { say: 'para o Spotify ou a Apple Music', not: 'só para o Spotify', his: 'exporta só para o spotify?' }
]

/**
 * The ruler, in words (English, as the research measures; the phone line counts hold for both languages).
 * Each kind: target and ceiling, a good and a bad example (today's text, with where it is).
 */
export const ruler = [
  { kind: 'Botão', target: 2, ceiling: 4, unit: 'palavras',
    good: { text: 'Save ranking', where: 'ranking' },
    bad: { text: 'Redo the change that was undone', where: 'Playlists' } },
  { kind: 'Título da página', target: 8, ceiling: 12, unit: 'palavras', phone: 'até 3 linhas no celular',
    good: { text: 'Mergulhe nos álbuns que você ama.', where: 'a home nova, nas palavras dele' },
    bad: { text: 'Dig through the albums you love. Keep every track.', where: 'página de entrada: 9 palavras, mas 5 linhas no celular' } },
  { kind: 'Parágrafo', target: 25, ceiling: 40, unit: 'palavras', phone: 'até 4 linhas no celular',
    good: { text: 'A fase de um artista, uma década, um clima: uma série é uma estante de álbuns inteiros que você escolhe.', where: 'página de entrada' },
    bad: { text: 'The Album Blender is a web app for people who listen to whole albums. Gather albums into series, rank every track, and blend them into playlists that keep every record in the mix — then keep count of the ones on your shelf.', where: 'página de entrada, o topo' } },
  { kind: 'Primeira tela', target: 60, ceiling: 100, unit: 'palavras no computador', phone: '40 / 70 no celular',
    good: { count: 84, text: 'A página de entrada de hoje: 84 no computador, 64 no celular.', where: 'medido no navegador' },
    bad: { count: 179, text: 'O comparador da Home: 179 no computador, 132 no celular.', where: 'medido no navegador' } }
]

export const rulerSource = 'Proposta da pesquisa de volume de texto de 21/11, revisável.'
