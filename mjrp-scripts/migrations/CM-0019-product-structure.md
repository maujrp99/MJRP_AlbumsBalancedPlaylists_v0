---
id: CM-0019
item: product-structure
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0019 · product-structure@0 → product-structure@1

## Por que

O Control Center mostra o produto de cada filho a partir dos arquivos do próprio filho: os resultados do `ROADMAP.md`, os épicos do PRD, as stories em `docs/specs/requirements/`, as features e o `uat.md`. No fin-control os épicos estavam certos (11 `^EP-`, 70 stories com `epic:`), mas não havia nenhum `^REL-` nem `planned_for:` — e o Board, que é montado por release, saiu vazio. O catálogo não via: o `releases@1` só pede que exista algum `^REL`, no ROADMAP ou no PRD, e o Control Center lê releases só do `ROADMAP.md`. O responsável pelo produto decidiu (crítico, alta prioridade) que todo filho chega ao ponto em que o produto aparece certo na tela, e que isso é conferido por uma ferramenta que lê o projeto como o Control Center lê.

Nasceu de: o Board vazio do fin-control (log da raiz do harness, 2026-10-14 19:57).

## O que muda

- o filho recebe `mjrp-scripts/product_structure_check.py` com o kernel; ele lê o projeto como o Control Center e lista, por tela, o que não pode ser mostrado, cada lacuna com arquivo:linha e a skill dona;
- o item `product-structure@1` roda esse script (cláusula `script` do catálogo): sai 0, o produto aparece inteiro; sai 1, há lacunas; sai 2, não avaliável (nunca aprovação);
- o que ele cobra: resultados `^OUT-xx` em `## Now`/`## Next`/`## Later`, cada um sozinho na sua seção `###`, com `- **Medida:**` e `tags::`; ao menos um release `^REL-xx` **no `ROADMAP.md`**; épicos no PRD que servem a um resultado que existe; toda story que não é `Deferred` nem `Cancelled` com `epic:` de um épico do PRD e `planned_for:` de um release do ROADMAP (o `planned_for` do épico não chega à tela); features que importam stories que existem e caem num release; `uat.md` legível, em `uat@2`, cada rodada com o nome de um release; cada release com ao menos uma story que conta (um release sem stories mostra "sem stories": ou ganha stories, ou ainda não é release); um `contributes_to::` declarado que a tela resolveria (o alvo é o `ROADMAP.md` de um projeto com contrato, do mesmo repositório, não o próprio roadmap, com esse `^OUT-xx` — um `^REL` não vale — e sem ciclo); um arquivo que não é UTF-8 válido é lacuna com o nome dele, nunca saída 2;
- **o release mora no `ROADMAP.md`**: o `releases@1` ainda aceita um `^REL` no PRD, mas a mensagem dele agora aponta o `ROADMAP.md` — é de lá que a tela lê; os dois itens dizem a mesma coisa;
- ele também imprime o que a tela conta ("n de m" por release, épico e resultado; "sem release"; em que release cai cada feature no quadro). **As NFR transversais** (`type: nfr` ou `NFR-xx`) não têm release por regra do grafo e o script só as conta: enquanto o Control Center as listar no card "Sem release", elas aparecem ali e isso é esperado;
- se o script não puder rodar no filho (ausente, quebrou, estourou o tempo), o `doctor` avisa na I6 — não é só uma nota.

## O que o filho faz

1. Roda `python3 mjrp-scripts/product_structure_check.py .` e lê as lacunas.
2. Invoca a `mjrp-organizing-product-structure`, que roda o laço até o script sair 0: cada lacuna vai à skill dona (`mjrp-coaching-pm` para resultados, roadmap e releases; `mjrp-writing-reqs` para as stories; `mjrp-specifying-sdd-artifacts` para features e UAT), e o humano responde só as decisões de produto — que releases existem, que story vai em que release, a medida de cada resultado —, em lotes, com uma recomendação.
3. Confere a tela: `cc snapshot --project .` sem erro, o Board de cada release com as suas stories e o card "Sem release" só com o que o humano deixou de fora de propósito (mais as NFR transversais, enquanto a tela as listar ali). O critério de saída é os dois: o script sai 0 **e** a tela confere.
   Antes do `--refresh-kernel` trazer o script, rode a cópia do harness sobre o filho (`python3 <harness>/mjrp-scripts/product_structure_check.py <filho>`, só leitura); o item e a I6 ficam não avaliáveis (aviso) até o refresh.
4. Acrescenta `CM-0019` a `conformance.applied`, se quiser registrar a nota.

## Como se confere

`python3 mjrp-scripts/product_structure_check.py .` sai 0, e `conformance_check.py . --gaps` não lista `product-structure`.

## Quando não se aplica

No perfil `content` e no `meta` (não há produto na tela do Control Center), e no `process_level: minimal`, que também não cobra releases. Um projeto sem grafo de requisitos ainda é lacuna: a tela o mostra "sem grafo", e o conserto começa pela `mjrp-writing-reqs`.
