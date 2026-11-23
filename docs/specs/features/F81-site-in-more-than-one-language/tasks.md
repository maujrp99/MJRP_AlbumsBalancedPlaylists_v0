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
- [x] TASK-02 resolver o idioma: país do acesso na primeira visita (o arquivo `/country.json` que o Firebase Hosting responde por país; sem ele, o idioma do navegador), escolha guardada no aparelho acima do país, `lang` da página, sem piscar no outro idioma · implements:: REQ-02, REQ-03 · model:: fable · rounds:: 1 — feito em 2026-11-23 no ramo `feat/f81-language-by-country-and-switch` (UAT-303, UAT-304); a parte «na conta» do REQ-03 saiu desta task e é a linha TASK-02b
- [ ] TASK-02b a escolha do idioma também na conta (vale em outro aparelho; a mais recente vence quando aparelho e conta divergem) · implements:: REQ-03 · model:: sonnet · waiting:: human — não há documento do usuário nem regra no banco para guardar a escolha, e `firestore.rules` é do MJRP (spec, «no aparelho desde já, e na conta quando ele publicar a regra nova de acesso ao banco») · action:: o MJRP publica a regra que deixa cada pessoa ler e gravar a própria preferência de idioma · rounds:: 0
- [x] TASK-03 seletor de idioma em todas as telas do app (no painel da conta, no computador, e no Menu do celular), acessível por teclado e leitor de tela; a página de entrada já tem o seu (F80), na mesma chave · implements:: REQ-04 · model:: fable · rounds:: 1 — feito em 2026-11-23 no ramo `feat/f81-language-by-country-and-switch` (UAT-305, UAT-306)
- [ ] TASK-04 migrar os textos tela a tela, junto com a migração para React da F83 (Start, Séries, Ranking, Blend, Playlists, Inventário, menus, modais), aplicando as decisões de rótulo único · implements:: REQ-01, REQ-05 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-05 textos montados: mensagens inteiras com variáveis e plural; datas, horas e moeda pelo idioma da tela · implements:: REQ-07 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-06 falhas: um texto por caso no lugar de `error.message`, com o código do servidor mapeado para texto do cliente · implements:: REQ-08 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-07 página de entrada e `index.html` (título, descrição, `lang`) no idioma, lidos sem script, sem piscar · implements:: REQ-09, REQ-02 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1
- [ ] TASK-08 sensor: rodar `scripts/i18n/scan-copy.cjs` sobre o código e falhar se achar texto fora do dicionário; e conferir que `en` e `pt` têm as mesmas chaves · implements:: REQ-01, REQ-05 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1

## Verification
- [ ] TASK-09 no navegador real (MCP Playwright), a 1280 e a 393 px, em cada idioma, com e sem conta: primeira visita por país (simulado), a escolha vence o país, trocar o idioma na tela, nenhuma tela com texto do outro idioma · implements:: REQ-02, REQ-03, REQ-04, REQ-05, REQ-07, REQ-08, REQ-09 · model:: sonnet · waiting:: human — espera as decisões D-01 a D-13 do MJRP, a proposta da F83 e a priorização da F81 · action:: o MJRP responde D-01 a D-13 do relatório e põe a F81 na «Priorizada» · rounds:: 1

## Documentation
- [ ] `behavior.md`, o manual, `info-arch.md`, a evidência em `reports/evidence/F81/`; o mapa revisado e aprovado em `design/copy/`
