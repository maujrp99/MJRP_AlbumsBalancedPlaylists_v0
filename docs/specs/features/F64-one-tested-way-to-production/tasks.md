<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F64: Um caminho só, testado, para produção · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] lidos os dois scripts antigos, o `cloudbuild.yaml`, o `server/Dockerfile`, a automação, as três issues e os passos feitos à mão no `docs/log.md`; lida do serviço a origem da imagem em produção
- [x] ramo criado: `fix/f64-one-tested-way-to-production`
- [ ] conferência cruzada da spec e do plano: fica para o fecho, porque os dois foram escritos depois do código

## Implementation
- [x] TASK-01 `scripts/lib/deploy-common.sh` e `scripts/deploy-site.sh`: publicar o site da `main` commitada, com `--dry-run` — commit `fca0108` · implements:: REQ-01, REQ-03 · model:: opus · rounds:: 2
- [x] TASK-02 `scripts/deploy-server.sh`: publicar o servidor da `main` commitada, com a subida local do contexto e `--dry-run` — commit `fca0108` · implements:: REQ-02, REQ-03 · model:: opus · rounds:: 2
- [x] TASK-03 uma receita da imagem: `cloudbuild.yaml` removido; `server/Dockerfile` em `node:26-slim` e `npm ci --omit=dev` — commit `fca0108` · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-04 `scripts/deploy-prod.sh` e `scripts/deploy-backend.sh` removidos; `deploy:site`, `deploy:server` e as variantes `:dry-run` no `package.json` — commit `fca0108` · implements:: REQ-06 · model:: sonnet · rounds:: 1
- [x] TASK-05 `.github/workflows/ci.yml` (era `ci-firebase.yml`): só os testes unitários, em push e pull request, sem publicação — commit `fca0108` · implements:: REQ-05 · model:: opus · rounds:: 1

## Verification
- [x] TASK-06 os dois ensaios até o fim na `main` em `e54c80e` (493 testes), pasta temporária removida; recusa com a `main` suja e com o Client ID vazio; `reports/evidence/F64-one-tested-way-to-production/` · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-07 o servidor no Node 26: subida local com as dependências do lockfile, ES256 com chave descartável, `cheerio` e `axios` carregados · implements:: REQ-04 · model:: opus · rounds:: 1
- [ ] TASK-08 primeira publicação real com os scripts, do site e do servidor (com o Node 26) · implements:: REQ-01, REQ-02, REQ-04 · model:: opus · waiting:: human — publicar em produção e trocar o Node do servidor dependem do sim do MJRP · action:: o MJRP dá o sim; o agente integrador roda `npm run deploy:site` e `npm run deploy:server` depois de integrar o ramo na `main`
- [ ] TASK-09 a automação do GitHub roda uma vez e o job `unit-tests` passa · implements:: REQ-05 · model:: sonnet · waiting:: human — o push é do MJRP e a automação só roda no GitHub · action:: o MJRP faz o push; depois, abrir a aba de automação do repositório e conferir o resultado
- [ ] TASK-10 julgamento do MJRP (tarefa do humano) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06 · model:: opus · waiting:: human — o aceite das issues é do MJRP · action:: o MJRP confere uma publicação feita pelos scripts e dá o OK na UAT-202 e na UAT-22; a UAT-20 só fecha quando o lint reprovar
- [x] TASK-11 a aba aberta antes de uma publicação carrega a versão nova uma vez (`utils/staleBuild.js`, roteador) e a página sai com `Cache-Control: no-cache` (`firebase.json`) · implements:: REQ-07 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/manual/00_Deployment_and_Setup.md` (seções 1 e 2), `.env.example` e as instruções em `.github/` descrevem o caminho único
- [x] spec, plano e tarefas escritos do que foi feito (passo retroativo, 2026-11-19)
- [ ] `docs/specs/arch.md` e `docs/specs/tech-stack.md`: tirar os scripts antigos, o `cloudbuild.yaml` e o Node 18 das linhas de implantação (fora dos caminhos desta entrega; fica para a integração)
- [ ] fechar chamando a `mjrp-ensuring-sdd` antes do Done; só então `status: Done` (depende do aceite do MJRP)
