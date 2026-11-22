---
type: ux-audit
subject: "Página do design system do Album Blender (F86), 2ª passada — checks da 1ª e o que a página nova trouxe"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: discovery
judged: "2026-11-21"
who_judged: separate-agent
verdict: passes
p0: 0
p1: 6
p2: 7
human_decisions: 3
status: open
---
<!-- o frontmatter é o que o Control Center lê. open: sobram P1 e as três perguntas do MJRP na própria página. -->

# UX audit — página do design system (F86), 2ª passada · 2026-11-21

> Momento: Discovery · Gênero: documento de consulta · Objeto: `design/proposals/design-system/design-system.html` (servida em `http://127.0.0.1:5187/design-system.html`) · Viewports: 1280×800 e 390×844 · Cânone: `docs/wiki/harness/design-canon.md`, mais as regras do MJRP de 2026-11-21 (uma coisa na abertura, pouco texto, nada de sigla ou código à vista, decisão com ganho, custo e recomendação visíveis, 100/70 palavras na primeira tela, pt-BR, nada rola de lado, alvos de 44 px)
> Quem julgou: agente separado (recebeu só a skill e os artefatos). As peças vivas nos quadros são o CSS real do site e os protótipos; não foram julgadas, só a forma como a página as apresenta.

## Veredito
Passa (P0: 0) — recomendação para a aprovação do MJRP, nunca a aprovação. Dos 5 P1 da 1ª passada, 4 estão resolvidos e 1 (o tamanho real da amostra) foi resolvido só na pergunta da fonte. A página cresceu de ~8.500 para 20.350 px e trouxe seis P1 novos: uma recomendação com um número que contradiz a própria tabela de contraste, amostras pequenas demais para decidir, os avisos de «Desencontro» com a frase partida, quadros de componentes cortados e uma decisão escondida em «Desencontros».

## Os checks da 1ª passada
| # antigo | Check | Resultado |
|---|---|---|
| 1 (P1) | As opções A e B mostram o mesmo equalizador, só mudando as cores? | **S** — os dois quadros mostram o mesmo equalizador; a ponta amarela aparece em B |
| 2 (P1) | Texto da pergunta da fonte em tamanho real, as duas fontes distinguíveis? | **S** na pergunta da fonte (16 px, Syne e a do sistema se distinguem). O mesmo problema volta nas perguntas 1 e 2 no celular → achado 2 |
| 3 (P1) | Cada pergunta mostra a recomendação, o ganho e o custo sem abrir nada? | **S** — faixa «Recomendo …, custa …» visível nas três (mas ver achado 1) |
| 4 (P1) | Link das perguntas no cabeçalho sem rolar o menu, a 1280 e a 390? | **S** — botão fixo «Para aprovar 24» à direita |
| 5 (P1) | Cada «detalhes» tem nome que diz o que abre? | **S** nas seções; sobra o mesmo rótulo repetido nos cartões → achado 12 (P2) |
| 6 (P2) | Logotipo sem retângulo sobre o brilho? | **S** |
| 7 (P2) | Cada estado do equalizador com rótulo? | **S** — «pronto», «esperando», «não respondeu» |
| 8 (P2) | Rodapé em palavras comuns? | **S** — «Rascunho, gerado do documento do design system em 21/11/2026…» |
| 9 (P2) | Nenhuma sigla de feature sem nome? | **N** — achado 8 |
| 10 (P2) | `summary` ≥ 44 px a 390? | **S** — todos com 44 px |
| 11 (P2) | Link das perguntas sem o sinal de página atual? | **S** — virou botão próprio |
| 12 (P2) | Quadros recortados na altura do componente, sem vazio nem rolagem interna? | **Em parte** — os vazios sumiram, mas o recorte agora corta componentes → achado 5 |

