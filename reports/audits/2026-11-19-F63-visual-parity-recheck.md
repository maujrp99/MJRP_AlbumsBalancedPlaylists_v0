---
type: visual-parity-recheck
subject: "Reconferência visual da F63 (Home e navegação que respondem): a tela construída contra o spec, sem protótipo"
project: mjrpalbumblender-v0
feature: F63
verdict: fail
p0: 0
p1: 2
who_judged: agent
written: "2026-11-19"
---

# Reconferência visual da F63 — Home e navegação que respondem

**Veredito: não passa limpo: sem P0, com 2 P1 para corrigir antes do aceite.** O frontmatter diz `verdict: fail`, `p0: 0`, `p1: 2`.

## Como foi feito

- **Quem julgou:** um agente revisor que não implementou nenhuma das seis features (pedido do integrador, via rápida, trilha do agente).
- **Onde:** `http://127.0.0.1:5010` (servidor local, código da `main`), no navegador embutido, em uma aba aberta só para isto, com a conta do MJRP já entrada (Firebase autenticado; o Spotify aparece «Connect» ou «Connected» conforme a hora). Só leitura: nada foi salvo, apagado, gerado, exportado nem desconectado. Foram abertos menus, a Home, `/albums`, a série `/albums/<id>`, `/blend`, `/blend?seriesId=<id>`, `/saved-playlists` e `/inventory`, em 1440 px, 1002 px (tamanho do painel) e 375 px (predefinição mobile). O tamanho da janela foi devolvido ao padrão e a aba foi fechada.
- **Referência de «como deve ficar»:** o `spec.md` e a prova de cada feature. **Não existem** `docs/specs/design-system.md` nem `docs/specs/info-arch.md` neste repositório (a pasta tem só arch, behavior, constitution, data-model, prd, priority, tech-stack, uat); não há protótipo aprovado nem tokens para comparar. Sem referência visual aprovada, o que se julga é o spec e se a tela está quebrada. Isto é o P2-1 de todos os relatórios.
- **Registro de honestidade:** uma consulta de leitura (medir a largura da barra do topo) foi disparada por engano na aba de outra pessoa (a do endereço de produção), por eu ter omitido o `tabId`; só leu a página, não mudou nada. Todo o resto foi na minha aba.

## O que o spec diz que deve aparecer

REQ-01 voltar do navegador volta; REQ-02 e REQ-03 colar lista aceita hífen no nome e mostra na tela a linha pulada com número, texto e motivo; REQ-05 item «Soon» do menu não navega; REQ-08 menu da conta abre por toque e teclado, fecha com clique fora e Esc e diz `aria-expanded`; REQ-09 aberto a partir de uma série, o blend vem com a série escolhida e o passo da receita liberado; REQ-10 a interface em inglês; REQ-14 na barra do topo o título sem caixa atrás e os nomes da conta e do Spotify inteiros quando há espaço, cortados com o nome inteiro ao passar o mouse.

## O que foi olhado

- **Barra do topo, 1440 px e 1002 px, e mobile 375 px.** O título saiu da caixa; links Home, Music Series, The Blending Menu, Playlists, Inventory; botão do Spotify («Connect» ou «Connected» + nome); botão da conta com `title` com o nome. Mobile: botão de menu à esquerda, avatar da conta à direita, sem rolagem horizontal; o menu da conta abre por clique (`aria-expanded` vira `true`, mostra «Signed in as … / Sign Out») e fecha com Esc (`aria-expanded` volta a `false`). REQ-08 conferido nisto.
- **Menu «Music Series»** (1440 px): abre; «By Album» marcado; «By Artist», «By Genre», «By Track» com «Soon», sem `href`, `aria-disabled=true`, cursor `not-allowed`. REQ-05 conferido.
- **Voltar do navegador:** `/albums/<id>` redireciona para `/albums?seriesId=<id>` sem empilhar entrada extra (o histórico da aba tem o tamanho esperado). Não cliquei «voltar» em sequência; **REQ-01 só conferido em parte.**
- **Idioma:** as telas, os menus e as descrições estão em inglês; nenhuma sobra em português nas telas visitadas. REQ-10 conferido nas telas vistas, não nas receitas (ver abaixo).

## O que NÃO foi olhado, e por quê

- Colar lista («Bulk Paste», «Process List»): REQ-02, REQ-03 e REQ-07; «Process List» busca no catálogo e pode abrir a criação de série; fora de só leitura. **Não conferido.**
- A volta do Spotify (REQ-04) exige conectar. **Não conferido.**
- Esc em diálogo de confirmação (REQ-06): os diálogos vêm de ações que alteram dados. **Não conferido.**
- ✕ da faixa à vista em toque e o olho de detalhes (REQ-08 parte): só aparecem com faixas geradas. **Não conferido.**
- Descrições das receitas e subtítulos das playlists em inglês (REQ-10): exigem avançar o blend. **Não conferido.**
- REQ-11, REQ-12 e REQ-13 o spec diz que não foram entregues; confirmo que o app não tem link para as telas de ranking e de migração (o menu não os mostra).

## Achados

- **P1-1. «Blend your Albums» de uma série não leva a série (contradiz REQ-09).** Na tela da série (`/albums/<id>` → `/albums?seriesId=<id>`), o botão «Blend your Albums» abre `/blend` **sem** `seriesId` e a série não vem escolhida; só o endereço digitado `/blend?seriesId=<id>` marca a série e libera o passo 2 (confirmado). A causa provável está em `public/js/views/helpers/SeriesComponentFactory.js` (`onGeneratePlaylists` só põe o `seriesId` quando `albumSeriesStore.getActiveSeries()` existe; nesta tela o escopo é «ALL» e a série ativa é nula). O `verified_by` do REQ-09 prova o `mount()` com o endereço, não o caminho do botão. Evidência: cliques reais, duas vezes, o endereço ficou `/blend`.
- **P1-2. A barra do topo estoura a largura quando o Spotify está conectado (contradiz REQ-14: nomes inteiros «quando há espaço», cortados com `title` quando não há).** Em 1440 px com «CONNECTED Maurício (Zé) Pedroso», o botão da conta termina em x = 1504 (a janela tem 1440): a página ganha rolagem horizontal de 64 px e o botão da conta fica cortado na borda direita. Em 1002 px (o tamanho do painel) mesmo com o Spotify desconectado a barra mede 1174 px e o botão do Spotify e a conta ficam fora da tela. O corte com `title` existe no nome da conta, mas o conjunto não encolhe: o layout não corta, transborda. Evidência: medição de `getBoundingClientRect` nos botões da barra e captura da tela, nos dois tamanhos.
- **P2-1.** Não há `design-system.md` nem `info-arch.md` (ver «Como foi feito»).
- **P2-2.** O rótulo do menu muda de «Music Series» (Home, blend) para «By Album» (álbuns, playlists) por mostrar a visão atual; é coerente, mas quem lê a barra pode estranhar.
- **P2-3.** A lista de séries traz «Dire Straits Vol.1» duas vezes (dados da conta, não tela).

