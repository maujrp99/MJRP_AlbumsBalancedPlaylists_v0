<!-- kernel do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# A rodada de design — do pedido à construção

> Kernel · página conceitual · criada 2026-11-07 14:15 · fonte: o how-to da sessão Designer do `MJRPpersonal`, aprovado pelo MJRP em 2026-11-07, e a narrativa do design de 3 a 7/11 (o parecer, no harness: `docs/wiki/feedback-from-other-projects/2026-11-07-mjrppersonal-design-round-how-to.md`)

## Definition

A **rodada de design** é o ciclo de uma tela, do pedido do humano até a construção: o item no board, ler antes de
desenhar, fazer o pedido no sentido estreito, mostrar dois níveis de ambição, iterar pela reação, responder a pergunta de
negócio com o código, conferir a viabilidade, tirar o texto do copy deck, descrever na mesma rodada, registrar a
aprovação, habilitar a construção e acompanhá-la. São treze passos (0 a 12); o **como** de cada um está na skill
`mjrp-designing-ui` (`reference/redesign-round.md` e as referências que ela indexa). Esta página guarda o **porquê**:
por que a ordem é esta, e o que o humano espera dela sem dizer.

Nenhuma etapa do PDLC muda. A rodada acontece dentro do Explorar e do Desenhar de [[pdlc-loops]], e o critério do que
se desenha continua sendo o [[design-canon]].

## A ordem do ciclo

**O item no board vem antes do protótipo.** A feature nasce na `main`, e o protótipo vive num branch com o nome dela.
Um protótipo sem commit se perde, e o hook recusa commit num branch sem feature. Na origem, o processo apareceu na
primeira semana justamente por isso: versões feitas sem item não tinham onde morar.

**Ler antes de desenhar, com os dados reais.** Desenhar contando o que existe (quantos itens, quantos sem campo) pegou
cedo os defeitos que estavam no ar. Uma proposta feita antes da pesquisa teve de ser rebaixada, e uma regra de cor
escrita sem buscar a decisão anterior do humano estava errada: a decisão dele estava numa conversa, não no log.

**O pedido no sentido estreito, renderizado logo.** O humano reage a uma tela, não a uma pergunta abstrata. Um arquivo
com seletor, quando ele pediu opções, teve de ser refeito em três protótipos.

**Dois níveis de ambição, sem perguntar o tamanho.** Ao ver a versão ousada ao lado da segura, o humano escolheu a
ousada em todas as frentes; o mesmo aconteceu fora do filho, nas telas do iPhone do Control Center (F205). A pergunta
«de que tamanho é o redesenho?» é a que ele não precisa responder: os dois níveis, lado a lado, com a tela de hoje como
referência, são a resposta. A regra MP-01 (divergir antes de convergir) do cânone foi emendada para dizer quando vale
cada forma: dois níveis na primeira rodada do redesenho de uma tela que o humano já usa, com a tela de hoje como âncora (Consolidar entra só quando apertar o que existe responde ao pedido); três num elemento novo dentro de uma direção já escolhida; duas ou três prévias numa dúvida visual.

**A pergunta de negócio e a viabilidade não abrem protótipo.** Quando o humano pergunta o que uma função faz para o
negócio, a resposta vem do código e dos dados, numa tabela; na origem, uma análise assim virou uma feature e três
issues, e o desenho seguinte nasceu dela. Quando ele pergunta «é viável?», a resposta vem da stack real e dos tetos da
plataforma: dois pedidos de design viraram decisões de arquitetura, e um limite de envio mudou o que o protótipo
prometia. Uma direção aprovada sem viabilidade pode ser desfeita pela construção.

## A prévia antes

Uma dúvida visual («como ficaria com o título menor?») se responde com duas ou três prévias da página real, num eixo
só, **antes** de mexer no protótipo. A prévia é a divergência barata: poupa uma versão para uma opção que ele recusaria.
O protótipo que mudou antes da escolha foi uma das correções que mais se repetiram.

