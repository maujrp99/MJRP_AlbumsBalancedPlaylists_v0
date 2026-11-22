# Plan — Feature F92: Algoritmos de mistura criados e gerenciados no CMS · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Em esboço: **uma proposta de arquitetura vem antes de qualquer construção** (`mjrp-designing-architecture`, com a crítica separada).

O que é sabido (conferido no código em 2026-11-22): as receitas são classes de código em `public/js/algorithms/` (`MJRPBalancedCascadeAlgorithm`, `TopNPopularAlgorithm`, `TopNAcclaimedAlgorithm`, `TopNUserAlgorithm`, com os mixins de equilíbrio e de corte de duração), registradas num mapa em `public/js/algorithms/index.js`; `getAllAlgorithms()` devolve id, nome, selo, descrição e se é a recomendada, e o cartão de receitas da tela de Blend (`components/blend/BlendRecipeCard.js`) desenha a lista a partir dele. A ordem na tela é a ordem do registro.

O que precisa ser desenhado: onde mora a definição de um algoritmo que o CMS cria (o CMS da F82, ainda sem arquitetura); como a tela de Blend lê essa configuração (com os algoritmos de código de hoje como reserva); e o que «criar» quer dizer: **(a)** compor a partir de blocos com parâmetros, ou **(b)** um módulo de código que o CMS liga e configura, ou os dois por fases.

## Technical Design
A escrever depois da proposta aprovada.

## Dependencies
F82 (o CMS; bloqueia), F93 (a mesma porta de configuração em produção, a combinar na proposta), F81 (os nomes e descrições nos dois idiomas).

## Documents Consulted
`public/js/algorithms/index.js`, `public/js/components/blend/BlendRecipeCard.js`, `docs/specs/features/F82-*`.

## Risks & Considerations
- Um algoritmo definido por dados precisa de blocos que cubram o que o MJRP imagina; se não cobrirem, volta a ser código.
- A tela de Blend hoje depende da ordem fixa do registro.
