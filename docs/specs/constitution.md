# Constitution - MJRP_AlbumsBalancedPlaylists_v0

Este projeto segue o `PRINCIPLES.md` do MJRP Harness, versão 1.0 - cópia carimbada na raiz deste projeto (`PRINCIPLES.md`).

## O que é da stack deste projeto

Reflita a REALIDADE, não o ideal: o que já é verdade no código. Uma ou duas linhas por seção; o porquê de cada uma está no `engineering-canon` (kernel), § O que é opinião de stack.

- **Tipagem:** [ex.: "TS strict, sem `any`, `as` só com comentário do porquê" · "JS puro, JSDoc nas funções públicas"]
- **Tamanho de arquivo:** [o limite que acende o alarme - ex.: 300 linhas]
- **Nomes:** [convenção de arquivos, funções e componentes; um export por arquivo, se valer]
- **Padrões com endereço:** [cada padrão em uso, onde mora e para quê - ex.: "Repository em `src/data/`, um por fonte"]
- **Proibições:** [o que não se faz nesta stack - ex.: "Composition API only", "sem SDK fora de `src/adapters/`"]
- **Tela e design system** (se o projeto tem tela): o CSS, os tokens, as fontes e os componentes compartilhados do design system são portados da referência visual aprovada (o protótipo, ou as exportações do Figma), não reescritos; cortar ou trocar qualquer um deles exige decisão registrada (ADR), nunca um corte calado no tema. A tela se compara com a referência pelo sensor de paridade visual (`sensors.visual`).
- **Requisitos em pt-BR e em inglês:** cada nó em `docs/specs/requirements/` com as seções `## pt-BR` e `## en` (padrão do harness; outra lista de línguas vai no contrato, `mjrp_harness.requirements.languages`).

## O que NÃO vai aqui

Stack (qual framework/linguagem) e quem-faz-o-quê vivem no contrato de instância (`.mjrp-project.yml` -> `stack:`, `tools:`, `models:`), não neste arquivo. Uma constituição de mais de 30 linhas provavelmente tem algo que devia estar lá.
