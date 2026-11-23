---
status: In Progress
lane: fast
solution_type: feature
imports: ["[[S-77-see-the-entry-page-albums-as-a-blender-curation]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F95: Os álbuns da página de entrada como curadoria do The Album Blender
**Approved**: pendente. Em esboço: o nome está escolhido e a parte do celular está decidida (é o deslize da F96); o MJRP pôs a feature na «Priorizada» em 2026-11-23. Falta decidir o que é só desta feature (ver Open Questions).

> **Via rápida.** O MJRP, 2026-11-23: «tudo em fast lane.» Como o orquestrador leu (interpretação dele, revisável pelo MJRP): vale para o que está sendo trabalhado agora na página de entrada, esta feature e a F96. Na via rápida a construção parte do protótipo e deste resumo; ele valida olhando a tela; os documentos vêm depois, no passo retroativo, antes de a feature fechar.

## Summary
**A feature:** Os álbuns que a página de entrada mostra (a caixa da F80) passam a ser apresentados como uma indicação, uma curadoria, do The Album Blender, com o nome «Na caixa do The Album Blender»: quem chega entende que são uma escolha da casa.

**Por quê:** Hoje os álbuns aparecem sem dizer por que estão ali. O MJRP quer que virem a indicação do The Album Blender.

**Como saber que funcionou:** Quem abre a página de entrada lê, junto dos álbuns, «Na caixa do The Album Blender», e chega de cada um ao álbum no Apple Music.

**O que é desta feature e o que é da F96.** No celular, a curadoria é o deslize único da página nova, e quem o constrói é a F96 (a página de entrada no celular). Para esta feature sobram três coisas: o nome «Na caixa do The Album Blender» no computador (o selo ou rótulo junto da caixa); as datas ou notas, se o MJRP as quiser («desde tal dia», uma frase por álbum); e a ligação com o CMS, onde ele escolhe os álbuns (F82 REQ-03 e REQ-11).

## Problem Statement
Dito pelo MJRP em 2026-11-23, sobre os álbuns da página de entrada: «E pensando que esses albuns que temos na home, tenhamos alguma forma de deixar como indicacao/curadoria da semana do The Album Blender, o que acha? Acha que precisa prototipar?»

O orquestrador respondeu que a ideia é boa, que «da semana» é uma promessa de trocar os álbuns toda semana, enquanto um nome sem prazo diz o mesmo sem a promessa, e recomendou uma rodada curta de protótipo. O MJRP respondeu: «2. faça».

**O nome, escolhido pelo MJRP em 2026-11-23**, depois de ver o protótipo (https://claude.ai/artifact/FhWNQqENfJUgMtPdnjKDxn; ramo `wip/f95-blender-curation-prototype`, `design/proposals/f95-blender-curation/proposal.md`): «2. Curadoria, gostei no Na Caixa....Mas colocaria na web "Na caixa do "The Album Blender" e não só blender.» A curadoria se chama «Na caixa do The Album Blender», com o nome inteiro do produto.

**O celular, decidido em 2026-11-23 na F96:** o MJRP escolheu a página vertical com um deslize só, o da caixa («agora creio com minha decisao só vai ter swipe para a caixa, certo?»; sim). Esse deslize é a curadoria no celular, com o mesmo nome.

**Regras de texto, do MJRP (2026-11-23), para tudo o que esta feature escrever:** o produto se chama «The Album Blender», inteiro, nunca «Blender» sozinho; em português diz-se «álbum» e «álbuns», nunca «disco» e «discos». A proposta do protótipo, escrita antes da regra, ainda traz «Seleção do Blender» e «Na caixa do Blender»: são nomes das opções daquela rodada, não textos a usar.

Fatos conferidos no código da `main` (2026-11-23; só leitura):
- Os álbuns da página de entrada são um arquivo de dados fixo, `public/splash/covers.js`: um conjunto fictício (o padrão) e um conjunto real, escolhido no build; cada álbum real traz o título, o artista, o ano, a capa e um endereço do Apple Music.
- A página não diz que os álbuns são uma escolha de alguém: não há rótulo de indicação nem de curadoria.
- Já registrado: o dono escolhe no CMS quais álbuns aparecem, em que lado e em que ordem (F82 REQ-03), e a página lê essa escolha depois de carregar, com o conjunto fixo como reserva (F82 REQ-11).

**Prototype**: quick — MJRP, 2026-11-23: «2. faça» à rodada de protótipo, e escolheu o nome sobre ele; o comparador é https://claude.ai/artifact/FhWNQqENfJUgMtPdnjKDxn. A forma no celular está no protótipo da F96 (https://claude.ai/artifact/Qs64Xut1fuKQ6z1Sf8tjTd).

## Requirements
- [REQ-01] A página de entrada diz, junto dos álbuns, que eles são uma indicação (curadoria) do The Album Blender; no computador, com um selo ou rótulo junto da caixa; no celular, no deslize que a F96 constrói · fixes S-77
- [REQ-02] A indicação tem um nome só, «Na caixa do The Album Blender», com o nome inteiro do produto, o mesmo em toda a página, no computador e no celular, e nas línguas do site; o nome não promete prazo de troca dos álbuns · fixes S-77
- [REQ-03] De cada álbum indicado a pessoa chega ao álbum para ouvir; o Apple Music é o primeiro caminho · fixes S-77
- [REQ-04] A indicação não quebra o que a página de entrada já garante (S-62): lê-se inteira sem script, nada se move com «reduzir movimento», e as capas reais seguem com o seu crédito · fixes S-77

## Observable States
A escrever no passo retroativo, do que for construído.

## Success Criteria
A escrever no passo retroativo.

## Out of Scope
Redesenhar a página de entrada (F80); a página de entrada no celular e o seu deslize (F96); o Painel do CMS e a escolha dos álbuns nele (F82 REQ-03 e REQ-11: esta feature só usa o que o CMS entregar); indicação dentro do app (só a página de entrada foi pedida).

## Open Questions
**Fechadas em 2026-11-23:**
- **O nome.** «Na caixa do The Album Blender», com o nome inteiro do produto (o MJRP, depois de ver o protótipo).
- **O celular.** A curadoria é o deslize único da F96, no fim da página, com o mesmo nome.

**Abertas com o MJRP** (o que é só desta feature):
- **O computador.** Onde o nome aparece: um selo no canto da caixa (a forma leve do protótipo), ou também uma faixa própria com todos os álbuns, como a do celular.
- **Datas ou notas.** A caixa mostra «desde tal dia»? Cada álbum ganha uma frase? As duas coisas criam trabalho de manter; sem o CMS, trocar é uma publicação.
- **Quem troca e de quanto em quanto tempo**, e se a troca começa no arquivo fixo do código ou espera a escolha dos álbuns no CMS (F82 REQ-03).
- A indicação vale para os dois lados da caixa (todos os álbuns) ou só para uma parte deles?