## Achados
| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| 1 | AH-01 (e a regra do MJRP: a decisão traz o ganho verdadeiro) | P1 | `#aprovar` › 1ª `.ask` («Texto sobre o fogo»), faixa da recomendação | «Recomendo B, texto preto nos dois: passa em qualquer tamanho (7,0:1 e 4,1:1)». 4,1:1 fica abaixo de 4,5:1 para texto normal; a própria tabela «Contraste, medido aqui» diz, na ponta vermelha, «os dois passam como texto grande». O ganho mostrado ao MJRP está errado | A recomendação diz o que os números dizem (ex.: «preto passa em qualquer tamanho na ponta laranja; na vermelha, só como texto grande, como o branco»), sem contradizer a tabela? S/N | baixo / alto | «passa em qualquer tamanho» → o ganho como a tabela mede | `mjrp-designing-ui` |
| 2 | AH-11 | P1 | `#aprovar` › 1ª e 2ª `.ask`, quadros `iframe` A/B | Os quadros de 800 px são reduzidos a 68 % no computador e a 40 % no celular (318×80 px): o rótulo do botão de fogo fica com uns 6 px. A pergunta 1 é justamente se o texto se lê sobre o fogo | No celular e no computador, o botão das opções A e B aparece em tamanho real (escala 1:1) e o rótulo se lê? S/N | baixo / alto | «quadro de 800 px reduzido a 40 %» → «só o botão (e o equalizador), na largura da coluna, 1:1» | `mjrp-designing-ui` |
| 3 | AH-11 / DE-08 | P1 | `#aprovar` › grupo «A home com o menu na barra» e «O que a construção da Home acrescentou», quadros `Computador (protótipo)` | Sete amostras mostram a página de 1280 px reduzida a 25–27 %, em quadros de 341×37 a 341×240 px. Em «Barra-menu» e «Topo com conta» a amostra tem 37 px de altura; em «Pausar o movimento como ícone» o ícone não se vê. A linha pendente não mostra a coisa a aprovar | Cada uma das 21 linhas mostra a peça em questão recortada e legível (o menu, o ícone, o cartão), não a página inteira encolhida? S/N | médio / alto | «página inteira a 26 %» → «recorte da peça em 1:1; a página inteira atrás de um link “ver no protótipo”» | `mjrp-designing-ui` |
| 4 | candidato (frase partida — WCAG 2.2, 1.4.8 e 1.3.2) | P1 | `.finding { display: flex; flex-wrap: wrap }` — os 6 avisos «Desencontro» (`#tipo`, `#forma`, 4 em `#componentes`) | O `flex` transforma cada `code` e cada link em bloco: a frase quebra no meio («…da Home (» / `.home-hint` / «) sai em Syne…»), e um ponto final fica sozinho na última linha, a 1280 e a 390 | Cada aviso «Desencontro» se lê como uma frase corrida, com o código e o link dentro da linha? S/N | baixo / médio | «frase em pedaços» → «uma frase, com a etiqueta “Desencontro” na frente» | `mjrp-designing-ui` |
| 5 | candidato (a amostra mostra o componente inteiro) | P1 | `#componentes` › quadros de «Botões» (computador 140 px p/ conteúdo de 171; celular 260 p/ 342), «Página de entrada» (300 p/ 548; 420 p/ 578), «Estados vazios» (560 p/ 651), «Faixas» (220 p/ 262; 240 p/ 302) | Os quadros ficaram mais baixos que o conteúdo: em «Botões» o botão «Delete» (o de perigo) some no celular e aparece cortado ao meio no computador | Nenhum quadro de componente corta o conteúdo, a 1280 e a 390 (altura do quadro ≥ altura medida do conteúdo)? S/N | baixo / alto | «altura fixa menor que a peça» → «altura medida da peça» | `mjrp-designing-ui` |
| 6 | regra do MJRP (decisão nunca enterrada; ganho, custo e recomendação visíveis) | P1 | `#desencontros` › 5º item («O fio da página de entrada…») | «A linha errada é de um protótipo aprovado: fica como está, para você decidir» — uma decisão do MJRP no meio de uma lista de constatações, sem ganho, custo nem recomendação, fora de «Para aprovar» e fora da contagem do botão | A decisão do fio está em «Para aprovar», com recomendação, ganho e custo, e «Desencontros» só aponta para ela? S/N | baixo / médio | «para você decidir» no meio da lista → uma linha em «Para aprovar» | `mjrp-designing-ui` |
| 7 | regra do MJRP (nada de código à vista) | P2 | avisos `.finding` (`.home-hint`, `--phone-bar-bg`, `rgba(…)`, `.home-dock`); `#desencontros` (`.home-chip`, `bg-gray-800`, `.thread .g i`); linhas pendentes («(v2)», «(v4)», «v3», «rodada 2», `components/ui/Sheet.js`, `.btn-primary`, a lista `--home-flame-a…`) | Nomes de classe, caminhos de arquivo e números de versão no texto aberto. Os valores de cor nos cartões de «Cores» são conteúdo de consulta e ficam | Fora dos cartões de valor, o texto aberto nomeia em palavras («a dica sob o campo», «a versão com a vinheta») e o código vai para «detalhes»? S/N | baixo / baixo | «`.home-hint`» → «a dica sob o campo da Home» | `mjrp-designing-ui` |
| 8 | regra do MJRP (nada de sigla) | P2 | `details` de «Cores», «Movimento», componentes e a 2ª pergunta | «aprovado com o protótipo da F79/F80», «corrigido na F86», «decidida pelo agente na F79», «pendente (P1)»: siglas sem nome (o achado 9 da 1ª passada continua) | Nenhuma sigla de feature ou severidade aparece sem o nome em palavras («a Home nova (F79)»)? S/N | baixo / baixo | «na F79» → «na Home nova (F79)» | `mjrp-designing-ui` |
| 9 | DE-02 | P2 | botão «Para aprovar 24»; grupo «Página de entrada, rodada 1» | O 24 soma as 3 perguntas e as 21 linhas, mas 3 das 21 são «A mesma decisão de …, acima»: são 21 decisões. «pendente de aprovação do MJRP» repete 8 vezes dentro de uma seção que já se chama «Para aprovar» | O número do botão conta cada decisão uma vez, e a frase «pendente de aprovação» não se repete nas linhas? S/N | baixo / baixo | «24» → «21»; «novo; pendente de aprovação do MJRP» → «novo» | `mjrp-designing-ui` |
| 10 | DE-02 | P2 | `#aprovar` › grade de 3 colunas das linhas pendentes, a 1280 | A linha da grade toma a altura do quadro de celular (≈665 px); os cartões vizinhos de computador ficam com ~450 px pretos embaixo | Nenhum cartão da grade tem faixa vazia acima de ~30 % da altura? S/N | baixo / baixo | «linha da grade = altura do celular» → «cartões de computador e de celular em linhas separadas» | `mjrp-designing-ui` |
| 11 | DE-04 / IN-03 | P2 | `header.top` a 390 px | O botão «Para aprovar 24» (168–374 px) cobre o menu: das sete famílias, só «Cores» e metade de «Tipo» aparecem, numa janela de ~110 px; as outras passam por baixo do botão ao rolar | A 390, todas as famílias se alcançam sem passar por baixo do botão (ex.: menu numa segunda linha, ou botão só com o número)? S/N | baixo / médio | «menu sob o botão» → «menu e botão sem se cobrirem» | `mjrp-designing-ui` |
| 12 | candidato (WCAG 2.4.6) | P2 | `summary` das linhas pendentes e das perguntas | «como é e por quê» 21 vezes e «como está hoje no código» 3 vezes; dentro de cada cartão o contexto ajuda, mas o leitor de tela lê 21 rótulos iguais | Cada `summary` repetido carrega o nome da linha (visível ou no nome acessível)? S/N | baixo / baixo | «como é e por quê» → «como é e por quê — Barra-menu» (no nome acessível) | `mjrp-designing-ui` |
| 13 | CP-01 | P2 | `#aprovar` › 1ª `.ask`, quadros A e B | A mostra «Create series» (botão do app), B mostra «Open the app» (outro botão, de outro tamanho); a pergunta muda só a cor do texto | A e B mostram o mesmo botão, mesmo rótulo e tamanho, mudando só a cor do texto? S/N | baixo / baixo | «dois botões diferentes» → «o mesmo botão, branco × preto» | `mjrp-designing-ui` |

