---
type: evidence
feature: F76
task: TASK-01
date: 2026-11-20
---
# F76 · TASK-01, a base do celular — prova em navegador

**O que foi provado:** as telas alcançáveis sem login, no Chrome sem cabeça dirigido pelo protocolo DevTools, a 393x852 e 852x393 (emulação de celular: toque, escala 2) e 1280x800, antes (`main`, 26eb01b, servida de uma cópia do commit) e depois (o ramo `feat/f76-mobile-redesign`). **O que não foi:** nada num iPhone; nenhuma tela com dados (sem login o app mostra os estados vazios).

## Como refazer

```sh
npx vite --port 5183 --strictPort --host 127.0.0.1
node reports/evidence/F76/shoot.mjs after        # capturas + after/measures.json (FULL_PAGE=1 grava também a página inteira)
node reports/evidence/F76/sheets.mjs after       # o menu, a folha e as janelas abertas + after/windows.json
python3 reports/evidence/F76/summary.py after
python3 reports/evidence/F76/compare.py          # antes x depois fora do celular
```

Arquivos: `before/` e `after/` com `<tela>-<tamanho>.png`, `window-<janela>-<tamanho>.png`, `measures.json`, `windows.json`. As capturas de página inteira (`*-full.png`) não foram commitadas (peso); o script as refaz.

## No celular (393x852), antes → depois

| Tela | Largura do conteúdo | Texto < 12 px | Campo < 16 px | Alvo < 44 px (de quantos) |
|---|---|---|---|---|
| Home | 393 → 393 | 3 → 0 | 0 → 0 | 17 de 27 → 8 de 18 |
| Albums | 393 → 393 | 0 → 0 | 6 → 0 | 13 de 27 → 2 de 18 |
| Blend | 393 → 393 | 4 → 0 | 0 → 0 | 9 de 16 → 0 de 7 |
| Playlists (novas) | 393 → 393 | 0 → 0 | 0 → 0 | 11 de 18 → 0 de 9 |
| Playlists (gravadas) | 393 → 393 | 0 → 0 | 4 → 0 | 10 de 21 → 0 de 12 |
| Inventário | 393 → 393 | 0 → 0 | 4 → 0 | 10 de 23 → 1 de 14 |
| Série por artista | 393 → 393 | 0 → 0 | 0 → 0 | 9 de 16 → 0 de 7 |

Os alvos que sobram são de tela e estão no `mobile-kit.md` (Home: «Visual»/«Bulk Paste» e os seis filtros de tipo; Albums: grade/lista; Inventário: o seletor de moeda). Sem login nenhuma tela estourava a largura já antes: os estouros da crítica (Albums 602 px, Playlists gravadas 465 px) pedem dados e ficam para a prova do integrador.

Fixos na tela, depois: `#phone-topbar` e `#phone-tabbar` (antes: nada ficava fixo; a barra saía ao rolar).

## As janelas no celular (`after/windows.json`)

| Janela | Caixa (x, y, largura, altura) | Página de trás presa | Alvos < 44 px |
|---|---|---|---|
| Menu (folha de baixo) | 0, 364, 393, 488 | sim | 1 (o «Connect» do Spotify, 109x30, componente compartilhado) |
| Confirmar limpeza do cache | 0, 614, 393, 238 | sim | 0 |
| Folha de tela cheia (título de três linhas, inteiro) | 0, 0, 393, 852 | sim | 0 |
| Entrar | 0, 374, 393, 478 | sim | 0 |
| Confirmação (`ConfirmModal`) | 0, 628, 393, 224 | sim | 0 |
| Edição (`BaseModal`) | 0, 0, 393, 852 | sim | 0; campos a 16 px |
| Janela do álbum | 0, 0, 393, 852; título inteiro em 241x72 (antes: cortado) | sim | 0 |
| Janela de ranking | 0, 0, 393, 852 | sim | 0 (antes: Back 36x24, Reset 67x36, Save 82x36) |

Antes, nenhuma prendia a página de trás.

## A tela de computador não mudou (REQ-12)

`python3 reports/evidence/F76/compare.py` compara, para 1280x800 e 852x393 (o iPhone deitado, que não é «celular»):

1. **As medidas** (`measures.json`): largura e altura da página, a caixa (x, y, largura, altura) de cada parte principal (`#header-container`, a barra, `#app`, seus filhos e netos, o rodapé), a contagem de textos, campos e alvos pequenos e o que é fixo. **Iguais nas 14 telas** (7 a 1280x800, 7 a 852x393). Para as cinco janelas a 1280x800 (`windows.json`): caixa do painel, caixa do título, alvos e campos. **Iguais nas cinco.**
2. **Os pixels** de cada captura: 29 capturas idênticas pixel a pixel (entre elas as cinco janelas a 1280x800 e as sete telas a 852x393). Quatro diferem em 1 a 21 pixels de 1.024.000: bordas arredondadas sobre vidro desfocado (o «Connect» e o «Sign In» da barra em Home e Albums; um ponto em Blend e outro no Inventário). Ao olho são iguais. Para saber se é ruído da captura ou efeito do ramo, a mesma captura foi repetida do mesmo servidor (ver abaixo).

O relógio do rodapé («Last updated») e as animações são congelados pelo script antes de cada captura, para a comparação valer.

### Ruído da captura, medido

As sete telas a 1280x800 foram capturadas duas vezes de cada servidor (`before`/`before2` da `main`, `after`/`after2` do ramo; as segundas rodadas não foram guardadas):

| Par | Resultado |
|---|---|
| `main` contra `main` (mesmo código) | Home difere na mesma caixa (1052..1280, 38..43), até 31/255; as outras seis idênticas |
| ramo contra ramo (mesmo código) | Home e Albums diferem na mesma caixa, até 31/255; as outras cinco idênticas |
| `main` contra ramo, segunda rodada | Albums, Blend, Inventário, Playlists, gravadas e Artista **idênticas pixel a pixel**; Home difere na mesma caixa |

A diferença aparece entre duas capturas do mesmo código, na mesma caixa (a borda dos dois botões da direita da barra, sobre o vidro), e some de uma rodada para a outra: é da captura, não do ramo. Por isso `compare.py` pode dizer «DIFFER» para Home ou Albums numa rodada e «identical» na seguinte; as medidas de layout nunca diferiram.

## Não conferido

- iPhone de verdade: áreas seguras (`env()` vale 0 no Chrome), zoom ao focar, barra do Safari, tela cheia pelo ícone, arrastar a folha, toque. É a TASK-09.
- Telas com login e com dados; o estado «com conta» da barra do topo e do menu (coberto só por teste de unidade).
- O site construído (`vite build` passa e o HTML sai com o manifesto e o ícone; as capturas são do servidor de desenvolvimento).
