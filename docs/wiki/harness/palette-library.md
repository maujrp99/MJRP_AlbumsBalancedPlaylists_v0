---
title: Biblioteca de paletas MJRP
aliases: [palette-library, MJRP Personal Palette Library, biblioteca de paletas, color palette library]
summary: as paletas curadas com a identidade visual pessoal do MJRP (Light + Dark) — fonte única para qualquer skill que gere output visual (infográficos, dossiês, decks, site pessoal)
tags: [harness, design, paleta, visual, identidade]
status: vivo
atualizado: 2026-09-18
fontes: []
---
<!-- kernel do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition

A **MJRP Personal Palette Library** é o conjunto de paletas curadas para output com a identidade
visual pessoal do MJRP — infográficos de reunião, dossiês, decks, site pessoal. Não é o
`design-system.md` de um projeto (esse é por-projeto, criado pela skill `mjrp-defining-design-systems` em
`docs/specs/`); é um recurso do **harness**, cross-project, consultado por qualquer skill que
precise gerar um artefato visual com a cara do MJRP.

Todas as paletas seguem o mesmo conjunto de 8 tokens, então qualquer skill que já consome
`--color-primary`, `--color-secondary`, etc. funciona com qualquer uma delas sem mudança de
código. Selecionadas em 2026-09-17/18 a partir de uma exploração de 8 opções iniciais.

**Por que esta página, e não dentro de uma skill:** skill carrega o *como*, não o *o quê* — a
mesma regra que mantém ADR fora de skill vale aqui. Antes desta página, a library inteira vivia
copiada dentro de `mjrp-defining-design-systems/SKILL.md`; cada nova paleta ou reordenação exigia editar a
skill (e reempacotar/republicar no Cowork). Agora a skill só aponta pra cá — atualizar a paleta é
editar esta página, sem tocar em nenhuma skill.

**A biblioteca também dá a cor do projeto no portfólio.** O Control Center mostra cada projeto em uma cor fixa, um par desta
biblioteca (uma paleta clara e uma escura) declarado no contrato do projeto como `project_palette: {light, dark}`; não é a pele
do produto, que o `design-system.md` do projeto decide.

## Quem consome esta página

- `mjrp-defining-design-systems` — dona conceitual do recurso; a seção "MJRP Personal Palette Library" da
  skill aponta pra cá em vez de embutir o conteúdo.
- `mjrp-visual-mtg-summarizer` — pergunta ao usuário qual paleta usar antes de gerar o
  infográfico HTML, lendo a lista completa e atual aqui.
- Qualquer skill futura que gere output visual com a identidade MJRP deve referenciar esta
  página do mesmo jeito, em vez de copiar hex codes para dentro do próprio `SKILL.md`.

**Regra — nunca assumir uma paleta.** Qualquer skill prestes a gerar um artefato visual (PDF,
infográfico HTML, deck, etc.) deve perguntar ao usuário qual paleta desta biblioteca usar antes
de gerar, a menos que o usuário já tenha especificado uma no mesmo pedido. Só cair no Neutral
Default se o usuário disser explicitamente para usar o default.

## Light Mode Palettes

### L1. Alegre / Vibrante — "Coral Splash"
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #FF6B5B | Ações principais, CTAs |
| --color-secondary | #1B3A4B | Títulos |
| --color-accent | #FFC93C | Destaques, badges |
| --color-bg | #FFFFFF | Fundo |
| --color-surface | #FFF5F0 | Cards, seções elevadas |
| --color-border | #FFDDD2 | Divisores |
| --color-text | #22303C | Corpo de texto |
| --color-text-muted | #6F7C85 | Legendas |

Typography: `'Poppins', sans-serif` 700 (heading) / `'Nunito Sans', sans-serif` 400 (body)
Layout: cantos bem arredondados (12–16px), ícones ilustrativos, alto contraste entre blocos, tom lúdico

### L2. Profissional / Executiva — "Navy & Gold"
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #1B3358 | Ações principais |
| --color-secondary | #0D1B2A | Títulos |
| --color-accent | #B08D57 | Destaques discretos |
| --color-bg | #FFFFFF | Fundo |
| --color-surface | #F4F5F7 | Cards |
| --color-border | #DCE1E8 | Divisores |
| --color-text | #1F2933 | Corpo de texto |
| --color-text-muted | #697586 | Legendas |

Typography: `'Playfair Display', serif` 700 (heading) / `'Source Sans 3', sans-serif` 400 (body)
Layout: grid rígido, bordas finas de 1px, ornamentação mínima, muito espaço em branco

### L3. Zen / Calma
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #7C9885 | Ações principais |
| --color-secondary | #4A4A42 | Títulos |
| --color-accent | #D8A48F | Destaques suaves |
| --color-bg | #FBF9F6 | Fundo |
| --color-surface | #F1EFE9 | Cards |
| --color-border | #E3DFD3 | Divisores |
| --color-text | #3A3A33 | Corpo de texto |
| --color-text-muted | #8A8578 | Legendas |

