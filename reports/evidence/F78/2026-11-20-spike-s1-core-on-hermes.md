---
type: evidence
feature: F78
subject: "Spike S1: as regras do produto dão no Hermes o mesmo resultado que no site?"
written: "2026-11-20 14:20"
who: agente (Opus 5.5), na linha de comando do Mac do MJRP, sem Xcode, sem Android SDK, sem aparelho
---
# F78 · Spike S1 — o núcleo no Hermes · 2026-11-20

## O veredito

**SIM, COM duas mudanças** — e só para o motor do iPhone. Medido no Hermes que o React Native
0.88.1 usa, rodando fora do aparelho:

- **Igual, byte a byte, depois das duas mudanças:** os 3.401 casos. Todas as receitas, todas as
  estratégias de ranking, os modelos `Album` e `Track`, o `TrackTransformer` e as duas regras de
  identidade. O resultado é o mesmo rodando o código-fonte e rodando o bytecode do `hermesc`.
- **Sem mudança nenhuma:** 1.241 casos quebram (36%). É o `crypto.randomUUID`, que o Hermes não tem.
- **Só com o gerador de id:** 3.394 dos 3.401 iguais. Os 7 que diferem estão todos no
  `TrackEnrichmentMixin`, que nenhuma receita do registro usa. O motivo é uma ordenação que o
  padrão do JavaScript deixa a cargo do motor (detalhe abaixo).

Para receitas, estratégias e identidade, a resposta à pergunta do S1 é **sim**. Basta a mudança 1:
uma fonte de id no lugar do `crypto.randomUUID`.

**O que este spike não prova:** Android, o Metro, o Hermes compilado dentro do app e o desempenho
num telefone. Ver «O que não está provado».

## A pergunta

As regras do produto produzem no Hermes (o motor de JavaScript do React Native) a mesma saída que no
site, byte a byte? Elas são: cada receita de playlist e cada estratégia de ranking, com os modelos de
álbum e de faixa que usam, e as regras de identidade de álbum e de faixa. Se não, a pilha recomendada
(React Native com um núcleo de JavaScript em comum) cai.

## Como foi feito

1. **O motor.** O `react-native@0.88.1` (o atual no npm) depende do `hermes-compiler`
   **260318099.0.5**. Esse pacote só traz o compilador (`hermesc`), e compilar não é rodar. Por isso
   o motor veio do artefato que o React Native baixa para o iOS:
   `com.facebook.hermes:hermes-ios:260318099.0.5`, no Maven Central (25 MB, sha256 conferido).
   - O arquivo traz uma fatia para macOS do `hermesvm.framework` e os cabeçalhos JSI.
   - Um host de cerca de 80 linhas (`host/hermes-run.cpp`), compilado com o clang das ferramentas de
     linha de comando, roda um arquivo JS ou bytecode nesse motor.
   - O host acrescenta só `print()`. Nada de `console`, `crypto` ou timers.
   - O motor se declara assim: «OSS Release Version 260318099.0.5, Static Hermes, Bytecode 99,
     Release». Configuração: fila de microtarefas ligada (como no React Native) e `Intl` ligado.
   - O `hermes-cli` do GitHub e o `jsvu` param na v0.13.0 (2024), que não é o Hermes do React Native
     atual. Foram descartados.
2. **O corpo dourado.** Três partes, sem dado pessoal do dono:
   - **As entradas que os testes do próprio repositório passam às regras, extraídas.** Um gravador
     roda os 10 arquivos de teste das receitas, rankings, transformador e identidade (337 testes
     verdes) e grava os argumentos no momento da chamada. Deu 938 chamadas, 921 reaproveitáveis.
     As 17 que sobram passam funções e não podem ser repetidas.
   - **28 álbuns reais de catálogo**, das fixtures `test/fixtures/trackIdentity/`: títulos da Apple e
     a página do BestEverAlbums. As durações e a popularidade (em metade dos álbuns) saem de uma
     fórmula fixa, dita no código.
   - **11 álbuns feitos à mão:**
     - «Admirável Chip Novo», «Ágætis byrjun», títulos em japonês, cirílico e grego (sigma final),
       «İstanbul», ligadura e letras de largura cheia;
     - «(Super Deluxe Edition)», «(2022 Mix/Master)», medley, «Reprise» duas vezes no mesmo álbum,
       «Come Together» em dois álbuns;
     - empates, notas ausentes, nula ou em texto («79»);
     - um álbum vazio, um de uma faixa, um de 20 faixas, um sem nota nenhuma.

     Quase nenhuma faixa tem `id`, então o gerador de id é chamado: **25.369 ids gerados**.
