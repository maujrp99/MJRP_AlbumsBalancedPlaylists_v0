---
status: Done
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-212", "UAT-213", "UAT-214", "UAT-215", "UAT-219"]
planned_for: "[[ROADMAP#^REL-40]]"
---
# Feature F73: As telas mantêm o campo em uso e largam o que deixaram
**Approved**: not a gate (via rápida; o MJRP julga)

> **Nota de 2026-11-23 (arrumação do board).** As telas feitas à mão que esta feature consertou (playlists e inventário) foram reescritas em React (F83, em produção desde 2026-11-23); o `utils/keepField.js` saiu com elas. O comportamento pedido continua valendo, agora nas telas de `public/js/screens/`.

## Summary
**A feature:** Quatro defeitos do ciclo de vida das telas, achados pelo MJRP ao testar a exportação em produção: o campo «Batch Name» perde o foco enquanto se digita; os botões de exportar não respondem numa aba aberta durante uma publicação; recarregar sem salvar mostra uma tela antiga de geração; a tela do inventário continua viva depois de deixada.

**Por quê:** O MJRP não conseguiu nomear o lote nem exportar em produção.

**Como saber que funcionou:** Digitar no «Batch Name» enquanto os álbuns carregam mantém o foco; clicar num botão de exportar numa aba de versão antiga recarrega o app uma vez; `/playlists` sem playlists diz isso e leva ao Blending Menu; depois de sair do inventário, nenhuma mudança no inventário redesenha a tela atual.

## Problem Statement
Relato do MJRP em produção, 2026-11-19: «bug de foco/keystroke no batch name field. sugiro verificar todos os campos, pq esse bug parece que existe pelo site … depois disso parece que as exportacoes, os botoes nao funcionam mais»; «se eu dou reload antes de salvar aparece essa tela antiga, que é lixo, nao deveria aparecer».

## Requirements
- [REQ-01] Um campo de texto em uso continua em uso, com o texto e o cursor, quando a tela é redesenhada. · fixes UAT-212
  verified_by:: `reports/evidence/F73/2026-11-19-screens-keep-the-field-proof.md` (a prova no navegador, na entrega); visto de novo pelo juiz separado em 2026-11-21 (`reports/audits/2026-11-21-mjrpalbumblender-v0-playlists-blend-visual-parity-recheck.md`). O teste da entrega (`test/utils/keepField.test.js`) saiu com as telas antigas na migração para React
- [REQ-02] Um arquivo do app pedido na hora de um clique que não existe mais (a aba roda uma versão antiga) faz o app carregar de novo, uma vez. · fixes UAT-213
  verified_by:: `test/utils/staleBuild.test.js`; `reports/evidence/F73/2026-11-19-screens-keep-the-field-proof.md`
- [REQ-03] `/playlists` sem playlists e fora da edição diz que não há playlists e leva ao Blending Menu; as configurações iniciais antigas não são desenhadas. · fixes UAT-214
  verified_by:: `test/screens/playlists/Playlists.test.tsx` (o estado «No playlists here yet»); `reports/evidence/F73/2026-11-19-screens-keep-the-field-proof.md`
- [REQ-04] Uma tela deixada não escuta mais nenhuma loja; uma regra só diz como uma tela se inscreve e se solta. · fixes UAT-215
  verified_by:: `test/architecture/viewLifecycle.test.js`; `reports/evidence/F73/2026-11-19-screens-keep-the-field-proof.md`
- [REQ-05] Uma tela redesenhada fica onde a pessoa estava na página: a rolagem não volta ao topo. · fixes UAT-219
  verified_by:: `reports/evidence/F73/2026-11-19-screens-keep-the-field-proof.md` (a seção «REQ-05 — a rolagem fica onde estava»)

## Observable States
A feature não importa nenhum requisito (conserto de quatro issues). Os estados de comportamento que mudam ou nascem, em `docs/specs/behavior.md`:

- `^playlists-batch-name-live` (muda): o campo em uso continua em uso quando a tela é redesenhada.
- `^playlists-no-albums` (muda): sem playlists, a tela diz isso e leva ao Blending Menu; o formulário antigo saiu.
- `^screens-left-and-stale-tab` (nasce): uma tela deixada não desenha mais; a aba de versão antiga recarrega uma vez.

**Prototype**: none — conserto de comportamento; a única tela nova é o quadro «No playlists here yet», que usa o painel e o botão que o app já tem (decidido pelo agente — revisável).

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- Digitar no «Batch Name» com a tela sendo redesenhada mantém o foco, o texto e o cursor.
- Uma falha de arquivo pedido sob demanda recarrega o app uma vez, e não outra vez em menos de um minuto.
- `/playlists` vazio não mostra campo de nome, exportação nem o formulário antigo.
- Depois de deixar o inventário, a loja do inventário não tem ouvinte da tela.

## Out of Scope
Redesenhar as telas por partes em vez de inteiras. É a correção de fundo: enquanto a tela de playlists se redesenha inteira a cada aviso, um clique dado no instante de um redesenho pode se perder.

## Open Questions
- Por que o rascunho do MJRP não voltou ao recarregar (não reproduzido).
