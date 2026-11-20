# Plan — Feature F73: As telas mantêm o campo em uso e largam o que deixaram · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Architecture Approach
Três regras, cada uma num lugar só, sem camada nova:

1. **O redesenho devolve o campo em uso** (`public/js/utils/keepField.js`, `redrawKeepingField`). As telas que se redesenham inteiras (playlists, inventário) passam o redesenho por ela. O remendo de foco da busca do inventário saiu.
2. **A guarda de versão antiga vale para o app inteiro** (`installStaleBuildGuard` em `public/js/utils/staleBuild.js`, ligada em `app.js`). Antes só a troca de tela, no roteador, era protegida.
3. **Um contrato de vida da tela** (`BaseView`): a inscrição numa loja vai em `this.subscriptions` e o `destroy()` do roteador a solta. A `InventoryView` usava `onUnmount()`, que ninguém chama. O teste `test/architecture/viewLifecycle.test.js` guarda o contrato.

## Technical Design
- `utils/keepField.js` — `redrawKeepingField(container, redraw)`: guarda o campo de texto em uso dentro do contêiner (pelo `id`), o valor e o cursor; redesenha; devolve o foco, o valor digitado e o cursor ao campo de mesmo `id`. Sem `id`, não há devolução. (REQ-01)
- `views/PlaylistsView.js` `update()` e `views/InventoryView.js` `render()` — redesenham por `redrawKeepingField`. (REQ-01)
- `utils/staleBuild.js` — `installStaleBuildGuard(window)`: ouve `vite:preloadError` e `unhandledrejection` com o texto de arquivo ausente, e chama `reloadOnceForNewBuild`. (REQ-02)
- `views/PlaylistsView.js` e `components/playlists/PlaylistsGridRenderer.js` — sem playlists e fora da edição, só `renderEmptyState()`; `renderInitialSettings` e o ouvinte do `#generateBtn` foram apagados. (REQ-03)
- `views/InventoryView.js` — a inscrição vai em `this.subscriptions`; `destroy()` marca a tela como deixada e o redesenho pedido depois disso não acontece. (REQ-04)

## Dependencies
Nenhuma.

## Documents Consulted
`AGENTS.md`, `docs/specs/behavior.md`, `docs/specs/uat.md` (UAT-207, UAT-05), `public/js/router.js`, `public/js/views/BaseView.js`.

Declarações do passo retroativo da via rápida:
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — sem mudança: nenhum componente, fluxo técnico ou integração novos
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade, campo ou esquema mudou
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — atualizado (no commit do conserto, que cita a F73)
- `docs/wiki/` — sem mudança: nenhuma página descreve uma regra do app que esta feature mudou

## Risks & Considerations
- **A recarga perde o que não estava no rascunho.** As playlists não salvas voltam; um título sendo digitado, não.
- **Queda de rede** também dispara `vite:preloadError`: o app recarrega uma vez e não de novo por um minuto.
- **Clique no instante de um redesenho** ainda pode se perder (fora do escopo; ver a spec).
