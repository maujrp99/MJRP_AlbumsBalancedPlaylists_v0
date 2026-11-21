---
type: ux-audit
subject: "Reconferência visual independente da F85: «Start» no lugar de «Home», /start, o logotipo para a entrada; o ramo sobre 09a0c61 contra a produção (main), deslogado, 1280 e 393"
project: mjrpalbumblender-v0
feature: F85
moment: delivery
date: "2026-11-21 12:03"
judged: "2026-11-21 12:03"
judged_commit: 09a0c61
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 1
status: open
---

# Reconferência visual da F85

**Veredito: passa (`pass`), sem P0 e sem P1; fica 1 P2 (uma observação de texto, que já existe na produção).** Fora o rótulo «Start» onde havia «Home» e o botão «Go to Start», nada ficou diferente da produção nas telas olhadas.

## Como foi feito
- **Quem julgou:** um agente que não implementou a F85.
- **O objeto e a referência:** o ramo `claude/f85-start-in-the-menu` em `09a0c61`, servido pelo Vite desta pasta (`vite --port 5197`), contra a produção (`https://mjrp-playlist-generator.web.app`, ou seja, a `main`). Não há protótipo: a decisão do dono é só trocar o rótulo e o destino de alguns links.
- **Condições:** deslogado, Chrome sem interface, 1280 x 800 e 393 x 852. Não rodei o sensor visual do projeto (ordem de só subir o servidor e tirar capturas); olhei os pares com os olhos e li o DOM (rótulo, destino do link, altura da barra, rolagem lateral). Isso é uma passada mais curta que a do sensor, dita aqui.
- **Capturas:** `reports/evidence/F85-visual-recheck/` (`<largura>-dev-<tela>.png` ao lado de `<largura>-prod-<tela>.png`; `info.json` tem as leituras do DOM).

## O que bateu
- **Tela de montar série (`/start` contra `/home` da produção), 1280 e 393:** mesmo desenho, mesma ordem, mesma tipografia. Só mudou «HOME» para «START» no menu (1280) e na aba e no nome da barra do topo (393). A aba «Start» cabe: largura 79 px com o conteúdo inteiro (sem corte), a barra de abas tem a mesma altura de antes, 57 px, sem rolagem lateral.
- **Menu, rodapé e migalha:** em `/start`, `/albums`, `/inventory` e `/blend`, a 1280 os três links para a tela inicial (menu, e os outros dois do texto do rodapé/migalha) dizem «Start» e apontam para `/start`; na produção, «Home» e `/home`. A 393, a aba e o nome na barra dizem «Start».
- **Logotipo:** aponta para `/?entry` nas duas larguras; o clique termina em `/?entry`, a página de entrada (na produção apontava para `/home`).
- **`/home` e `/home?signin`:** viram `/start` nas duas larguras, a tela abre igual.
- **`/albums`, `/inventory`, `/blend`:** iguais à produção nos pares (diferença de pixels só no rótulo da barra e do rodapé, e, em `/albums` a 393, no botão do estado vazio, que agora diz «Go to Start»: o botão ficou um pouco mais estreito por a palavra ser mais curta, o desenho é o mesmo). `/inventory` e `/albums` a 1280 mostram diferença também no corpo; olhei os pares: é a rotação de capas e dados carregando, não forma.
- **Página de entrada (`/?entry`):** mesma estrutura, textos e botões; a diferença é a capa e a legenda (aqui capas fictícias, na produção capas reais), que vêm da configuração `VITE_SPLASH_COVERS` do servidor de desenvolvimento, não do código da F85. Onde os botões levam (`/start`) li no registro de provas do implementador; não cliquei neles.

## Achados
- **P2-1 (observação, não é divergência da produção):** o estado vazio de `/albums` ainda diz «Create a series from the home page to get started», com «home page» em minúsculas, enquanto o botão agora diz «Go to Start». Existe igual na produção e a decisão do dono falava só do rótulo e do botão. Anchor: `393-dev-albums.png`. Dono: o dono decide se quer «Start» ali também; o agente do texto da tela (`mjrp-designing-ui`) executa. Não abri issue no `uat.md` por não ser divergência de forma.

## Não pude conferir
- **Telas com conta** (o desenho de quem entrou, a janela de entrar aberta por `?signin`, a raiz levando uma pessoa com conta a `/start`): sem entrar, sem segredos. Ficam com a prova do implementador (`reports/evidence/F85/`) e com o dono.
- **O build de produção** (`dist/`, as regras do `firebase.json`): só servidor de desenvolvimento.
- **O sensor visual do projeto** e **o Safari / o aparelho real**.
- Os botões da página de entrada, por clique.