3. **A corrida de referência.** O Node 26 roda os módulos do site como estão, sem empacotar, com o
   `crypto.randomUUID` dele (a mesma API Web Crypto que o site chama). São 3.401 casos:

   | Grupo | Casos |
   |---|---|
   | Receitas do registro | 1.256: Zé's Balanced (80), Top N Popular, Acclaimed e User (392 cada) |
   | Chamadas gravadas de receitas | 17 |
   | Rankings | 464: 4 estratégias × 58 álbuns × dados soltos ou modelo `Album` |
   | Modelos | 59 |
   | Transformador | 58 |
   | Mixins | 66 |
   | Identidade de álbum | 728 |
   | Identidade de faixa | 270 |
   | Chamadas gravadas de identidade | 482 |

   **As opções das receitas que mudam a saída:**
   - Top N: N = 1, 3 e 5; as cinco formas de agrupar; saída automática, única ou múltipla de
     10 minutos; e a fonte de ranking escolhida no menu, que se sobrepõe à da receita.
   - Zé's Balanced: as quatro estratégias e a padrão; o teto de 30 minutos ou o padrão.
4. **A comparação.**
   - A saída é JSON canônico (chaves ordenadas), feito dentro do motor testado.
   - **Os ids gerados não são trocados por um gerador fixo.** Cada id novo vira `<new-id-N>` pela
     ordem em que aparece, então «o mesmo id em dois lugares» continua comparado. À parte, cada id é
     conferido: formato v4 e nunca repetido. Deu 0 fora do formato e 0 repetidos.
   - O carimbo `new Date().toISOString()` vira `<now>` depois de conferido como instante ISO.
   - `Math.random` recebe uma semente fixa nos dois motores, para o agrupamento «shuffle» ser
     comparável.
   - O `console` é recolhido e comparado.
5. **A corrida no Hermes.**
   - O esbuild 0.28.2 gera **o mesmo arquivo** para todos os motores: um IIFE sem sistema de
     módulos, `target: esnext` (sem rebaixar sintaxe).
   - O build **falha** se alcançar um módulo `node:` ou um módulo embutido do Node, ou se nomear
     `process.`, `require(`, `Buffer.`, `__dirname` ou `global.`.
   - Prova extra: o mesmo arquivo roda no Node num contexto **vazio** e sai idêntico à referência.
   - No Hermes, o arquivo roda de três jeitos: sem nada, com o substituto de `crypto`, e compilado a
     bytecode pelo `hermesc -O`.
   - O diff é byte a byte.

## Os resultados

| Corrida | Casos iguais | Diferenças |
|---|---|---|
| Node, o pacote, contexto vazio | 3.401 / 3.401 | nenhuma |
| Hermes sem nada | 2.160 / 3.401 | 1.241, todas `ReferenceError: Property 'crypto' doesn't exist`: modelos 39, transformador 38, rankings 263, receitas 856, mixins 45 |
| Hermes + gerador de id, fonte | 3.394 / 3.401 | 7: `mixin:enrichTracks` (3 álbuns) e `mixin:swap+trim` (4 conjuntos) |
| Hermes + gerador de id, bytecode | 3.394 / 3.401 | as mesmas 7; saída idêntica à da fonte (mesmo sha256) |
| **Com as duas mudanças**, Node × Hermes fonte × Hermes bytecode | **3.401 / 3.401** | **nenhuma** |

As saídas têm 54 MB cada. O sha256 de cada uma está em `out/summary.json` e em
`out/patched/summary.json`.

**Por que os 7 diferem.** A ordenação de `TrackEnrichmentMixin.js:140-159` compara a nota só quando
as duas faixas têm nota, e a pontuação só quando as duas têm pontuação. Fora disso, cai na ordem do
álbum. Uma faixa sem nota fica então «antes» de umas faixas com nota e «depois» de outras.

Exemplo real, em «Admirável Chip Novo»:
- «Temporal» (79) vem antes de «Só de Passagem» (77);
- «Só de Passagem» vem antes de «I Wanna Be» (sem nota, lugar 8);
- «I Wanna Be» vem antes de «Temporal» (lugar 10).

É um ciclo. Para um comparador assim, o ECMAScript deixa a ordem a cargo do motor: o V8 escolhe uma,
o Hermes outra. Os navegadores também divergem entre si, então o próprio site já não dá o mesmo
resultado em todo navegador.

