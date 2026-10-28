# MEMORY

## Now

**Where the Work Stopped.** (2026-10-28 13:03) O v0 do Album Blender entrou no harness como projeto brownfield em produção (decisão do MJRP de 2026-10-28). Bootstrap feito e conform da sessão A parado no ponto de revisão: a `docs/log.md` tem as decisões e as notas aplicadas estão em `conformance.applied` do `.mjrp-project.yml`; o juiz independente (sessão B) ainda não começou. Código do v0 intocado; commits locais na `main`, sem push. Já no repositório: 18 features de histórico por release, 25 issues de UAT na trilha do agente (`docs/specs/uat.md`) e a crítica de arquitetura.

**Pending on Agent.** (2026-10-28) Nada em voo. Notas ainda abertas: tela (`info-arch`, `info-arch-sections`, `wireframes`, `design-system`, `visual-sensor`) e `project-palette`, e a auditoria de conteúdo (`content-audit`). Próximo passo: a sessão B audita e a rodada de correção responde aos achados.

**Pending on Human.** (2026-10-28) Perguntas do conform (visão, medidas dos resultados, paleta, regras do Firestore, aceite do `tech-stack.md` e da ADR-0018, revogar o token de serviço de discos): rascunho na pasta de notas das sessões laterais (`v0-conform-perguntas-ao-mjrp.md`), que a sessão B passa para a seção de perguntas do relatório de auditoria em `reports/audits/`. Push dos commits locais: é dele.

**Do Not Forget.** Não alterar, apagar nem mover código do v0 (em produção). O fechado antes do contrato (commit 54fd54c) nasce aceito; sensor visual só na tela alterada depois. Economia de uso até 2026-10-30: subagentes em Sonnet, sem wireframe nem protótipo, doctor completo só no fechamento. As válvulas são do MJRP (`--no-verify`, `Human-accepted:` e as outras): nunca do agente.

## Ways of Working