## O comparador, lugar da decisão

O comparador é a página com todas as versões de uma área, lado a lado, nas larguras de computador e de celular, com a
tela de hoje («Referência») e a marca «Aprovada». É ali que o humano decide, com a versão anterior ao lado — por isso
**toda** versão e toda prévia aberta entram nele, e a versão que ele viu nunca é sobrescrita. Uma versão fora do
comparador é uma versão que ele não pode julgar.

## O humano, juiz final

A aprovação dele fecha o julgamento do que ele aprovou. Depois dela, nada muda sem ele pedir, e nenhum juiz ou auditor é
lançado ou oferecido sobre ela (um juiz oferecido depois da aprovação foi recusado e virou regra, em 2026-11-03). O
registro da aprovação traz as palavras dele e a lista explícita do que foi entendido, porque um «aprovado tudo»
registrado como tudo na tela cobre o que ele não olhou; e traz **cada** estado em `shows::`, porque um estado aprovado
sem essa linha trava a story em Ready. Aprovar não libera a produção: quem libera é o arraste dele para a «Priorizada».

## A ponte com a construção

O protótipo é o contrato da construção. Para ela não inventar, a versão aprovada leva os tokens completos, as fontes e os
pesos que o protótipo **carrega de verdade** (o juiz visual reprovou uma página por uma fonte carregada em outro peso),
os casos de borda desenhados, o painel pensado junto da tela (um campo do admin ficou sem página que o mostrasse), os
estados que o sensor consegue capturar e os geradores no repositório. O admin nasce do copy deck, não da página: o que
foi feito da página teve de ser refeito. Durante a construção, uma divergência se resolve no código; quando o protótipo
estava errado, a correção é uma versão nova, aprovada por ele.

## O texto da tela

O texto vem do copy deck. O agente propõe, com duas ou três opções e uma recomendação; quem grava e marca como final é o
humano. Um rótulo do agente ficou dias na tela sem revisão porque não estava marcado como proposta, e um texto gravado
sem pedido teve de ser desfeito. O copy de marketing de um site é da `mjrp-copywriting`.

## A proporção de cor

A proporção tem dois eixos que não se misturam: o **papel** (a ordem de destaque) e a **área**. A cor principal da marca
não é necessariamente a de maior área; a base neutra de leitura costuma ser a maior, e uma cor de apoio mais escura pesa
mais ao olho e fica com menos área que a principal. A regra antiga lia a ordem de destaque como ordem de área e propôs a
principal com 60% da tela; o humano a corrigiu, e a HI-08 (a proporção de cor) do cânone foi emendada. Continua
recomendação para peça nova, conferida com ele, e nunca reprova o que ele aprovou.

## O que o humano espera sem dizer

- Abrir no próprio aparelho, no tamanho real, com dados realistas.
- Decidir no comparador, com a versão anterior ao lado.
- Uma recomendação em toda pergunta, com o motivo, também quando o assunto é meta ou problema.
- O vocabulário dele na tela, nunca o nome técnico.
- Uma versão nova a cada mudança.
- A conversa curta, na língua dele.
- Saber o que o agente decidiu sozinho e o que não conseguiu ver.

## History

- **2026-11-07 14:15** · Criada pela F214 (S-222), a pedido do MJRP: o how-to da sessão Designer do `MJRPpersonal` vai em três casas — o procedimento na `mjrp-designing-ui`, o porquê aqui, a evidência no parecer dos outros projetos, no harness («Sim, levar», depois de perguntar «teremos esse howto na parte de design do harness? e tb na wiki?»). Na mesma feature, duas emendas no [[design-canon]]: a MP-01 (divergir antes de convergir) e a HI-08 (a proporção de cor).

## Related

[[design-canon]] · [[sketch-vs-prototype]] · design-research · [[pdlc-loops]] · [[harness-kaizen]] · `mjrp-designing-ui` · `mjrp-defining-design-systems` · `mjrp-copywriting`
