---
id: CM-0167
item: admin-kit
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0167 · admin-kit@0 → admin-kit@1

## Por que

O kit do admin passa a morar no harness (F332, CC-ADR-0068) e chega ao filho por versão, por um refresh próprio (`new_project.py --refresh-admin-kit --version X.Y.Z`), separado do refresh do kernel. A cópia não se edita no filho, e o check do kit (`check.mjs`: a fronteira, a pele, a complexidade, a superfície) é um sensor que o filho herda junto com o kit.

## O que muda

- Só para o projeto que declara `admin_kit:` no contrato (e tem o registro `.mjrp-admin-kit.json` que o refresh escreve). Os outros não são tocados.
- O refresh copia `ui/` e `core/` para `ui_path` e `core_path`, e o `check.mjs`, as listas dele e os testes do kit (com o projeto de exemplo que eles usam, `tests/example/`, que nunca fica dentro de `ui_path`) para `tools_path`; cada arquivo leva uma linha com a versão do kit; o corpus fica no harness.
- O I5 do doctor recusa arquivo do kit editado, sumido ou acrescentado, e o contrato sem o sensor que roda o `check.mjs`.

## O que o filho faz

1. Roda, do harness, `python3 mjrp-scripts/new_project.py <projeto> --refresh-admin-kit --version X.Y.Z --core-path <pasta> --ui-path <pasta> --tools-path <pasta> --skin <css>` (as pastas só na primeira vez).
2. Declara o sensor em `sensors:` do `.mjrp-project.yml`: `admin_kit: "node <tools_path>/check.mjs --ui <ui_path> --core <core_path> --root <tools_path> --project . --skin <css>"` (com `--no-complexity-exceptions` se as regras do projeto não admitem exceção de complexidade, como no V0).
3. Liga o apelido do núcleo, `@mjrp/admin-kit-core`, ao `index.js` de `core_path` em todo lugar onde o projeto resolve imports: o empacotador (Vite, Next), o `tsconfig.json` (`paths`) e **toda tabela de apelidos que um sensor do próprio projeto mantém à mão**. O `ui/` do kit importa o núcleo só por esse apelido; um sensor de módulo morto que não o conhece acusa os arquivos do núcleo como código que ninguém carrega (no V0: a tabela `ALIASES` de `test/architecture/support/importGraph.js` ganha a linha `['@mjrp/admin-kit-core', 'shared/admin-kit/index.js']`, a mesma que o `vite.config.js` dele já declara). Acrescentar o apelido não afrouxa o sensor: a tabela espelha os apelidos do empacotador.
4. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0167` e acrescenta `CM-0167` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0167` sai 0; `python3 mjrp-scripts/doctor.py .` sem erro do I5 sobre o kit do admin.

## Quando não se aplica

Projeto sem o kit (sem `.mjrp-admin-kit.json`) ou que não é `code-app`.
