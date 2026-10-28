# Parecer do v0 para o harness: três checks passam o modelo sem preencher

Projeto: MJRP_AlbumsBalancedPlaylists_v0 (brownfield, conform do pacote B, 2026-10-28). Origem: o agente que executou as notas de `constitution`, `arch`, `data-model`, `tech-stack` e `adr-names`.

## 1. `constitution` (v2): o esqueleto com colchetes passa

- **Fato.** Antes de eu escrever qualquer coisa, `conformance_check.py . --check-note CM-0030` e `CM-0048` já saíam **passou**, com `docs/specs/constitution.md` ainda igual ao modelo: `**Tipagem:** [ex.: "TS strict..."]`, `**Tamanho de arquivo:** [o limite...]` e as demais linhas entre colchetes. O check é só `contains ^#\s+Constitution\b` (`canonical_catalog.json`, item `constitution`).
- **Por que importa.** O mesmo vale para `arch` (`^#\s+Architecture\b`) e `data-model` (`^#\s+Data Model\b`): o título basta. A regra do harness (conformance-notes, passo 6: «passar no check não é estar feito») fica só com a auditoria de conteúdo; a forma deixa passar o arquivo que o `new_project.py` acabou de criar.
- **Proposta.** Uma segunda cláusula `script` por item que reprove o placeholder do modelo (`[ex.:`, `[Project Name]`, `[Name]`, `[Entity Name]`), no estilo do `tech_stack_check.py`, que já pula a linha de placeholder do modelo e exige o resto.

## 2. `tech-stack`: a ADR citada pode estar `Proposed`

- **Fato.** A skill `mjrp-designing-architecture` manda citar na coluna Decisão uma ADR **aceita**, não uma superada. O `tech_stack_check.py` só confere que `docs/decisions/NNNN-*.md` existe; uma ADR em `Proposed` ou `Rejected` passa.
- **Proposta.** Ler a linha `**Status**:` do arquivo resolvido e avisar quando não for `Accepted`.

## 3. `report-names`: a pasta com `_` no nome não tem nome de parecer possível

- **Fato.** O `report_types_check.py` deriva o segmento do projeto da pasta em minúsculas (`mjrp_albumsbalancedplaylists_v0`, `project_slug`, só tira o prefixo `mjrp-`) e exige o resto do nome em `[a-z0-9]+([-.][a-z0-9]+)*` (`name_problem`). O sublinhado do nome da pasta nunca casa com a segunda regra, então nenhum arquivo de `reports/harness-feedback/` pode ficar sem aviso neste projeto. Este arquivo usa `mjrpalbumblender-v0` (o nome que o V1 deu aos relatórios do v0) e recebe o aviso «falta o segmento do projeto».
- **Proposta.** `project_slug` trocar `_` por `-` (e tirar também o prefixo `mjrp_`).
