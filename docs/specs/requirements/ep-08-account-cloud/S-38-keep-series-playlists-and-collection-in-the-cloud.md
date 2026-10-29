---
id: S-38
aliases: [S-38]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-08]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^auth-anonymous-start]]", "[[behavior#^inventory-saved-per-user]]", "[[behavior#^playlists-save-saved]]"]
delivered_by: ["6eb6682", "b85f473", "edc38ee"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-38 · Ter as séries, as playlists e a coleção guardadas na nuvem, por conta

## pt-BR

Como quem cura playlists a partir de álbuns, quero ter as minhas séries, playlists e coleção guardadas na nuvem, ligadas à minha conta, para que eu os encontre ao voltar ao app, em outro navegador ou aparelho.
Hoje (fato lido do código): ao abrir, o app entra sozinho como convidado; se isso falhar, avisa «Authentication issue. Some features may be limited.».
Defeito aberto hoje (a história segue aceita por histórico; este caso contradiz o «ligadas à minha conta» até ser consertado): as séries criadas como convidado não passam para a conta ao entrar com Google ou Apple ([[uat#^UAT-12]]).
Entrega (histórico, antes do harness): 2025-11-28 (6eb6682), 2025-12-03 (b85f473), 2025-12-21 (edc38ee); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: D1, I10, L1 (`repositories/*Repository.js:21-27`, `services/AuthService.js:36-67`); ROADMAP legado, Sprint 5 («Firestore Persistence»).

## en

**Keep series, playlists and collection in the cloud**

As someone who curates playlists from albums, I want to have my series, playlists and collection saved in the cloud, tied to my account, so that I find them when I return to the app, in another browser or device.
Today (read from the code): on opening, the app signs in by itself as a guest; if that fails, it says “Authentication issue. Some features may be limited.”.
Open defect today (the story stays accepted by history; this case contradicts the “tied to my account” until fixed): series created as a guest do not move to the account on signing in with Google or Apple ([[uat#^UAT-12]]).
Delivery (history, before the harness): 2025-11-28 (6eb6682), 2025-12-03 (b85f473), 2025-12-21 (edc38ee); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: D1, I10, L1 (`repositories/*Repository.js:21-27`, `services/AuthService.js:36-67`); legacy ROADMAP, Sprint 5 (“Firestore Persistence”).
