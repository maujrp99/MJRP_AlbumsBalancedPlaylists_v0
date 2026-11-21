---
id: CM-0038
item: info-arch-sections
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0038 · info-arch-sections@0 → info-arch-sections@1

## Por que

O `info-arch.md` não é só o inventário `UI-xx` (o item `info-arch`): é onde o desenho da tela deixa três coisas que os requisitos, o sensor de paridade visual e o Control Center leem. **Os protótipos aprovados** (uma entrada por versão, com a ferramenta, a referência, o que a versão mostra — `shows::` — e quem aprovou), **os fluxos** (entrada, objetivo, caminho feliz, caminhos de erro, bordas) e **o Content Map** (o texto de cada elemento: o que é, como ler, a referência, o que fazer, onde fica, o estado vazio ou de erro). Os três modelos da `mjrp-designing-ui` (`prototype-record.md`, `flow.md`, `content-map.md`) fixam a forma; sem eles escritos, a tela existe e quem a lê não sabe o que ela quer dizer.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para nosso PDLC.»

## O que muda

- em `docs/specs/info-arch.md` (projeto com tela): a seção `## Protótipos aprovados`, ao menos um fluxo (`## Flow: <nome>`, ou `## Fluxos`, ou as jornadas por pessoa) e ao menos um `## Content Map — <tela>`.

## O que o filho faz

1. `mjrp-designing-ui` (modo converge), um por vez:
   - **Protótipos aprovados:** uma entrada por versão que o MJRP aprovou, copiada do que o projeto já registrou (a spec, o log, a UAT: quem aprovou e quando) no formato de `templates/prototype-record.md` — ferramenta, referência, `reference_kind::`/`reference_path::`, `shows::` com os block IDs dos estados, `Aprovado por:`. **A aprovação é dele:** o agente copia o que está registrado, com a fonte; uma versão cuja aprovação não está registrada em lugar nenhum vai ao MJRP como pergunta, nunca é dada por aprovada.
   - **Fluxos:** os que o projeto já descreve (jornadas, «como se usa») reescritos na forma de `templates/flow.md`, cada borda com o block ID do estado.
   - **Content Map:** para cada tela, o texto de cada gráfico, número e botão, na forma de `templates/content-map.md`, a partir do que a tela mostra hoje e do que o requisito diz; é texto de tela — o MJRP lê e aprova, o agente não o dá por aprovado.
2. Se o `info-arch.md` já tem essas seções com outros títulos, retitule no lugar; o texto fica.
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0038` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `info-arch-sections`.

## Quando não se aplica

Projeto sem tela (o item só vale com `has_screen`).
