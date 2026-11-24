---
status: In Progress
lane: standard
solution_type: feature
imports: ["[[S-74-grow-and-manage-the-blend-algorithms-from-the-cms]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F92: Algoritmos de mistura criados e gerenciados no CMS
**Approved**: pendente. Em esboço, esperando o MJRP. Depende do CMS (F82). Arquitetura decidida pelo MJRP em 2026-11-22 (`design/proposals/f82-cms/architecture-proposal.md`; ADR-0024 em `Proposed`).

## Summary
**A feature:** Uma seção do CMS (o Painel, F82) onde o dono decide quais receitas de mistura aparecem na tela de Blend, em que ordem, com que aparência e configuração; e onde cria receitas novas **a partir de blocos** (fonte do ranking, do topo ou do fim, quantas faixas pular e pegar por álbum, exclusão por duração), começando por «Deep cuts» e «As menos ouvidas».

**Por quê:** Uma das ideias da plataforma é o MJRP ir criando e acrescentando receitas. Hoje cada receita é código.

**Como saber que funcionou:** O MJRP esconde uma receita, muda a ordem e a configuração no Painel e a tela de Blend muda sem publicar código; cria «Deep cuts» e «As menos ouvidas», liga-as e gera uma playlist com elas; uma playlist guardada nunca muda de faixas.

## Problem Statement
Dito pelo MJRP em 2026-11-22: «Importante: uma das ideias dessa plataforma seria a de ir eu ir criando e acrescentando algoritmos para o blend. Por exemplo um algoritmo de deep cuts, um algoritmo das menos ouvidas o oposto do top. Eu eu precisa no CMS ter uma seção especial para criar e gerar algoritmos e gerenciar o aparecimento e configuração deles na tela de blend. Isso implica que a tela de blend tem que ser altamente configurável tb.»

Decidido por ele em 2026-11-22 (`docs/log.md`):
- As regras das duas receitas novas, como no protótipo («Sigamos sua recomendação»): **«Deep cuts»** pula as 3 faixas mais populares de cada álbum e pega as 3 seguintes; **«As menos ouvidas»** pega as 3 menos populares de cada álbum; uma faixa sem dado nunca conta. Os números se ajustam nos blocos.
- Fechar a gravação de convidados na popularidade do Spotify antes da fatia das receitas por blocos, com um teste segurando essa fatia: «Agree».

## Requirements
- [REQ-01] Uma seção especial do CMS cria e gera algoritmos de mistura: uma receita nova é montada **por blocos** (REQ-06), nasce **escondida** e só aparece na tela de Blend quando o dono a liga; receita não se apaga, só se esconde · fixes S-74
- [REQ-02] No CMS o dono gerencia o aparecimento e a configuração de cada algoritmo na tela de Blend: quais aparecem, em que ordem (arrastar ou setas), qual é a recomendada, a aparência (de uma lista fechada de cores e ícones), os ingredientes que a pessoa vê e o valor de partida de cada um, o nome e a descrição nos dois idiomas; mudanças vão ao ar com o mesmo «Salvar» do Painel (F82: salvar publica) · fixes S-74
- [REQ-03] A tela de Blend é altamente configurável: o que ela mostra vem do catálogo de receitas (as do código mais o documento publicado, num modelo só), não de uma ordem fixa no código, e uma receita nova aparece sem mudar a tela. Sem documento publicado, o catálogo é o código de hoje, igual. O selo «recomendada» é um texto único da tela, não o de cada receita: se outra virar a recomendada, a equilibrada deixa de dizer «recomendada». A tela de Blend e o painel de «gerar de novo» desenham sempre o catálogo e nunca importam o registro de algoritmos direto · fixes S-74
- [REQ-04] Os algoritmos que o MJRP já citou, com as regras decididas por ele (2026-11-22, «Sigamos sua recomendação»): **«Deep cuts»** = fonte Spotify, do topo, pular 3, pegar 3 por álbum; **«As menos ouvidas»** = fonte Spotify, do fim, pular 0, pegar 3 por álbum, o oposto do top; uma faixa sem dado de popularidade nunca conta (nem como a menos ouvida). Nascem escondidas; os números são ajustáveis nos blocos · fixes S-74
- [REQ-05] Há um motor de seleção por ranking só, não dois: o que já existe em `public/js/algorithms/` é generalizado com sentido, pular, pegar e exclusão, e as três receitas «Top N» de hoje passam a ser definições fixas no código, no mesmo vocabulário de blocos (por exemplo, «top N por popularidade» = fonte Spotify, do topo, pular 0, pegar N). Cada receita «Top N» de hoje e a sua forma em blocos dão as mesmas faixas na amostra fixa; se a regra «sem dado fica sempre fora» mudar alguma faixa de uma receita de hoje, a diferença é listada e vai ao MJRP antes de mudar · fixes S-74
- [REQ-06] O vocabulário dos blocos e os seus limites, conferidos pelo Painel, pelas regras e pelo site (um validador só): **fonte** (`spotify`, `bea`, `combined`, `user`; partida `spotify`); **sentido** (`top` ou `bottom`; partida `top`); **pular K por álbum** (0 a 10; partida 0); **pegar N por álbum** (1 a 10, com K + N no máximo 15; partida 3); **exclusão** de faixa mais curta que S segundos (0 a 300; partida 0); **agrupamento** (as listas de hoje, menos o aleatório; partida «por álbum»). Fixos, não editáveis: **faixa sem dado fica sempre fora** nas receitas de blocos, e o **desempate** segue o REQ-12 (a outra fonte, depois a ordem da faixa no álbum). Uma definição fora dos limites é recusada inteira (a receita do código segue); a complexidade de uma receita é no máximo 10. Mesma receita e mesmos álbuns dão as mesmas faixas, byte a byte · fixes S-74
- [REQ-07] Playlist guardada nunca muda de faixas: o id de uma receita nunca é reaproveitado nem apagado; «gerar de novo» com uma receita agora escondida abre na recomendada e diz por quê, e com uma receita redefinida usa a definição de hoje · fixes S-74
- [REQ-08] Antes das receitas por blocos, convidados deixam de poder gravar a popularidade do Spotify (`spotify_enrichment/`), que alimenta «As menos ouvidas» e «Deep cuts» (a constituição, regra V.13, já manda fechar `albums/` e `spotify_enrichment/` antes de qualquer conta de fora; hoje qualquer pessoa com login, até visitante, grava nelas). Um caso do emulador das regras falha enquanto um convidado puder gravar ali (com a exceção numa lista que só encolhe), e o catálogo das receitas por blocos tem um teste que falha se a exceção ainda existir: a fatia das receitas por blocos não sai antes. Palavras do MJRP (2026-11-22): «Agree» · fixes S-74
- [REQ-09] A prévia no Painel mostra, num álbum de exemplo, quais faixas entram, quais são puladas e quais ficam sem dado, antes de a receita ser ligada · fixes S-74
- [REQ-10] Na tela de Blend, «Deep cuts» tem um controle deslizante para a pessoa ajustar quantas das mais populares pular (as 3 de partida mais X), antes de gerar; o valor fica dentro dos limites do REQ-06. Palavras do MJRP (2026-11-24): «Deep cuts, podemos ter o ajuste desse pulo na tela? pular as 3+X mais populares com um slider?» · fixes S-74
- [REQ-11] Criar algoritmos próprios, não só montar blocos: o dono cria, com ajuda de IA no Painel, a **fonte do ranking** de uma receita (como a sua «equilibrada» `mjrp-balanced-cascade`), independente do Spotify e do ranking de aclamados (BEA); a receita passa por testes e por uma prévia antes de ligar, e roda pelo motor único. A forma vai a uma proposta de arquitetura antes de construir (`design/proposals/f92-own-algorithms/architecture-proposal.md`). Palavras do MJRP (2026-11-24): «o começar de é legal, mas depois que criarmos o deep cuts e as menos ouvidas, nao faria mais sentido continuar no CMSm lá. E o ponto mais importante a fonta do ranking, é aí que de fato mora a criacao, é criacao de algoritmos propios como o meu ze balanced....é criar algoritmos, e aí creio que poderíamos ter ajudar da IA. As receitas/algoritmos vão alem e independem de spotify e BEA» · fixes S-74
- [REQ-12] Uma regra só para faixa sem dado e empate, em **todas** as receitas de ranking (as «Top N» de hoje e as de blocos): (a) uma faixa sem dado na fonte da receita nunca entra, nem para completar o número pedido; (b) no empate pela popularidade do Spotify, desempata a nota do BestEverAlbums (BEA); sem nota do BEA, a ordem da faixa no álbum; (c) no empate pela nota do BEA, desempata a popularidade do Spotify; sem ela, a ordem no álbum. Muda o «Top N por popularidade» e o «Top N aclamadas» de hoje para playlists novas; uma playlist guardada não muda. Palavras do MJRP (2026-11-24): «Faixa nova : usar regra nova ; empate: usar o BEA pra desempatar, e o fallback pra regra nova, caso não tenha dado para BEA (e vice-versa para a popularidade do BEA)» · fixes S-74

## Observable States
Os de F82 REQ-09 (o Painel) e os da seção de receitas: sem nome (recusada, com aviso); fora dos limites (recusada, dizendo qual); receita escondida (cartão com borda tracejada e «escondida»; no Blend, não aparece); receita nova ainda sem documento publicado (o catálogo é o código); a leitura das receitas falhou (receitas do código, dito no Painel). Na tela de Blend: as receitas visíveis na ordem do dono; a recomendada com o selo único.

## Success Criteria
- **REQ-01, REQ-02** · Dado o dono no Painel, quando liga, desliga, reordena e escolhe a recomendada e salva, então a tela de Blend, aberta depois, mostra as receitas na nova ordem e só as visíveis; dado o banco fora, então a tela mostra as receitas do código.
- **REQ-03** · Dado um catálogo sem documento, então a tela é igual à de hoje; dado outra receita recomendada, então só ela traz o selo; dado `algorithms/index.js`, então a tela de Blend e o painel de gerar de novo não o importam (sensor).
- **REQ-04, REQ-06** · Dada uma amostra fixa de álbuns com popularidade conhecida, quando se roda «Deep cuts» então saem as faixas 4 a 6 de cada álbum por popularidade, e «As menos ouvidas» as 3 de menor popularidade; dada uma faixa sem dado, então ela nunca sai; dado um valor fora do limite (pegar 11, ou pular 10 com pegar 6), então a definição é recusada.
- **REQ-05** · Equivalência: cada receita «Top N» de hoje e a sua forma em blocos dão a mesma saída na amostra fixa; a diferença que a regra «sem dado fora» causar é listada.
- **REQ-07** · Dada uma playlist guardada, quando a receita é escondida ou redefinida, então as faixas guardadas não mudam; dado «gerar de novo» com receita escondida, então abre na recomendada e diz por quê.
- **REQ-08** · No emulador, convidado gravando em `spotify_enrichment/` é recusado (ou está na lista de exceções); o teste do catálogo de blocos falha enquanto a exceção existir.
- **REQ-09** · Dado «The Velvet Underground & Nico» ou «OK Computer» na prévia, então as faixas entram, são puladas ou ficam sem dado como a definição diz.

## Out of Scope
O CMS em si (F82); as chaves de ligar e desligar features (F93); mudar o que as receitas que existem hoje escolhem (só a forma de defini-las); apagar uma receita; mover o motor para `shared/` (quando o app precisar dele); cada pessoa ter o seu catálogo (quem usa vê o do dono).

## Open Questions
- Quem passa a gravar a popularidade do Spotify depois de fechada a escrita dos convidados (o servidor, ou só a conta que enriquece): a decidir na tarefa do plano; muda quem grava, não a regra.
- Se um dia uma receita precisar do que os blocos não cobrem (por exemplo, equilíbrio por gênero), volta a ser código; os blocos cobrem o que o MJRP citou até aqui.
- A prévia usa o álbum de exemplo do protótipo; se o dono quiser a prévia sobre os álbuns dele, é uma melhoria depois.
- Receita escondida num playlist guardado: o texto exato do aviso de «gerar de novo» (proposto no desenho; aprovado junto com os outros textos novos).
