---
type: ux-audit
subject: "Reconferência visual pré-merge do ramo fix/f80-home-opens-in-portuguese, no site CONSTRUÍDO (vite build), no WebKit com iPhone 14 e no Chromium a 1280 px, com o navegador em inglês e em português: a home abre em português para todos (UAT-273), o «EN» troca e é lembrado, nada se mexe na página, e as duas descrições escondidas"
project: mjrpalbumblender-v0
features: [F80]
moment: delivery
date: "2026-11-21 22:40"
judged: "2026-11-21 22:40"
judged_commit: e743a1a
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 2
duration_s: 1500
status: open
---

# Reconferência visual — a home abre em português

**Veredito: passa (`pass`), sem P0 e sem P1; 2 P2.** O defeito que o dono viu no iPhone está consertado no site construído: com o navegador em inglês (`en-US`) e em português (`pt-BR`), no WebKit com iPhone 14 e no Chromium a 1280 px, a primeira tela é «Mergulhe nos álbuns que você ama.» / «Seus álbuns do momento, numa playlist balanceada.», `<html lang="pt-BR">` vem no primeiro byte, nenhum texto em inglês aparece em momento algum e nada se mexe entre a primeira pintura e 2 s depois. O «EN» troca todo o texto visível e o `lang`, e fica lembrado na recarga e numa aba nova; o «PT» volta e também fica lembrado. Quem já tinha escolhido EN continua em EN. A página em português é, pixel a pixel e caixa a caixa, a do `main`. O app não mudou.

## Como foi feito
- **Quem julgou:** agente juiz separado (Opus); não construiu o ramo.
- **Objeto:** `e743a1a` e `main` (`394c8e0`), extraídos com `git archive` para pastas de rascunho e construídos com `vite build` pela fila da máquina (`machine_load.py`, rótulo `judge-f80-pt-build`); servidos por um servidor local em `127.0.0.1` que reescreve como o `firebase.json` (`/` e `/home` → `index.html`, o resto → `app.html`, `/api` → 500). Os dois `dist/` só diferem em `splash-*.js` e `crate3d-*.js` e nas duas descrições.
- **Navegador:** Playwright 1.56.1 (de outro projeto do MJRP na máquina, `MJRPpersonal/node_modules`), WebKit 26.0 com o perfil `iPhone 14` (390 × 664); Chromium 141 a 1280 × 800. Cada um com `locale` `en-US` e depois `pt-BR`, armazenamento limpo em cada contexto.
- **Costuras:** pedidos a `identitytoolkit`, `securetoken`, `firestore.googleapis` e `firebaseinstallations` recusados (12); nenhum login, nada escrito fora do `localStorage` do próprio contexto.
- **Primeira pintura:** um observador (`MutationObserver`, desde a criação do documento) registra cada mudança de `lang` e do título; captura logo que o título existe e outra 2 s depois; as caixas do título, do seletor de idioma, dos botões e do cabeçalho comparadas entre as duas. Movimento normal (`no-preference`) neste passo; nos passos de comparação, movimento reduzido.
- **Roteiro e medidas** (rascunho, fora do repositório): `work/judge.mjs`, `work/judge.json`, `work/shots/`. Ele mesmo para os dois servidores no fim (`finally`).
- **Capturas:** `captures/` (7 recortes, 1,4 MB).

## O que foi conferido
1. **Primeira visita, nada lembrado** (`iPhone14-first-paint-and-2s-en-US-and-pt-BR.png`, `desk1280-en-US-first-paint-and-2s.png`):
   - Nos quatro casos (2 navegadores × 2 idiomas do navegador), o HTML entregue já traz `lang="pt-BR"` e o título em português. O registro mostra só `pt-BR` / «Mergulhe…» do primeiro ao último instante, sem passagem por inglês.
   - Nenhuma linha visível em inglês na página.
   - Caixas iguais na primeira pintura e 2 s depois (sem pulo). A diferença de pixels entre as duas fica só na arte que se mexe (o caixote e as faíscas).