Esse mixin **não é usado por nenhuma receita do registro**: só `mixins/index.js` e o teste o
importam. Com a correção de 2 linhas (a faixa sem nota vai depois das que têm), os 7 casos ficam
iguais.

## As mudanças (aplicadas no spike e rodadas de novo; o código do site não foi tocado)

| # | Arquivo e linha | A mudança | Tamanho | No spike |
|---|---|---|---|---|
| 1 | `public/js/models/Track.js:38`, `public/js/transformers/TrackTransformer.js:60` | `crypto.randomUUID()` → `newId()` de uma porta de plataforma: no site, `crypto.randomUUID`; no app, `randomUUID` do `expo-crypto` | 2 linhas e uma porta de ~10 linhas (é a Ref-0 da proposta, § 4.7) | `src/polyfill-crypto.js` põe um `crypto.randomUUID` global (xorshift semeado pelo relógio). **É um substituto do spike, não criptográfico**: prova que as regras rodam e dão ids v4 distintos, **não** prova o gerador nativo do app |
| 2 | `public/js/algorithms/mixins/TrackEnrichmentMixin.js:152` e `:155` | o comparador fica total: nota ausente vai depois de nota presente; pontuação idem | 2 linhas; ou apagar o mixin, que a produção não usa (180 linhas e o teste) | `src/patches.js` (P1), aplicado aos dois lados no momento da leitura |

Nada mais foi preciso no núcleo. O harness acrescenta `console` e a semente de `Math.random`, mas
isso não é mudança de regra: o React Native fornece `console`.

## Cada recurso dependente do motor, sozinho

Os probes estão em `src/probes.js`; os resultados, em `out/features-node.json`,
`out/features-hermes.json` e `out/features-hermes-bytecode.json`, iguais entre si.

O que «Medição vale para» quer dizer:
- **app (iOS):** a fatia de macOS sai do mesmo artefato e da mesma camada de Unicode e `Intl` do iOS.
  O `PlatformUnicodeCF`, do CoreFoundation, cuida de `normalize`, `localeCompare` e caixa; a doc de
  `Intl` do Hermes diz que o iOS usa os recursos da plataforma.
- **Android:** o Hermes do Android usa outra camada, `PlatformUnicodeJava` (Java/ICU4J). Não foi
  medido.
- **só motor:** o probe diz o que o Hermes cru tem. O React Native acrescenta globais por cima.

