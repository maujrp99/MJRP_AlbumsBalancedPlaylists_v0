---
type: ux-audit
subject: "Reconferência visual em lote, grupo «inventário» (/inventory e a janela do álbum): F54, F71, F73 — a tela de hoje, 1280 e 393, contra o design system"
project: mjrpalbumblender-v0
features: [F54, F71, F73]
moment: delivery
date: "2026-11-21 13:32"
judged: "2026-11-21 13:32"
judged_commit: df23bdf
who_judged: separate-agent
verdict: fail
p0: 0
p1: 0
p2: 1
duration_s: 1200
status: open
---

# Reconferência visual em lote — inventário

**Veredito: não passa limpo (`fail`), sem P0 e sem P1; 1 P2.** O inventário de hoje mostra o que a F54 e a F71 pediram; a parte da F73 que toca o inventário é comportamento e não se vê.

## Como foi feito
- **Quem julgou:** um agente juiz (Opus) que não implementou nenhuma destas features; capturas por um agente de captura (Sonnet) com roteiro.
- **Referência:** nenhuma destas features teve protótipo aprovado (via rápida). A referência é o `docs/specs/design-system.md` e o que o MJRP aprovou usando o site — o inventário do celular foi redesenhado pela F76 e os botões de situação pela F75, depois destas features; julgo a tela de hoje.
- **Objeto:** o código da `main` local. Sem entrar não se chega ao inventário com dados; usei a costura das provas da F76: a `InventoryView`, o controlador, os desenhos, as janelas e a casca reais, com 211 itens de fixture; a fiação do inventário trocada por um substituto que usa o `InventoryService` real sobre um repositório em memória (apagar e «acrescentar os álbuns das séries» rodam o código real e só mudam uma lista). Nada gravado.
- **Capturas e medidas:** `reports/evidence/visual-recheck-batch/2026-11-21/inventory/` (`NOTES.md`, `measures.json`, `console-errors.json`, `harness/`). 1280 x 800 e 393 x 852 (celular, toque, escala 2). Zero erros no console nas 26 capturas.
- **Limite da costura:** a página do harness do inventário não carrega a Syne (a do app carrega), então a família da fonte no computador não foi julgada aqui.

## Por feature — o que olhei e contra o quê
- **F54 (apagar de verdade, durações, «Close», aba do navegador):** apagar pede confirmação («Remove from Inventory?», com «Remove» em vermelho de perigo) e o item sai da lista (211 → 210) — `delete-confirm-*`, `delete-after-*`. A janela do álbum mostra cada faixa em m:ss, sem «--:--» (`item-window-*`); o botão de baixo diz «Close»; no celular o fechar do topo tem o nome «Close». No computador o «X» do topo não tem nome (P2-1). A aba do navegador está no relatório da casca. A janela de ranking com durações está no relatório dos álbuns («não visto» com dados reais).
- **F71 (o inventário com todos os álbuns das séries; Avg Rating e Avg Pop):** o botão «Add the albums of my series» fica na linha de filtros do computador e na folha «Collection actions» do celular (`series-button-*`); a confirmação diz quantos entram, quantos já estavam, quantos repetem e quantos ficam de fora (`series-confirm-*`); depois, «Added 11 albums as Not Owned.» e a lista vai de 211 a 222 (`series-result-*`); sem nada a acrescentar, o aviso diz isso (`series-nothing-*`). As médias aparecem e ordenam: «Avg Rating: 97.8 (9 of 10) · Avg Pop: 28.2% (10 of 10)» na lista do computador e as duas notas em cada linha do celular (`sort-avg-*`, `sort-pop-*`). O filtro de situação com «All / Owned / Not Owned / Wishlist» que a F71 pediu foi trocado pela F75 pelos três botões de contagem no título (`filtered-notowned-393.png`: «32 Not Owned» ligado em laranja, a lista só com esses); apertar de novo mostra todos. É uma mudança de uma feature posterior, não uma falta: não abro issue.
- **F73 (a tela do inventário larga o que deixou):** comportamento (depois de sair, nada redesenha a tela atual): **não visto** — a costura não navega entre telas.

## Design system — o que bateu
Preto, laranja no item escolhido e nos valores, fogo no botão de confirmar («Add 11 albums»), vermelho de perigo em «Remove», folhas do celular com alça e fechar de 44 px, nada passando da borda direita (`scrollWidth` = largura). No celular, nenhum texto abaixo de 12 px nem campo abaixo de 16 px; alvos abaixo de 44 px só o logotipo do topo (UAT-242) e o fechar do aviso (32 x 32) enquanto ele aparece.

## Achados
- **P2-1 · F54 · no computador, o «X» do topo da janela do álbum não tem nome.** O botão de baixo diz «Close», mas o «X» do topo é só um ícone, sem `aria-label`; um leitor de tela o anuncia como «botão». Âncora: `public/js/components/ViewAlbumModal.js` (`createCloseButton`), `item-window-1280.png`. Issue: UAT-251.

## Não visto
- F73: o inventário largar a tela depois de sair (comportamento).
- A família da fonte no computador (o harness não carrega a Syne).
- Gravar de verdade (apagar, acrescentar, editar): só em memória, de propósito.
