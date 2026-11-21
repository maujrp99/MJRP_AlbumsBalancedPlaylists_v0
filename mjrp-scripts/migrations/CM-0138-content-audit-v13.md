---
id: CM-0138
item: content-audit
from: 12
to: 13
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0138 · content-audit@12 → content-audit@13

## Por que

O `content_audit_check.py --fix-hints` (CM-0122) indexava as âncoras só pela linha dica. Duas âncoras que citam a mesma linha, uma que seguiu o
trecho e outra que está certa, fazem o `--fix-hints` reescrever as duas para a mesma linha, e na rodada seguinte de volta: o aviso
`anchor_line_moved` nunca some e a âncora certa tem a linha estragada a cada passada (F262, UAT-532; achado P2-A da reconferência da F209).

## O que muda

- `mjrp-scripts/content_audit_check.py`: a dica de cada âncora que seguiu o trecho leva também o trecho citado, e o `--fix-hints` reescreve só a
  âncora cujo trecho é o da dica. O trecho, o texto e o `judged:` seguem como o juiz os escreveu.
- O check do item não muda.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o `content_audit_check.py` novo. Sem o refresh, a cópia do filho segue funcionando
   com o `--fix-hints` antigo.
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0138` e acrescenta `CM-0138` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/content_audit_check.py <projeto> --fix-hints` duas vezes seguidas: a segunda não reescreve nada e o aviso
`anchor_line_moved` não volta. `conformance_check.py . --check-note CM-0138` sai 0 com o `content_audit_check.py` do kernel.

## Quando não se aplica

Igual à CM-0122: projeto sem auditoria de conteúdo não usa o `--fix-hints`.
