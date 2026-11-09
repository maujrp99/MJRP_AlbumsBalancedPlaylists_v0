---
id: CM-0104
item: design-system
from: 6
to: 7
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0104 · design-system@6 → design-system@7

## Por que

O cânone de design passou a exigir pesquisa antes do primeiro desenho de uma tela ou de um tipo de página novo, em vez de desenhar de memória ou só com o que o MJRP manda (UAT-482, F174). Três páginas novas do kernel descrevem o procedimento, as referências conferidas e a cor, a tipografia e os elementos de UI com fonte. A `mjrp-defining-design-systems` passa a responder cor e tipografia a partir dessas páginas.

## O que muda

- Chegam três páginas em `docs/wiki/harness/`: `design-research.md`, `design-references.md` e `visual-foundations.md`.
- A `mjrp-defining-design-systems` ganha, no índice, as duas páginas de pesquisa, e no trecho «busca antes de presumir», a regra de responder cor e tipografia pelo `visual-foundations.md` antes de decidir.
- O template do `design-system.md` não muda de forma: a nota não pede seção nova.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` uma vez, para trazer as páginas novas.
2. Não reescreve o `design-system.md`. Paleta e tipografia que o projeto já declarou seguem como estão.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0104`, e acrescenta `CM-0104` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0104` sai 0, e as três páginas existem em `docs/wiki/harness/`.

## Quando não se aplica

Projeto sem `design-system.md` (sem identidade visual declarada): o refresh traz as páginas do mesmo jeito, e a nota fica aplicada sem efeito no `design-system.md`.
