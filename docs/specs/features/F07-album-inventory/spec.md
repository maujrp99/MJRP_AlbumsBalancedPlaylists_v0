---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-33-see-my-collection-how-many-i-own-and-its-worth]]", "[[S-34-add-to-the-collection-an-album-i-saw-in-a-series]]", "[[S-35-mark-albums-owned-or-wanted-and-fix-their-details]]", "[[S-36-search-and-filter-the-collection]]"]
planned_for: "[[ROADMAP#^REL-02]]"
---
<!-- docs/specs/features/F07-album-inventory/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F07: Manter a coleção de álbuns: ver o que tenho, registrar, marcar a situação e buscar
**Approved**: not a gate

## Summary
**A feature:** a pessoa abre a coleção e vê os álbuns, quantos tem e quantos quer ter e o total em dólar ou em real; registra um álbum que viu numa série, marca se o tem ou se quer ter, corrige formato, preço e notas e busca e filtra a coleção.

**Por quê:** o colecionador quer saber o que já tem antes de montar uma série e manter a coleção dizendo a verdade.

**Como saber que funcionou:** registrar um álbum a partir do cartão faz o aviso «Album added to inventory!» e o álbum aparece na coleção; trocar a situação para «tenho» atualiza a contagem e o total; buscar por título filtra a lista.

## Problem Statement
Quem coleciona álbuns quer o inventário junto do que escuta: ver a coleção e seus totais (S-33), registrar um álbum que viu numa série (S-34), mantê-lo em dia (S-35) e achar um item numa coleção grande (S-36). Proveniência: Sprint 5 do ROADMAP legado («Inventory CRUD: Complete management of owned albums»); commits bf561e0 (2025-11-28), 730a9d2 (2025-12-08), 165c055 e 2f980d0 (ambos de 2025-12-09). Quatro histórias de um só épico, entregues no mesmo sprint; ficam numa feature porque são um só ciclo de uso da coleção. Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa abre a coleção e vê os álbuns, quantos tem e quantos quer ter e o total em dólar ou em real (o botão USD/BRL escolhe qual soma mostrar, sem converter); os totais são dos itens que passam pelos filtros e a escolha de grade ou lista fica guardada. · from [[S-33-see-my-collection-how-many-i-own-and-its-worth|S-33]]
  verified_by:: test/stores/inventory.test.js (carregar os álbuns do repositório); entrega em produção: commit bf561e0 (2025-11-28), 165c055 (2025-12-09) — ver reports/evidence/F07/evidence.md
- [REQ-02] A pessoa registra na coleção, a partir do cartão do álbum, o formato, a moeda, o preço e as notas; o álbum entra como «Not Owned», álbum já registrado é recusado e a coleção fica guardada por pessoa, na nuvem. · from [[S-34-add-to-the-collection-an-album-i-saw-in-a-series|S-34]]
  verified_by:: test/stores/inventory.test.js (addAlbum); entrega em produção: commit 2f980d0 (2025-12-09) — ver reports/evidence/F07/evidence.md
- [REQ-03] A pessoa muda a situação de um álbum entre «não tenho», «tenho» e «quero ter» e corrige o formato, a moeda, o preço e as notas; cada mudança avisa («Moved to Collection», «Moved to Wishlist», «Marked as Not Owned», «Album updated»). · from [[S-35-mark-albums-owned-or-wanted-and-fix-their-details|S-35]]
  verified_by:: test/stores/inventory.test.js (updatePrice: atualização otimista e volta atrás em caso de erro); entrega em produção: commit 730a9d2 (2025-12-08) — ver reports/evidence/F07/evidence.md
- [REQ-04] A pessoa busca na coleção por título, artista ou notas e filtra por formato (CD, vinil, digital) e situação (tenho, quero ter); sem resultado a tela diz «No albums found matching your filters.». · from [[S-36-search-and-filter-the-collection|S-36]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 730a9d2 (2025-12-08) — ver reports/evidence/F07/evidence.md

## Observable States
- S-33 · [[behavior#^inventory-header-totals]] · [[behavior#^inventory-currency-toggle]] · [[behavior#^inventory-view-mode-remembered]] · [[behavior#^inventory-item-card]]
- S-34 · [[behavior#^album-add-to-inventory]] · [[behavior#^inventory-saved-per-user]]
- S-35 · [[behavior#^inventory-status-changed]] · [[behavior#^inventory-item-edited]]
- S-36 · [[behavior#^inventory-search-and-filters]] · [[behavior#^inventory-filter-empty]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-33 (REQ-01): o botão USD/BRL escolhe qual soma mostrar (não converte uma moeda na outra); os totais são dos itens que passam pelos filtros; a escolha de grade ou lista fica guardada.
- Para S-34 (REQ-02): o álbum entra como «Not Owned»; álbum já registrado é recusado; a coleção fica guardada por pessoa, na nuvem. Não há botão de adicionar na própria tela da coleção.
- Para S-35 (REQ-03): trocar a situação avisa «Moved to Collection», «Moved to Wishlist» ou «Marked as Not Owned»; editar avisa «Album updated».
- Para S-36 (REQ-04): sem resultado, a tela diz «No albums found matching your filters.».

## Out of Scope
- Excluir um álbum da coleção: o botão de excluir do cartão não funciona hoje, tratado em outra frente do conform.
- Adicionar álbum pela própria tela da coleção: o v0 não tem esse botão (história S-34).
- Converter dólar em real: o botão USD/BRL só escolhe qual soma mostrar.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
