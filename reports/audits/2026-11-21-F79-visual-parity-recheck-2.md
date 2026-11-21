---
type: ux-audit
subject: "Reconferência visual independente da F79, segunda passada: a Home sobre b12e751 (as correções da primeira) contra design/inception/home-transformar-v2.html, 18 estados, 1280 e 393"
project: mjrpalbumblender-v0
feature: F79
moment: delivery
date: "2026-11-21 00:32"
judged: "2026-11-21 00:32"
judged_commit: b12e751
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 4
human_decisions: 1
status: open
supersedes: reports/audits/2026-11-20-F79-visual-parity-recheck.md
---

# Reconferência visual da F79, segunda passada

**Veredito: passa (`pass`), sem P0 e sem P1; ficam 4 P2.** As correções de `b12e751` fecham os dois P1 da primeira passada e quatro dos P2 (P2-1, P2-2, P2-6 e o corte de P2-3). Nada regrediu nos 36 pares. Os P2 que ficam são os três que o implementador deixou de propósito (P2-4, P2-5 e P2-7) e um resto do P2-3 no celular (o contorno de foco e a caixa da lista colada mais alta). Pela regra, os P2 reais viram issues e o MJRP decide cada um. O relatório fica `open` até essa decisão.

O relatório da primeira passada (`reports/audits/2026-11-20-F79-visual-parity-recheck.md`, `fail`, 2 P1, 7 P2) fica como está. O mais novo decide o portão.

## Como foi feito

- **Quem julgou:** o mesmo agente revisor da primeira passada, que não implementou a F79 nem as correções.
- **O objeto:** o ramo `feat/f79-home-that-explains-itself` em `b12e751`, servido pelo Vite deste worktree (`npx vite --port 5185 --host 127.0.0.1`), como visitante. A série nunca foi gravada (a escrita foi trocada na página) e nada foi escrito no Firestore.
- **A referência e as condições:** as mesmas da primeira passada. O protótipo é `design/inception/home-transformar-v2.html`, nos 18 estados do `shows::`, no Chrome headless a 1280 x 900 e a 393 x 852.
- **As capturas foram refeitas** com `reports/evidence/F79/shoot.sh` sem mudança; as do implementador não foram usadas. Resultado: **36 pares, todos olhados um a um**, em `reports/evidence/F79/recheck-2/pairs/`. As capturas soltas estão em `recheck-2/shots/` e os recortes ampliados em `recheck-2/zoom/`.
- **Os fatos medidos:** o kit visual do projeto continua sem poder rodar (P2-7). Usei de novo os coletores da primeira passada, pelo protocolo de depuração:
  - `recheck/facts.mjs` → `recheck-2/facts.json`, nos 72 cenários: Syne carregado, os botões com fogo e a rolagem lateral.
  - `recheck/fonts2.mjs` → `recheck-2/fonts.txt`: a família, o tamanho e o peso das linhas coladas, dos números e do aviso de Undo.
- **A janela de editar a série** foi reaberta com uma série falsa, sem salvar, a 1280 e a 393 (`recheck-2/edit-modal/`). Ela continua inteira, com a grade, as fichas e o rodapé preso, e sem rolagem lateral.

## O que bate (medido e olhado)

- **Nos 72 cenários, zero diferenças** nos botões com o degradê do fogo entre os dois lados. Há um botão de ação com fogo por estado, mais o «Sign In» do topo no computador. O Syne carrega em todos e nenhum tem rolagem lateral.
- **O que a primeira passada já tinha confirmado continua igual:** o título, a frase, o campo, o equalizador nos três estados (parado, buscando e erro), as fichas, as capas numeradas, a base e a barra de ação, o painel ↑ ↓ ✕, o Undo, a faixa de criada com «Blend it now», a falha e o visitante.

## Os achados da primeira passada