## O que está bom, manter
- A abertura continua sendo a identidade e mais nada: 47 palavras no computador e 42 no celular (tetos 100 e 70); título «Design system do Album Blender».
- O botão fixo «Para aprovar» no cabeçalho resolve o caminho até as perguntas nos dois tamanhos.
- As três perguntas têm agora a faixa «Recomendo …, custa …» visível, e a pergunta da fonte mostra o texto em tamanho real.
- O equalizador aparece nos três estados com o nome de cada um; o botão «Ver com menos movimento» (44 px, `aria-pressed`) para tudo, inclusive o protótipo embutido.
- «Contraste, medido aqui» mostra a medida ao lado da amostra, nos dois fundos, e diz «igual ao documento».
- A régua de texto (alvo, teto, «Bom» e «Ruim» com exemplos reais e de onde vêm) é fácil de ler e de consultar.
- Os «detalhes» de cada seção têm nomes próprios e 44 px; nada rola de lado a 390 (largura do documento 390; a tabela de contraste rola dentro da própria caixa).
- Texto da página em português; o inglês só aparece nas amostras do site, que é em inglês.

## Próximos checks (Discovery)
1. Os checks dos achados 1 a 6: a recomendação da pergunta 1 bate com a tabela; amostras A/B em 1:1 no celular; cada linha pendente mostra a peça legível; avisos «Desencontro» em frase corrida; nenhum quadro de componente cortado; a decisão do fio em «Para aprovar».
2. Os P2 são acabamento: registrados, sem data.

## Fora do cânone (candidatos)
- Achado 4: nenhum ID cobre «uma frase quebrada pelo layout». Fontes: WCAG 2.2, 1.4.8 (apresentação visual de blocos de texto) e 1.3.2 (sequência com sentido). Se se mantiver, retorno ao harness.
- Achado 5: nenhum ID cobre «a amostra de referência mostra o componente inteiro» num documento de design system; a regra mais próxima é AH-11 (sem perder conteúdo), que trata de zoom e refluxo. Candidato.
- Achado 12: o mesmo da 1ª passada (WCAG 2.4.6).
- Não se escreveu a entrada no log nem se fez commit: por instrução de quem pediu, esta passada só pode escrever este arquivo.