Typography: `'Fraunces', serif` 500 (heading) / `'Work Sans', sans-serif` 400 (body)
Layout: coluna única de leitura, cantos suavemente arredondados, muito espaço em branco, baixo contraste

### L4. Vinho + Coral — "Bordô Editorial"
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #7A2048 | Ações principais |
| --color-secondary | #2B0F1A | Títulos |
| --color-accent | #FF6F61 | Destaques quentes |
| --color-bg | #FFFFFF | Fundo |
| --color-surface | #FBF1EE | Cards |
| --color-border | #EAD3CF | Divisores |
| --color-text | #2E1620 | Corpo de texto |
| --color-text-muted | #7C616B | Legendas |

Typography: `'Playfair Display', serif` 700 (heading) / `'Nunito Sans', sans-serif` 400 (body)
Layout: editorial, margens generosas, títulos serifados grandes, divisores finos, fotografia/capas em destaque

### L5. Terracota / Warm Earthy
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #C1653D | Ações principais |
| --color-secondary | #3E2B23 | Títulos |
| --color-accent | #8A9A5B | Destaques |
| --color-bg | #FBF6EF | Fundo |
| --color-surface | #F1E7D8 | Cards |
| --color-border | #E0D0B8 | Divisores |
| --color-text | #3B2E27 | Corpo de texto |
| --color-text-muted | #8A7A6C | Legendas |

Typography: `'Lora', serif` 700 (heading) / `'Work Sans', sans-serif` 400 (body)
Layout: texturas sutis, margens generosas, imagens grandes, tipografia serifada quente

### L6. Verde / Botânica — "Sage & Clay"
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #4B7355 | Ações principais, verde sálvia |
| --color-secondary | #2B3A2E | Títulos, verde musgo escuro |
| --color-accent | #C97B4A | Destaques quentes, argila/terracota |
| --color-bg | #FBFAF5 | Fundo (marfim quente) |
| --color-surface | #EFF2E8 | Cards (tom sálvia claro) |
| --color-border | #DCE3D0 | Divisores |
| --color-text | #33402E | Corpo de texto |
| --color-text-muted | #748169 | Legendas |

Typography: `'Cormorant Garamond', serif` 600 (heading) / `'Karla', sans-serif` 400 (body)
Layout: ilustrações botânicas de linha fina, cantos suavemente arredondados, respiro generoso, paleta terrosa com verde dominante e argila como contraponto quente

### L7. Minimal / Clean — "Ink & Paper"
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #101113 | Ações principais |
| --color-secondary | #6E7178 | Títulos secundários, ícones |
| --color-accent | #3B5BDB | Único destaque, usado com extrema moderação |
| --color-bg | #FFFFFF | Fundo |
| --color-surface | #FAFAFA | Cards |
| --color-border | #E7E7EA | Divisores |
| --color-text | #101113 | Corpo de texto |
| --color-text-muted | #85858C | Legendas |

Typography: `'Inter', sans-serif` 600 (heading) / `'Inter', sans-serif` 400 (body)
Layout: grid rígido de 12 colunas, sem sombras, linhas de 1px como único ornamento, muitíssimo espaço em branco, cor de destaque usada em no máximo um elemento por tela

### L8. MJRP Personal — "Organic Blueprint" (site pessoal, canônica)
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #3A5A40 | Ações principais, CTAs, links, verde floresta |
| --color-secondary | #2F3330 | Títulos, carvão quase-preto |
| --color-accent | #C08A5A | Destaques secundários, terracota/terra |
| --color-bg | #F5F2E9 | Fundo (creme claro) |
| --color-surface | #E8DFCC | Cards (creme mais profundo, contraste) |
| --color-border | #D6C8AF | Divisores, bordas estruturais |
| --color-text | #2F3330 | Corpo de texto |
| --color-text-muted | #545955 | Legendas, texto secundário |

Typography: `'Lora', serif` 600–700 (heading) / `'Manrope', sans-serif` 400 (body)
Layout: crème + verde floresta + terracota, cantos moderadamente arredondados (8–12px), sombras suaves, tom "biblioteca privada encontra mente de engenheiro"

**Nota — esta não é uma opção entre outras.** É o mapeamento (9 seções → 8 tokens) do
design-system.md real e vivo do site MJRP Personal
(`MJRPpersonal/docs/specs/design-system.md`, tema "Organic Blueprint"). Só oferecer como escolha
quando a saída for sobre/para o site pessoal ou precisar bater com a identidade dele; para as
outras 7 é uma opção qualquer da library. Fonte de verdade continua sendo o design-system.md do
projeto — se ele mudar lá (cor, tipografia, tokens extras de spacing/shadow/radius que este
mapeamento não carrega), esta entrada fica defasada até alguém atualizar as duas.

