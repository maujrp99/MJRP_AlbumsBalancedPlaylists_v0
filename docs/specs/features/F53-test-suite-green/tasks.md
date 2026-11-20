<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F53: A suíte de testes volta a ficar verde · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] as 28 falhas agrupadas por causa antes de mexer: ambiente sem guardado do navegador, testes de código que mudou, roteiros de navegador contados como unidade
- [x] ramo criado: `fix/f53-test-suite-green`
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
- [x] TASK-01 `test/setup.js`: guardado do navegador para os testes, esvaziado a cada teste; `vitest.config.js`: `test/e2e/` fora da suíte de unidade — commit `0d402f9` · implements:: REQ-02, REQ-04 · model:: opus · rounds:: 2
- [x] TASK-02 testes reescritos ou reapontados para o código que existe: loja de séries, roteador, login, barra de filtros, painel do blend, duração da playlist, ranking consolidado, sincronização de usuário — commit `0d402f9` · implements:: REQ-01, REQ-03 · model:: opus · rounds:: 1

## Verification
- [x] TASK-03 `npx vitest run`: 431 passam, 0 falham, código de saída 0; repetido numa cópia limpa da `main` antes do deploy de 2026-11-19 · implements:: REQ-01 · model:: sonnet · rounds:: 1
- [x] TASK-04 achar a origem de «Maximum call stack size exceeded» na saída de erro da suíte — origem achada e consertada: o roteador chamava a si mesmo num endereço desconhecido (`docs/log.md`, 2026-11-19 16:13) · implements:: REQ-01 · model:: opus (não derruba teste; fica para a v5.0, junto da F58) · rounds:: 1

## Documentation
- [x] `docs/manual/24_Test_Suite.md`: as pastas de teste, como rodar e o endereço dos roteiros de navegador — commit `da65725`
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)
- [x] ramo levado à `main` (`ea393c1`); push e aceite são do MJRP

## For the owner at UAT
- O MJRP confere no navegador e dá o OK na UAT-149.
- Fechada em 2026-11-19 depois da prova do integrador; o aceite é do MJRP no UAT.
