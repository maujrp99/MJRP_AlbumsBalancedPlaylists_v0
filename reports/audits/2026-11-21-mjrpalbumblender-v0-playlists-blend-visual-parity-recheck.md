---
type: ux-audit
subject: "Reconferência visual em lote, grupo «playlists, playlists guardadas, blend e exportar»: F61, F73 — a tela de hoje, 1280 e 393, contra o design system"
project: mjrpalbumblender-v0
features: [F61, F73]
moment: delivery
date: "2026-11-21 13:33"
judged: "2026-11-21 13:33"
judged_commit: 85941b0
who_judged: separate-agent
verdict: fail
p0: 0
p1: 0
p2: 2
duration_s: 1200
status: open
---

# Reconferência visual em lote — playlists, playlists guardadas, blend e exportar

**Veredito: não passa limpo (`fail`), sem P0 e sem P1; 2 P2.** As playlists guardadas mostram cada série assim que chega, com «lendo» e «falhou, Try again»; o nome do lote mantém o foco; a tela sem playlists diz isso e leva ao Blending Menu.

## Como foi feito
- **Quem julgou:** um agente juiz (Opus) que não implementou nenhuma destas features; capturas por um agente de captura (Sonnet) com roteiro.
- **Referência:** nenhuma destas features teve protótipo aprovado (via rápida). A referência é o `docs/specs/design-system.md` e o que o MJRP aprovou usando o site — as telas de playlists do celular foram redesenhadas pela F76 depois destas features; julgo a tela de hoje.
- **Objeto:** o código da `main` local, pela costura das provas da F76: a `PlaylistsView`, a `SavedPlaylistsView`, o `SavedPlaylistsController`, o `SavedPlaylistsReader` e o armazém reais, com uma fonte de mentira (uma promessa que não responde = «lendo», com o prazo do leitor aumentado; uma que rejeita = «falhou»); a `BlendingMenuView` com 8 séries de mentira, sem rede. Nada gravado. A tela sem playlists também foi vista em produção, deslogado (`.../shell/prod-playlists-393.png`).
- **Capturas e medidas:** `reports/evidence/visual-recheck-batch/2026-11-21/playlists/` (`NOTES.md`, `measures.json`, `console-errors.json`, `harness/`). 1280 x 800 e 393 x 852 (celular, toque, escala 2). O logotipo do topo aparece quebrado nessas capturas porque a raiz do harness não serve a imagem: artefato da costura, não do produto. Os erros de console (o `search.worker.js` e o ícone) são do harness.

## Por feature — o que olhei e contra o quê
- **F61 (playlists guardadas em poucos segundos; estado por série):** a tela desenha na hora; enquanto lê, uma linha diz «Reading playlists: 5 of 6 series» e as séries prontas já aparecem com os lotes (`saved-mixed-*`, `saved-loading-*`); uma série que falhou diz «The playlists of this series could not be read.» com «Try again» (`saved-failed-*`), e «Try again» lê de novo (`saved-retried-*`). Uma série vazia não tem cartão próprio; só quando todas estão vazias a tela diz «No Playlists Found» (`saved-empty-*`). Ver P2-1. O tempo («cerca de 1 segundo») é medida de produção com conta: não visto aqui.
- **F73 (as telas mantêm o campo e largam o que deixaram):** «Batch Name» — 12 letras digitadas tecla por tecla, com quatro redesenhos reais da tela no meio (os armazéns de álbuns e de séries avisando), o campo ficou com o foco depois de cada tecla e o valor inteiro, nas duas larguras (`generated-typed-*`, `measures.json`). `/playlists` sem playlists diz «No playlists here yet» e leva ao Blending Menu com «Go to The Blending Menu» (`empty-*`; igual em produção). Os botões de exportar numa aba de versão velha recarregarem o app e o recarregar sem salvar: comportamento, **não visto**. A parte do inventário está no relatório do inventário.
- **Blend:** a `BlendingMenuView` desenha as séries e o passo «Recipe» depois de escolher uma (`blend-*`, `blend-recipe-*`), sem corte. Nenhuma das features deste lote mudou o desenho dessa tela (a F59 e a F64 tocaram nela só no código); fica como vista, sem achado próprio.

## Design system — o que bateu
No celular: preto, Syne nos títulos, texto do sistema no corpo, o botão de fogo «Save» na barra de ação de 64 px, «Export» neutro ao lado, abas de playlist em fita que rola de lado (de propósito: 14 elementos passam da borda dentro dessa fita, `scrollWidth` = 393), vermelho claro na linha de erro. Nenhum texto abaixo de 12 px nem campo abaixo de 16 px; alvos abaixo de 44 px só o logotipo (UAT-242) e o fechar do aviso.

## Achados
- **P2-1 · F61 · série vazia sem cartão, e a série que falhou diz «0 batches · 0 playlists».** A F61 nomeia quatro estados por série (lendo, pronta, vazia, falhou); «vazia» só existe como a tela inteira vazia. No celular, a linha da série que falhou diz «0 batches · 0 playlists» acima do erro, como se a série estivesse vazia. Âncora: `saved-failed-393.png`, `saved-empty-*`. Issue: UAT-252.
- **P2-2 · exportar no computador fora da paleta:** em «Actions & Export», «Save to Series History» é verde (o verde é cor de estado, e no celular o mesmo «Save» é o botão de fogo), «Export to Apple Music» tem outro degradê laranja, e o campo «Batch Name» focado tem anel azul (o design system: borda laranja ao focar). Âncora: `generated-typed-1280.png`. Issue: UAT-253.

## Não visto
- Os tempos da F61 (com a conta do MJRP), os exportar numa aba velha e o recarregar sem salvar (F73): comportamento.
- Exportar de verdade (Spotify, Apple Music) e salvar: de propósito.
