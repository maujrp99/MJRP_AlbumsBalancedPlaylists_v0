---
type: ux-audit
subject: "Reconferência visual independente da onda 1 da F83 (a tela das playlists guardadas em React), ramo claude/f83-wave-1-saved-playlists, contra a tela antiga (a912eaf) e a produção — 1280 e 393 (TASK-32)"
project: mjrpalbumblender-v0
features: [F83]
moment: delivery
date: "2026-11-21 16:10"
judged: "2026-11-21 16:10"
judged_commit: 4582756
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 1
duration_s: 1500
status: open
---

# Reconferência visual — as playlists guardadas em React (F83, onda 1)

**Veredito: passa (`pass`), sem P0 e sem P1; fica 1 P2 (de prova, não de tela).** Nos 31 estados encenados, a tela nova é igual à antiga pixel a pixel, com os mesmos botões, rótulos, perguntas, ordem do teclado, título da aba, Voltar e o sair-e-voltar. As poucas diferenças que apareceram não se repetem e aparecem também comparando a tela antiga com ela mesma. Os 19 pixels do construtor na barra de busca a 393 são ruído da própria produção: produção contra produção dá os mesmos 19 pixels, no mesmo lugar.

## Como foi feito
- **Quem julgou:** um agente juiz (Opus) que não construiu o ramo. As capturas do construtor não foram usadas como prova.
- **Objeto:** `4582756`, exportado com `git archive` para a pasta de rascunho e servido por um servidor Vite próprio (porta 5111). A tela antiga: `a912eaf` (a base do ramo), exportada e servida do mesmo jeito (porta 5110). Produção: https://mjrp-playlist-generator.web.app sem login. Nenhum login, nenhuma escrita. Os dois servidores foram parados ao fim.
- **Dados:** os mesmos do construtor (séries Plant e Floyd, três lotes, uma playlist sem faixas), encenados por mim através do módulo da store do app, com o leitor trocado por um que nunca responde e nunca grava. Acrescentei três estados que o construtor não tinha: série carregando, lista atualizando e o lote Edit seguido de Voltar.
- **Roteiro:** `script/judge.mjs` (a prova) e `script/noise.mjs` (a repetição das diferenças), rodados por `machine_load.py run`. Medidas: `results.json` (86 conferências), `noise.json`. Capturas: `captures/` (69 PNG; `-OLD`/`-NEW` lado a lado). 1280 x 900 e 393 x 852 com toque.

## O que foi conferido (antiga = nova)
- **1280, 17 estados:** esperando a lista, séries carregando, atualizando, duas séries, lote aberto, playlist aberta com faixas, janela da playlist (abrir, Escape), busca «floyd» digitada de verdade, sem resultado, filtro de série, pergunta antes de apagar o lote e antes de apagar tudo (Cancelar; nada apagado), Edit e Voltar, série que falhou, lista que falhou, vazio. Pixel igual em 14; as 3 diferenças são ruído (ver abaixo).
- **393, 12 estados:** os mesmos estados de carga, uma série aberta, um lote aberto, a folha da série e a do lote, a folha dos filtros, a busca, a falha, o vazio. Pixel igual em todos.
- **Botões:** a lista dos controles visíveis (texto, `aria-label`, `title`) é idêntica em cada estado; abrir, ver, editar, apagar lote, apagar tudo, as ações «⋯» do celular. Não há botão de exportar em nenhuma das duas telas (a tela antiga também não tinha).
- **Texto da pergunta de apagar:** o mesmo, palavra por palavra.
- **Edit:** as duas vão para `/playlists/edit?seriesId=…&edit=…`; Voltar traz a tela de volta com 2 séries, igual.
- **Ordem do teclado:** 22 Tab a 1280 e 16 a 393, a mesma sequência (busca, filtros, ordem, Refresh, séries, lotes, botões).
- **Título da aba:** «MJRP The Album Blender - Playlist Generator» nas duas (nenhuma das duas o troca).
- **Sair e voltar:** três vezes para `/start` e Voltar, a 1280 e a 393: nenhuma tela nem janela sobrando fora, uma tela ao voltar, igual à antiga. Sem erro de página.
- **«No connection» na tela carregada sob demanda:** desligada a rede antes de pedir o arquivo da tela, a nova mostra «No connection … Try again» (`offline-1280-NEW.png`). Religada a rede, «Try again» traz a tela (`offline-1280-NEW-after-try-again.png`). A antiga, que vinha no arquivo principal, abre a tela vazia (`offline-1280-OLD.png`). A diferença é esperada pelo desenho da F83 (a tela vem em arquivo próprio).
- **Produção sem login:** 4 rodadas a 393 e 4 a 1280, ramo = produção, 0 pixel em todas.

## As diferenças que não se repetem
- **Os 19 pixels do construtor (393, produção):** não voltaram em 4 rodadas. Produção contra ela mesma deu 19 pixels na caixa x 30–254, y 80–107 (a barra de busca). É ruído do navegador na própria produção, não da tela nova.
- **1280, playlist aberta: 5 pixels** numa linha da borda do lote (y 648–654). Na repetição, deu 0 entre antiga e nova em 3 rodadas, e deu 5 e 8 pixels em antiga contra antiga e nova contra nova (`noise.json`): é arredondamento de borda.
- **1280, janela da playlist: 267 pixels** atrás do fundo desfocado, num canto (x 1024–1203, y 832–855), só na rodada que fez a passada de Tab logo antes. Sem a passada de Tab, deu 0 em 3 rodadas.

## Achados
- **P2-1 · a prova do construtor marca como falha um ruído da produção.** `reports/evidence/F83/wave-1/raw/browser-proof-results.json` registra «A 393 … 19 pixels apart» com `ok: false`, sem comparar a produção com ela mesma. Evidência: `results.json` («production 393 against itself», 19 pixels, na mesma caixa da barra de busca). A mudança: `browser-proof.mjs` (parte A) mede também produção contra produção e trata como empate uma diferença que fique nesse piso; o resultado da onda 1 é anotado como ruído.

## Não visto
- A tela com a conta real e os dados reais do MJRP (sem login; dados encenados).
- Apagar e editar de verdade (só a pergunta, o Cancelar e o destino da navegação).
- O que fica entre 393 e 1280 px, um iPhone de verdade e o anel de foco desenhado (só a ordem do foco foi conferida).
- «No connection» no celular, e com a rede caindo no meio da carga (só a rede desligada antes de pedir a tela, a 1280).
