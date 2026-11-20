---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-212", "UAT-213", "UAT-214", "UAT-215"]
planned_for: "[[ROADMAP#^REL-40]]"
---
# Feature F73: As telas mantêm o campo em uso e largam o que deixaram
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Quatro defeitos do ciclo de vida das telas, achados pelo MJRP ao testar a exportação em produção: o campo «Batch Name» perde o foco enquanto se digita; os botões de exportar não respondem numa aba aberta durante uma publicação; recarregar sem salvar mostra uma tela antiga de geração; a tela do inventário continua viva depois de deixada.

**Por quê:** O MJRP não conseguiu nomear o lote nem exportar em produção.

**Como saber que funcionou:** Digitar no «Batch Name» enquanto os álbuns carregam mantém o foco; clicar num botão de exportar numa aba de versão antiga recarrega o app uma vez; `/playlists` sem playlists diz isso e leva ao Blending Menu; depois de sair do inventário, nenhuma mudança no inventário redesenha a tela atual.

## Problem Statement
Relato do MJRP em produção, 2026-11-19: «bug de foco/keystroke no batch name field. sugiro verificar todos os campos, pq esse bug parece que existe pelo site … depois disso parece que as exportacoes, os botoes nao funcionam mais»; «se eu dou reload antes de salvar aparece essa tela antiga, que é lixo, nao deveria aparecer».

## Requirements
- [REQ-01] Um campo de texto em uso continua em uso, com o texto e o cursor, quando a tela é redesenhada. · fixes UAT-212
- [REQ-02] Um arquivo do app pedido na hora de um clique que não existe mais (a aba roda uma versão antiga) faz o app carregar de novo, uma vez. · fixes UAT-213
- [REQ-03] `/playlists` sem playlists e fora da edição diz que não há playlists e leva ao Blending Menu; as configurações iniciais antigas não são desenhadas. · fixes UAT-214
- [REQ-04] Uma tela deixada não escuta mais nenhuma loja; uma regra só diz como uma tela se inscreve e se solta. · fixes UAT-215

## Observable States
A escrever com o conserto.

## Success Criteria
A escrever com o conserto.

## Out of Scope
Redesenhar as telas por partes em vez de inteiras.

## Open Questions
- Por que o rascunho do MJRP não voltou ao recarregar (não reproduzido).
