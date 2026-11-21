<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F50: Um endereço local só para o login e para o Spotify · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] causa da UAT-182 lida no código antes de mexer: a conexão avisava por `spotify-auth-success`, o botão só escutava `spotify-auth-change`
- [x] ramo criado: `fix/f50-one-local-address`, sobre a integração da F46 e da F48
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
- [x] TASK-01 `test/utils/localAddress.test.js` e `public/js/utils/localAddress.js`; chamada na entrada do `public/js/app.js` — os testes falhavam antes · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `vite.config.js` na porta 5010 com `strictPort`; `PORT_INFO.txt`, `README.md`, `.env.example`, `restart_dev.sh` e os scripts de `test/` no endereço novo · implements:: REQ-02 · model:: sonnet · rounds:: 1
- [x] TASK-03 `test/services/spotify/SpotifyAuthSignal.test.js`; `SpotifyAuthService.setSession` dispara `spotify-auth-change`; o botão busca o nome da conta ao ouvir — commit `5debc7b` · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-04 o «x» pergunta por `dialogService.confirm` — commit `feae54d` · implements:: REQ-04 · model:: opus · rounds:: 1

## Verification
- [x] TASK-05 no navegador: `localhost:5010` cai em `127.0.0.1:5010`; o «x» abre o diálogo e desconecta; o MJRP conectou e desconectou («ok agora no 5010»); `reports/evidence/F50-one-local-address/F50-probe-2026-11-19.json` · implements:: REQ-01, REQ-03, REQ-04 · model:: opus · rounds:: 1
- [ ] TASK-06 o que a trava do passo retroativo ainda cobra antes do `Done` (`python3 mjrp-scripts/retro_step_check.py . --staged` com a feature em `Done`, conferido em 2026-11-21): Reconferência visual: a feature mexeu na tela e não há relatório `visual-parity-recheck` nem nota de Touch ID (`mjrp-visual-ok`) que a cubra. É trabalho de agente; nenhum item é do MJRP. O que falta de verdade é a reconferência visual independente (relatório `reports/audits/<data>-F50-visual-parity-recheck.md`, por quem não implementou, num navegador): nenhum merge traz nota de Touch ID. «Prototype: none» já está gravada na spec (MJRP, 2026-11-20 00:10). · implements:: REQ-01 · model:: opus

## Documentation
- [x] `docs/manual/00_Deployment_and_Setup.md`: o endereço local único, os cadastros e a variável do Spotify
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)
- [x] levar o ramo à `main` — feito: ramo mergeado na `main` local (`40ca80d`)

## For the owner at UAT
- O MJRP confere e dá o OK na UAT-178, na UAT-182 e na UAT-183.
- Falta o que a tarefa aberta acima descreve (trabalho de agente); o aceite é dele no UAT, depois do `Done`.
- Push da `main` ao remoto (e, com ele, a primeira rodada da automação do GitHub): é do MJRP.
