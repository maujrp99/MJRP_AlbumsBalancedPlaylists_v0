# Tasks — Feature F81: O site em mais de um idioma · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [x] levantar todos os textos do site (`mjrp-generating-copy-deck`): `design/copy/album-blender-copy.md`, `scripts/i18n/scan-copy.cjs`, relatório em `reports/audits/`
- [ ] o MJRP responde as decisões D-01 a D-10 do relatório e revisa o mapa (coluna PT é proposta do agente, nada aprovado)
- [ ] conversa com o orquestrador do MJRPpersonal: como os sites dele tratam idiomas, e o que o CMS-kit já traz
- [ ] proposta de arquitetura da F83 (`mjrp-designing-architecture`), com a crítica separada, e o contrato do dicionário dela
- [ ] a feature priorizada; só então o ramo

## Implementation
- [ ] TASK-01 carregar o mapa aprovado como dicionário `en` e `pt` no formato do contrato da F83, com o identificador estável de cada linha · implements:: REQ-01, REQ-06 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-02 resolver o idioma: país do acesso na primeira visita, escolha guardada (aparelho e conta) acima do país, `lang` da página · implements:: REQ-02, REQ-03 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-03 seletor de idioma em todas as telas, na página de entrada e no celular, acessível por teclado e leitor de tela · implements:: REQ-04 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-04 migrar os textos tela a tela, junto com a migração para React da F83 (Start, Séries, Ranking, Blend, Playlists, Inventário, menus, modais), aplicando as decisões de rótulo único · implements:: REQ-01, REQ-05 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-05 textos montados: mensagens inteiras com variáveis e plural; datas, horas e moeda pelo idioma da tela · implements:: REQ-07 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-06 falhas: um texto por caso no lugar de `error.message`, com o código do servidor mapeado para texto do cliente · implements:: REQ-08 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-07 página de entrada e `index.html` (título, descrição, `lang`) no idioma, lidos sem script, sem piscar · implements:: REQ-09, REQ-02 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-08 sensor: rodar `scripts/i18n/scan-copy.cjs` sobre o código e falhar se achar texto fora do dicionário; e conferir que `en` e `pt` têm as mesmas chaves · implements:: REQ-01, REQ-05 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1

## Verification
- [ ] TASK-09 no navegador real (MCP Playwright), a 1280 e a 393 px, em cada idioma, com e sem conta: primeira visita por país (simulado), a escolha vence o país, trocar o idioma na tela, nenhuma tela com texto do outro idioma · implements:: REQ-02, REQ-03, REQ-04, REQ-05, REQ-07, REQ-08, REQ-09 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1

## Documentation
- [ ] `behavior.md`, o manual, `info-arch.md`, a evidência em `reports/evidence/F81/`; o mapa revisado e aprovado em `design/copy/`
