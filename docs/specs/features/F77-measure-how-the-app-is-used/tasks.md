# Tasks — Feature F77: O uso do app, medido (PostHog) · Plan: [[plan]]
**Approved**: pendente (o MJRP priorizou em 2026-11-20; o plano e as decisões do agente esperam o julgamento dele)

## Pre-Implementation
- [x] a feature priorizada pelo MJRP; o ramo `feat/f77-measure-how-the-app-is-used` criado da `main` local (`ada8da4`)
- [x] lidos o `AGENTS.md`, o `spec.md`, o `arch.md` (as fontes trocáveis, a porta das rotas pagas, a camada do celular), o jeito de o client id do Spotify chegar ao build (`vite.config.js`, `.env.example`, `scripts/deploy-site.sh`), `models/buyLinks.js`, o roteador e os testes de arquitetura
- [x] as opções do `posthog-js` conferidas na documentação dele e nos tipos do pacote instalado, não de memória

## Implementation
- [x] TASK-01 a lista fechada de eventos em `shared/usageEvents.js` e a porta `services/usage/track.js`; testes em `test/shared/usageEvents.test.js` e `test/services/usage/track.test.js` · implements:: REQ-01, REQ-03, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-02 o interruptor (`usageSwitch.js`), o adaptador do PostHog carregado só quando ligado (`posthogAdapter.js`), o de depuração (`memoryAdapter.js`), a fiação (`usageWiring.js`) e o teste `test/architecture/usageBehindThePort.test.js` · implements:: REQ-01, REQ-03, REQ-04 · model:: opus · rounds:: 1
- [x] TASK-03 os eventos das tarefas, onde a ação dá certo (séries, ranking, gerar, gravar, exportar, inventário, filtros, entrar, sair), os links de compra marcados nos quatro lugares, a tela pelo nome da rota; testes em `test/services/usage/eventsOf*.test.js` · implements:: REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-04 as variáveis do build no `.env.example`, o CSP do `index.html` e a conferência do `deploy-site.sh` · implements:: REQ-04 · model:: opus · rounds:: 1

## Verification
- [x] TASK-05 suíte, lint e build verdes; num navegador, sem conta e com o adaptador de depuração, a 1002 px e a 375 px: as telas pelo nome, a busca medida uma vez sem o texto, o clique em link de compra medido sem segurar a navegação; sem chave, nenhum pedido a host do PostHog · implements:: REQ-02, REQ-03, REQ-04 · model:: opus · rounds:: 1
- [ ] TASK-06 os eventos chegam ao PostHog · implements:: REQ-02, REQ-04 · model:: opus · waiting:: human — o projeto e a chave do PostHog são do MJRP · action:: criar o projeto (EU), pôr a chave no `.env`, publicar e ver os eventos lá

## Documentation
- [x] `docs/specs/arch.md`: «A medição do uso: a porta e o adaptador (F77)» e as linhas do mapa de componentes
- [x] `docs/specs/behavior.md`: a seção «Medição do uso (F77)» (`^usage-off`, `^usage-on`, `^usage-debug`, `^usage-events`, `^usage-buy-link`, `^usage-never`) e a chave `mjrp.usage`
- [x] `docs/specs/data-model.md`: os eventos de uso, apontando para `shared/usageEvents.js`, e a chave do navegador
- [x] `docs/specs/tech-stack.md`: o `posthog-js`
- [x] `docs/manual/00_Deployment_and_Setup.md`: as variáveis do build, como ligar e como desligar

## For the owner at UAT
- julgar as onze decisões «decidido pelo agente — revisável» do `plan.md`, em especial: a nuvem da Europa; o identificador que vive o tempo da página; os dois eventos acrescentados
- ao criar o projeto, conferir em Settings > Project > Privacy que a captura de IP está desligada
