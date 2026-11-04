---
id: CM-0020
item: product-structure
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0020 · product-structure@1 → product-structure@2

## Por que

Duas coisas mudaram depois da CM-0019 sair, e uma nota publicada não se reescreve (ADR-0019 § 2).

1. **Quem faz o laço.** A CM-0019 manda invocar a `mjrp-organizing-product-structure`. Essa skill foi aposentada no mesmo dia (decisão do MJRP de 2026-10-14 21:21, "a estrutura de produto desmontada nos donos do PDLC"): o laço mora agora no modo *conform* da **`mjrp-pdlc-bootstrap`**, e a `mjrp-pdlc` ganhou o portão Discovery→Delivery por story. Onde a CM-0019 diz a skill aposentada, leia a `mjrp-pdlc-bootstrap` em modo *conform*.
2. **O Backlog sem release.** A `mjrp-writing-reqs` já dizia que a release é escolhida quando a story é priorizada, e o juiz cobrava `planned_for:` de toda story ativa: quem seguia a skill ficava com uma lacuna por story ainda sem release. A decisão do MJRP (2026-10-14, delegada, regra lean): só uma story em `Backlog` pode ficar sem release; a release é exigida **a partir de `Prioritized`** — a mesma régua do sensor do grafo (`requirements_graph_check.py`) quando o contrato liga `release_required`, para o produto não ter duas respostas.
3. **O NFR transversal fora da conta.** Um NFR (`type: nfr`, ou ID `NFR-nn` / `<PFX>-NFR-nn`) vale para toda feature e, pela regra do grafo, não tem épico nem release. O núcleo do Control Center o tira do card "Sem release" e do "n de m" das releases (F22, UAT-150); o juiz passa a contar do mesmo jeito, em vez de somá-lo ao que o humano ainda não colocou.

Nasceu de: a verificação da estrutura de produto nos donos (P1-3 e P1-4), `reports/audits/2026-10-14-product-structure-in-owners-verification.md`.

## O que muda

- o `check` do item continua sendo o script `product_structure_check.py`, mas o script mudou o que cobra: **story em `Backlog` não precisa de `planned_for:`** (continua precisando de `epic:`, e um `planned_for:` declarado tem de resolver). A partir de `Prioritized`, `planned_for:` de um release do `ROADMAP.md` é obrigatório. A story em `Backlog` sem release continua contada no card "Sem release", que é onde a tela a mostra;
- o NFR transversal não gera lacuna e **não entra** na contagem de "sem release" nem no "n de m" de release nenhuma (o relatório o conta à parte: "N NFR transversais, sem épico nem release por regra");
- cada lacuna do `--json` ganha um campo estável `code` (`story_release_missing`, `roadmap_missing`…), e o script ganha `--story <arquivo>`: o portão da `mjrp-pdlc` (só as lacunas daquela story mais as que impedem a tela de ler o `ROADMAP.md`, o PRD ou os requisitos; caminho inexistente é exit 2, nunca aprovação). Não muda o que um projeto precisa ter;
- o dono do item é a `mjrp-pdlc-bootstrap` (modo *conform*), e a `mjrp-pdlc` roda o portão antes de a story entrar em Delivery.

## O que o filho faz

1. Nada no artefato se você já está conforme com a CM-0019: o check da versão 2 é mais frouxo que o da 1 só para o Backlog (e não conta o NFR transversal).
   Se tem story em `Prioritized` sem release, ela passa a ser lacuna: a release se escolhe com o humano (`mjrp-writing-reqs`), ou a story volta ao `Backlog`.
2. Se ainda não aplicou a CM-0019: a `mjrp-pdlc-bootstrap`, em modo *conform*, roda `python3 mjrp-scripts/product_structure_check.py .` e leva cada lacuna à skill dona (`mjrp-coaching-pm` para resultados, roadmap e releases; `mjrp-writing-reqs` para as stories; `mjrp-specifying-sdd-artifacts` para features e UAT), com o humano respondendo só as decisões de produto, em lotes, com uma recomendação. Para de pedir quando a contagem de lacunas não cai em duas rodadas seguidas.
3. Acrescenta `CM-0020` a `conformance.applied`, se quiser registrar a nota.

## Como se confere

`python3 mjrp-scripts/product_structure_check.py .` sai 0, e `conformance_check.py . --gaps` não lista `product-structure`.

## Quando não se aplica

No perfil `content` e no `meta`, e no `process_level: minimal`, como na CM-0019.
