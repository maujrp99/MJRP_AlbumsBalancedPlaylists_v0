# O admin (CMS) do Album Blender — protótipo, rodada 1 (explorar)

**Data:** 2026-11-22 · **Ramo:** `wip/cms-prototype` · **Feature:** o admin com o kit do CMS (F82), com as receitas (F92) e as chaves (F93)
**Protótipo:** `design/proposals/f82-cms/prototype.html` (um arquivo só, para publicar como artefato) · **Capturas:** `caps/`
**Enquadramento lido:** `reports/proposals/2026-11-22-mjrpalbumblender-v0-cms-framing.md`

## O pedido, nas palavras dele (2026-11-22)

- «Quero ver um protótipo num artefato separado do CMS.»
- «podemos começar a criar o CMS?»
- Receitas: «uma das ideias dessa plataforma seria a de ir eu ir criando e acrescentando algoritmos para o blend. Por exemplo um algoritmo de deep cuts, um algoritmo das menos ouvidas o oposto do top. Eu eu precisa no CMS ter uma seção especial para criar e gerar algoritmos e gerenciar o aparecimento e configuração deles na tela de blend»
- Chaves: «no CMS importante termos feature toggle para ligarmos e desligarmos features em prod. A começar pela integração com a discogs»
- Quem entra: «poderíamos evoluir o kit do CMS pra ter rbac em que eu sou o super admins. Atriibuo e crio roles»
- Textos: pequenos acertos esperam, «pq eu sei que depois posso revisar tudo via cms».

## Decidido por ele durante a rodada: salvar publica

À pergunta «mantenho como o kit faz hoje (gravar já publica), ou rascunho e depois "publicar", com desfazer?», o MJRP respondeu (2026-11-22): «1. Mantém». Na primeira versão, **salvar põe no ar**, como o kit faz hoje: não há rascunho, prévia, «publicar» nem desfazer. O protótipo foi ajustado nos dois níveis: «Salvar» pede uma confirmação calma do que vai ao ar («3 textos vão ao ar agora») e salva; aprovar o português (um ou vários) também salva; o histórico ficou como ideia de depois.

## Os dois níveis, e quanto custa cada um

| | **Painel** | **Na própria tela** |
|---|---|---|
| O que é | Uma área à parte: as seções numa coluna, listas e formulários. Textos por tela com inglês e português lado a lado. | As telas do site como são, em modo de edição: clicar num texto e editá-lo ali; as receitas mexidas nos cartões da tela de Blend; o Discogs ligado e desligado em cima do lugar onde aparece. |
| O que custa | **Baixo.** O kit do CMS dos sites do MJRPpersonal já é assim (áreas, campos pt e en, salvar). Falta só um adaptador para os dicionários do V0 (um arquivo por idioma). | **Alto.** Cada texto da tela precisa saber o seu endereço (a chave) no lugar onde aparece, em todas as telas e estados (vazio, erro, folhas do celular). Hoje ~30 arquivos ainda têm frases escritas à mão e algumas frases são montadas por regras: essas não seriam clicáveis. Duas funções (medição de uso, português para todos) não têm lugar na tela e voltam a uma lista. Cada tela nova pede o seu modo de edição. |
| O que ganha | Vê tudo de uma vez, acha pela palavra, aprova em lote as centenas de frases em português. | Vê o texto no lugar: sabe se cabe, se faz sentido ao lado dos outros. |

## Recomendação

**O Painel na primeira versão.** Ele cobre os quatro trabalhos já, sai quase de graça do kit e é o melhor para a tarefa mais urgente: revisar e aprovar em lote as centenas de textos em português propostos pelos agentes. O que ele perde — ver o texto no lugar antes de salvar — é o ganho do outro nível. **Editar na própria tela vem depois, só para os textos**, quando a migração terminar e todo texto visível estiver num dicionário.

## O que o protótipo mostra

**Seções** (as mesmas nos dois níveis; no «Na própria tela», Funções, Pessoas e Histórico abrem no painel ao lado da tela):

1. **Textos** — cinco telas (Página de entrada, Create, Albums, Blend, Inventory), 64 textos reais em inglês e português; os em português propostos pelo agente marcados «aguardando você»; editar um; aprovar um a um, os selecionados ou todos da tela; achar pela palavra (em todas as telas); aviso quando o texto fica bem mais longo que o original (caso real: «Top Faixas pela Minha Própria Classificação», 54% mais longo que o inglês), quando falta um marcador como `{count}`, ou quando fica vazio; as mudanças não salvas se acumulam numa faixa com «Salvar» e «Descartar»; «Salvar» mostra o que vai ao ar e pede «Salvar e pôr no ar».
2. **Funções** — Valores do Discogs (primeiro; com «para quem» e a segunda trava do servidor), Medição de uso (nasce desligada), Português para todos (a terceira candidata real: hoje só ele vê o português); cada uma com o que faz, onde aparece, o estado em produção e o que a pessoa vê desligada. Ligar e desligar pede confirmação e vale na hora. Candidatas depois: exportar para o Spotify e para a Apple Music.
3. **Receitas do Blend** — as quatro reais (nome, descrição e selo vêm dos textos; aparecer ou esconder; ordem por arrastar ou ↑ ↓; a recomendada; os ingredientes que a pessoa vê e o valor de partida de cada um). **Nova receita** de blocos (fonte do ranking, do topo ou do fim, pular as K primeiras, quantas por álbum, exclusões, agrupamento), com «Deep cuts» e «As menos ouvidas» prontas como exemplo e a prévia num álbum real (The Velvet Underground & Nico ou OK Computer) mostrando quais faixas entram, quais são puladas e quais ficam sem dado. A receita nova nasce escondida; mudanças nas receitas vão ao ar com o mesmo «Salvar».
4. **Pessoas e papéis** — agora: só ele, superadministrador. **Depois** (marcado): papéis que ele cria (o que cada papel muda, vê ou não vê, por seção), a pessoa e o papel dela, convidar, e «ver o admin como» um papel.
5. **Histórico** — só como ideia, marcada «depois»: quem salvou o quê e quando, e voltar a uma versão. Não existe na primeira versão (sem desfazer).

