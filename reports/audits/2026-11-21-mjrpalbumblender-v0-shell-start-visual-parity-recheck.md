---
type: ux-audit
subject: "Reconferência visual em lote, grupo «Start, navegação e casca»: F48 (Clear Cache), F50, F54 (aba do navegador), F57, F59, F64, F67 — a tela de hoje, 1280 e 393, contra o design system"
project: mjrpalbumblender-v0
features: [F48, F50, F54, F57, F59, F64, F67]
moment: delivery
date: "2026-11-21 13:22"
judged: "2026-11-21 13:22"
judged_commit: 1101874
who_judged: separate-agent
verdict: fail
p0: 0
p1: 0
p2: 4
duration_s: 2400
status: open
---

# Reconferência visual em lote — Start, navegação e casca

**Veredito: não passa limpo (`fail`), sem P0 e sem P1; 4 P2.** O que cada feature pediu está na tela de hoje; as divergências são de acabamento, abertas como issues.

## Como foi feito
- **Quem julgou:** um agente juiz (Opus) que não implementou nenhuma destas features; as capturas foram tiradas por um agente de captura (Sonnet) com roteiro.
- **Referência:** não houve protótipo aprovado para nenhuma destas features (todas na via rápida, `Prototype: none`). A referência é o `docs/specs/design-system.md` (cores, Syne, fogo e equalizador, alvos de 44 px no celular) e o que o MJRP aprovou usando o site (a Home «Transformar v2» da F79, em produção).
- **Objeto:** a produção de hoje (`https://mjrp-playlist-generator.web.app`, site da `da3bf1c`) deslogado, e o servidor de desenvolvimento da `main` local (`1101874`) na porta 5404. Ninguém entrou com senha; nada foi gravado.
- **Costuras:** na tela Start, só a chamada crua ao catálogo (`musicKitService.getArtistAlbums`) foi trocada por álbuns de Kendrick Lamar no formato do catálogo; o `AlbumSearchService`, o classificador real (`models/albumType.js`) e o seletor seguem o código. A janela «Edit Series» foi aberta com uma série de mentira no `albumSeriesStore`, sem salvar. A casca «com conta» usou um registro de conta de teste escrito à mão no IndexedDB de `127.0.0.1:5404`, com os servidores do Firebase bloqueados (método da prova da F85).
- **Capturas e medidas:** `reports/evidence/visual-recheck-batch/2026-11-21/shell/` (`NOTES.md`, `measures-*.json`, `prod-title-favicon.json`). 1280 x 800 e 393 x 852 (celular, toque, escala 2).

## Por feature — o que olhei e contra o quê
- **F48 (o «Clear Cache» que limpa de fato):** o botão está no rodapé do computador (`shell-visitor-footer-1280.png`) e no menu do celular como «Clear album cache» (`shell-account-menu-393.png`). Não cliquei (limparia dados). A mudança da F48 é de comportamento; o visível é o botão, que existe. Ver P2-2.
- **F50 (um endereço local):** mudança de configuração local. O visível é o botão «Connect» do Spotify, na barra do computador e no menu do celular, com o verde da marca Spotify (o design system reserva o verde ao que é do Spotify). Ver P2-3 (tamanho no celular).
- **F54 (aba do navegador: o logotipo e um título só):** confirmado em produção: um `<title>` por página, «MJRP The Album Blender - Playlist Generator» no app; o ícone é o logotipo (`prod-favicon-1.png`). As outras partes da F54 (excluir do inventário, durações, «Close») estão no relatório do inventário.
- **F57 (uma peça só para buscar e escolher álbuns, um classificador):** Start (`start-results-*.png`) e «Edit Series» (`editseries-aftersearch-*.png`) mostram os mesmos grupos e contagens (Studio 7, EPs 1, Singles 2, Live 1, Compendiums 1, Other) e «To Pimp a Butterfly» e «good kid, m.A.A.d city» em Studio, pelo classificador real. A Start foi redesenhada depois pela F79; a janela de edição ficou com o desenho antigo. Ver P2-1.
- **F59 (fechar o que estava aberto):** sem mudança visível própria. O CSS do Tailwind compilado (sem CDN) desenha as telas iguais; nenhum erro no console em produção.
- **F64 (um caminho só para produção):** sem mudança visível própria (tocou rodapé e menu só em nomes). A casca está íntegra: barra do topo, rodapé, barra de abas e menu do celular, sem rolagem lateral (`scrollWidth` = largura em todas as capturas do app).
- **F67 (o Scan responde ao clique):** os quatro estados que a feature pede estão na tela, nas duas larguras: buscando (botão ocupado «Searching…», esqueletos, equalizador em movimento — `start-scanning-393.png`), resultados (`start-results-*`), sem resultados (`start-notfound-*`) e falhou com «Try again» (`start-error-1280.png`, «The search could not be completed. Nothing was changed.»). A tela é a da F79, que substituiu o desenho da época da F67; o comportamento pedido continua.

## Design system — o que bateu
Fundo preto, painel `#101014`, Syne nos títulos, texto do sistema no corpo do celular, o fogo no botão principal (Sign In, «Search» com o campo vazio), o equalizador sob o campo nos três estados, fichas ligadas em branco na Start, aba atual em laranja. Nenhum texto abaixo de 12 px nem campo abaixo de 16 px no celular.

## Achados
- **P2-1 · F57 · a janela «Edit Series» não acompanhou a Start.** Mesma peça e mesmos dados, mas a ficha escolhida é laranja preenchida (o design system diz: ficha ligada branca com texto preto, nunca laranja) e há dois botões de fogo na mesma janela («Scan» e «Save Changes»; a regra é um por tela). Âncora: `editseries-aftersearch-1280.png` contra `start-results-1280.png`. Causa provável: a F79 redesenhou a Start depois da F57. Issue: UAT-240.
- **P2-2 · F48 · no computador, em `/start`, o rodapé (com «Clear Cache») fica sob a base fixa da série,** mesmo com a página rolada até o fim: o botão em y 714–734, a base de ~670 a ~780. Âncora: `shell-visitor-footer-1280.png`, `measures-dev-visitor.json` (`footer.rect`). Nas outras telas o rodapé aparece. Causa provável: a base da F79 sem respiro embaixo. Issue: UAT-241.
- **P2-3 · casca do celular · dois alvos abaixo de 44 px:** o logotipo da barra do topo (28 x 28) e o «Connect» do Spotify no menu (109 x 30). Âncora: `measures-*.json` (`targetsBelow44`). Issue: UAT-242.
- **P2-4 · produção, visitante, `/albums` a 1280: dois estados vazios empilhados** — «No albums match your filters» e, abaixo, «No albums in library». A prova da F76 diz ter corrigido isso no celular; no computador continua. Âncora: `prod-albums-1280.png`. Issue: UAT-243.

## Não visto
- Clicar «Clear Cache», «Create series», «Save Changes» ou entrar: de propósito (gravariam ou exigiriam senha).
- A página de entrada (`/`, `/home`) foi capturada, mas é da F80 e tem a própria reconferência; não julgada aqui.
