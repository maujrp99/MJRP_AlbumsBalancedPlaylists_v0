---
type: visual-parity-recheck
subject: "Reconferência visual da F60 (nenhum trabalho salvo se perde): a tela construída contra o spec, sem protótipo"
project: mjrpalbumblender-v0
feature: F60
verdict: fail
p0: 0
p1: 1
who_judged: agent
written: "2026-11-19"
---

# Reconferência visual da F60 — nenhum trabalho salvo se perde

**Veredito: não passa limpo: sem P0, com 1 P1 para corrigir antes do aceite.** O frontmatter diz `verdict: fail`, `p0: 0`, `p1: 1`.

## Como foi feito

- **Quem julgou:** um agente revisor que não implementou nenhuma das seis features (pedido do integrador, via rápida, trilha do agente).
- **Onde:** `http://127.0.0.1:5010` (servidor local, código da `main`), no navegador embutido, em uma aba aberta só para isto, com a conta do MJRP já entrada (Firebase autenticado; o Spotify aparece «Connect» ou «Connected» conforme a hora). Só leitura: nada foi salvo, apagado, gerado, exportado nem desconectado. Foram abertos menus, a Home, `/albums`, a série `/albums/<id>`, `/blend`, `/blend?seriesId=<id>`, `/saved-playlists` e `/inventory`, em 1440 px, 1002 px (tamanho do painel) e 375 px (predefinição mobile). O tamanho da janela foi devolvido ao padrão e a aba foi fechada.
- **Referência de «como deve ficar»:** o `spec.md` e a prova de cada feature. **Não existem** `docs/specs/design-system.md` nem `docs/specs/info-arch.md` neste repositório (a pasta tem só arch, behavior, constitution, data-model, prd, priority, tech-stack, uat); não há protótipo aprovado nem tokens para comparar. Sem referência visual aprovada, o que se julga é o spec e se a tela está quebrada. Isto é o P2-1 de todos os relatórios.
- **Registro de honestidade:** uma consulta de leitura (medir a largura da barra do topo) foi disparada por engano na aba de outra pessoa (a do endereço de produção), por eu ter omitido o `tabId`; só leu a página, não mudou nada. Todo o resto foi na minha aba.

## O que o spec diz que deve aparecer

Salvar a edição de um lote num envio só; o botão de salvar desabilitado enquanto grava; apagar série avisa antes quantas playlists vão junto; sair da tela com alteração não salva pergunta; playlists geradas voltam ao recarregar; a janela de entrada avisa que os dados de visitante não passam para a conta; ao sair da conta o inventário some.

## O que foi olhado

- `/saved-playlists` (1440 px): título «Your Playlists Series», busca, dois seletores, «Refresh», cada série com «Add Playlists», «Open Albums Series» e a lixeira, e os lotes com «Edit Batch»; sem imagem quebrada nem rolagem horizontal. Legível e coerente.
- `/saved-playlists` em 375 px: o cabeçalho e os filtros ficam bem; **o cartão do lote não cabe** (achado abaixo).
- `/inventory`: a contagem fecha (211 = 6 + 204 + 1) e a conta mostrada é a da pessoa entrada.

## O que NÃO foi olhado, e por quê

Tudo o que depende de salvar, apagar ou sair da conta: o botão de salvar desabilitado durante a gravação, a janela «quantas playlists vão junto» ao apagar série, a pergunta ao sair com alteração não salva, o retorno das playlists geradas ao recarregar, o aviso de visitante na janela de entrada, o inventário sumindo ao sair. Todos proibidos nesta passada. **Não conferidos.** A prova da feature é `reports/evidence/F60-no-saved-work-lost/F60-browser-2026-11-19.json`, do implementador; não a li como prova visual.

## Achados

- **P1-1. `/saved-playlists` em 375 px estoura a largura.** O cartão do lote («1. Bob Dylan, The Band & Joni Mitchell SPFY Top 3 Bal.Intv.…») tem título, subtítulo e a linha de botões (`.batch-card-buttons`, «Edit Batch» e a lixeira) que passam de 375 px: o botão vai até x = 662 e a página ganha rolagem horizontal (largura 465 px); o título aparece cortado pela borda. O spec da F60 coloca o botão de salvar e as ações do lote nesta tela e pede que continuem acessíveis; num telefone o botão de ação fica fora da tela. Não consegui dizer se é regressão da F60 ou antigo (não havia referência); trato como P1 porque é a tela dos fluxos que a F60 protege. Evidência: medição no navegador, 375 px, `docScroll` 465, e captura da tela.
- **P2-1.** Não há `design-system.md` nem `info-arch.md` (ver «Como foi feito»).

