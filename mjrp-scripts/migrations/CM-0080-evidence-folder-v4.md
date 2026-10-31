---
id: CM-0080
item: evidence-folder
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0080 · evidence-folder@3 → evidence-folder@4

## Por que

O `evidence_folder_check.py` tratava como evidência perdida (`evidence_pointer_dangling`, lacuna) qualquer `reports/evidence/<pasta>` citado num spec, plano ou task que não estivesse no disco. Uma task **pendente** descreve onde a prova vai morar: a pasta ainda não existe por definição, e o sensor ficou vermelho antes de o trabalho que a cria ser feito.

Nasceu de: o achado de 2026-10-19 (um texto de task apontava para uma pasta de evidência futura e deixou o sensor vermelho). Decidido pelo agente (classe a: deriva da regra de que a prova de uma task feita mora em `reports/evidence/<TASK-ID>/`; técnico e reversível), revisável pelo MJRP.

## O que muda

- `evidence_folder_check.py`: o ponteiro é lacuna só quando a linha afirma algo já feito — uma task marcada `- [x]` (com as linhas indentadas dela) ou o spec/plano de uma feature com todas as tasks feitas. Numa task `- [ ]`, ou no spec/plano de uma feature ainda em curso, a pasta ausente sai como o aviso `evidence_pointer_future`, que não muda o exit.
- Uma feature sem `tasks.md` (ou sem task) não afirma nada pendente: o ponteiro ausente segue sendo lacuna, como na v3. Uma subtask indentada vale pelo próprio checkbox.
- Só afrouxa: um filho que passa na v3 passa na v4. O `check` do item não muda (o mesmo script).

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0080` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0080` sai 0 (o mesmo check da v3) e `--gaps` não lista `evidence-folder`.

## Quando não se aplica

Projeto sem features em `docs/specs/features/*/spec.md` (`has_path:docs/specs/features/*/spec.md`).
