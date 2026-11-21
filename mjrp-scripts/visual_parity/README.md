<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# O kit de paridade visual

Compara a tela do produto com a **referência visual aprovada** dela, na mesma tela, no mesmo estado e nas mesmas
condições (navegador × largura × paleta), e devolve **0** (paridade), **1** (divergência real P0 ou P1) ou **2** (não
avaliável). O que conta é **forma** — componente, ordem, tipografia, cor, espaçamento, comportamento —, nunca o dado.

Referência visual aprovada é qualquer ferramenta que dê o visual de uma tela aprovada (MJRP, 2026-10-12): o protótipo em
HTML, o arquivo do Figma ou a exportação dele, outra ferramenta de design. O kit aceita duas:

- **viva** (`prototype.kind: 'live'`, o padrão): um protótipo HTML servido. Os dois lados dão fatos e pixels, e o juiz
  compara fato com fato (`baseChecks`, ou o juiz do projeto).
- **estática** (`prototype.kind: 'static'`): imagens exportadas por tela e por estado. Não há fatos do lado da
  referência: o juiz compara por imagem (a fração de pixels que diferem, acima de `rules.imageDiffMax`, padrão 5%; a
  largura da tela) e aplica ao produto as regras que não dependem do outro lado — markdown cru, texto espremido, texto
  que passa da caixa (tabelas e gavetas), rolagem horizontal (`staticChecks`). Os olhos nos pares fazem o resto.

Nasceu do Control Center 1.0 (2026-10-11): uma release inteira passou com todos os sensores verdes e a tela longe do
protótipo. O juiz que a correção criou (`apps/control-center/web/visual/`) é a referência que este kit generaliza. O
porquê e a etapa que o usa: a página `pdlc-loops` do kernel (§ 5, a reconferência visual) e a ADR-0017 do harness.

```bash
node mjrp-scripts/visual_parity/run.mjs web/visual.config.mjs              # captura + juiz: exit 0 / 1 / 2
node mjrp-scripts/visual_parity/run.mjs web/visual.config.mjs --judge DIR  # só o juiz, sobre fatos já capturados
VISUAL_PAIRS=none …                                                        # sem desenhar os pares lado a lado
node --test mjrp-scripts/visual_parity/                                    # os testes do kit, de dentro do projeto
```

O projeto declara o sensor no contrato:

```yaml
  screen: [web/src/]                    # onde mora a tela — o A2 do doctor e o hook pre-merge-commit leem daqui
  sensors:
    visual:
      cmd: "node mjrp-scripts/visual_parity/run.mjs web/visual.config.mjs"
      config: web/visual.config.mjs     # tem de existir; o doctor (A2) confere, e confere que o comando chega ao kit
      when: pre-merge                   # só o visual pode: roda na reconferência visual, não a cada doctor
```

O Playwright é dependência **do projeto** (fixada no `package.json` dele); o kit não tem dependência própria e o
resolve a partir da pasta do config (`deps` muda o ponto de partida). Nada do núcleo do harness o chama. O kit é
copiado só para filho `code-app` com tela.

## O kit recolhe o que cria (F52 TASK-00)

Uma rodada que captura deixa a pasta do dia com **só o veredito**: `summary.md`, `diff.json` e o par lado a lado
(`pairs/<condição>/<cenário>.pair.jpg`) de cada cenário que divergiu como P0 ou P1, nas condições em que divergiu. As
capturas, os fatos (`facts/`) e os artefatos do Playwright (`.playwright/`) são derivados e regeneráveis: saem no fim, por
`collect.mjs`, e **nunca vão para o `_backups/`** (o `_safe.py` também recusa copiá-los). A captura roda por padrão com **um
navegador por vez** (nas configs do projeto, `VISUAL_WORKERS`, padrão 1). Motivo: em 2026-10-19 mais de 400 rodadas de ~10 GB
encheram o disco do MJRP (harness-kaizen 2026-10-19 22:59). `VISUAL_KEEP_CAPTURES=1` mantém tudo, para depurar uma
captura; `--judge DIR` (rejulgar uma pasta guardada) nunca recolhe. Só se recolhe pasta já julgada (com `summary.md`). **Nunca o que o git versiona** (achado do juiz da F52; kaizen de 2026-10-23: uma limpeza apagou 1.628 imagens versionadas): cada remoção consulta o `git ls-files`; um arquivo versionado fica onde está, uma pasta que guarda um perde só os arquivos não versionados, e sem o git ao alcance nada se remove.

## Exit 2 é não avaliável — e, na etapa, não passa

Sem Playwright (ou fora da faixa), sem fatos, com zero registros a julgar, ou com um config de outro formato, o kit sai
**2**. Na reconferência visual, exit 2 **não é paridade**: o juiz **não avaliou**, e o relatório diz `verdict: incomplete`
(`pdlc-loops` § 5) — o portão do merge o recusa. Um projeto com tela e sem Node instala Node e o Playwright para ter o sensor.

## Superfície: só loopback, e nada fica no ar

Todo servidor que o kit sobe tem de responder em **loopback** (`127.0.0.1`, `localhost`, `::1`): a URL em outro host é
recusada e o servidor, parado. Prenda o comando ao loopback (`--bind 127.0.0.1`, `--host 127.0.0.1`). Cada servidor
roda no próprio grupo de processos, e o fim da execução encerra o grupo inteiro (SIGTERM, espera, SIGKILL) — um
`npm run preview` não deixa `vite` no ar.

## A versão do kit (`version.mjs`)

