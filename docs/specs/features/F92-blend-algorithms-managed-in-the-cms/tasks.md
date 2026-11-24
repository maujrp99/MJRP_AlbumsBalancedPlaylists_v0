# Tasks — Feature F92: Algoritmos de mistura criados e gerenciados no CMS · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [ ] FEITO: conversa com o MJRP: o que são «deep cuts» e «menos ouvidas» (decidido em 2026-11-22: «Sigamos sua recomendação»; as regras estão no REQ-04)
- [ ] FEITO: proposta de arquitetura (`mjrp-designing-architecture`): `design/proposals/f82-cms/architecture-proposal.md` (criar por blocos, um motor, o catálogo), com a crítica separada
- [ ] FEITO: rodada de desenho: a seção de receitas do Painel e o construtor, no protótipo aprovado como direção (`design/proposals/f82-cms/prototype.html`)
- [ ] o MJRP aceita a ADR-0024 · waiting:: human — só ele aceita uma ADR da rota dele · action:: ler a ADR-0024 e carimbá-la no commit dele
- [ ] o MJRP publica as regras que fecham a escrita de convidados em `spotify_enrichment/` · waiting:: human — `firestore.rules` é dele e nenhum pipeline o publica (constituição V.5) · action:: publicar as regras no console do Firebase, depois de a TASK-09 passar
- [ ] o MJRP põe a F92 na «Priorizada» (depois do CMS, F82)

## Implementation

### Fatia 0 · Alicerce
- [x] TASK-04 o caso do emulador que lista a escrita de convidados em `spotify_enrichment/` como exceção declarada, numa lista que só encolhe, dentro do teste das regras da F82 (TASK-05); a exceção some quando a TASK-09 fecha a escrita · implements:: REQ-08 · model:: opus

### Fatia 3 · Receitas: aparecer e configurar (esperam a F82 fatia 1, a linha do React em produção e o kit)
- [ ] TASK-05 o catálogo de receitas (código mais `published/recipes`, num modelo só, executando sempre pelo motor) e a tela de Blend e o painel de gerar de novo desenhando o catálogo, com o selo «recomendada» como texto único; a leitura sob demanda com prazo de 3 s e as receitas do código como reserva · implements:: REQ-02, REQ-03, REQ-07 · model:: opus
- [ ] TASK-06 a seção de receitas do Painel: aparecer ou esconder, ordem (arrastar e setas), a recomendada, a aparência, os ingredientes e os valores de partida, nome e descrição nos dois idiomas · implements:: REQ-01, REQ-02 · model:: sonnet

### Fatia 4 · Receitas por blocos (esperam a fatia 3 e a escrita de convidados fechada)
- [ ] TASK-07 o motor de seleção por ranking generalizado com sentido, pular, pegar e exclusão; as três receitas «Top N» como definições fixas no mesmo vocabulário; o validador da definição em `shared/content` com os limites do REQ-06; o teste de equivalência de cada «Top N» com a sua forma em blocos (a diferença da regra «sem dado fora» listada e levada ao MJRP) · implements:: REQ-05, REQ-06 · model:: opus
- [ ] TASK-08 o construtor de receita por blocos no Painel, com a prévia num álbum de exemplo, a receita nova nascendo escondida, e os ids nunca reaproveitados · implements:: REQ-01, REQ-07, REQ-09 · model:: sonnet
- [ ] TASK-02 as receitas «Deep cuts» (fonte Spotify, do topo, pular 3, pegar 3) e «As menos ouvidas» (fonte Spotify, do fim, pular 0, pegar 3), faixa sem dado nunca conta, escondidas · implements:: REQ-04 · model:: sonnet
- [x] TASK-09 fechar a escrita de convidados em `spotify_enrichment/`: decidir quem passa a gravar a popularidade (o servidor ou só a conta que enriquece), mudar o código que grava e escrever o rascunho da regra em `firestore.rules`; o teste do catálogo de blocos passa a falhar se a exceção da TASK-04 existir · implements:: REQ-08 · model:: opus
- [ ] TASK-10 o controle deslizante de «Deep cuts» na tela de Blend: pular as 3+X mais populares, dentro dos limites do REQ-06 · implements:: REQ-10

## Verification
- [ ] TASK-03 a prova: a equivalência das «Top N», os limites, as duas receitas novas na amostra fixa, uma playlist guardada que não muda ao esconder ou redefinir uma receita, e no navegador a tela de Blend com receitas escondidas, reordenadas e a recomendada trocada, a 1440 e 393 px · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-09 · model:: sonnet

## Documentation
- [ ] `docs/specs/behavior.md` (a tela de Blend configurável e as receitas), `data-model.md` (`published/recipes`), `info-arch.md`, `arch.md` (o catálogo e o motor único)
