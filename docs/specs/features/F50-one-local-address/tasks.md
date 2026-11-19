<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F50: Um endereço local só para o login e para o Spotify · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] causa da UAT-182 lida no código antes de mexer: a conexão avisava por `spotify-auth-success`, o botão só escutava `spotify-auth-change`
- [x] ramo criado: `fix/f50-one-local-address`, sobre a integração da F46 e da F48
- [ ] conferência cruzada da spec e do plano: fica para o fecho, porque os dois foram escritos depois do código

## Implementation
- [x] TASK-01 `test/utils/localAddress.test.js` e `public/js/utils/localAddress.js`; chamada na entrada do `public/js/app.js` — os testes falhavam antes · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `vite.config.js` na porta 5010 com `strictPort`; `PORT_INFO.txt`, `README.md`, `.env.example`, `restart_dev.sh` e os scripts de `test/` no endereço novo · implements:: REQ-02 · model:: sonnet · rounds:: 1
- [x] TASK-03 `test/services/spotify/SpotifyAuthSignal.test.js`; `SpotifyAuthService.setSession` dispara `spotify-auth-change`; o botão busca o nome da conta ao ouvir — commit `5debc7b` · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-04 o «x» pergunta por `dialogService.confirm` — commit `feae54d` · implements:: REQ-04 · model:: opus · rounds:: 1

## Verification
- [x] TASK-05 no navegador: `localhost:5010` cai em `127.0.0.1:5010`; o «x» abre o diálogo e desconecta; o MJRP conectou e desconectou («ok agora no 5010»); `reports/evidence/F50-one-local-address/F50-probe-2026-11-19.json` · implements:: REQ-01, REQ-03, REQ-04 · model:: opus · rounds:: 1
- [ ] TASK-06 julgamento do MJRP (tarefa do humano); UAT-178, UAT-182 e UAT-183 seguem sem o aceite até lá · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: opus

## Documentation
- [x] `docs/manual/00_Deployment_and_Setup.md`: o endereço local único, os cadastros e a variável do Spotify
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)
- [ ] levar o ramo à `main` (push e aceite são do MJRP)
- [ ] fechar chamando a `mjrp-ensuring-sdd` antes do Done; só então `status: Done`
