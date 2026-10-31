---
id: S-39
aliases: [S-39]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-08]]"
planned_for: "[[ROADMAP#^REL-04]]"
points_to: ["[[behavior#^auth-anonymous-start]]", "[[behavior#^auth-login-modal]]"]
delivered_by: ["b3b9f32"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-39 · Abrir o app sem ver janela de login nem de autorização

## pt-BR

Como quem cura playlists a partir de álbuns, quero abrir o app e começar a usar sem que apareça uma janela de login ou de autorização, para que eu só seja interrompido quando eu pedir algo que exige conta.
Hoje (fato lido do código): a autorização do Apple Music só é pedida ao enviar uma playlist para lá; a janela de entrada só abre quando eu toco em «Sign In».
Entrega (histórico, antes do harness): 2025-12-31 (b3b9f32); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: L1, L2, L7 (`services/musickit/MusicKitAuth.js:54-176`); ROADMAP legado, Sprint 15 («ARCH-13: Lazy Authorize»).

## en

**Open the app with no login or authorization window**

As someone who curates playlists from albums, I want to open the app and start using it without a login or authorization window appearing, so that I am interrupted only when I ask for something that needs an account.
Today (read from the code): Apple Music authorization is only requested when sending a playlist there; the sign-in window only opens when I tap “Sign In”.
Delivery (history, before the harness): 2025-12-31 (b3b9f32); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: L1, L2, L7 (`services/musickit/MusicKitAuth.js:54-176`); legacy ROADMAP, Sprint 15 (“ARCH-13: Lazy Authorize”).