**Estados** (seletor «Ver um estado», só do protótipo): mudanças não salvas, a confirmação do que vai ao ar, salvando (o equalizador em movimento), salvo (no ar), falha ao salvar, conflito (o mesmo texto mudou noutro aparelho dele: como estava, a outra, a sua), sem permissão, vazio (nada aguardando, busca sem resultado, receita sem nome, papel sem nome).

## Real e inventado

- **Real:** os textos e as chaves (dicionários da linha do React, `integrate/staging-2026-11-21`, e `public/splash/copy.js`); quais textos em português esperam por ele (os cabeçalhos dos dicionários dizem «propostos pelo agente; esperam o MJRP»); as quatro receitas, os ícones e cores dos cartões, os ingredientes, os valores de partida (`algorithms/index.js`, `recipeLooks.js`, `recipeIngredients.js`); as funções e como funcionam hoje (enquadramento § 1c); só a conta dele como admin (F82 REQ-04); as faixas dos dois álbuns.
- **Inventado (texto proposto):** todo texto do admin; os nomes, descrições e regras de «Deep cuts» e «As menos ouvidas»; a popularidade das faixas na prévia; o histórico e os horários; «Ana (exemplo)» e os papéis; o valor do inventário (US$ 1.240) na cópia da tela; o estado «só pessoas nomeadas» do Discogs.

## Autocrítica (cânone de desenho, passada de densidade)

Conferido no navegador sem tela (Chromium) a 1440×900 e 393×852, nos dois níveis, em cada seção e cada interação: nenhum erro no console, nenhuma rolagem lateral, contraste ≥ 4,5:1 em todo texto medido, nenhum texto cortado, alvos ≥ 44 px no celular.

Consertado nesta rodada:
- O título selecionado encolhia na tela de edição e o cartão da receita recomendada ganhava uma borda estranha: duas classes do admin colidiam com as da cópia da tela.
- Os botões de escolha («Todos / Só pessoas nomeadas», «Do topo / Do fim», EN / PT) tinham 38 px no celular: agora 44.
- A mensagem de salvar de um nível aparecia no outro: agora zera ao trocar.
- Os cartões de receita escondida, na tela de edição, apagavam o texto (contraste 2,9:1): agora só o ícone apaga, e o cartão ganha borda tracejada e «escondida».
- Depois da decisão dele: tirados rascunho, prévia, publicar e desfazer; «Salvar» com confirmação; aprovar salva; histórico como «depois».

Fica para a próxima rodada (P2):
- **DE-07:** cada tela mostra todos os seus textos; no produto, o inventário tem 308 chaves — pede agrupar por parte da tela e um «Ver mais».
- **IN-16:** arrastar as receitas não tem a animação dos vizinhos nem o Esc; as setas ↑ ↓ fazem o mesmo.
- **IN-09:** receita não se apaga, só se esconde; papel se cria, mas não se edita nem apaga (decidido pelo agente, revisável).
- Achado real: o selo da receita equilibrada é o texto «RECOMMENDED» dela. Se outra virar a recomendada, a receita equilibrada continua dizendo «RECOMMENDED». O selo da recomendada precisa ser um texto único, não o de cada receita.

## Perguntas para ele

1. **Painel ou Na própria tela na primeira versão?**
   *Ganha com o Painel:* o admin sai logo, do kit, e a revisão do português em lote. *Paga:* não vê o texto no lugar antes de salvar. **Recomendo:** Painel agora; na própria tela depois, só para os textos.
2. **«Deep cuts» e «As menos ouvidas» são isto?** Deep cuts: pular as 3 mais populares de cada álbum e pegar as 3 seguintes. Menos ouvidas: as 3 de menor popularidade no Spotify; faixa sem dado nunca conta.
   *Ganha:* as duas viram as primeiras receitas de blocos. *Paga:* nada agora; os números se ajustam nos blocos. **Recomendo:** sim, com o 3 como partida.
3. **Papéis, quando vierem, por seção (muda, vê, não vê)?**
   *Ganha:* simples de criar e de entender. *Paga:* não dá para limitar um editor a uma tela só. **Recomendo:** sim; por tela só se um dia precisar.

## O que acrescentar às specs (não editadas aqui)

- **F82:** a decisão dele, «salvar publica» («1. Mantém», 2026-11-22), sem desfazer na primeira versão; os estados observáveis (mudanças não salvas, confirmação do que vai ao ar, salvando, salvo, falha, conflito, sem permissão, vazio); a validação ao salvar (nada vazio, os mesmos marcadores, aviso de texto longo); aprovar em lote, que salva; o histórico como ideia de depois.
- **F92:** a receita nova nasce escondida; a prévia num álbum de exemplo; «faixa sem dado nunca é a menos ouvida»; o selo da recomendada como texto único.
- **F93:** ligar e desligar com confirmação, valendo na hora; «para quem» no Discogs; a segunda trava visível; «Português para todos» como chave candidata.
