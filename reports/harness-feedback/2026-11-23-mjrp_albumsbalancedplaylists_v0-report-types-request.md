# Pedido ao harness: dois tipos novos de relatório

Escrito em 2026-11-23, por resposta do MJRP (2026-11-23 11:20, lote `2026-11-21-1335-v0-conform-questions`, D-02, opção a: «pedir ao harness um ou dois tipos novos e usar quando existirem»). A regra é do harness: tipo novo entra na lista do harness, não se inventa no projeto.

## O que falta

O `report_types_check.py` reprova oito relatórios de `reports/audits/` do Album Blender V0 cujo tipo não está na lista (`mjrp-scripts/report_types.json`) e que não cabem, sem descrever mal, em nenhum tipo próximo:

| Relatório | O que é | Tipo hoje |
|---|---|---|
| `2026-11-19-…-browser-regression.md` | a regressão no navegador | `regression-report` (fora da lista) |
| `2026-11-19-…-earlier-reports-vs-v5-plan.md` | o cruzamento de relatórios com o plano da v5 | `cross-check` (fora da lista) |
| `2026-11-19-…-open-issues-triage.md` | a triagem de issues abertas | sem tipo |
| `2026-11-19-…-ratings-source-sweep.md` | a varredura das fontes das notas | sem tipo |
| `2026-11-19-…-v5-map.md` | o mapa do que a v5 cobre | `backlog-map` (fora da lista) |
| `2026-11-20-…-outreach-emails.md` | os e-mails de contato | `draft` (fora da lista) |
| `2026-11-21-…-kernel-refresh.md` | a atualização do kernel | `kernel-refresh` (fora da lista) |
| `2026-11-21-…-worktree-cleanup.md` | a limpeza de worktrees | sem tipo |

Há ainda relatórios novos com `type: recheck` (os dois da fatia 0 do CMS, 2026-11-23) e um sem tipo (`…-f83-wave-2-drag-and-drop.md`); o mais próximo, `visual-parity-recheck`, só serve se o harness disser que serve.

## O que o projeto propõe

1. **`analysis`**: um levantamento ou cruzamento de fontes que termina em conclusões, sem veredito de aprovação (cobriria o cruzamento, a triagem, a varredura, o mapa e a regressão, e, se o harness quiser, a atualização do kernel e a limpeza de worktrees como análises de manutenção).
2. **`draft`**: um texto escrito para ser enviado ou publicado depois, ainda não final (cobriria os e-mails de contato).

O projeto não decide a lista nem o modelo (`templates/`) de cada um: a decisão é do harness. Quando os tipos existirem, o projeto põe `type:` nos oito relatórios e a lacuna `report-names` fecha; até lá ficam como estão, e o aviso continua.