2. **O «EN» e o «PT»** (`iPhone14-after-EN-tap-and-after-PT-reload.png`, `desk1280-after-EN-tap-and-after-PT-reload.png`):
   - Depois do «EN»: `lang="en"`, título «Dig through the albums you love.», título da aba e descrição em inglês, o «EN» marcado, `albumblender:lang = en`, nenhuma linha visível com cara de português.
   - Recarga e aba nova (`/home`): continuam em inglês.
   - «PT» e recarga: volta a `pt-BR`, lembrado como `pt`, nenhuma linha em inglês.
   - **Quem já tinha escolhido EN** (`albumblender:lang = en` antes de abrir): abre em inglês nos quatro casos. Ver P2-1.
3. **A página inteira em português, ramo contra `main`** (`iPhone14-pt-full-branch-main-diff-control.png`, `desk1280-pt-full-branch-main-diff-control.png`), com o navegador em `pt-BR` (no `main` em `en-US` a home abria em inglês, que é o defeito):
   - **Caixas:** 343 elementos no iPhone 14 e 335 a 1280 px, **0 diferença** de posição e tamanho entre o ramo e o `main`; o controle `main` contra `main` também 0.
   - **Pixels:** iPhone 14, ramo × `main` 6946 pixels diferentes contra 8933 no controle `main` × `main`; 1280 px, 636 contra 695. Ruído da mesma ordem, todo na arte animada.
   - A página do ramo aberta com o navegador em `en-US` também é a mesma (7381 e 655 pixels, a mesma zona de arte).
4. **O app e a volta** (`app-start-branch-vs-main-iPhone14-and-desk.png`):
   - «Abrir o app» leva a `/start`, em inglês como hoje («Pick the albums. We blend the playlists.»), menu «Start · Albums · Blend · Playlists · Inventory»; a tela é **0 pixel diferente** do `main` nos quatro casos, e o app não grava escolha de idioma.
   - Voltar (botão de voltar) e abrir `/home` de novo: a home segue em português nos quatro casos. No `main` com navegador em inglês ela voltava em inglês, como esperado.
5. **As duas descrições escondidas** do `index.html` construído:
   - `description` (155 caracteres): «O The Album Blender é um app web para quem ouve álbuns inteiros: monte séries com seus álbuns do momento, ranqueie as faixas e gere playlists equilibradas.»
   - `og:description` (117): «Monte séries com seus álbuns do momento, ranqueie as faixas, gere playlists equilibradas e conte suas mídias físicas.»
   - Lidas como um leitor brasileiro: naturais e verdadeiras ao produto (séries, ranking de faixas, playlists equilibradas, inventário de mídia física). Sem «ponha», sem «misture»; «Blend» não aparece fora do nome. O tamanho está no limite de 155 e o «O The» soa um pouco estranho (P2-2).

## Achados
- **P2-1 · quem escolheu EN ainda vê o português por um instante.** O HTML vem em português e o script troca depois: o título muda para inglês 50 ms após o início no WebKit e cerca de 280 ms no Chromium. Foi medido no registro das mudanças, não numa captura de tela. É o mesmo mecanismo do `main`, onde o mesmo intervalo atingia todo visitante com navegador em inglês. Agora só atinge quem tocou «EN». Não é regressão deste ramo.
  - **Âncora:** `public/splash/splash.js` (`languageControl`), `public/splash/lang.js` (`applyLanguage`).
  - **Evidência:** `work/judge.json`, `priorEN.log` e `afterReload.log`.
  - **A mudança:** um script mínimo no `<head>` que lê `albumblender:lang` e, se for `en`, esconde o corpo até o `applyLanguage`. Também dá para aceitar como está.
- **P2-2 · a descrição para busca está no limite e começa com «O The».** Com 155 caracteres, qualquer acréscimo vai ser cortado pelo buscador. «O The Album Blender é…» é correto, mas soa duplicado para quem lê em português.
  - **Âncora:** `public/splash/copy.js`, `meta.desc` (pt).
  - **A mudança:** por exemplo, «The Album Blender: um app web para quem ouve álbuns inteiros. Monte séries com seus álbuns do momento, ranqueie as faixas e gere playlists equilibradas.» (152 caracteres). Ou deixar como está.

## Não visto
- **Um iPhone de verdade:** só o WebKit do Playwright com o perfil; o Safari do iOS em inglês, que é o caso do dono, não foi visto.
- **Com conta:** sem login, então a home só foi vista sem conta.
- **Pré-visualização de link:** não foi visto como WhatsApp ou iMessage mostram a `og:description`; só o texto do HTML.
