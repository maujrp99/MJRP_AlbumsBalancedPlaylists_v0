---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-19-edit-a-batch-of-playlists-already-saved]]", "[[S-20-delete-a-batch-or-all-playlists-of-a-series]]"]
planned_for: "[[ROADMAP#^REL-03]]"
---
<!-- docs/specs/features/F09-edit-and-delete-saved-batches/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F09: Editar um lote de playlists guardado e excluir lotes ou todas as playlists de uma série
**Approved**: not a gate

## Summary
**A feature:** a pessoa abre um lote guardado numa tela de edição, muda as faixas ou o nome e guarda de novo; e exclui um lote, ou todas as playlists de uma série, depois de confirmar.

**Por quê:** a pessoa quer ajustar uma mistura sem refazê-la do zero e limpar o que não quer mais guardar.

**Como saber que funcionou:** «Edit Batch» abre a tela «Edit Playlist Batch» com o lote; guardar substitui o lote antigo pelo novo; «Delete Batch?» pede confirmação e depois avisa o resultado; «Delete All Playlists?» apaga só as playlists, e a série e seus álbuns ficam.

## Problem Statement
Guardar um lote não basta: a pessoa precisa corrigi-lo (S-19) e descartá-lo (S-20). Proveniência: Sprint 9+10 do ROADMAP legado («EditPlaylistView: full editing support for saved playlist batches», correção das playlists fantasma #54 e #55); commits e057cfe (2025-12-16) e f1b3d46 (2025-12-18). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa abre um lote guardado na tela «Edit Playlist Batch», muda as faixas ou o nome e guarda de novo; lote que não existe mais leva à tela «Batch Not Found». · from [[S-19-edit-a-batch-of-playlists-already-saved|S-19]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit f1b3d46 (2025-12-18) — ver reports/evidence/F09/evidence.md
- [REQ-02] A pessoa exclui um lote, ou todas as playlists de uma série, depois de confirmar («Delete Batch?», «Delete All Playlists?»); a série e seus álbuns ficam, e um aviso diz se deu certo ou falhou. · from [[S-20-delete-a-batch-or-all-playlists-of-a-series|S-20]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit e057cfe (2025-12-16) — ver reports/evidence/F09/evidence.md

## Observable States
- S-19 · [[behavior#^playlists-edit-mode]] · [[behavior#^playlists-edit-not-found]] · [[behavior#^playlists-save-saved]]
- S-20 · [[behavior#^saved-batch-delete]] · [[behavior#^saved-series-delete-all]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-19 (REQ-01): a tela se chama «Edit Playlist Batch» e mostra «Editing: <lote>»; guardar apaga o lote antigo e grava o novo; lote que não existe mais leva à tela «Batch Not Found».
- Para S-20 (REQ-02): as janelas «Delete Batch?» e «Delete All Playlists?» pedem confirmação; depois vem um aviso de sucesso ou de falha.

## Out of Scope
- Guardar e consultar lotes (F06).
- Renomear uma playlist dentro do lote e fazer o nome ficar (item que não funciona hoje, tratado em outra frente do conform).

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
