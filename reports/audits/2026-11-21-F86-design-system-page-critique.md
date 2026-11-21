---
type: ux-audit
subject: "Página do design system do Album Blender (F86), gerada de docs/specs/design-system.md"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: discovery
judged: "2026-11-21"
who_judged: separate-agent
verdict: passes
p0: 0
p1: 5
p2: 7
human_decisions: 3
status: open
---
<!-- o frontmatter é o que o Control Center lê. open: sobram P1 e as três perguntas do MJRP na própria página. -->

# UX audit — página do design system (F86) · 2026-11-21

> Momento: Discovery · Gênero: documento · Objeto: `design/proposals/design-system/design-system.html` (servida em `http://localhost:5186/design-system/design-system.html`) · Viewports: 1280×800 e 390×844 · Cânone: `docs/wiki/harness/design-canon.md`, mais as regras do MJRP de 2026-11-21 (uma coisa na abertura, pouco texto, nada de sigla na superfície, perguntas à parte)
> Quem julgou: agente separado (recebeu só a skill e os artefatos). Os componentes nos quadros são o CSS real do site e não foram julgados.

## Veredito
Passa (P0: 0) — recomendação para a aprovação do MJRP, nunca a aprovação. A abertura cumpre a regra dele (a identidade sozinha, 45 palavras no computador e 25 no celular, contra os tetos de 100 e 70). O que falha está na parte das três perguntas: duas não mostram de verdade as opções, a recomendação fica escondida e o link para elas não aparece no menu.

## Achados
| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| 1 | CP-01 | P1 | `#espera-voce` › 2ª `.ask` («Ponta amarela do fogo»), quadro B (`data-tpl="t21"`, `data-css="splash"`) em `specimens.mjs` | A mostra o equalizador grande da Home; B mostra a faixa `nav.thread` da página de entrada, cortada no topo, quatro grupos de barras finas: a ponta amarela quase não aparece e a forma é outra, então não dá para comparar | As opções A e B mostram o mesmo equalizador, do mesmo tamanho, mudando só as cores, com a ponta amarela visível em B? S/N | baixo / alto | «equalizador da Home × faixa da página de entrada cortada» → «o mesmo equalizador nas duas, A com duas cores e B com a terceira cor amarela» | `mjrp-designing-ui` |
| 2 | AH-11 | P1 | `#espera-voce` › 3ª `.ask` («Fonte do texto corrido»), quadros de 800 px em `.pair--ask` | O quadro de 800 px é reduzido para cerca de 340 px no computador: o texto de 20 px aparece com uns 8–9 px, e Syne e a fonte do sistema ficam quase iguais. A pergunta é justamente qual lê melhor a 14–16 px | Nos dois quadros o texto aparece no tamanho real (14–16 px na tela, sem reduzir), e as duas fontes se distinguem a olho? S/N | baixo / alto | «quadro de 800 px reduzido a 42 %» → «quadro da largura da coluna, escala 1:1, o mesmo parágrafo nas duas fontes» | `mjrp-designing-ui` |
| 3 | HI-02 (e a regra do MJRP: uma decisão traz o que ele ganha, o que ele paga e a recomendação) | P1 | `.ask` › `details.det` das três perguntas | A recomendação do agente fica dentro de «detalhes» na 1ª e na 3ª; na 2ª nem existe («Uma só para as duas telas», sem dizer qual) | Cada pergunta mostra, sem abrir nada, uma linha «Recomendo A/B, porque…» com o que ele ganha e o que paga? S/N | baixo / alto | «pergunta → opções → detalhes (com a recomendação escondida)» → «pergunta → recomendação em uma linha → opções → detalhes» | `mjrp-designing-ui` |
| 4 | DE-04 | P1 | `header.top` › `nav.fams` (13 links, com a barra de rolagem escondida) | A 1280 px o menu mostra 906 px de 1350; «Espera você» fica em x = 1546, fora da tela, sem sinal de que o menu rola. As perguntas ficam no fim de uma página de cerca de 8.500 px | A 1280 e a 390 px, um link «3 perguntas esperam você» aparece no cabeçalho sem rolar o menu? S/N | baixo / alto | «13 links seguidos, a pergunta no 13º, fora da tela» → «as famílias num menu que rola + um botão fixo à direita, fora do menu, para as perguntas» | `mjrp-designing-ui` |
| 5 | candidato (WCAG 2.4.6, títulos e rótulos dizem o assunto) | P1 | `summary` de `details.det` em `#tipo` (2 seguidos) e `#no-codigo` (3 seguidos) | Cinco botões iguais, «detalhes», um embaixo do outro; não dá para saber o que cada um abre (tamanhos × medidas; conflitos × declarado sem uso × defeitos do CSS) | Dois «detalhes» na mesma seção têm nomes diferentes que dizem o que abrem (ex.: «tamanhos», «medidas»; «cores repetidas», «sem uso», «defeitos»)? S/N | baixo / médio | «detalhes · detalhes · detalhes» → «um nome por conteúdo» | `mjrp-designing-ui` |
| 6 | DE-02 | P2 | `.open` › `img.wordmark` | O PNG do logotipo tem fundo preto opaco: um retângulo com borda visível por cima do brilho laranja, mais forte no celular | O logotipo aparece sem retângulo sobre o brilho, a 1280 e a 390 px? S/N | baixo / médio | «retângulo preto sobre o brilho» → «logotipo com fundo transparente (ou sem o brilho atrás)» | `mjrp-designing-ui` |
| 7 | AH-02 | P2 | `#fogo-e-equalizador`, quadros t14/t15 | A linha diz «parado é pronto; mexendo é esperando; baixo é falha», mas os três estados aparecem sem nome e, parados na captura, parado e mexendo ficam iguais | Cada estado do equalizador tem o próprio rótulo («pronto», «esperando», «falhou») ao lado? S/N | baixo / médio | «três faixas sem nome» → «três faixas, cada uma com a palavra» | `mjrp-designing-ui` |
| 8 | regra do MJRP (nada de código solto na superfície) | P2 | `footer` | «Gerada de `docs/specs/design-system.md` (commit f3f417f) · Draft»: código, um identificador e uma palavra em inglês à vista | O rodapé fala em palavras comuns (ex.: «Rascunho, gerado do documento do design system em 21/11»)? S/N | baixo / baixo | «caminho + commit + Draft» → «rascunho + data» (o resto em «detalhes») | `mjrp-designing-ui` |
| 9 | regra do MJRP (nada de sigla) | P2 | `.ask` 2ª › `details` | «a cor A, decidida pelo agente na F79», «`#fdba74`, a ponta clara da prévia da F79»: siglas de feature sem o nome, mesmo dentro de «detalhes» | Nenhuma sigla de feature aparece sem o nome em palavras («a Home nova (F79)»)? S/N | baixo / baixo | «na F79» → «na Home nova (F79)» | `mjrp-designing-ui` |
| 10 | IN-03 | P2 | `.det summary` (`min-height: 32px`) | No celular o alvo de «detalhes» tem 32 px de altura; passa no piso do WCAG (24) e fica abaixo dos 44 que o site declara | O `summary` tem ≥ 44 px de altura a 390 px? S/N | baixo / baixo | 32 px → 44 px | `mjrp-designing-ui` |
| 11 | AH-08 | P2 | `nav.fams a:last-child` | O sublinhado laranja marca «Espera você» como se fosse a página atual; no site o laranja sublinhado quer dizer link | O destaque do link das perguntas usa um sinal que não seja o de página atual nem o de link? S/N | baixo / baixo | «sublinhado laranja de página atual» → «botão próprio (ver achado 4)» | `mjrp-designing-ui` |
| 12 | DE-02 | P2 | `.pair` › quadros de 390 px de «Base da série» e «Barras do celular» (altura de 520) | A tela do celular é quase toda preta e vazia entre as barras de cima e de baixo; a 1ª opção da 1ª pergunta mostra uma barra de rolagem interna (o conteúdo tem 276 px num quadro de 200) | Cada quadro mostra só o componente, sem faixa vazia acima de ~30 % e sem rolagem interna? S/N | baixo / baixo | «telefone de 520 px vazio» → «quadro recortado na altura do componente» | `mjrp-designing-ui` |

