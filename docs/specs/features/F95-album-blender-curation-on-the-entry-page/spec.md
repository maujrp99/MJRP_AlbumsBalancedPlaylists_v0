---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-77-see-the-entry-page-albums-as-a-blender-curation]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F95: Os álbuns da página de entrada como curadoria do The Album Blender
**Approved**: pendente. Em esboço, esperando a rodada de protótipo com o MJRP.

## Summary
**A feature:** Os álbuns que a página de entrada mostra (o caixote da F80) passam a ser apresentados como uma indicação, uma curadoria, do The Album Blender: quem chega entende que são uma escolha da casa.

**Por quê:** Hoje os álbuns aparecem sem dizer por que estão ali. O MJRP quer que virem a indicação do The Album Blender.

**Como saber que funcionou:** Quem abre a página de entrada lê, junto dos álbuns, que eles são a indicação do The Album Blender, e chega de cada um ao álbum na Apple Music. O nome e o lugar dessa indicação saem da rodada de protótipo.

## Problem Statement
Dito pelo MJRP em 2026-11-23, sobre os álbuns da página de entrada: «E pensando que esses albuns que temos na home, tenhamos alguma forma de deixar como indicacao/curadoria da semana do The Album Blender, o que acha? Acha que precisa prototipar?»

O orquestrador respondeu que a ideia é boa, que «da semana» é uma promessa de trocar os álbuns toda semana, enquanto «Seleção do Blender» diz o mesmo sem prazo, e recomendou uma rodada curta de protótipo com as duas formas. O MJRP respondeu: «2. faça».

Fatos conferidos no código da `main` (2026-11-23; só leitura):
- Os álbuns da página de entrada são um arquivo de dados fixo, `public/splash/covers.js`: um conjunto fictício (o padrão) e um conjunto real, escolhido no build; cada álbum real traz o título, o artista, o ano, a capa e um endereço da Apple Music.
- A página não diz que os álbuns são uma escolha de alguém: não há rótulo de indicação nem de curadoria.
- Já registrado: o dono escolhe no CMS quais álbuns aparecem, em que lado e em que ordem (F82 REQ-03), e a página lê essa escolha depois de carregar, com o conjunto fixo como reserva (F82 REQ-11).

## Requirements
- [REQ-01] A página de entrada diz, junto dos álbuns, que eles são uma indicação (curadoria) do The Album Blender · fixes S-77
- [REQ-02] A indicação tem um nome só, o mesmo em toda a página e nas línguas do site; se o nome promete um prazo («da semana»), os álbuns mudam nesse prazo · fixes S-77
- [REQ-03] De cada álbum indicado a pessoa chega ao álbum para ouvir; a Apple Music é o primeiro caminho · fixes S-77
- [REQ-04] A indicação não quebra o que a página de entrada já garante (S-62): lê-se inteira sem script, nada se move com «reduzir movimento», e as capas reais seguem com o seu crédito · fixes S-77

## Observable States
A escrever depois da rodada de protótipo.

## Success Criteria
A escrever depois da rodada de protótipo.

## Out of Scope
Redesenhar a página de entrada (F80); o Painel do CMS e a escolha dos álbuns nele (F82 REQ-03 e REQ-11); indicação dentro do app (só a página de entrada foi pedida).

## Open Questions
Nada disto está decidido; são as perguntas da rodada de protótipo.
- **O nome.** «Da semana» (promete trocar os álbuns toda semana), «Seleção do Blender» (diz o mesmo sem prazo) ou outro.
- **O rótulo e onde aparece na página de entrada.** O texto do rótulo e o lugar: junto do caixote, na legenda de cada disco, numa faixa própria, na primeira tela ou mais abaixo; no computador e no celular.
- **Quem troca e de quanto em quanto tempo.** O MJRP, à mão? Com que frequência? O que a página mostra se a troca atrasa?
- **Depende do CMS ou começa no código?** Esperar a escolha dos álbuns pelo CMS (F82 REQ-03) ou começar com o arquivo fixo, trocado por publicação.
- **Apple Music como primeiro caminho para ouvir.** Hoje cada álbum real já tem um endereço da Apple Music; a indicação mostra só ela ou também outros serviços?
- A indicação vale para os dois lados do caixote (todos os álbuns) ou só para uma parte deles?
