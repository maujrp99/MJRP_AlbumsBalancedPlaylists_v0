# Erros bloqueantes -- historico

> O erro em si ja bloqueia o `doctor`/`stop_gate` ao vivo; este arquivo so registra QUANDO cada um apareceu e foi corrigido, pra dar pra ver o que fica se repetindo.

<!-- sensor:doctor:start -->
### doctor.py (erros correntes)

**Abertos**

| Desde | Item |
|---|---|
| 2026-11-19 | [F1] MEMORY.md: o ## Now para em 2026-11-23 16:58, a última entrada do docs/log.md é de 2026-11-24 10:46 — atualize o ## Now com o estado de agora (S-61) |
| 2026-11-24 | [I5] a cópia do kit do admin 1.0.1 foi mexida neste projeto (1): o sensor herdado do kit test/admin-kit/check.mjs chega e nada o roda: declare-o em `sensors:` do contrato (`admin_kit: "node <tools_path>/check.mjs --ui <ui_path> --core <core_path> --root <tools_path> --project . --skin <skin> [--no-complexity-exceptions]"`). O kit não se edita aqui: edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit --version X.Y.Z` neste projeto |
| 2026-11-24 | [F1] 'Where the Work Stopped' com 11538 caracteres, acima de 1500 (memory.stopped_max_chars): o bloco diz onde o trabalho está agora; o histórico é do log — reescreva, não acrescente |
| 2026-11-24 | [A1] sensor 'lint' reprovou (exit 2):   Try `npm i --save-dev @types/react-dom` if it exists or add a new declaration (.d.ts) file containing `declare module  |
| 2026-11-24 | [A1] sensor 'test' reprovou (exit 1): } |
| 2026-11-24 | [A1] sensor 'build' reprovou (exit 1):     at ModuleJob.syncLink (node:internal/modules/esm/module_job:277:33) |
| 2026-11-24 | [A1] sensor 'board_states' reprovou (exit 1):   … e mais 2 |

**Resolvidos (ultimos 20)**

| Aberto em | Resolvido em | Item |
|---|---|---|
| 2026-10-28 | 2026-11-24 | [A1] sensor 'build' não executa: > mjrp-playlist-generator@3.19.0 build
> vite build

sh: vite: command not found |
| 2026-10-28 | 2026-11-24 | [A1] sensor 'test' não executa: > mjrp-playlist-generator@3.19.0 test
> vitest --run

sh: vitest: command not found |
| 2026-10-28 | 2026-11-24 | [A1] sensor 'lint' não executa: > mjrp-playlist-generator@3.19.0 lint
> eslint .

sh: eslint: command not found |
| 2026-11-07 | 2026-11-24 | [I5] 3 sensor(es) do processo chegam ao filho mas nada os roda (o contrato não os declara em `sensors:`): pdlc_vocabulary_check.py → `python3 mjrp-scripts/pdlc_vocabulary_check.py .` · requirements_graph_check.py → `python3 mjrp-scripts/requirements_graph_check.py .` · sdd_shape_check.py → `python3 mjrp-scripts/sdd_shape_check.py .`. Declare cada um em `sensors:` do .mjrp-project.yml (nota de migração CM-0107) |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint23-ranking-refactor/plan.md: link para '../../../manual/00_MJRP_Album_Blender_Ref_Guide_Index.md' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint20-user-ranking-ext/plan.md: link para '../../public/js/services/PlaylistGenerationService.js' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint20-user-ranking-ext/plan.md: link para '../../public/js/components/blend/BlendRecipeCard.js' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint20-user-ranking-ext/plan.md: link para '../../public/js/components/blend/BlendIngredientsPanel.js' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint20-user-ranking-ext/plan.md: link para '../../manual/31_UI_Style_Guide.md' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint20-user-ranking-ext/plan.md: link para '../../manual/18_Frontend_Logic_Core.md' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint20-user-ranking-ext/plan.md: link para '../../manual/07_Frontend_Data_Infra.md' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint20-user-ranking-ext/plan.md: link para '../../manual/01_System_Architecture.md' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint19-frontend-modularization/tasks-track-b.md: link para 'file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/technical/specs/sprint19-frontend-modularization/plan-track-b.md' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint19-frontend-modularization/tasks-track-b.md: link para 'file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/technical/specs/sprint19-frontend-modularization/spec.md' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint19-frontend-modularization/spec.md: link para 'file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/technical/refactoring_recommendations.md' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint19-frontend-modularization/refactoring_recommendations.md: link para 'file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/manual/01_System_Architecture.md' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint18-backend-refactor/plan.md: link para 'file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/TopNav.js' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint18-backend-refactor/plan.md: link para 'file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/SeriesGridRenderer.js' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint18-backend-refactor/plan.md: link para 'file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/SpotifyExportModal.js' não existe |
| 2026-10-28 | 2026-11-24 | [I3] docs/technical/specs/archive/sprint18-backend-refactor/plan.md: link para 'file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/services/SpotifyExportService.js' não existe |
<!-- sensor:doctor:end -->
