---
type: evidence
feature: F76
task: [TASK-05, TASK-06]
date: 2026-11-20
---
# F76 · Home, edição da série e Blend no celular — prova em navegador

**O que foi provado:** o app de verdade (servidor Vite deste ramo), no Chrome sem cabeça dirigido pelo protocolo DevTools, a 393x852 (celular: toque, escala 2) e 1280x800, com os componentes de verdade preenchidos pela própria página, já que sem login não há dados: o picker da Home recebe um catálogo de 18 álbuns (títulos longos, 15 de estúdio, 2 ao vivo, 1 coletânea, capas em SVG), o seletor do Blend recebe 50 séries (nomes longos, um com `&amp;`), a janela de edição abre numa série de 15 álbuns. **O que não foi:** nada num iPhone; nada com login (criar a série, gerar playlists).

## Como refazer

```sh
npx vite --port <porta livre> --strictPort --host 127.0.0.1           # deste ramo
node reports/evidence/F76/harness/home-blend.mjs after <porta>         # after/<cena>-<tamanho>.png + measures.json
# a base (feat/f76-mobile-redesign), servida de uma cópia do commit (git archive), na outra porta:
node reports/evidence/F76/harness/home-blend.mjs before <porta da base>
python3 reports/evidence/F76/harness/home-blend-compare.py           # 1280x800, antes x depois
```

`after-final/` repete três cenas depois do último ajuste de estilo (o texto da barra alinhado à esquerda).

## Celular, 393x852 (`after/measures.json`)

| Cena | Largura | Texto < 12 | Campo < 16 | Alvo < 44 | Caixa com rolagem própria |
|---|---|---|---|---|---|
| home-empty, home-results, home-chosen, home-sheet, home-bulk | 393 | 0 | 0 | 0 | 0 |
| edit-series | 393 | 0 | 0 | 2 (`#viewModeGrid` 40, `#viewModeList` 38: da tela Albums, atrás da janela) | 0 |
| blend-start, blend-sheet, blend-recipes, blend-ready | 393 | 0 | 0 | 0 | 0 |

Acima da dobra (a barra de ação começa em y=731): Home com resultados — nome, busca, filtros e o topo da primeira linha de capas (y=561); com escolhidos, a contagem e «Create series» sempre na barra. Blend — os quatro passos (y=116), a linha «Choose a series» (y=393) e «Blend it!» na barra.

## Computador, 1280x800 (antes x depois)

As oito cenas que existem no computador: **0,000 % de pixels diferentes** em todas (diferença máxima de canal 0). As medidas de layout são iguais; a única diferença em `measures.json` é que o seletor `.blend-stepper` agora encontra a faixa de passos (uma classe nova sem regra fora do celular), o que não muda nada na tela.

## O que vi nas capturas

- 1ª passada: o fundo decorativo da Home (imagem + véu preto) ficava **por cima** da grade no celular e escurecia capas e títulos (~40 %): escondido no celular. O número do selo saía na fonte Syne com um «1» estranho: passou para a fonte do sistema. «4 albums chosen» quebrava em duas linhas: capas mais sobrepostas, 14 px, botão mais justo. O «★ RECOMMENDED» flutuante repetia o selo da receita: escondido. O «60m» da duração passava da margem: 20 px, largura própria. A área de colar ocupava demais: 30dvh.
- Final: capas vivas, o escolhido com anel e número legíveis, barra limpa; a folha do conjunto com ↑ ↓ ✕ alinhados; a folha de séries com a busca presa e nomes longos em duas linhas; receitas em coluna com a descrição inteira.