| Recurso | O código usa? (arquivo:linha) | Hermes cru (medido) | Medição vale para | O app precisa de |
|---|---|---|---|---|
| `crypto.randomUUID` | **sim**: `models/Track.js:38`, `transformers/TrackTransformer.js:60` | **não existe** (`typeof crypto` = undefined) | só motor; o React Native 0.88.1 não acrescenta `crypto` (não está em `setUpXHR.js` nem em `setUpTimers.js`) | a mudança 1: `expo-crypto` (`randomUUID()` síncrono, v4) atrás de `newId()` |
| `crypto.getRandomValues` | não | não existe | só motor | nada |
| `localeCompare` sem opções | **sim**: `algorithms/TopNAlgorithm.js:173` (agrupar por artista) | existe; a ordem de 17 nomes (latim com acento, grego, cirílico, japonês, turco) **igual** à do Node | app (iOS) | nada no motor. A ordem segue a **língua do aparelho**, como no navegador |
| `localeCompare`/`Intl.Collator` com `numeric` e `sensitivity` | `models/savedPlaylists.js:49` (`numeric`), fora das receitas | existe; resultados iguais ao Node («Mix 10» > «Mix 9»; `base`: a = á = A) | app (iOS) | nada |
| `Intl.DateTimeFormat` (`toLocaleDateString`/`TimeString`) | `models/inventoryValue.js:311, 318`; `models/albumLoadState.js:52` | só Collator, DateTimeFormat, NumberFormat e getCanonicalLocales. `en-GB` dá «20 Nov 2026» e «14:05», iguais. Com `[]`, a língua padrão difere: «14:05» × «02:05 PM» | app (iOS) | nada no motor; a hora segue a língua do aparelho (por desenho) |
| `Number.toLocaleString('en-US', 2 casas)` | `models/inventoryValue.js:196` (valor do inventário) | **difere**: 1166.505 dá «1,166.50» no Hermes e «1,166.51» no Node | app (iOS) | a mudança 3 (abaixo), fora do escopo do S1 |
| `String.prototype.normalize` NFD/NFKD | **sim**: `shared/albumIdentity.js:128`, `shared/trackIdentity.js:113, 276` (NFD) | existe; pontos de código **iguais** (Ágætis, й, Ё; NFKD de ﬁ, largura cheia, ｱﾏｲﾜﾅ); forma inválida dá RangeError | app (iOS); Android **não** | nada no iOS; medir no Android |
| `\p{L}\p{N}` com `u`, literal e montado em execução | **sim**: `albumIdentity.js:123`, `trackIdentity.js:108, 274`; `models/albumType.js:56-60` | existe; saídas iguais | motor (o RegExp do Hermes traz as tabelas Unicode dele) | nada |
| Lookbehind `(?<=…)` `(?<!…)` | `models/albumQuery.js:46`, `models/albumType.js:60` | existe; iguais | motor | nada |
| Grupos com nome | não, no escopo | existe | motor | nada |
| Flag `v` em RegExp | não | **não existe** (SyntaxError) | motor | não usar |
| `structuredClone` | não (nenhum uso no núcleo limpo) | não existe | só motor; o React Native também não o acrescenta | não usar |
| `queueMicrotask` | `stores/albumLoad.js:196`, `stores/savedPlaylists.js:119` (fora das receitas) | não existe | só motor; o **React Native 0.88.1 acrescenta** (`Libraries/Core/setUpTimers.js`) | nada |
| `Array.prototype.toSorted` | não | **não existe** | motor | não usar |
| `at`, `findLast`, `Object.groupBy`, `Object.hasOwn`, `flatMap`, `matchAll`, `replaceAll` | `Object.hasOwn` em `trackIdentity.js:133`; `matchAll` em `albumIdentity.js:255, 319, 325, 671` | todos existem, iguais | motor | nada |
| Encadeamento opcional, `??`, `??=`, campos estáticos e privados, bloco estático | `?.()` em `TopNAlgorithm.js:160`; `static metadata` em `BaseAlgorithm.js:31` e nas subclasses; campos privados: nenhum | todos existem | motor; o Metro ainda passa pelo Babel | nada |
| `Date` | `new Date().toISOString()` em `BaseAlgorithm.js:122, 142`; `Date.parse(readAt)` em `inventoryValue.js:84`; `new Date(texto)` em `savedPlaylists.js:43`, `inventorySort.js:25` | ISO com e sem `Z`, só data, RFC 1123 e só ano: iguais. **«20 Nov 2026» e «November 20, 2026» dão NaN no Hermes** e um instante no Node | motor | nada, se o que se lê é ISO ou timestamp do Firestore (é o que o código grava). Texto livre de data quebraria |
| Ordenação estável | **sim**: `TopNAlgorithm.js:166` («os álbuns mantêm a ordem dentro do lugar»), `MJRPBalancedCascadeAlgorithm.js:333` | estável (2.000 itens, 3 chaves) | motor | nada. Um comparador inconsistente (mudança 2) é outro assunto |
| `URLSearchParams` | `models/buyLinks.js:34` (fora do escopo) | não existe | só motor; o React Native 0.88.1 acrescenta (`Libraries/Core/setUpXHR.js:36`) | nada |
| `console`, `setTimeout` | `console.log` no caminho quente da Zé's Balanced (`MJRPBalancedCascadeAlgorithm.js:61, 68, 177, 324`) | não existem | só motor; o React Native acrescenta | nada |
| Texto dos erros do motor | não (as regras não leem `message`) | difere («Cannot read property 'x' of null» × «Cannot read properties of null (reading 'x')») | motor | nada. Por isso a comparação guarda só o tipo dos erros do motor |

## A mudança 3: fora do escopo do S1, mas achada pelos probes

`models/inventoryValue.js:196` formata o dinheiro do inventário com `toLocaleString('en-US',
{ minimumFractionDigits: 2, maximumFractionDigits: 2 })`. No caso 1166.505, o Node arredonda para
.51 e o Hermes do iOS para .50. É um centavo de diferença na tela, entre o site e o app.

A correção é arredondar antes, uma vez, em número (`Math.round(valor * 100) / 100`) e só então
formatar. São 1 ou 2 linhas. Esse arquivo não é receita nem ranking: fica para a fatia do
inventário do app (6), não para o S1.

## O que o Metro faria diferente (pela documentação)

