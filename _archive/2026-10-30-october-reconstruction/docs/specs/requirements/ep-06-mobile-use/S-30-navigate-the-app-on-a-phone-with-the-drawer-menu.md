---
id: S-30
aliases: [S-30]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-06]]"
planned_for: "[[ROADMAP#^REL-05]]"
points_to: ["[[behavior#^app-mobile-drawer]]"]
delivered_by: ["9ebed2b", "11747c3"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-30 · Navegar pelo app no celular com o menu em gaveta

## pt-BR

Como quem escuta música no celular, quero abrir o menu numa gaveta, tocando em ☰, e chegar a qualquer tela do app, para que eu use o app inteiro no celular.
Hoje (fato lido do código): abaixo de 768 px o menu vira o botão ☰; a gaveta fecha ao tocar num link, no fundo, no ✕ ou ao ampliar a janela, e trava a rolagem da página.
Entrega (histórico, antes do harness): 2025-12-06 (9ebed2b), 2025-12-09 (11747c3); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: T3, KB2 (`components/TopNav.js:92-147,258-308`); ROADMAP legado, Sprint 21 («Mobile Layout»).

## en

**Navigate the app on a phone with the drawer menu**

As someone who listens on a phone, I want to open the menu in a drawer by tapping ☰ and reach any screen of the app, so that I use the whole app on a phone.
Today (read from the code): below 768 px the menu becomes the ☰ button; the drawer closes on tapping a link, the background, the ✕ or when the window widens, and locks page scrolling.
Delivery (history, before the harness): 2025-12-06 (9ebed2b), 2025-12-09 (11747c3); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: T3, KB2 (`components/TopNav.js:92-147,258-308`); legacy ROADMAP, Sprint 21 (“Mobile Layout”).