| Achado | Estado | Como foi conferido |
|---|---|---|
| **P1-1** a tipografia da lista colada | **fechado** | Colando, as linhas medem agora **Syne 15/400** a 1280 e **sistema 16/400** a 393, iguais ao protótipo. Na lista adicionada, a linha pulada é **texto em Syne bold, sem caixa**, sobre a faixa vermelha, como no protótipo. «Added 2 albums.» está em negrito (`<strong>` Syne 14/700, contra o `<b>` Syne 14/700 do protótipo). Evidência: `pair-paste-1280.jpg`, `pair-pastereport-1280.jpg`, `pair-pastereport-393.jpg`, `zoom/z-paste.jpg`, `zoom/z-pastereport.jpg`, `fonts.txt`. |
| **P1-2** a barra do celular em «Criando» | **fechado** | O mini equalizador está na linha de «Saving your series…», «Tap to edit or reorder» vem logo abaixo, e a barra tem a altura do protótipo. Evidência: `pair-creating-393.jpg`, `zoom/z-creating.jpg`. |
| **P2-1** a Folha da série no celular | **fechado** | O cabeçalho é «Your series» mais «4 albums» apagado, como no protótipo (o ✕ no lugar de «Done» é a decisão aceita na primeira passada). Os títulos ficam em uma linha, com reticências. O nome da série segue uns 2 px maior que no protótipo, o que não basta para manter o achado. Evidência: `pair-reorder-393.jpg`, `pair-removed-393.jpg`, `pair-noname-393.jpg`, `zoom/z-sheet-header.jpg`. |
| **P2-2** «Not saved» cortado no celular | **fechado** | «Not saved: the connection dropped» aparece inteiro, quebrado em duas linhas como no protótipo. Evidência: `pair-createfail-393.jpg`, `zoom/z-createfail.jpg`. |
| **P2-3** a linha colada cortada sem reticências | **fechado em parte** | No colar, a última linha agora aparece inteira («…Grey and Pinkk»). A linha pulada termina em «…» onde o protótipo corta seco, o que não diverge. **Fica** o resto, abaixo, como P2-3'. |
| **P2-4** números de linha e Undo do celular em sistema | **fica** (de propósito) | Os números da lista colada seguem em sistema 12 px, contra Syne 12 px a 1280. «Added 17 albums.» no celular segue em sistema 14 px, contra Syne 14 px. Evidência: `fonts.txt`. |
| **P2-5** as fichas do celular | **fica** (de propósito) | «Compendiums · 15» segue numa linha só, e a fileira fica uns 4 px mais baixa. Evidência: `pair-results-393.jpg`. |
| **P2-6** os títulos da segunda fileira sob a base (1280) | **fechado** | Os títulos da segunda fileira aparecem inteiros abaixo da base, como no protótipo. O ano corre na linha de meta do cartão («2014 · Deluxe»), igual nos dois lados. Evidência: `pair-results-1280.jpg`, `pair-chosen-1280.jpg`, `zoom/z-card-meta.jpg`. |
| **P2-7** sem sensor visual no projeto | **fica** (de propósito) | O contrato segue sem `sensors.visual`, não há config visual e o Playwright não está instalado. Isso é processo, não tela. |

## Os achados desta passada

Não há P0 nem P1.

### P2

- **P2-3' · A caixa da lista colada com o contorno de foco e mais alta no celular** (`^home-paste-list`). Ao entrar em «paste a list», a caixa aparece com o contorno laranja de foco, nas duas larguras, e o protótipo não o mostra nesse estado. No celular, cada linha é um campo de 44 px, então a caixa fica cerca de 50 px mais alta, e «Search an artist instead» e o equalizador descem na mesma medida. Isso decorre da decisão aceita da lista editável (o alvo de 44 px). O que é forma nova é o contorno de foco. Evidência: `pair-paste-1280.jpg`, `pair-paste-393.jpg`. Dono: o implementador da F79, ou o MJRP decide que fica como está.
- **P2-4, P2-5 e P2-7** ficam como estão descritos na tabela acima, sem mudança desde a primeira passada.

### Regressões

**Nenhuma regressão** nos 36 pares, nem na janela de editar a série. As três mudanças que o orquestrador pediu para olhar estão conferidas:
- a linha pulada da lista colada já não tem caixa;
- o cabeçalho da Folha diz «Your series» mais «4 albums»;
- o ano corre na linha de meta do cartão.

## Issues

**Nenhuma issue foi aberta em `docs/specs/uat.md`**, por instrução do orquestrador. Ele deve registrar estes quatro, cada um como `bug` com `fixing (F79)`, `Reportado por` `juiz` e `**Aberta por:** agente (juiz da F79)`:
1. **P2-3'**: a caixa da lista colada aparece com o contorno laranja de foco, e no celular fica cerca de 50 px mais alta que no protótipo.
2. **P2-4**: os números de linha da lista colada (1280) e o aviso de Undo do celular estão em fonte do sistema, e o protótipo usa Syne.
3. **P2-5**: no celular, «Compendiums · 15» fica numa linha só, onde o protótipo quebra em duas, e a fileira de fichas fica uns 4 px mais baixa.
4. **P2-7**: o contrato não declara `sensors.visual`, então o kit visual não roda. É processo, não tela; o dono é o contrato do projeto (o A2 do doctor).

## O que fica com o humano

- **1 decisão:** se os quatro P2 que restam ficam como estão («fica como está») ou voltam para a F79. Três deles o implementador deixou de propósito.

## O que não pôde ser conferido

- **O kit de paridade visual** (P2-7): as regras dele não rodaram, e o julgamento ficou nos olhos e nos coletores improvisados.
- **Safari, WebKit, um aparelho de verdade e o toque:** só o Chrome com as larguras emuladas.
- **Uma conta de verdade e o catálogo de verdade:** a resposta foi a captura do protótipo.
- **Criar a série de verdade:** não foi feito, para não escrever em produção.
- **As animações e o tempo real:** só quadros parados.
- **A janela de editar a série:** foi aberta só com uma série montada na página e não tem referência aprovada para comparar.

## Como rodar de novo

```sh
npx vite --port 5185 --host 127.0.0.1 --strictPort          # no worktree do ramo
sh reports/evidence/F79/shoot.sh reports/evidence/F79/recheck-2/shots http://127.0.0.1:5185
python3 reports/evidence/F79/pairs.py reports/evidence/F79/recheck-2/shots reports/evidence/F79/recheck-2/pairs
# os fatos: no shoot.sh, trocar shoot.mjs por reports/evidence/F79/recheck/facts.mjs ou fonts2.mjs, com outra porta de depuração
```