## Dark Mode Palettes

### D1. Moderna / Tech
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #7B5CFA | Ações principais |
| --color-secondary | #F1F0F6 | Texto de título sobre fundo escuro |
| --color-accent | #2FE6D6 | Destaques neon |
| --color-bg | #0E0E16 | Fundo (quase-preto) |
| --color-surface | #1A1A26 | Cards |
| --color-border | #2C2C3D | Divisores |
| --color-text | #F1F0F6 | Corpo de texto |
| --color-text-muted | #9A97AE | Legendas |

Typography: `'Space Grotesk', sans-serif` 700 (heading) / `'Source Sans 3', sans-serif` 400 (body)
Layout: fundo quase-preto, cards com leve glow/borda luminosa, grid assimétrico, ícones monoline

### D2. Midnight Editorial
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #C9A55C | Ações principais, dourado envelhecido |
| --color-secondary | #F4F1EA | Texto de título sobre fundo escuro |
| --color-accent | #B6524B | Destaques quentes |
| --color-bg | #12141B | Fundo (quase-preto) |
| --color-surface | #1C1F29 | Cards |
| --color-border | #2B2F3B | Divisores |
| --color-text | #F4F1EA | Corpo de texto |
| --color-text-muted | #9098A8 | Legendas |

Typography: `'Playfair Display', serif` 700 (heading) / `'Source Sans 3', sans-serif` 400 (body)
Layout: dark editorial, cantos retos, títulos serifados grandes, divisores dourados finos, alto contraste tipográfico
Companion dark da L4 Vinho + Coral (mesma família tipográfica serifada).

### D3. Cyberpunk Neon
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #FF2E88 | Ações principais, magenta |
| --color-secondary | #F5F5FF | Texto de título sobre fundo escuro |
| --color-accent | #00E5FF | Destaques ciano neon |
| --color-bg | #05050A | Fundo (preto puro) |
| --color-surface | #12121C | Cards |
| --color-border | #23233A | Divisores |
| --color-text | #F5F5FF | Corpo de texto |
| --color-text-muted | #8888AA | Legendas |

Typography: `'Space Grotesk', sans-serif` 700 (heading) / `'IBM Plex Sans', sans-serif` 400 (body)
Layout: preto puro, grid técnico, bordas com glow neon, cantos retos, alta energia — para conteúdo criativo/gaming/growth

### D4. Zen Dark
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #6FA98A | Ações principais |
| --color-secondary | #E9E6DE | Texto de título sobre fundo escuro |
| --color-accent | #D8A48F | Destaques suaves (mesmo tom da L3 Zen/Calma) |
| --color-bg | #141815 | Fundo (quase-preto) |
| --color-surface | #1E2420 | Cards |
| --color-border | #2C332D | Divisores |
| --color-text | #E9E6DE | Corpo de texto |
| --color-text-muted | #9AA396 | Legendas |

Typography: `'Fraunces', serif` 500 (heading) / `'Work Sans', sans-serif` 400 (body)
Layout: mesmo clima calmo e baixo contraste da L3 Zen/Calma, invertido para fundo escuro; coluna única de leitura
Companion dark da L3 Zen / Calma (mesma família tipográfica e tom).

### D5. Executive Dark
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #6D93C2 | Ações principais |
| --color-secondary | #E8ECF2 | Texto de título sobre fundo escuro |
| --color-accent | #D4AF6A | Destaques dourados (mais claros p/ contraste) |
| --color-bg | #0B1220 | Fundo (quase-preto) |
| --color-surface | #141C2C | Cards |
| --color-border | #223049 | Divisores |
| --color-text | #E8ECF2 | Corpo de texto |
| --color-text-muted | #8B98AC | Legendas |

Typography: `'Playfair Display', serif` 700 (heading) / `'Source Sans 3', sans-serif` 400 (body)
Layout: mesmo rigor de grid corporativo da L2 Profissional/Executiva, em fundo escuro tipo dashboard noturno
Companion dark da L2 Profissional / Executiva (mesma família tipográfica).

*(não inverter as paletas light acima para dark mode sem redesenhar contraste — cada dark palette
acima foi ajustada à mão para legibilidade em fundo escuro, não é só um `invert()` da light)*

## Neutral Default (fallback — usar só se o usuário pedir explicitamente)
```css
/* === MJRP DEFAULT PALETTE (neutral placeholder) === */
--color-primary: #2C5F8A;
--color-secondary: #1A1A1A;
--color-accent: #D98E04;
--color-bg: #FFFFFF;
--color-surface: #F5F5F5;
--color-border: #E0E0E0;
--color-text: #2D2D2D;
--color-text-muted: #6B6B6B;

--font-heading: 'Montserrat', 'Poppins', system-ui, sans-serif;
--font-body: 'Open Sans', 'Inter', system-ui, sans-serif;
--font-weight-heading: 800;
--font-weight-body: 400;
```
