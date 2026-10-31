---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-02
sprint: SPR-17.9
delivered_by: ["398025d"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F36: Sprint 17.9: Recipe Rebranding (Flavor to Recipe)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 17.9: Recipe Rebranding especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** nenhuma versão declarada no roadmap ou no CHANGELOG.

**Épico:** EP-02.

## Functionalities
- Interface do Blending Menu diz «Receita»: passo do assistente e título «Choose Your Recipe» — *evidência:* tasks.md §4 [x]; ADR-0015
- (refactor) BlendFlavorCard vira BlendRecipeCard (classe, evento, CSS) — *evidência:* tasks.md §2 [x]
- (refactor) BlendIngredientsPanel e RegeneratePanel: ALGORITHM_RECIPES, setRecipe — *evidência:* tasks.md §3, §5 [x]
- (refactor) Documentação e Product Vision com «Recipe» — *evidência:* tasks.md §1 [x]

## Sources
- `legacy/sprint17.9-flavor-to-recipe--plan.md` (plan) ← `docs/technical/specs/archive/sprint17.9-flavor-to-recipe/plan.md`
- `legacy/sprint17.9-flavor-to-recipe--spec.md` (spec) ← `docs/technical/specs/archive/sprint17.9-flavor-to-recipe/spec.md`
- `legacy/sprint17.9-flavor-to-recipe--tasks.md` (tasks) ← `docs/technical/specs/archive/sprint17.9-flavor-to-recipe/tasks.md`
