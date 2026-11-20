<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F50: Um endereço local só para o login e para o Spotify · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do código (passo retroativo da via rápida), a partir do `docs/log.md` de 2026-11-19 e do código do ramo `fix/f50-one-local-address`.

## Architecture Approach
Nenhuma peça nova de arquitetura. Duas regras passam a ter um dono só:
- **O endereço local** é decidido por uma função pura, `canonicalLocalUrl` (`public/js/utils/localAddress.js`), chamada na entrada do app. Ela não conhece tela nem rede (DP-20, núcleo puro).
- **«A sessão do Spotify mudou»** é um sinal só, `spotify-auth-change`, disparado por `SpotifyAuthService` em toda escrita da sessão (`setSession`) e na saída (`logout`). Quem desenha a sessão escuta esse sinal e mais nenhum. `spotify-auth-success` continua existindo só como gatilho do enriquecimento em segundo plano.

## Technical Design
- `public/js/utils/localAddress.js`: `LOCAL_HOST`, `canonicalLocalUrl(location)` devolve o endereço certo ou `null` (REQ-01).
- `public/js/app.js`: na entrada, se `canonicalLocalUrl` devolve um endereço, `window.location.replace` (REQ-01).
- `vite.config.js`: porta 5010, `strictPort` (REQ-02).
- `public/js/services/SpotifyAuthService.js`: `setSession` dispara `spotify-auth-change` (REQ-03).
- `public/js/components/SpotifyConnectButton.js`: ao ouvir o sinal, redesenha e busca o nome da conta, um pedido por vez (REQ-03); o «x» pergunta por `dialogService.confirm` (REQ-04).

## UI/UX Design (if the feature touches a screen)
A pergunta de desconectar usa o `ConfirmModal` que o app já tem. Nenhum desenho novo.

## Dependencies
Cadastros fora do código, feitos pelo MJRP em 2026-11-19: `http://127.0.0.1:5010/callback` nos Redirect URIs do painel do Spotify; `127.0.0.1` nos domínios autorizados do Firebase Authentication. `VITE_SPOTIFY_CLIENT_ID` no `.env`.

## Documents Consulted
- `docs/specs/uat.md` (UAT-178, UAT-182, UAT-183)
- `docs/manual/00_Deployment_and_Setup.md`, `PORT_INFO.txt`, `README.md`
- `public/js/services/SpotifyAuthService.js` (o comentário sobre o Spotify exigir `127.0.0.1`)

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — sem mudança: só o endereço local e o botão do Spotify; nenhum componente, fluxo técnico ou integração novos
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade, campo ou esquema mudou
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — sem mudança: nenhum estado de comportamento mudou
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou

## Risks & Considerations
- O sinal agora dispara também na renovação do token. Quem escuta precisa ser barato: o botão só redesenha e, sem nome da conta, busca uma vez.
- Guardados do navegador em `localhost:5010` (login, tokens, cache) ficam para trás: valem os de `127.0.0.1:5010`.
- O login pela Apple no endereço local segue sem resposta (ver Open Questions da spec).

## Test plan
- `test/utils/localAddress.test.js`: seis casos da função pura (REQ-01).
- `test/services/spotify/SpotifyAuthSignal.test.js`: o sinal ao gravar e ao sair, o botão que muda sozinho, o «x» pelo diálogo do app (REQ-03, REQ-04).
- No navegador: `reports/evidence/F50-one-local-address/F50-probe-2026-11-19.json` (REQ-01 a REQ-04).
