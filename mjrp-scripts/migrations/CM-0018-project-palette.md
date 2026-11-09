---
id: CM-0018
item: project-palette
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0018 · project-palette@0 → project-palette@1

## Por que

O Control Center mostra cada projeto em uma cor fixa no cabeçalho, e essa cor não tinha casa: a lista de projetos vem do `workspace.json` e o contrato de cada um não dizia nada sobre cor. O MJRP escolheu os pares (uma paleta clara e uma escura da biblioteca de paletas) e decidiu que a cor nasce com o projeto, no contrato dele, e não numa tabela que alguém precise lembrar de atualizar.

Nasceu de: UAT-107 do Control Center e da ADR-0022 do harness (2026-10-13).

## O que muda

- o `.mjrp-project.yml` ganha o campo `mjrp_harness.project_palette: {light, dark}`, com dois IDs da biblioteca de paletas (`docs/wiki/kernel/design/palette-library.md`);
- não é a pele do produto: o `design-system.md` do projeto continua dono da UI dele e pode usar outra paleta;
- o modelo do contrato da bootstrap traz o bloco, comentado, com o ponteiro para a biblioteca;
- um projeto de um modo só declara apenas o lado que tem.

## O que o filho faz

1. Escolhe o par com o MJRP (a pergunta está na `mjrp-defining-design-systems`).
2. Escreve no `.mjrp-project.yml`:

   ```yaml
   mjrp_harness:
     project_palette:
       light: L5
       dark: D2
   ```

3. Acrescenta `CM-0018` a `conformance.applied`, se quiser registrar a nota.

## Como se confere

`conformance_check.py . --gaps` não lista `project-palette`: o contrato tem a chave `project_palette`. A forma do par (um dicionário com `light` e/ou `dark`) é conferida pela I1 do doctor; se os IDs existem na biblioteca é o Control Center que diz, no cabeçalho do projeto. O item só avisa, nunca vira erro (`max_severity: warning`).

## Quando não se aplica

Nunca: todo projeto com contrato aparece no Control Center e precisa de cor. Sem o campo o projeto fica com a faixa padrão, que é um estado válido, e o aviso do catálogo é o lembrete.
