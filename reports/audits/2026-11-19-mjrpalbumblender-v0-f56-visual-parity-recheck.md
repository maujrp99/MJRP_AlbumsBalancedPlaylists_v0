---
type: visual-parity-recheck
subject: "Reconferência visual da F56 (todas as telas carregam pelo serviço de carga): a tela construída contra o spec, sem protótipo"
project: mjrpalbumblender-v0
feature: F56
verdict: pass
p0: 0
p1: 0
who_judged: agent
written: "2026-11-19"
---

# Reconferência visual da F56 — todas as telas carregam pelo serviço de carga

**Veredito: passa, sem P0 e sem P1.** O frontmatter diz `verdict: pass`, `p0: 0`, `p1: 0`.

## Como foi feito

- **Quem julgou:** um agente revisor que não implementou nenhuma das seis features (pedido do integrador, via rápida, trilha do agente).
- **Onde:** `http://127.0.0.1:5010` (servidor local, código da `main`), no navegador embutido, em uma aba aberta só para isto, com a conta do MJRP já entrada (Firebase autenticado; o Spotify aparece «Connect» ou «Connected» conforme a hora). Só leitura: nada foi salvo, apagado, gerado, exportado nem desconectado. Foram abertos menus, a Home, `/albums`, a série `/albums/<id>`, `/blend`, `/blend?seriesId=<id>`, `/saved-playlists` e `/inventory`, em 1440 px, 1002 px (tamanho do painel) e 375 px (predefinição mobile). O tamanho da janela foi devolvido ao padrão e a aba foi fechada.
- **Referência de «como deve ficar»:** o `spec.md` e a prova de cada feature. **Não existem** `docs/specs/design-system.md` nem `docs/specs/info-arch.md` neste repositório (a pasta tem só arch, behavior, constitution, data-model, prd, priority, tech-stack, uat); não há protótipo aprovado nem tokens para comparar. Sem referência visual aprovada, o que se julga é o spec e se a tela está quebrada. Isto é o P2-1 de todos os relatórios.
- **Registro de honestidade:** uma consulta de leitura (medir a largura da barra do topo) foi disparada por engano na aba de outra pessoa (a do endereço de produção), por eu ter omitido o `tabId`; só leu a página, não mudou nada. Todo o resto foi na minha aba.

## O que o spec diz que deve aparecer

Refatoração de carga: o blend e a edição de playlists pedem os álbuns ao serviço de carga; um álbum que falha vira aviso; salvar a edição de uma série recarrega só o que mudou. Nada de tela nova: **o que se vê deve ficar igual**, só mais rápido e com o aviso de falha.

## O que foi olhado

- `/blend` (1440 px): o passo «Choose Your Mix» abre com a lista de séries e as contagens («10 albums», «3 albums»), o seletor «Albums», os quatro passos (Mix, Recipe, Ingredients, Blend it! Ready!), sem imagem quebrada (0 de 0), sem rolagem horizontal. As 46 séries aparecem; a lista rola dentro da caixa.
- `/blend?seriesId=<id>`: abre com a série marcada e o passo 2 (Recipe) liberado.
- `/albums` e a série `/albums/<id>` (redireciona para `/albums?seriesId=<id>`): 172 imagens, 0 quebradas, cartões com selos de fonte, sem sobreposição.
- `/saved-playlists`: carrega os lotes guardados.

## O que NÃO foi olhado, e por quê

- O aviso de «álbum que falhou» e o texto de «quais e quantos ficaram de fora» do blend e da edição: só aparecem ao gerar (ou com falha provocada); gerar é proibido nesta passada de só leitura. **Não conferido.**
- Salvar a edição de uma série recarregando só o que mudou: exige salvar. **Não conferido** (a prova da feature é a `reports/evidence/F56/2026-11-19-screens-through-the-load-service-proof.md`, feita pelo implementador).

## Achados

Nenhum P0 nem P1 desta feature.

- **P2-1.** Não há `design-system.md` nem `info-arch.md` para comparar (ver «Como foi feito»).
- **P2-2.** Na série aberta por `/albums/<id>` o título da página continua «All Albums Series» e o seletor de série diz «All Series», embora só os 2 álbuns da série apareçam. Não é desta feature (é o escopo da tela de álbuns), mas quem lê a tela não vê qual série está filtrada.

