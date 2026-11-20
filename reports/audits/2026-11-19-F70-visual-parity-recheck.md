---
type: visual-parity-recheck
subject: "Reconferência visual da F70 (pequenos defeitos achados pelo caminho): a tela construída contra o spec, sem protótipo"
project: mjrpalbumblender-v0
feature: F70
verdict: pass
p0: 0
p1: 0
who_judged: agent
written: "2026-11-19"
---

# Reconferência visual da F70 — pequenos defeitos achados pelo caminho

**Veredito: passa, sem P0 e sem P1.** O frontmatter diz `verdict: pass`, `p0: 0`, `p1: 0`.

## Como foi feito

- **Quem julgou:** um agente revisor que não implementou nenhuma das seis features (pedido do integrador, via rápida, trilha do agente).
- **Onde:** `http://127.0.0.1:5010` (servidor local, código da `main`), no navegador embutido, em uma aba aberta só para isto, com a conta do MJRP já entrada (Firebase autenticado; o Spotify aparece «Connect» ou «Connected» conforme a hora). Só leitura: nada foi salvo, apagado, gerado, exportado nem desconectado. Foram abertos menus, a Home, `/albums`, a série `/albums/<id>`, `/blend`, `/blend?seriesId=<id>`, `/saved-playlists` e `/inventory`, em 1440 px, 1002 px (tamanho do painel) e 375 px (predefinição mobile). O tamanho da janela foi devolvido ao padrão e a aba foi fechada.
- **Referência de «como deve ficar»:** o `spec.md` e a prova de cada feature. **Não existem** `docs/specs/design-system.md` nem `docs/specs/info-arch.md` neste repositório (a pasta tem só arch, behavior, constitution, data-model, prd, priority, tech-stack, uat); não há protótipo aprovado nem tokens para comparar. Sem referência visual aprovada, o que se julga é o spec e se a tela está quebrada. Isto é o P2-1 de todos os relatórios.
- **Registro de honestidade:** uma consulta de leitura (medir a largura da barra do topo) foi disparada por engano na aba de outra pessoa (a do endereço de produção), por eu ter omitido o `tabId`; só leu a página, não mudou nada. Todo o resto foi na minha aba.

## O que o spec diz que deve aparecer

Visitante não chama rota paga; editar o preço de um item do inventário mantém a moeda; o desfecho das fontes de notas é lido do servidor; **toda capa de álbum mostra o mesmo substituto** quando falta o endereço ou o endereço falha.

## O que foi olhado

- Capas: `/inventory` com 216 imagens, 0 quebradas e 15 usando substituto, todas desenhadas (nenhuma imagem vazia ou ícone de imagem quebrada); `/albums` com 172 imagens e 0 quebradas; o cartão de série e o de blend sem capa vazia. O substituto é o mesmo nas 15 ocorrências do inventário. REQ-04 conferido nisso.
- Os preços em `R$` no inventário aparecem com a moeda do item (`R$ 100.00`, `R$ 30.00`); isso é leitura, não prova de gravação.

## O que NÃO foi olhado, e por quê

- Editar o preço (REQ-02): grava no banco. **Não conferido** (a spec diz que nenhuma tela chama esse caminho; a janela de editar manda preço e moeda juntos).
- O visitante sem chamadas pagas (REQ-01) e as notas da busca por IA (REQ-03): exigem sair da conta e buscar com IA. **Não conferidos** (a prova é a TASK-06, do implementador).
- O substituto na falha de carregamento da imagem de um endereço real (`onerror`): não consegui provocar a falha em só leitura.

## Achados

Nenhum P0 nem P1.

- **P2-1.** Não há `design-system.md` nem `info-arch.md` (ver «Como foi feito»).
- **P2-2.** O inventário mostra «Total Owned: $0.00 USD» enquanto há itens com preço em `R$`; com 6 itens «Owned» e os de preço aparentemente «Not Owned» pode estar certo, mas a soma em USD sem converter a moeda merece uma olhada do dono.