## O que está bom, manter
- A abertura é a identidade e mais nada: logotipo, sete cores com nome, Syne ao lado da fonte do sistema, o botão de fogo e o equalizador vivo. 45 palavras no computador, 25 no celular. Título em 3 palavras.
- Cada família tem um título de uma ou duas palavras e uma linha só (todas abaixo de 40 palavras), com os detalhes fechados.
- Os componentes aparecem com o CSS real do site, a 960 e a 390 px, lado a lado.
- As perguntas ficam numa seção à parte, com borda laranja, e cada uma tem uma pergunta de uma frase e duas opções A/B com nome.
- Nada rola de lado a 390 px (largura do documento = 390); o movimento do equalizador respeita a preferência de menos movimento.
- Escuro de propósito, declarado no estilo e no documento (CP-07); texto secundário a 64–72 % de branco sobre preto passa folgado em AH-01.

## Próximos checks (Discovery)
1. Os checks dos achados 1 a 5 (o mesmo equalizador nas duas opções; texto em tamanho real na pergunta da fonte; recomendação visível nas três; link das perguntas no cabeçalho; nomes diferentes para cada «detalhes»).
2. Os P2 são acabamento: registrados, sem data.

## Fora do cânone (candidatos)
- Achado 5: nenhum ID do cânone cobre «o mesmo rótulo para conteúdos diferentes na mesma tela» (o IA-02 cobre o inverso: um conceito, um rótulo). Fonte: WCAG 2.2, critério 2.4.6 (títulos e rótulos descrevem o assunto ou o propósito). Se o achado se mantiver, vai como retorno ao harness.
- Não se escreveu a entrada no log nem se fez commit: por instrução de quem pediu, esta passada só pode escrever este arquivo.
