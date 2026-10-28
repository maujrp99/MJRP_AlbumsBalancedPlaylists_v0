# log — o que aconteceu, em ordem

> **Append-only.** Uma entrada por bloco de trabalho, mais recente no topo, com prefixo parseável: `## [AAAA-MM-DD HH:MM] <tipo> — título`. Tipos: `session`, `decision` (o conteúdo mora na página do assunto em `docs/wiki/`, seção `## History`), `ingest`, `inventory`, `harness-feedback`, `review` (uma passada de crítica, com o caminho do relatório). Hora de Brasília, sempre. Ninguém lê este arquivo inteiro — consulta-se por data ou `grep`. Aqui fica só o **quando**; o que é verdade mora na wiki, o estado no `MEMORY.md`.


## [2026-10-28 11:56] decision — v0 entra no harness como projeto brownfield; o fechado em produção nasce aceito — decidido pelo agente, revisável pelo MJRP

Contexto: decisão do MJRP de 2026-10-28 (confirmada por ele à orquestradora): o v0 do Album Blender (Vanilla JS, em produção) passa a ser projeto do harness; até 2026-10-27 era só fonte para a análise que alimenta o V1.

- [revisável] `new_project.py` rodou sem `--force` (`--profile code-app --process-level standard --ui --requirements-format story`, sensores do `package.json`: lint `npm run lint`, teste `npm test -- --run`, build `npm run build`) e só acrescentou 207 arquivos (nenhum existente alterado, apagado ou movido; código intocado) — deriva de a regra do MJRP de não sobrescrever e de «o código não se apaga nem se move».
- [revisável] `npm test` é o modo de observação do vitest; o contrato usa `npm test -- --run` para o sensor terminar — deriva de `package.json` scripts.test.
- [revisável] `screen:` do contrato declarado como `[public/]` (a tela mora em `public/index.html`, `public/css/`, `public/js/`); o valor do modelo (`web/src/`) não existe aqui — deriva de `public/` (código existente).
- [revisável] regras do MJRP de 2026-10-18 valem aqui: o que está fechado e em produção antes do commit que criou `.mjrp-project.yml` (54fd54c, 2026-10-28 11:52) nasce aceito, sem pedir aceite de histórico; o sensor visual não roda no fechado em produção — deriva de `docs/wiki/harness/conformance-notes.md` e da referência `legacy-history` da bootstrap.
- Todos os 19 ramos remotos (`backup-main-v1.6`, `prod-fixes`, `deploy-sa-helper`, `feature/*`, `fix/*`, `sprint-*`…) têm 0 commits que a `main` não tenha (`git rev-list --count origin/main..<ramo>`); das 70 tags, só `v2.7.0` tem 1 commit fora da `main` (f534ffc, 2025-12-15, CHANGELOG).
