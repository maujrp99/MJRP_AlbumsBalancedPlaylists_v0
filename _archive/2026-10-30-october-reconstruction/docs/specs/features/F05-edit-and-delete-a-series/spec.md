---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-06-edit-a-series-rename-it-remove-and-add-albums]]", "[[S-07-delete-a-series-without-deleting-inventory-albums]]"]
planned_for: "[[ROADMAP#^REL-02]]"
---
<!-- docs/specs/features/F05-edit-and-delete-a-series/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F05: Editar uma série (nome e álbuns) e excluí-la sem apagar os álbuns do inventário
**Approved**: not a gate

## Summary
**A feature:** a pessoa troca o nome de uma série, tira álbuns dela e acrescenta outros buscando um artista; e exclui uma série depois de confirmar, sem que os álbuns do inventário sejam apagados.

**Por quê:** a série precisa acompanhar o que a pessoa quer ouvir, sem criar outra, e a biblioteca deve ficar só com o que ela usa.

**Como saber que funcionou:** editar o nome de uma série e tirar um álbum atualiza a série na hora, sem recarregar a página; excluir uma série pede confirmação e os álbuns continuam na coleção.

## Problem Statement
Uma série criada precisa poder mudar de nome e de álbuns (S-06) e poder ser descartada sem levar junto o inventário de álbuns que a pessoa possui (S-07). Proveniência: Sprint 5 do ROADMAP legado (exclusão e gestão de séries), Sprint 15 («Edit Modal Refactor: Artist scan») e Sprint 21.5 (remoção sem piscar); commits b85f473 (2025-12-03), 19d38c1 (2025-12-07) e b3b9f32 (2025-12-31). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa troca o nome da série, tira álbuns dela e acrescenta outros buscando um artista; o nome é obrigatório, álbum repetido é recusado e os avisos dizem o que aconteceu. · from [[S-06-edit-a-series-rename-it-remove-and-add-albums|S-06]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 19d38c1 (2025-12-07), b3b9f32 (2025-12-31) — ver reports/evidence/F05/evidence.md
- [REQ-02] A pessoa exclui uma série depois de confirmar, a janela avisa que os álbuns do inventário não saem, e quem estava vendo só essa série volta à biblioteca. · from [[S-07-delete-a-series-without-deleting-inventory-albums|S-07]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit b85f473 (2025-12-03) — ver reports/evidence/F05/evidence.md

## Observable States
- S-06 · [[behavior#^series-edit-modal]] · [[behavior#^series-edit-messages]] · [[behavior#^album-remove-confirm]] · [[behavior#^album-removed]]
- S-07 · [[behavior#^series-delete-confirm]] · [[behavior#^series-deleted]] · [[behavior#^series-delete-failed]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-06 (REQ-01): o nome é obrigatório; álbum repetido é recusado; os botões de editar e excluir a série ficam só no cabeçalho de cada série do painel geral.
- Para S-07 (REQ-02): a janela «Delete Series?» avisa que os álbuns não saem do inventário; se eu estava vendo só essa série, volto à biblioteca.

## Out of Scope
- Criar a série (F01, F12).
- Ordenar as séries (F15).
- Apagar um álbum da coleção: o botão de excluir não funciona hoje, tratado em outra frente do conform.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
