---
type: ux-audit
subject: "Reconferência visual independente da F80: a página de entrada construída (public/splash.html) contra o Caixote v2 aprovado, no fogo brando"
project: mjrpalbumblender-v0
feature: F80
date: "2026-11-21 00:09"
moment: delivery
judged: "feat/f80-splash-page-for-album-lovers @ 0e393f9 (último commit de tela) contra design/inception/splash-crate-v2.html?fire=soft"
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 1
human_decisions: 1
status: open
---

# Reconferência visual da F80 — a página de entrada

**Veredito: passa, sem P0 e sem P1.** A página construída bate com o protótipo aprovado nas duas larguras, nos dois navegadores, nos dois conjuntos de capas e nos planos B. Fica **um P2**, que não é diferença do protótipo (o protótipo tem o mesmo defeito): com as capas **reais**, no celular, a página fica mais larga que a tela. Com as capas fictícias (o padrão que vai ao ar) isso não acontece. Ele precisa ser corrigido antes de as capas reais irem a público; essa decisão é do MJRP.

## Como foi feito

- **Quem julgou:** um agente que não implementou a F80 nem as rodadas de desenho dela. Leu a prova do implementador (`reports/evidence/F80/2026-11-20-entry-page-proof.md`) e tirou as próprias capturas.
- **O que foi comparado:** o ramo `feat/f80-splash-page-for-album-lovers` na pasta `agent-a4806cd05ee3c9cc0`, servido pelo Vite de desenvolvimento, que mostra a página na raiz:
  - `VITE_SPLASH_COVERS=real npx vite --port 5184 --host 127.0.0.1` (capas reais, para comparar o mesmo com o mesmo);
  - `npx vite --port 5187 --host 127.0.0.1` (o padrão, capas fictícias; a 5185 estava ocupada por outro servidor).
- **A referência:** `design/inception/splash-crate-v2.html?fire=soft`, servida por `python3 -m http.server 5186 --bind 127.0.0.1`. É a referência aprovada em `docs/specs/info-arch.md` § Protótipos aprovados (MJRP, 2026-11-20 22:15), com os nove estados `^splash-v2-*`. A faixa do protótipo (`.proto-strip`), as notas para o MJRP (`.proto-notes`) e o link «Privacy» foram escondidos do lado do protótipo: são diferenças previstas.
- **O sensor.** O contrato (`.mjrp-project.yml`) ainda não declara `sensors.visual`. Rodei o kit do projeto (`mjrp-scripts/visual_parity/run.mjs`) com uma config feita para esta rodada (cópias em `reports/evidence/F80/recheck/visual-real.config.mjs` e `visual-fictional.config.mjs`). O Playwright 1.56.1 foi resolvido de outro projeto local (`deps`), porque este não tem o Playwright. Nada mudou no `package.json`.
  - Condições: Chromium e WebKit × 1280×800 e 393×852 (móvel) × fundo escuro, ou seja, 4 condições.
  - Cenários: a primeira tela, A2, A3, A5, «Flip the record», B1 e B2, rolando até cada faixa: 7 cenários × 4 condições = 28 registros por conjunto de capas.
  - Comando: `python3 …/machine_load.py run --label f80-recheck --wait 3600 -- node mjrp-scripts/visual_parity/run.mjs <config>`.
- **Os olhos:** o painel do navegador (Chromium com GPU, o 3D desenhando) a 1280 e a 393, faixa por faixa, nos dois lados. Também um script Playwright próprio (`recheck/fallbacks.mjs`) para «reduzir movimento», sem WebGL (`?nogl`) e sem JavaScript, nos três lados (protótipo, capas reais, capas fictícias), e um script (`recheck/wide.mjs`) para achar o que transborda.

## O resultado do sensor

| Conjunto | Exit | P0 · P1 · P2 | Resumo |
|---|---|---|---|
| Capas reais | 0 | 0 · 0 · 0 | `reports/evidence/F80/recheck/sensor-real-summary.md` |
| Capas fictícias | 0 | 0 · 0 · 0 | `reports/evidence/F80/recheck/sensor-fictional-summary.md` |

Não há linha P0 nem P1 para julgar. Para conferir que o zero não era vazio, comparei os fatos das 28 capturas fictícias campo a campo, sem contar o texto das legendas:

- os tokens do `:root`, a tipografia por papel, a ordem da casca, os componentes e as fontes carregadas são **iguais** nos dois lados, em todos os registros;
- as fontes carregadas nos dois lados são Syne 700 e Syne 800, e o `h1` é `Syne, sans-serif`. **A Syne carrega**;
- o que muda é a altura da página: 43 px a menos a 1280; a 393, 57 px a menos antes do primeiro cartão. É o dado: as legendas das capas fictícias são mais curtas que as reais, e o rodapé do protótipo tem o link «Privacy». A forma é a mesma.

## O que os olhos viram, item por item

| Item | Protótipo × produto | Evidência |
|---|---|---|
| Layout e texto | Iguais. O texto servido, sem as tags, é idêntico linha a linha nas capas reais, exceto «Privacy» (prevista). | `recheck/tri-w1280-plain.jpg`, `recheck/tri-w393-plain.jpg` |
| Tipografia | Syne 700 e 800 nos títulos, o corpo na fonte do sistema, os mesmos tamanhos. | `recheck/fallbacks-facts.json` |
| Cores | Os mesmos tokens (`--bg #0a0a0c`, `--orange #f97316`, `--flame` laranja→vermelho), o mesmo fundo. | `recheck/sensor-*-diff.json`, fatos |
| O caixote | Antes do 3D, o caixote em CSS. Depois, o 3D (three.js r185): na A3 o «Low» puxado e a luz vermelha de baixo; no «Flip the record» o caixote gira; na B1 o lado B com «In the Aeroplane Over the Sea»; na B2 «To Pimp a Butterfly». Igual ao protótipo em cada faixa olhada no painel. | painel do navegador, 1280 |
| O fio, lado A / lado B | Os mesmos rótulos («Side A · 3 — Ranking», «Flip the record», «Side B · 1 — Why whole albums», «Side B · 2 — Start»), as barras acesas até a faixa atual, «FLIP» no meio, «Pause motion» à direita. No celular, a barra de baixo com o fio e «Open the app». | painel, `recheck/tri-w393-*.jpg` |
| O fogo | Brando nos dois: `FIRE = { peak: 0.72, low: 0.28 }` em `public/splash/splash.js:16`, os mesmos valores do `?fire=soft` do protótipo. Forte na A1 e na B2, baixo no meio. | código e painel |
| O movimento que para sozinho | Nos dois, `html.moving` sai uns 12 s depois de carregar; «Pause motion» vira «Play motion» com `aria-pressed="true"`. | painel |
| Menos movimento | Nos dois: o caixote em CSS parado, sem «Pause motion», three.js não pedido. | `recheck/tri-w1280-reduced.jpg`, `recheck/tri-w393-reduced.jpg` |
| Sem WebGL | Nos dois: o caixote em CSS com as mesmas capas, «Pause motion» presente. | `recheck/tri-w1280-nogl.jpg`, `recheck/tri-w393-nogl.jpg` |
| Sem JavaScript | Nos três lados: todo o texto, as chamadas, o caixote parado com as capas do lado A. Do lado do protótipo a faixa e as notas não puderam ser escondidas, porque sem script não há onde injetar o estilo. | `recheck/tri-w1280-nojs.jpg`, `recheck/tri-w393-nojs.jpg` |
| Capas fictícias (o padrão) | A mesma composição. Sobre o caixote aparece a etiqueta «Fictional albums · original art» (`.credit-tag`); o estilo dela já está no protótipo v2, então não é divergência. | `recheck/pairs-fictional/` |

## Achados

### P2-1 — Capas reais no celular: a página fica mais larga que a tela, e «Open the app» da barra de baixo sai cortado

- **Âncora:** `^splash-v2-phone` e `^entry-covers-switch`. O elemento é `a.slot-am`, o crédito de cada disco no celular, por exemplo «In the Aeroplane Over the Sea · Neutral Milk Hotel — Listen on Apple Music».
- **O que acontece:** a 393 px, com `VITE_SPLASH_COVERS=real`, o crédito não quebra linha e chega a 467 px. A página fica com `scrollWidth` 467. No Chromium móvel a janela de layout vira 467 px: a barra de baixo fica abaixo da primeira tela e, quando aparece, «Open the app» sai cortado à direita (`left 250, right 451`). No WebKit a página rola de lado. **O protótipo faz o mesmo**, nas mesmas medidas, então não é divergência da referência. É um defeito que veio do protótipo. Com as capas fictícias (o padrão) o `scrollWidth` é 393 e a barra aparece inteira.
- **Evidência:** `reports/evidence/F80/recheck/tri-w393-b1-overflow.jpg` (protótipo · reais · fictícias, na B1); `recheck/tri-w393-reduced.jpg` (a barra de baixo só aparece nas fictícias); `recheck/fallbacks-facts.json` (`scrollW` 467 / 467 / 393); a saída de `recheck/wide.mjs`, abaixo.

