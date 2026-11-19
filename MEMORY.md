# MEMORY

## Now

**Where the Work Stopped.** (2026-11-19 11:16) O MJRP mandou consertar o v0 pela via rápida, do mais grave ao menos grave, com prova no navegador. A versão «v4.0 · Carregamento e estabilidade» (`^REL-39`) está aberta, com a Rodada 2 do `uat.md` (UAT-172 a 178) e as features F45 a F50 em esboço. A carga do `/albums` foi reproduzida e medida no navegador (evidência em `reports/evidence/F45-*` e `F46-*`); nenhum código foi alterado ainda. Próximo: a F45 (carga em paralelo, com prazo, só as séries à vista), em ramo próprio.

**Pending on Agent.** (2026-11-19 11:16) F45 a F50, uma por ramo, com teste que falha antes e captura de antes e depois. Montar o resto da lista por gravidade a partir das notas dos seis leitores dos apêndices (`v0-appendix-*-verified.md`, na pasta de notas das sessões) e das issues abertas da Rodada 1. Resposta da orquestradora do harness sobre a release só de consertos (o `product_structure_check.py` acusa a REL-39 sem stories). Notas do conform seguem abertas: tela, `project-palette`, `content-audit`.

**Pending on Human.** (2026-11-19 11:16) Aceite de cada conserto (as issues do MJRP só fecham com o OK dele). Push dos commits locais. Conectar o Spotify no app local quando a F50 pedir. As perguntas do conform (classe b e c) seguem no relatório de auditoria.

**Do Not Forget.** O código do v0 passou a ser consertado por decisão do MJRP de 2026-11-19 (log); está em produção e só ele usa: a prova no navegador roda contra o servidor e o Firestore de produção, com o login dele. Conserto em `server/` só se prova publicando. O fechado antes do contrato (commit 54fd54c) nasce aceito. As válvulas são do MJRP (`--no-verify`, `Human-accepted:`, push e as outras): nunca do agente. Dúvida sobre o harness: perguntar ao agente mestre do harness.

## Ways of Working