O filho importa o kit, então a superfície dele é contrato: `KIT_VERSION` (semver), `CONFIG_FORMAT` (a chave `format`
do config; ausente é 1), `CONFIG_KEYS`, `PLAYWRIGHT_RANGE` (>= 1.51, < 2) e `STABLE_EXPORTS` (o que um projeto pode
importar de cada módulo). **MAJOR:** some ou muda de nome uma exportação estável, uma chave do config muda de sentido,
ou muda o `CONFIG_FORMAT` — o refresh do filho vem com a mudança dele. **MINOR:** acrescenta exportação, chave ou
checagem. **PATCH:** conserto sem superfície. O `kit.test.mjs` falha se uma exportação estável sumir; o `run.mjs`
recusa (exit 2) config de outro formato, chave desconhecida e Playwright fora da faixa.

## As peças

| Arquivo | O que faz |
|---|---|
| `run.mjs` | o sensor: lê o config, sobe os servidores, captura, julga, devolve o exit code |
| `servers.mjs` | sobe o servidor da referência viva e o do produto (só loopback; grupo de processos) |
| `capture.mjs` | cada cenário nos dois lados, em cada condição; na referência estática, a imagem e a diferença visual |
| `facts.mjs` | o que se lê na página (`collectFacts`): ordem da casca, cards, componentes, papéis tipográficos, tokens do `:root`, fontes carregadas, layout, a gaveta aberta, e a saúde do texto **por componente** (o título do card, `drawer`, a região): markdown cru, texto espremido e a coluna em que o texto quebra, tabelas, transbordo |
| `rules.mjs` | as regras, funções puras: webfonts, AH-01; markdown cru, texto espremido, tabelas e transbordo, **pareados por componente** (nunca pelo total da página); as gavetas (`drawerChecks`: o clique é julgado no produto — o card que ele tem e não abre a gaveta é P0, mesmo que o protótipo não a tenha aberto; o gesto `click` simples de um cenário de gaveta também conta; o card na tela que não é botão, contado pela ação, é P0 à parte da linha que o dado não tem, desde a 1.3, UAT-427; o `click` simples também leva o `card` e o `cards` chega ao julgamento, desde a 1.3.1, UAT-532); os grupos (`baseChecks`) e o juiz da referência estática (`staticChecks`). As regras por componente e as das gavetas nasceram no juiz das gavetas e tabelas do Control Center (2026-10-12, UAT-45 e UAT-49) |
| `judge.mjs` | agrega só os registros desta execução, escreve `summary.md` e `diff.json`, desenha os pares, devolve 0/1/2 |
| `version.mjs` | a versão e a superfície estável do kit |
| `kit.test.mjs` | os testes: regras, juiz, versão, servidores, e o sensor de ponta a ponta — referência viva e estática |

## O config do projeto

```js
// web/visual.config.mjs
export default {
  format: 1,
  name: 'protótipo v2',
  evidenceDir: '../reports/evidence/UAT-visual',            // relativo ao config; a data entra no fim
  deps: '.',                                                // de onde resolver o @playwright/test
  // referência viva: o protótipo HTML servido — sempre em loopback
  prototype: { server: { cmd: ['python3', '-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', '../design'],
                         ready: 'port (\\d+)', url: 'http://127.0.0.1:$1/inception/app-v2.html' },
               ready: 'nav button', hideCss: '.probe { display: none !important; }' },
  // ou a referência estática: as exportações do Figma, <cenário>.<condição>.png, <cenário>.<viewport>.png ou <cenário>.png
  // prototype: { kind: 'static', images: '../design/exports/' },
  product:   { server: { cmd: ['npm', 'run', 'preview', '--', '--host', '127.0.0.1'], ready: '(http://127\\.0\\.0\\.1:\\d+)', url: '$1' },
               ready: 'nav button' },
  conditions: { browsers: ['chromium', 'webkit'],
                viewports: [{ id: 'desktop', width: 1440, height: 900 }, { id: 'mobile', width: 390, height: 844, isMobile: true }],
                palettes: [{ id: 'light', colorScheme: 'light' }, { id: 'dark', colorScheme: 'dark' }] },
  scenarios: [
    { id: 'home', title: 'Início', ui: ['UI-01'], proto: { path: '#t=home' }, product: { path: '#/home' } },
    { id: 'home-min', title: 'Início · minimizar tudo', proto: { path: '#t=home' }, product: { path: '#/home' },
      actions: [{ clickText: '^Minimizar tudo$' }] },
  ],
  facts: { regions: { header: 'header', main: 'main' }, components: { 'collapse-all': '.colall' },
           roles: { navTab: 'header nav button', cardTitle: 'main h2' } },
  rules: { coreTokens: ['--primary', '--bg', '--surface', '--text', '--muted'], fallbackTokens: ['--serif', '--sans'],
           imageDiffMax: 0.05 },
  // checks: (rec) => [...],   // um juiz próprio, composto dos grupos de rules.mjs (o Control Center faz assim)
};
```

## Regras do juiz

Os ids das checagens (o que vai para o `diff.json` e o que um teste compara) são em inglês — `shell-order`,
`font: <papel>`, `raw-markdown`, `image-diff`… —, porque é a máquina que os lê; um juiz de projeto pode passar os seus
(`labels`). Gravidade: **P0** quebra a identidade ou falta o componente; **P1** diverge a forma de modo visível; **P2** é detalhe
(não reprova). Toda exceção a "o produto bate com a referência" é uma **regra com função testada e com o incidente de
onde nasceu**, nunca um valor aceito: as do kit estão no cabeçalho de cada uma em `rules.mjs`; as do projeto, no juiz
dele. O juiz só julga os cenários e as condições desta execução: fato velho de cenário removido não entra, e cenário
esperado sem fato vira linha P0 `capture`. O juiz lê fatos e diferença de imagem, não a tela inteira como um olho: o
que só a imagem mostra (rótulos sobrepostos, ordem dentro de uma faixa) fica para os olhos nos pares — por isso a
reconferência é sensor **e** olhos.
