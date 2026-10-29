---
id: S-37
aliases: [S-37]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-08]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^auth-login-modal]]", "[[behavior#^auth-login-result]]", "[[behavior#^auth-user-menu]]", "[[behavior#^auth-sign-out]]"]
delivered_by: ["18fbfc4"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-37 · Entrar com a conta Google ou Apple, ou seguir como convidado

## pt-BR

Como quem cura playlists a partir de álbuns, quero entrar com a minha conta Google ou Apple, sair quando quiser, ou seguir como convidado, para que o que eu montei fique ligado à minha conta.
Hoje (fato lido do código): a janela de entrada tem três opções e não fecha com Esc; erros viram frases como «Sign-in cancelled»; depois de entrar, o menu mostra a foto e o nome e oferece «Sign Out».
Defeito aberto hoje (a história segue aceita por histórico; este caso contradiz o «para que» até ser consertado): as séries criadas como convidado não passam para a conta ao entrar com Google ou Apple, e nenhum aviso diz que a migração falhou ([[uat#^UAT-12]]).
Entrega (histórico, antes do harness): 2025-12-11 (18fbfc4); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: L2, L3 (`components/LoginModal.js:9-121`, `components/navigation/AuthNav.js:21-97`); ROADMAP legado, Sprint 6 («Apple Sign-In», «Google Sign-In»).

## en

**Sign in with Google or Apple, or continue as guest**

As someone who curates playlists from albums, I want to sign in with my Google or Apple account, sign out whenever I want, or continue as a guest, so that what I built is tied to my account.
Today (read from the code): the sign-in window has three options and does not close with Esc; errors become phrases such as “Sign-in cancelled”; after signing in, the menu shows the photo and name and offers “Sign Out”.
Open defect today (the story stays accepted by history; this case contradicts the “so that” until fixed): series created as a guest do not move to the account on signing in with Google or Apple, and no warning says the migration failed ([[uat#^UAT-12]]).
Delivery (history, before the harness): 2025-12-11 (18fbfc4); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: L2, L3 (`components/LoginModal.js:9-121`, `components/navigation/AuthNav.js:21-97`); legacy ROADMAP, Sprint 6 (“Apple Sign-In”, “Google Sign-In”).