- O Metro resolve, transforma cada arquivo com Babel (`@react-native/babel-preset`) e serializa
  junto com o seu runtime de módulos, com ids numéricos. Este spike usou o esbuild, sem Babel e sem
  rebaixar sintaxe. O Hermes rodou a sintaxe do site como ela é, o que é o teste mais duro para o
  motor.
- O app vai rodar o código depois do Babel e dentro do sistema de módulos do Metro. Isso não foi
  testado.
- O apelido `@shared/…` precisa de configuração no Metro: `resolver` ou `babel-plugin-module-resolver`.
  O esbuild usou `alias`.
- O import de JSON com `with { type: 'json' }` foi usado só pelo spike. As regras não importam JSON.

## O que não está provado

- **Android.** Nada rodou no Hermes do Android. Lá o `normalize`, o `localeCompare`, a troca de caixa
  e o `Intl` passam pela camada Java (`PlatformUnicodeJava.cpp`), não pela do iOS. As regras de
  identidade dependem de `normalize('NFD')` e de `toLowerCase`. Isso tem de ser medido no emulador.
- **O Hermes de dentro do app no iOS.** Foi usada a fatia de macOS do mesmo artefato e da mesma
  versão. Não foi um iPhone nem um simulador: não há Xcode. A língua padrão medida é a do Mac
  («en-BR»), não a do aparelho.
- **O empacotamento do Metro e o Babel.** Ver acima.
- **O gerador de id do app.** Foi provado que as regras rodam com um `crypto.randomUUID` global e dão
  ids v4 distintos. Não foi provado o `expo-crypto` nativo, nem o `react-native-get-random-values`.
- **Desempenho num telefone.** Não medido: o spike é sobre igualdade.
- **Os 954 casos de teste do núcleo rodando dentro do motor.** Não foram portados. No lugar deles, o
  corpo dourado inclui as entradas que os testes das receitas, rankings, transformador e identidade
  passam às regras (gravadas, não redigitadas). Ficaram de fora as entradas dos testes de `models`,
  `stores` e `services` que não são receita nem ranking.
- **Os outros 61 arquivos «sensíveis ao motor» da crítica.** Os probes medem os recursos que eles
  usam, mas os arquivos não rodaram.

## Versões

- Hermes **260318099.0.5**: artefato `com.facebook.hermes:hermes-ios:260318099.0.5`, `hermesvm.framework`
  para macOS (x86_64 e arm64); sha256 do tar `4e137490ffdf5b145bd629c5cabdfe9aee54573308d7c357bc3300ac78d64507`.
- `hermesc` do pacote npm `hermes-compiler@260318099.0.5`, a versão de que o `react-native@0.88.1` depende.
- `react-native` 0.88.1 (o mais novo no npm em 2026-11-20; só lido, não instalado).
- esbuild 0.28.2; Node v26.11.1; npm 11.20.0; Vitest 1.6.1 (o do repositório); Apple clang 21.0.0.
- Código do site: `main` em `4a1264a`.

## Como repetir

`cd spikes/f78-s1-core-on-hermes && npm install && npm run spike`, em cerca de 2 minutos e meio.
Ver o `README.md` da pasta.

## Fontes

- React Native, ambiente de JavaScript (os polyfills e o Babel): https://reactnative.dev/docs/javascript-environment
- React Native 0.88.1, `Libraries/Core/setUpTimers.js` (`queueMicrotask`) e `Libraries/Core/setUpXHR.js` (`URL`, `URLSearchParams`): https://unpkg.com/react-native@0.88.1/Libraries/Core/
- Hermes, APIs de Intl por plataforma: https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md
- Hermes, Unicode por plataforma (`PlatformUnicodeCF.cpp`, `PlatformUnicodeJava.cpp`, `PlatformUnicodeICU.cpp`, `PlatformUnicodeLite.cpp`): https://github.com/facebook/hermes/tree/main/lib/Platform/Unicode
- Hermes, RegExp: https://github.com/facebook/hermes/blob/main/doc/RegExp.md
- Metro, conceitos (resolução, transformação, serialização): https://metrobundler.dev/docs/concepts
- Expo, `expo-crypto` (`randomUUID`, `getRandomValues`): https://docs.expo.dev/versions/latest/sdk/crypto/
- Maven Central, `com.facebook.hermes:hermes-ios`: https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/
- A proposta (§ 4.7, § 15, § 17): `design/proposals/f78-app-architecture/architecture-proposal.md`
- A crítica (a remedição dos dez arquivos): `reports/audits/2026-11-20-mjrpalbumblender-v0-f78-architecture-critique.md`
