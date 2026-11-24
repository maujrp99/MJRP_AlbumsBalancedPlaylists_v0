---
type: ux-audit
feature: F92
subject: "F92 · tela de Blend: cartões «Deep cuts» e «As menos ouvidas» e o controle de pulo (ramo claude/f92-deep-cuts-and-least-played, 144cfa0; última tela aac4d2c)"
date: "2026-11-24 13:05"
moment: delivery
judged: "/blend (build local do ramo) × design/proposals/f92-recipes/prototype-v1.html (main), abas «Site · Blend (computador)» e «Site · Blend (celular)», vista «Só a proposta»"
who_judged: separate-agent
verdict: fail
p0: 0
p1: 1
p2: 4
human_decisions: 0
duration_s: 540
status: open
---

# Reconferência visual independente · F92 · Deep cuts e As menos ouvidas

**Veredito: não passa (fail), 0 P0 · 1 P1 · 4 P2.** O sensor avaliou (saída 1). Nenhum P0: o ramo pode ir para a `main` com as issues abertas (UAT-313 a UAT-317, `fixing (F92)`). O P1 real: o controle de pulo de «Deep cuts» chegou sem metade do bloco aprovado (a faixa das posições, o «as 3 + X», a dica que segue o valor).

Fora do julgamento, como pedido: o catálogo vindo do Painel e o selo «EQUILIBRADA» do protótipo são de uma fatia posterior.

## Como foi rodado
- **Objeto:** o ramo construído (`npx vite build`, pela fila da máquina), servido em 127.0.0.1; uma série semeada no store (`Proof mix`), como na prova do ramo. Português (`pt-BR`), escuro.
- **Referência:** `prototype-v1.html` da `main`, servido em 127.0.0.1, com `S.view='prop'` e o estado `deep` / `least`; o pulo movido para 5 pelo próprio controle.
- **Bloqueios:** todo contexto do Playwright passa por um calço (`reports/evidence/F92/recheck/run/playwright-shim.mjs`) que aborta todo endereço fora de 127.0.0.1 e todo esquema que não é http (Apple Music, iTunes, Spotify, Firebase, `music:`, `itms:`, `spotify:`). Nenhum link para fora pressionado; nenhuma senha.
- **O sensor:** o kit `mjrp-scripts/visual_parity/run.mjs` com dois configs do juiz (o config do projeto, `test/visual/visual.config.mjs`, só cobre a Home e a página de entrada): `reports/evidence/F92/recheck/run/f92-pc.config.mjs` (1440) e `f92-ph.config.mjs` (393), Chromium e WebKit, 3 cenários cada (Deep cuts pulo 3, Deep cuts pulo 5, As menos ouvidas). Totais: computador P0 3 · P1 18 · P2 18; celular P0 3 · P1 18 · P2 21. Evidência: `reports/evidence/F92/recheck/pc/2026-11-24/`, `.../ph/2026-11-24/`.
- **Os olhos e as mãos:** `reports/evidence/F92/recheck/run/eyes.mjs`, nos 4 pares navegador × largura: escolher «Deep cuts», mover o pulo com a seta do teclado (3 → 5), ler o passo 4 e a barra do celular, escolher «As menos ouvidas». Capturas e textos em `reports/evidence/F92/recheck/eyes/`. Sem erro de página, sem rolagem lateral, o foco fica no controle.

## As linhas do sensor, julgadas
| Linha (P0/P1) | O que é | Julgamento |
|---|---|---|
| P0 `font: body` (3 cenários × 2 navegadores, nas duas larguras) | a fonte do `body` da página comparadora (fonte do sistema) contra a do produto (Syne) | falso positivo do juiz: dentro da moldura `.site`, o protótipo usa Syne como o produto (pares `pc-deep-5`, `ph-deep-5`) |
| P1 `cards-count` (5 × 4) | o protótipo conta a coluna «Proposta · v1» como um cartão | falso positivo do juiz (moldura) |
| P1 `card-padding`, `font-size/weight: cardTitle`, `font-size/weight: h2`, `font-size: h1` (celular) | o primeiro elemento achado no protótipo é o cabeçalho da coluna da comparação, não a tela | falso positivo do juiz (moldura); nos pares, títulos e cartões da tela batem |
| P2 `card-*`, `header-height`, `token-names`, `font-size: body`, `cards-order-or-title` | as mesmas causas (moldura da comparação, a barra do site simulada) | falso positivo do juiz |

**Proposta para o juiz:** o config do projeto ganhar os cenários da tela de Blend, com `facts.root` na moldura `.site` do protótipo (o padrão dos protótipos-comparadores), para o sensor medir a tela e não a moldura. Dono: quem implementa a F92.

## O que o olho achou (as divergências reais)
| Issue | Sev | Âncora | O que diverge | O conserto |
|---|---|---|---|---|
| UAT-313 | P1 | `public/js/ui/recipe/Ingredients.tsx` `Skip` · protótipo BLEND-R05/R06 | o controle tem só deslizador, número e uma dica fixa; faltam «as 3 + X» sob o número, a dica que segue o valor («Pula as 5 mais tocadas… (da 6ª à 8ª)»), a faixa das posições 1–13 com a legenda, a nota «Num álbum com menos faixas com dado, entram menos.»; o rótulo é «Pular as mais populares» (protótipo: «Quantas das mais populares pular») | montar o bloco como o protótipo, nas duas larguras, com os textos nos dicionários pt/en |
| UAT-314 | P2 | `public/js/screens/blend/Blend.tsx` (resumo do passo 4 e barra do celular) · BLEND-R08 | sem «pula N» no resumo e na barra | acrescentar o pulo ao resumo e à barra quando a receita mostra o pulo |
| UAT-315 | P2 | `public/js/i18n/pt/blend.js`, `en/blend.js` | as descrições dos dois cartões diferem das aprovadas; em inglês, «Deep cuts» / «Least played» fogem das iniciais maiúsculas dos vizinhos e do protótipo | usar os textos do protótipo, ou levar os novos ao MJRP |
| UAT-316 | P2 | `Ingredients.tsx` `Grouping` | o «Aleatório» some sem a nota «Sem «Aleatório»: esta receita dá sempre as mesmas faixas.» | a nota sob o agrupamento quando a receita é de blocos |
| UAT-317 | P2 | `public/js/models/recipeLooks.js` `least-played` | ícone de lupa (Search); o protótipo traz a seta para baixo (trending-down) | trocar para `TrendingDown` |

O que bate: os seis cartões na ordem, os dois novos por último; cores (violeta / verde-água), selo SPOTIFY; o controle de 3 a 10 começando em 3, número laranja ao lado; «As menos ouvidas» sem o controle; sem Top nº; seleção e passo 4 prontos; Chromium e WebKit iguais.

## O que não foi comparado
- Uma mistura gerada com álbuns de verdade (os álbuns vêm da Apple, bloqueada).
- A prévia publicada (staging): não aberta, o build local do mesmo commit foi usado.

## Como rodar de novo
`npx vite build`, depois `node mjrp-scripts/visual_parity/run.mjs <config>` com os configs de `reports/evidence/F92/recheck/run/` (eles apontam o calço, o servidor e o protótipo por caminhos absolutos do scratch do juiz: ajustar), e `node reports/evidence/F92/recheck/run/eyes.mjs`; tudo pela fila da máquina (`machine_load.py run`).