```
chromium :5184 (reais)    sw 467 · iw 467 · nav.thread 0–467 · a.bar-cta «Open the app» 250–451 · a.slot-am «In the Aeroplane Over the Sea · Neutral …» 16–467
chromium :5187 (fictícias) sw 393 · iw 393
chromium protótipo        sw 467 · iw 467 · as mesmas linhas das reais
webkit   :5184 (reais)    sw 467 · iw 393 · a.slot-am 16–402 e 16–467
webkit   :5187 (fictícias) sw 393 · iw 393
webkit   protótipo        sw 467 · iw 393 · as mesmas linhas das reais
```
- **Por que P2:** não é o que vai ao ar hoje (o padrão é o fictício), e a forma bate com o que foi aprovado. Vira P1 no dia em que as capas reais forem publicadas.
- **Dono do conserto:** o implementador da F80 (`mjrp-implementing-tasks`): deixar `.slot-am` quebrar linha (`overflow-wrap:anywhere` ou `max-width:100%`). Convém corrigir também o protótipo, para a referência não carregar o defeito.
- **Decisão do MJRP (`human_decisions: 1`):** se isso é corrigido antes de as capas reais irem a público, ou já agora.
- **Issue no `uat.md`:** **não aberta nesta passagem.** Quem me acionou limitou o commit ao relatório, às capturas e à entrada no log. Pela skill, um P2 real vira issue: falta abrir `fixing (F80)`, `Reportado por` `juiz`, `**Aberta por:** agente (juiz da F80)`, com este relatório em `Evidência`.

Nenhuma outra diferença real. As diferenças previstas (sem a faixa do protótipo, sem «Privacy», capas fictícias por padrão) foram vistas e conferem.

## Issues rechecadas

Nenhuma: a F80 não tinha issue aberta de reconferência anterior.

## Novas issues abertas

Nenhuma (ver P2-1, acima: fica por abrir).

## O que fica com o humano

- O P2-1: corrigir antes de publicar as capas reais, ou já agora.
- Uma proposta para o juiz visual: a regra de transbordo horizontal só aponta quando o produto transborda e o protótipo não. Quando os dois transbordam igual, ela fica calada. Proposta: marcar transbordo no produto como P2 mesmo quando a referência também transborda, com este caso como incidente.
- Declarar `sensors.visual` no contrato, com uma config versionada como as duas desta rodada e o `@playwright/test` no `package.json`. Sem isso, cada reconferência monta o sensor à mão.

## O que não pude conferir

- **Um iPhone ou um Safari de verdade:** só Chromium, no painel e sem interface, e o WebKit do Playwright sem interface. O 3D no WebKit não foi olhado.
- **O build de produção (`vite preview`):** comparei o servidor de desenvolvimento, como pedido. O build não foi refeito nem comparado; a prova do implementador mostra o `vite preview`.
- **A animação quadro a quadro** (o giro do «Flip», as brasas, o equalizador): vi quadros soltos no painel, não a fluidez nem os quadros por segundo.
- **A raiz com conta, «Open the app» e «Sign in» levando ao app:** é comportamento, não forma; fica com a prova do implementador e os testes.
- **O `?fire=bright`:** fora do aprovado, não comparado.

## Como rodar de novo

1. Na pasta do ramo, suba os três servidores: `VITE_SPLASH_COVERS=real npx vite --port 5184 --strictPort --host 127.0.0.1`, `npx vite --port 5187 --strictPort --host 127.0.0.1` e, em `design/inception`, `python3 -m http.server 5186 --bind 127.0.0.1`.
2. Rode `node mjrp-scripts/visual_parity/run.mjs reports/evidence/F80/recheck/visual-real.config.mjs`. Ajuste antes `deps` (um Playwright local entre 1.51 e 2, com o navegador dele instalado) e `evidenceDir`. Faça o mesmo com `visual-fictional.config.mjs`.
3. Para os planos B e o transbordo, rode `node reports/evidence/F80/recheck/fallbacks.mjs <pasta-de-saída>` e `node reports/evidence/F80/recheck/wide.mjs`, ajustando o caminho do Playwright no topo de cada um.
