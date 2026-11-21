---
type: visual-parity-recheck
subject: "Reconferência visual da F58 (serviço de carga dentro do limite de complexidade): a tela construída contra o spec, sem protótipo"
project: mjrpalbumblender-v0
feature: F58
verdict: pass
p0: 0
p1: 0
who_judged: agent
written: "2026-11-19"
---

# Reconferência visual da F58 — serviço de carga dentro do limite de complexidade

**Veredito: passa, sem P0 e sem P1.** O frontmatter diz `verdict: pass`, `p0: 0`, `p1: 0`.

## Como foi feito

- **Quem julgou:** um agente revisor que não implementou nenhuma das seis features (pedido do integrador, via rápida, trilha do agente).
- **Onde:** `http://127.0.0.1:5010` (servidor local, código da `main`), no navegador embutido, em uma aba aberta só para isto, com a conta do MJRP já entrada (Firebase autenticado; o Spotify aparece «Connect» ou «Connected» conforme a hora). Só leitura: nada foi salvo, apagado, gerado, exportado nem desconectado. Foram abertos menus, a Home, `/albums`, a série `/albums/<id>`, `/blend`, `/blend?seriesId=<id>`, `/saved-playlists` e `/inventory`, em 1440 px, 1002 px (tamanho do painel) e 375 px (predefinição mobile). O tamanho da janela foi devolvido ao padrão e a aba foi fechada.
- **Referência de «como deve ficar»:** o `spec.md` e a prova de cada feature. **Não existem** `docs/specs/design-system.md` nem `docs/specs/info-arch.md` neste repositório (a pasta tem só arch, behavior, constitution, data-model, prd, priority, tech-stack, uat); não há protótipo aprovado nem tokens para comparar. Sem referência visual aprovada, o que se julga é o spec e se a tela está quebrada. Isto é o P2-1 de todos os relatórios.
- **Registro de honestidade:** uma consulta de leitura (medir a largura da barra do topo) foi disparada por engano na aba de outra pessoa (a do endereço de produção), por eu ter omitido o `tabId`; só leu a página, não mudou nada. Todo o resto foi na minha aba.

## O que o spec diz que deve aparecer

Refatoração: complexidade ≤ 10 nas funções da carga, a espera pedida pelo servidor vira estado da loja, o Firestore fica atrás dos repositórios. **Nenhuma mudança visível**; a carga «se comporta como antes».

## O que foi olhado

A tela de álbuns e a Home carregam (console: worker pronto com 38 560 álbuns, autenticação concluída, sem erro de console); `/albums` mostra os cartões com capa, selos e contagem; sem imagem quebrada, sem texto cortado nem sobreposto, em 1440 px. As telas que passam pela camada de serviço que a F58 mexeu (Home, álbuns, blend, playlists guardadas, inventário) abriram sem falha.

## O que NÃO foi olhado

- O estado explícito de espera («entre na conta», «aguarde», «fonte ocupada») e a «carga parada»: só aparecem com o servidor pedindo espera ou com carga interrompida; não há como provocar em só leitura. **Não conferido.**
- O comportamento sob «Refresh» e «Clear Cache» (proibidos aqui). **Não conferido.**

## Achados

Nenhum P0 nem P1.

- **P2-1.** Não há `design-system.md` nem `info-arch.md` (ver «Como foi feito»).

