---
id: CM-0072
item: arch
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0072 · arch@2 → arch@3

## Por que

O modelo `templates/arch.md` listava a stack no mapa de componentes (coluna `Technology`). A stack agora tem artefato próprio (`tech-stack.md`, CM-0071) e uma segunda lista no `arch.md` envelhece sozinha.

Nasceu de: decisão do MJRP de 2026-10-18 (o `arch.md` aponta para o `tech-stack.md`).

## O que muda

- só o modelo: a coluna `Technology` do mapa de componentes vira `Stack layer` (o nome da camada no `tech-stack.md`) e o modelo ganha a seção `## Stack`, uma linha que aponta para `docs/specs/tech-stack.md`.
- **o `check` do item não muda**: é o mesmo da v2. Um filho que passa na v2 passa na v3.
- Subir a versão é a prática da casa (a mesma da CM-0053, que moveu o modelo): o modelo que o filho recebe mudou e a nota o diz. O portão do Learn não a exige para isso.

## O que o filho faz

Nada além do que a CM-0071 já manda (apontar o `arch.md` para o `tech-stack.md`). Registre a nota: acrescente `CM-0072` a `conformance.applied`, sem rodada.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0072` sai 0 (o mesmo check da v2).

## Quando não se aplica

Projeto `content` ou `meta`.
