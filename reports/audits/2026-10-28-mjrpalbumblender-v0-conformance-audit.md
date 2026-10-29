---
type: conformance-audit
subject: "A conformidade canônica de MJRP_AlbumsBalancedPlaylists_v0 (o conform de 2026-10-28, 59 notas aplicadas) — auditoria do conteúdo, nota a nota"
project: mjrpalbumblender-v0
judged: "2026-10-29 18:59"
who_judged: separate-agent (juíza B do conform do v0, a pedido da orquestradora do harness; a executora foi a sessão A)
verdict: conforme, com pontos fracos
content_p0: 0                      # os dois P0 (evidência da F04 e história S-04) fechados na releitura de 2026-10-29; acima de 0 o conform não fecha
avoidable_questions: 0             # as 7 (P-26, P-29, P-30, P-32, P-34, P-35, P-36) fechadas na releitura de 2026-10-29
bent_rules: 0                      # a regra dobrada (P-36) fechada na releitura de 2026-10-29
---

# Auditoria da conformidade de MJRP_AlbumsBalancedPlaylists_v0 · 2026-10-28

> Pedido pela orquestradora do harness, depois que a executora (sessão A) parou no último commit `6cca392`, árvore limpa, sem push. A juíza B leu o projeto só em leitura: sete agentes separados em Sonnet (um por skill juíza) escreveram um arquivo cada em `reports/audits/`, e a juíza B rodou o `conformance_check.py` de dentro do harness e conferiu o que a executora tocou. O `HEAD` e o `git status` do projeto só mudaram pelos oito relatórios novos desta auditoria. O relatório volta à orquestradora e, por ela, ao MJRP.

## Veredito: conforme, com pontos fracos

**Releitura de 2026-10-29 (só o que falhou): PASSOU.** A executora fez a rodada de correção em 4 commits locais (`8350503`, `3a4d838`, `5fee9c2`, `5de63ed`; `HEAD` `5de63ed`, 34 commits à frente de `origin/main`, que segue em `c9cf80f`: sem push). Nenhum arquivo de código, nenhuma válvula do MJRP. Os cinco pontos que falharam, um a um:

| Ponto | Estado | Âncora (arquivo:linha e o que a linha diz) |
|---|---|---|
| P0 1: evidência da F04 × UAT-12 | **fechado** | `reports/evidence/F04/evidence.md:21` «NÃO provam o fluxo real do visitante que entra com uma conta, e esse fluxo não funciona hoje: UAT-12»; `docs/specs/features/F04-*/spec.md:26` o `verified_by` do REQ-02 diz que a migração real «NÃO está pr[ovada]»; `evidence.md:23` «Nenhum destes testes foi executado nesta passagem» |
| P0 2: S-04 × UAT-24 e UAT-06 | **fechado** | `docs/specs/requirements/ep-01-album-series/S-04-…md:17` «Defeitos abertos hoje (a história segue aceita por histórico; estes casos a contradizem até serem consertados)», com `[[uat#^UAT-24]]` e `[[uat#^UAT-06]]`; mesma ressalva em S-37, S-38 (UAT-12), S-15, S-12 e S-24; o sensor do grafo segue VERDE (175 nós) |
| 7 perguntas evitáveis e a regra dobrada | **fechadas** (fora da lista ao MJRP, regra citada) | `docs/log.md:8-19` (entrada de 2026-10-29 18:55): P-29 → UAT-28 pelo §I.14; P-30 → UAT-14 pelo §I.3; P-32 → `docs/decisions/0015-flavor-to-recipe.md:3` `**Status**: Accepted (registro original de 2026-01-10: APPROVED)` (o `adr_header_check` passa); P-26 → a ADR-0018 fica `Proposed` para a via técnica; P-34 → a regra de economia até 2026-10-30 responde; P-35 → resolvida no git; P-36 → a regra vale (`loop.py:194`), a pendência virou UAT-29 e o parecer ao harness `reports/harness-feedback/2026-10-29-mjrpalbumblender-v0-loop-rounds-no-legacy-exemption.md` |
| H10 e S8 sem issue | **fechado** | `docs/specs/uat.md` linhas 38-39: UAT-26 «Home · colar lista de álbuns vazia» (confere: `HomeController.js:132` chama `toast.warn`, e `Toast.js:148-151` só tem `success`, `error` e `info`) e UAT-27 «botão «Create Series» do estado vazio» (confere: `SavedPlaylistsView.js:249` faz `window.location.hash = '/home'`, e o roteador lê `window.location.pathname`, `router.js:85`) |
| `delivered_by` fraco de S-30, 31, 32, 34, 38 | **fechado** | commits novos, todos de antes do contrato (`54fd54c`) e todos com código de produto (`public/js`, `server/`, `shared/` ou `public/index`): S-30 `9ebed2b`, `11747c3`; S-31 `b9530f1`, `29b3f5e`; S-32 `29b3f5e`; S-34 `2093d63`, `cd7dff4`; S-38 `6eb6682`, `b85f473`, `edc38ee` (conferi cada um com `git show --name-only`); `6d79577` (só documentos) e `2f980d0` (só configuração) saíram |

**Os quatro itens de tela seguem abertos de propósito**: `info-arch`, `info-arch-sections`, `wireframes` e `design-system` não têm arquivo (e `visual-sensor` e `project-palette`, só o contrato), porque dependem do MJRP (P-33 e a válvula de dispensar de vez) e da economia até 30/10; o conform **não está fechado**: `conformance_check.py … --pending --gaps` (do harness) segue em 7 lacunas e 17 notas pendentes. O que a releitura não refez: o P1 do F01 («todas as séries» no REQ-02 sem o limite de 20), os demais P1 e P2 dos juízes e o ponto de que nenhum teste citado foi executado (falta `npm ci`); continuam abertos nos arquivos dos juízes e na rodada seguinte. O `content_audit_check.py` ainda reprova só pelos quatro itens de tela sem arquivo (ver «Em aberto»).

## Histórico do veredito (2026-10-28, antes da correção): não conforme

**Mecânico.** `conformance_check.py ../MJRP_AlbumsBalancedPlaylists_v0 --pending --gaps` (do harness): 7 lacunas, 0 não avaliáveis, 17 notas pendentes. As 7 lacunas e as 17 notas são todas dos itens de tela (`visual-sensor`, `info-arch`, `info-arch-sections`, `wireframes`, `design-system`), da paleta (`project-palette`) e da própria auditoria de conteúdo (`content-audit`, esta). As 59 notas aplicadas passam no script. O catálogo não está incompleto (nenhuma linha «catálogo incompleto»). A executora declarou os itens de tela fora por economia até 30/10 e pela regra do MJRP de 2026-10-18 (sensor visual não roda no fechado em produção); o sensor visual segue só comentado no contrato. Nenhum arquivo de código do v0 foi alterado, apagado ou movido: dos 338 arquivos mudados desde `c9cf80f`, 329 são novos e 9 modificados, todos de documento ou de configuração do harness (`.gitignore`, a constituição gerada em `.specify/`, `docs/ROADMAP.md`, `docs/manual/00_Dir_File_Structure_Map.md`, `proj-documentation-task.md`, quatro ADRs renomeadas por `git mv`). Nenhum push (`origin/main` segue em `c9cf80f`, a `main` local está 29 commits à frente), nenhuma válvula do MJRP nos commits (nenhum `Human-accepted:`, `Conformance-waiver:`, `Catalog-editorial:` nem `--no-verify` nas mensagens).

**O que o script não vê.** Há dois P0 de conteúdo abertos, os dois do tipo «o documento diz que funciona e o próprio mapa do v0 diz que não»: a história S-04 («ver todas as séries e os álbuns de cada uma») está aceita sem ressalva enquanto a UAT-24 (lista cortada em 20 séries sem aviso) e a UAT-06 (o botão «Load N more albums» não faz nada) a negam; e a evidência da feature F04 dá como coberta a migração das séries do visitante para a conta com um teste que passa porque recebe os valores à mão, enquanto a UAT-12 diz que a migração não acontece. Fora os P0, 20 itens tiveram o conteúdo julgado: 4 sólidos (`adr-names`, `report-names`, `tech-stack`, `data-model`), 15 fracos e 1 errado (`requirement-nodes`); os 4 itens de tela sem arquivo (`info-arch`, `info-arch-sections`, `wireframes`, `design-system`) não têm o que julgar, e 5 itens são só a forma. Sete perguntas ao MJRP são de classe (a) e voltam ao agente; uma recomendação dobra uma regra.

## Os pontos que o MJRP pediu para olhar

- **18 features de histórico, F01 a F18:** existem exatamente 18, uma pasta cada em `docs/specs/features/`, cada uma com spec, plan e tasks, todas `lane: standard`, tipo feature, estado Done; 18 pastas de evidência em `reports/evidence/`, cada uma com `evidence.md` (juiz `mjrp-ensuring-sdd`, ponto 1). **ok.**
- **Cada story entregue importada por exatamente uma feature:** nenhuma story está em `Done`; as 39 entregues estão em `Accepted` (o aceite por histórico). Das 39: importadas uma vez = 39, zero vezes = 0, mais de uma vez = 0. As 3 em `Backlog` (S-49, S-50, S-51) não são importadas, como devem. **ok.**
- **Aceite por histórico só onde há `delivered_by` anterior ao contrato:** 39 de 39 têm `delivered_by` (30 com um commit, 9 com dois), todos de 2025-11-25 a 2026-01-19, anteriores ao commit do contrato `54fd54c` (2026-10-28 11:52:15 -03:00); zero sem `delivered_by`, zero posteriores, zero ausentes do git (dois juízes, `mjrp-ensuring-sdd` e `mjrp-writing-reqs`, contaram o mesmo). **ok no que a regra pede.** A fraqueza é outra: cinco histórias (S-30, S-31, S-32, S-34, S-38) citam commits que só mexem em documento, teste ou configuração (P1 abaixo, e a pergunta P-35).
- **O que o mapa do v0 mostra que não funciona virou issue de UAT, não entrega sem ressalva:** as 13 issues do mapa (UAT-01 a UAT-13) conferem no código, inclusive **excluir item do inventário (UAT-01)** e **desfazer/refazer (UAT-02)**; as UAT-14 a UAT-25 vêm da crítica de arquitetura. Nenhuma feature nem história afirma, sem ressalva, excluir do inventário nem desfazer/refazer. **Mas** duas coisas ficaram de fora do `uat.md` (H10, colar lista vazia chama `toast.warn`, que não existe; S8, o botão «Create Series» da tela vazia não navega) e quatro entregas continuam aceitas sem ressalva contra uma issue que as nega: S-04 (P0), S-37 e S-38 (UAT-12), e F01 («todas as séries», UAT-24).

## Nota por nota

Todas as notas aplicadas passam no script (a forma); o veredito de conteúdo é o do juiz do item.

| Nota | Veredito | O que falta |
|---|---|---|
| `vision@2` (CM-0029, 0047) | **fraca** | o campo Visão está vazio e a tela mostra «P-01» (certo: é do MJRP); o Objetivo (`VISION.md:19`) carrega a meta de curto prazo do Sprint 24 legado, que o ROADMAP tirou dos resultados |
| `roadmap@6` (CM-0002, 0017, 0025, 0041, 0045) | **fraca** | os 5 resultados sem Medida; faltam Quem sente (OUT-01, 02, 03, 05) e Problema (OUT-04, 05); o Problema de OUT-01 a 03 foi montado pelo agente, com fonte mas sem pergunta; o `docs/ROADMAP.md` antigo segue dizendo Sprint 21/24 como corrente |
| `releases@3` (CM-0003, 0046, 0078) | **fraca** | a descrição de REL-05 fala em «receitas» e nenhuma das 7 histórias de REL-05 carrega a troca (rascunho P-37) |
| `prd@2` (CM-0051, 0077) | **fraca** | EP-07 e EP-08 com ligação provisória do agente, e o comentário atribui ao `Prod_Vision:38-39` o que o documento não diz; EP-01 a EP-06 também derivados pelo agente, sem confirmação |
| `constitution@2` (CM-0030, 0048) | **fraca** | o Art. III manda bugs no `DEBUG_LOG.md` e a arquitetura em arquivo que o harness trocou por `uat.md` e `arch.md` (pergunta P-22); os limites de 150 e 200 linhas são texto novo do agente |
| `arch@3` (CM-0032, 0053, 0072) | **fraca** | traz inventário de defeitos e passo a passo de explorar `/api/debug/files`, contra o Art. III; os «Conserto» apontam para o relatório, não para UAT-14 a UAT-25 |
| `tech-stack@1` (CM-0071) | **sólida** | só polimento; segue `Draft` (a aprovação é do MJRP, P-25) |
| `data-model@2` (CM-0033, 0054) | **sólida** | só polimento (faltam `subtitle` e `description` da Playlist) |
| `adr-names@4` (CM-0012, 0024, 0076, 0085) | **sólida** | nenhum ponteiro velho sobrou fora do log; as 4 ADRs têm `# ADR-NNNN:` e status; ADR-0015 diz `APPROVED`, as outras `Accepted` |
| `behavior@2` (CM-0031, 0049) | **fraca** | `behavior.md:133` lista «Excluir» do inventário e `:108` «Open in Spotify» sem ressalva (UAT-01, UAT-09); o cabeçalho (`:21`) diz que o que não funciona vira story em Backlog, e virou issue de UAT; 16 caminhos de código não existem como escritos |
| `requirement-nodes@2` (CM-0037, 0067) | **fraca** (era errada até a releitura de 2026-10-29) | o P0 da S-04 fechou; segue: S-37 e S-38 sem a ressalva da UAT-12; S-15, S-12 e S-24 dizem que o defeito «está em outra story» que não existe |
| `product-structure@10` (CM-0019 a 0082) | só a forma | o script passa; o conteúdo dele é lido nos itens `roadmap`, `releases`, `prd`, `uat` e `feature-track` |
| `release-features@1` (CM-0074) | só a forma | idem |
| `contract-screen@1` (CM-0006) | só a forma | `screen: [public/]` em `.mjrp-project.yml:52` |
| `report-names@5` (CM-0016, 0043, 0059, 0060, 0065) | **sólida** | o parecer em `reports/harness-feedback/` tem nome fora da regra do sensor e já está em `conformance.asked` |
| `english-names@1` (CM-0013) | **fraca** | `docs/wiki/` só tem `index.md`: passa por vazio, e há decisões no log sem página de assunto |
| `record-shapes@2` (CM-0034, 0044) | **fraca** | F07 TASK-03 marcada feita contra um commit de configuração; F18 TASK-03 é só de documentos e testes |
| `memory-layer@2` (CM-0035, 0062) | **fraca** | `MEMORY.md:11` atribui ao MJRP «doctor completo só no fechamento» sem entrada no log, e o doctor completo já rodou às 12:33; o ponteiro das perguntas vai para fora do repositório |
| `arch-critique@1` (CM-0011) | só a forma | a crítica independente existe e os achados dela foram incorporados aos arquivos (juiz de arquitetura); 1 P0 de código (VT-06) segue como conserto aberto |
| `uat@3`, `feature-track@2`, `evidence-folder@4` (CM-0001, 0081, 0004, 0083, 0005, 0026, 0068, 0080) | **fraca** | ver as linhas dos itens abaixo |

## Item por item do catálogo

| Item | O que o item pede | O que existe no projeto | Forma (o script) | Conteúdo (quem julgou) |
|---|---|---|---|---|
| `uat@3` | `docs/specs/uat.md` com a descrição de cada issue em partes | 25 issues, partes separadas; «Aberta por: agente (conform 2026-10-28)» igual nas 25 (`uat.md`); H10 e S8 do mapa ficaram de fora | **ok** | **fraca** por `mjrp-ensuring-quality`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-ensuring-quality.md` |
| `roadmap@6` | resultados com Problema, Quem sente e Medida | `ROADMAP.md`, 5 resultados; medida em nenhum | **ok** | **fraca** por `mjrp-coaching-pm`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-coaching-pm.md` |
| `releases@3` | releases com histórias | `ROADMAP.md`, REL-01 a REL-05 com 8, 10, 7, 7 e 7 histórias | **ok** | **fraca** por `mjrp-coaching-pm`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-coaching-pm.md` |
| `feature-track@2` | features com spec, plan e tasks ligadas aos requisitos | `docs/specs/features/F01` a `F18` | **ok** | **fraca** por `mjrp-ensuring-sdd`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-ensuring-sdd.md` |
| `evidence-folder@4` | evidência de entrega onde a regra diz | `reports/evidence/F01` a `F18`, cada uma com `evidence.md` | **ok** | **fraca** por `mjrp-ensuring-quality` (o P0 da F04 fechou na releitura de 2026-10-29), arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-ensuring-quality.md` |
| `contract-screen@1` | o contrato diz onde mora a tela | `.mjrp-project.yml:52` `screen: [public/]` | **ok** | **só a forma** (sem juiz) |
| `visual-sensor@2` | `sensors.visual` no contrato | só o modelo comentado (`.mjrp-project.yml:57`); `config: web/visual.config.mjs` aponta pasta que não existe | **lacuna** (aviso até 2026-11-27) | **fraca** por `mjrp-ensuring-quality`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-ensuring-quality.md` |
| `info-arch@1` | `docs/specs/info-arch.md` | não existe | **lacuna** (aviso até 2026-11-27) | **sem artefato** (não julgado; o item está na carência e o arquivo não existe): o juiz de UX registra, na seção «Itens sem artefato» de `2026-10-28-mjrpalbumblender-v0-content-mjrp-critiquing-ux.md`, o que o arquivo ausente teria de trazer |
| `wireframes@1` | `design/wireframes/` | só `.gitkeep` | **lacuna** (aviso até 2026-11-27) | **sem artefato** (não julgado; o item está na carência e o arquivo não existe): o juiz de UX registra, na seção «Itens sem artefato» de `2026-10-28-mjrpalbumblender-v0-content-mjrp-critiquing-ux.md`, o que o arquivo ausente teria de trazer |
| `design-system@6` | `docs/specs/design-system.md` | não existe | **lacuna** (aviso até 2026-11-27) | **sem artefato** (não julgado; o item está na carência e o arquivo não existe): o juiz de UX registra, na seção «Itens sem artefato» de `2026-10-28-mjrpalbumblender-v0-content-mjrp-critiquing-ux.md`, o que o arquivo ausente teria de trazer |
| `arch-critique@1` | crítica independente da arquitetura | `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md` | **ok** | **só a forma** (sem juiz) |
| `adr-names@4` | ADRs com nome e cabeçalho do padrão | `docs/decisions/0015` a `0018` renomeadas | **ok** | **sólida** por `mjrp-auditing-docs`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-auditing-docs.md` |
| `english-names@1` | páginas da wiki com nome em inglês | `docs/wiki/index.md` e nada mais | **ok** | **fraca** por `mjrp-auditing-docs`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-auditing-docs.md` |
| `report-names@5` | relatórios com nome e `type:` do padrão | `reports/audits/`, `reports/evidence/`, `reports/harness-feedback/` | **ok** | **sólida** por `mjrp-auditing-docs`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-auditing-docs.md` |
| `project-palette@2` | `project_palette:` no contrato | a chave não existe | **lacuna** (só aviso, nunca vira erro) | **fraca** por `mjrp-critiquing-ux`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-critiquing-ux.md` |
| `product-structure@10` | a estrutura de produto que a tela lê | `ROADMAP.md`, PRD, requisitos, features, `uat.md` | **ok** | **só a forma** (sem juiz) |
| `vision@2` | `VISION.md` com propósito, objetivo e visão | `VISION.md`; Propósito de `Prod_Vision:11` | **ok** | **fraca** por `mjrp-coaching-pm`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-coaching-pm.md` |
| `constitution@2` | `docs/specs/constitution.md` | existe, sem colchete de modelo | **ok** | **fraca** por `mjrp-critiquing-architecture`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-critiquing-architecture.md` |
| `behavior@2` | `docs/specs/behavior.md` | existe, escrito do inventário do código | **ok** | **fraca** por `mjrp-writing-reqs`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-writing-reqs.md` |
| `arch@3` | `docs/specs/arch.md` | existe | **ok** | **fraca** por `mjrp-critiquing-architecture`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-critiquing-architecture.md` |
| `tech-stack@1` | `docs/specs/tech-stack.md` | existe, `Draft` | **ok** | **sólida** por `mjrp-critiquing-architecture`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-critiquing-architecture.md` |
| `data-model@2` | `docs/specs/data-model.md` | existe | **ok** | **sólida** por `mjrp-critiquing-architecture`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-critiquing-architecture.md` |
| `record-shapes@2` | plan, tasks e Test plan de cada feature na forma | 18 features | **ok** | **fraca** por `mjrp-ensuring-sdd`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-ensuring-sdd.md` |
| `memory-layer@2` | `MEMORY.md`, `## Now`, log | existem; log diz «não fechado» | **ok** | **fraca** por `mjrp-auditing-docs`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-auditing-docs.md` |
| `requirement-nodes@2` | um nó por requisito, com `id`, `type`, `status` | 44 nós (42 histórias e 2 requisitos não funcionais) | **ok** | **fraca** por `mjrp-writing-reqs` (era **errada** até a releitura de 2026-10-29, quando o P0 da S-04 fechou), arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-writing-reqs.md` |
| `info-arch-sections@1` | seções Protótipos aprovados, Flow e Content Map no `info-arch.md` | o `info-arch.md` não existe | **lacuna** (aviso até 2026-11-27) | **sem artefato** (não julgado; o item está na carência e o arquivo não existe): o juiz de UX registra, na seção «Itens sem artefato» de `2026-10-28-mjrpalbumblender-v0-content-mjrp-critiquing-ux.md`, o que o arquivo ausente teria de trazer |
| `prd@2` | `docs/specs/prd.md` com tabela de épicos e nós embutidos | tabela `Épico \| Serve`; os 44 nós embutidos, nenhum fora | **ok** | **fraca** por `mjrp-coaching-pm`, arquivo do juiz: `2026-10-28-mjrpalbumblender-v0-content-mjrp-coaching-pm.md` |
| `content-audit@5` | esta auditoria | este relatório | **lacuna** até este relatório ser commitado e o conform fechar (o `content_p0`, `avoidable_questions` e `bent_rules` precisam ir a 0) | **só a forma** (sem juiz) |
| `release-features@1` | toda release com feature | REL-01 a REL-05, uma ou mais features cada | **ok** | **só a forma** (sem juiz) |

Os achados vivem nos arquivos dos juízes (`[P0|P1|P2] <âncora> — <o que> — <teste Y/N> — <dono>`). Os dois P0 abertos:

- [P0 fechado 2026-10-29] `reports/evidence/F04/evidence.md:17` — a evidência cita `UserSyncService.test.js` como prova da migração do convidado para a conta e a UAT-12 diz que essa migração não acontece; o teste passa porque recebe `'guest'` à mão — dono: `mjrp-ensuring-quality` (juiz de qualidade).
- [P0 fechado 2026-10-29] `docs/specs/requirements/ep-01-album-series/S-04-browse-every-series-and-its-albums-in-the-library.md:17` — S-04 aceita sem ressalva, contra UAT-24 e UAT-06 — dono: `mjrp-writing-reqs` (juiz de requisitos).

Os P1 mais graves, de cada juiz, em uma linha:
- `mjrp-writing-reqs`: S-37 e S-38 sem a ressalva da UAT-12; `behavior.md:133` («Excluir») e `:108` («Open in Spotify») sem ressalva; o cabeçalho de `behavior.md:21` contradiz a decisão do MJRP (o que não funciona virou issue de UAT, não story em Backlog); S-15, S-12 e S-24 apontam para uma «outra story» que não existe.
- `mjrp-ensuring-quality`: «Aberta por: agente (conform 2026-10-28)» é igual nas 25 issues e não sai da evidência (UAT-14 a 25 vêm da crítica de arquitetura); `violates::` das UAT-14, 18, 19 e 20 cita só ADR ou PRINCIPLES; H10 e S8 sem issue; nenhum teste citado foi executado (o repositório está sem `node_modules`).
- `mjrp-ensuring-sdd`: nas 18 specs, «Open Questions: Nenhuma» manda para o «relatório do conform (pacote D1)», que não existe em `reports/`; F01 REQ-04 cita um teste que importa `public/js/stores/series.js`, que não existe; F18 REQ-02 e F07 REQ-02 só têm commit de documento ou de configuração.
- `mjrp-coaching-pm`: ver as linhas por item acima; os comentários do VISION e do ROADMAP citam um «relatório do pacote A» que não está no repositório.
- `mjrp-critiquing-ux` (nos itens sem artefato e na paleta): o design-system não existe e as fontes visuais não conversam (o guia diz `#FF6B00`, o CSS real tem `#f97316` e `#ff8800`); `tech-theme.css:44` usa `var(--tech-blue)`, que nunca é definida.
- `mjrp-critiquing-architecture`: o Art. III da constituição contradiz o uso do harness (P-22); o `arch.md` traz inventário de defeitos e passo a passo de explorar uma rota de depuração.
- `mjrp-auditing-docs`: `MEMORY.md:11` e o `docs/wiki/` quase vazio.

**Catálogo incompleto:** a listagem não imprimiu a linha; não se aplica.

## Processo

Os sete juízes rodaram em paralelo, em Sonnet, só leitura, com um arquivo cada; o `content_audit_check.py` lê esses arquivos (resultado da rodada em «Em aberto»). A executora fez 29 commits na `main` local, todos por `git`, sem push; 18 features e 25 issues de UAT estão no repositório; a entrada de fechamento do log diz «não fechado» (o juiz de documentos conferiu que ela não afirma mais do que o script confirma: 17 notas e 7 lacunas). `daily-checks/` e `data/` aparecem não rastreados na raiz do v0 (saída do doctor/`daily_checks.py` de 11:52 e 12:35; não são código, e a pasta `.mjrp/` e `_backups/` estão no `.gitignore`). Para este relatório a juíza B corrigiu, no texto das perguntas P-02 e P-33 (copiadas do rascunho da executora, na pasta de notas), duas afirmações sobre cor que o CSS real do v0 não sustenta (o juiz de UX achou); fora isso as perguntas vão como a executora as escreveu.

## Em aberto

- Depois da correção: os P1 e P2 dos sete juízes que a rodada não tocou (por exemplo o «Open Questions: Nenhuma» das 18 specs apontando para o «relatório do pacote D1» que não existe, o «Aberta por» igual nas 25 issues, o `behavior.md:133`/`:108`, o `MEMORY.md:11`, o F01 REQ-02 sem o limite de 20), ainda abertos nos arquivos dos juízes.
- A ADR-0018 segue `Proposed`, à espera do aceite técnico (via tech lead, não do MJRP); a P-34 ficou fechada só em parte: a regra responde «quando» (depois de 30/10), mas dispensar os itens de tela de vez continua sendo uma válvula do MJRP.
- O MJRP pediu para segurar as perguntas a ele por ora: nenhuma pergunta nova foi aberta na releitura, e as 34 que seguem na seção abaixo ficam registradas, sem envio.
- As questões em aberto do PRD ainda não têm número de P (a executora disse no rascunho); o conteúdo é do MJRP e o agente não podia redigir o texto sem a fonte: vão para a rodada de correção como perguntas P-NN novas.
- **O `content_audit_check.py` ainda reprova, por uma razão que se espera** (a dos 2 P0 abertos, `audit_p0_open`, acabou na releitura de 2026-10-29): os 4 itens de tela sem arquivo (`info-arch`, `info-arch-sections`, `wireframes`, `design-system`) pedem veredito de conteúdo ancorado em arquivo do próprio item, e esse arquivo não existe (`audit_row_missing`, `judge_file_invalid`). A segunda só some quando os arquivos nascerem (decisão do MJRP, P-33 e P-34): o juiz de UX não pode inventar âncora, e este relatório não finge veredito. O `harness-feedback` fica em «O que o harness faz com isto».
- Os itens de tela e a paleta esperam a decisão do MJRP (P-33, P-34); o conform não fecha enquanto o critério do passo 1 não chegar a exit 0 e enquanto os números do frontmatter não forem a 0. Pendência dita pelo juiz de qualidade: nenhum teste citado como evidência foi executado (falta `npm ci`).
- O push dos commits locais é do MJRP.

## Decidido pelo agente (revisável)

A executora registrou treze decisões de classe (a) no `docs/log.md`, cada uma com o sufixo «decidido pelo agente, revisável pelo MJRP»; esta tabela só as lista (a juíza B não as re-decidiu; os achados de conteúdo sobre elas estão acima).

| Decisão | Item | Deriva de (regra aprovada, arquivo e âncora) | Entrada do log |
|---|---|---|---|
| v0 entra no harness como brownfield em produção; o fechado nasce aceito | `memory-layer` | decisão do MJRP de 2026-10-28 e a regra de 2026-10-18 (`MEMORY.md ## Do Not Forget`) | `2026-10-28 11:56` |
| visão: campos citados da documentação; Visão e paleta ficam para o MJRP | `vision` | `docs/log.md#2026-10-28-1208` · «técnico/reversível» | `2026-10-28 12:08` |
| roadmap e releases tirados da documentação legada | `roadmap` | `docs/log.md#2026-10-28-1209` | `2026-10-28 12:09` |
| PRD: oito épicos de histórico; CM-0051 satisfeita pela forma atual | `prd` | `docs/log.md#2026-10-28-1209` | `2026-10-28 12:09` |
| constituição: artigos mantidos; divergência do código vira conserto, não emenda | `constitution` | a regra «a regra antes do código» | `2026-10-28 12:09` |
| arquitetura, stack e modelo de dados escritos do código | `arch` | `docs/log.md#2026-10-28-1209` · «técnico/reversível» | `2026-10-28 12:09` |
| ADRs 0015 a 0018 renomeadas; ponteiros varridos | `adr-names` | regra `adr-names@4` | `2026-10-28 12:09` |
| 39 histórias aceitas por histórico; o que não funciona virou história pendente | `requirement-nodes` | regra do MJRP de 2026-10-18 (o fechado antes do harness nasce aceito) | `2026-10-28 12:31` |
| comportamento transversal escrito do inventário do código | `behavior` | `docs/log.md#2026-10-28-1231` | `2026-10-28 12:31` |
| documentos de arquitetura corrigidos após a crítica independente | `arch-critique` | `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md` | `2026-10-28 12:32` |
| tela declarada e nomes de relatório | `contract-screen` | `.mjrp-project.yml:52` | `2026-10-28 12:32` |
| issues de UAT: o que não funciona vira issue na trilha do agente | `uat` | `docs/log.md#2026-10-28-1258` | `2026-10-28 12:58` |
| 18 features de histórico, cada história importada por uma | `feature-track` | `docs/log.md#2026-10-28-1302` | `2026-10-28 13:02` |
| notas de uat, trilha e evidência registradas | `evidence-folder` | `docs/log.md#2026-10-28-1303` | `2026-10-28 13:03` |
| sete perguntas evitáveis (P-26, 29, 30, 32, 34, 35, 36) decididas como classe (a), a P-36 sem dobrar a regra; UAT-26 a UAT-29 abertas | `uat` | `PRINCIPLES.md` §I.3 e §I.14; `loop.py:194`; regra de economia até 2026-10-30 | `2026-10-29 18:55` |
| histórias aceitas com defeito aberto apontam as issues; `delivered_by` de S-30, 31, 32, 34 e 38 refeito no git | `requirement-nodes` | regra do MJRP de 2026-10-18 (aceite por histórico) e `git merge-base --is-ancestor 54fd54c` | `2026-10-29 18:55` |

## Achados sobre as perguntas e as recomendações

A juíza B leu as 37 perguntas do rascunho da executora e as recomendações. Os sete primeiros achados são **pergunta evitável** (a classe verdadeira é (a): derivável de regra aprovada, ou técnica e reversível); o último é **regra dobrada**. Cada um entra na rodada de correção: o agente decide, corrige, registra em «Decidido pelo agente» e tira a pergunta.

- [P1 fechado 2026-10-29] pergunta evitável · P-26 — a ADR-0018 `Proposed`: a própria pergunta diz que a decisão é técnica e que a via é o aceitador técnico (a skill de aceite de decisões), não o MJRP; o agente não pode aceitar ADR por si, mas a pergunta deve ir a essa via, não ao MJRP — teste S/N: o MJRP precisa decidir? N — dono: a executora com o aceitador técnico.
- [P1 fechado 2026-10-29] pergunta evitável · P-29 — o `PRINCIPLES.md` §I.14 só admite credencial no cliente com o BYOK aprovado na constituição, e a constituição não o aprova: pela regra «a regra antes do código», o token do Spotify no `localStorage` é um defeito de código (Fix) e a constituição só muda se o MJRP emendá-la por conta própria — teste S/N: dá para responder da regra aprovada? S — dono: a executora.
- [P1 fechado 2026-10-29] pergunta evitável · P-30 — «há exceção para o P0 do VT-06?»: o `PRINCIPLES.md` §I.3 manda e a pergunta mesma recomenda «sem exceção»; sem exceção aprovada, o código é o defeito e vira item de conserto — teste S/N: dá para responder da regra aprovada? S — dono: a executora.
- [P1 fechado 2026-10-29] pergunta evitável · P-32 — o status `APPROVED` da ADR-0015 para `Accepted`: edição de uma palavra do cabeçalho, técnica e reversível — teste S/N: técnica e reversível? S — dono: a executora com o aceitador técnico.
- [P1 fechado 2026-10-29] pergunta evitável · P-34 — «quando entram os itens de tela?»: a resposta já está nas regras do MJRP (economia até 30/10; sensor visual não roda no fechado em produção; `MEMORY.md ## Do Not Forget`); a opção (a) recomendada repete a regra — teste S/N: dá para responder da regra aprovada? S — dono: a executora (dispensar o item de vez continua sendo do MJRP, e é outra pergunta).
- [P1 fechado 2026-10-29] pergunta evitável · P-35 — repontar o `delivered_by` de cinco histórias cujo commit citado é fraco: é correção de prova técnica e reversível (o juiz de SDD e o de requisitos a levantaram como P1); o MJRP não precisa decidir — teste S/N: técnica e reversível? S — dono: a executora (`mjrp-writing-reqs`).
- [P1 fechado 2026-10-29] pergunta evitável · P-36 — as 61 tasks fechadas sem `rounds::`: o próprio texto diz que é lacuna do harness, e lacuna de check se reporta ao harness (`harness-feedback`), nunca se pergunta ao MJRP do v0 — teste S/N: a resposta é do MJRP do v0? N — dono: a executora (entrada em `reports/harness-feedback/`).
- [P1 fechado 2026-10-29] regra dobrada · P-36 — a recomendação (a) «deixar sem `rounds::`» aceita que o `loop.py --check-tasks` reprovaria 61 tasks, porque «nada o roda hoje»: muda o resultado da regra porque o código (as tasks) faz diferente, sem mostrar que a regra está errada — teste S/N: muda a regra porque o artefato diverge, sem mostrar que a regra está errada? S — dono: a executora (julgar a regra primeiro: ela vale; então a pendência vira item de conserto ou parecer ao harness).

Também, como P2 (não contados): as perguntas P-14 e P-17 a P-23 (classe c) não trazem «— não:» nas opções (exceção só para medida, problema e quem sente); as linhas «(o que muda na tela …)» são genéricas; e a opção (a) de P-02 e de P-33 citava cores que o CSS não tem (corrigidas abaixo, ver «Processo»).

## Perguntas para o MJRP

### P-01 · item: vision · Visão (WHERE) do VISION.md
classe: c
por que o agente não podia: a doc não tem uma frase rotulada como horizonte; tem três candidatas de natureza diferente e escolher uma é decidir o produto
Qual destas é o horizonte do produto (sem recomendação: a visão é sua)? (o que muda na tela: a linha «Visão» do VISION.md passa a trazer a frase escolhida)
- a) «The Album Blender: A mixer that takes raw data (albums, AOTY ratings, Spotify popularity) and blends them into a coherent, balanced listening experience.» (Legado:295)
- b) «We are not a streaming platform. We are the intelligence layer that sits above them.» (Prod_Vision:13)
- c) a seção «Long-Term Vision» do legado: colaboração em séries, algoritmos avançados, sincronização entre plataformas, outros serviços (YouTube Music, Tidal), recomendações por IA (Legado:300-305)
- d) outra frase do MJRP

### P-02 · item: vision · Vibe: nome da paleta
classe: c
por que o agente não podia: a doc descreve cores e estilo, mas não nomeia uma paleta; nomear é decisão de design do MJRP
Que nome de paleta identifica a vibe do produto (sem recomendação: o nome é seu)? (o que muda na tela: o campo «Vibe» do VISION.md passa a trazer o nome)
- a) laranja `#FF6B00` do guia de estilo (o CSS real usa `#f97316` em `public/index.html:31` e `#ff8800` em `public/css/neon.css:5`; o `#FF6B00` só está no guia) como destaque; verde `#1DB954` (Spotify) e azul `#0EA5E9` («Incandescent Blue») por fonte de ranking (31_UI_Style_Guide.md, «Color Tokens»)
- b) «curated color palettes, micro-animations» (Constituição:6-7)
- c) nenhum nome de paleta existe na doc; o MJRP nomeia

### P-03 · item: roadmap · OUT-01 (mistura coerente e equilibrada) · Quem sente
classe: c
por que o agente não podia: a doc fala em «the user» em geral
O que a documentação diz sobre quem sente o problema do OUT-01 (sem recomendação: «quem sente» é seu)? (o que muda na tela: o OUT-01 do ROADMAP passa a nomear quem sente)
- a) «User Sovereignty: We empower the user…» (Prod_Vision:14)
- b) «I want to curate…», em quatro situações (Prod_Vision:26-34)
- c) Power User / Consumption (Prod_Vision:85-86)

### P-04 · item: roadmap · OUT-01 · Medida (hoje → alvo)
classe: c
por que o agente não podia: a doc descreve o resultado («coherent, balanced listening experience», Legado:295) sem medida
O que o registro diz sobre a medida do OUT-01 (sem recomendação: a medida é sua)? (o que muda na tela: o OUT-01 do ROADMAP passa a trazer hoje → alvo)
- a) «Duration Targeting… exact time windows (e.g., 'Max 2 Hours')» (README:58), citada como capacidade, não como medida
- b) nenhuma medida está escrita na documentação; o MJRP declara a medida

### P-05 · item: roadmap · OUT-02 (menu de mistura) · Quem sente
classe: c
por que o agente não podia: a doc não diz quem tem atrito com o menu
O que a documentação diz sobre quem sente o atrito do OUT-02 (sem recomendação: «quem sente» é seu)? (o que muda na tela: o OUT-02 do ROADMAP passa a nomear quem sente)
- a) «We are eliminating technical friction.» (Prod_Vision:56)
- b) Power User / Consumption (Prod_Vision:85-86)

### P-06 · item: roadmap · OUT-02 · Medida
classe: c
por que o agente não podia: não há medida na doc
O que o registro diz sobre a medida do OUT-02 (sem recomendação: a medida é sua)? (o que muda na tela: o OUT-02 do ROADMAP passa a trazer a medida)
- a) os parâmetros que o menu deve ter, «Ranking Logic», «Scope», «Constraints», «Output Format» (Prod_Vision:61-65): são requisitos, não medida
- b) nenhuma medida está escrita na documentação; o MJRP declara a medida

### P-07 · item: roadmap · OUT-03 (porta de entrada) · Quem sente
classe: c
por que o agente não podia: a doc nomeia as situações, não quem as vive
O que a documentação diz sobre quem vive as situações do OUT-03 (sem recomendação: «quem sente» é seu)? (o que muda na tela: o OUT-03 do ROADMAP passa a nomear quem sente)
- a) «I want to curate a specific set of albums.» (Prod_Vision:26)
- b) «…an Artist's discography.» (Prod_Vision:29)
- c) «…a specific Vibe/Genre.» (Prod_Vision:32)
- d) «…blend specific loose tracks/singles.» (Prod_Vision:34)
- e) «a broader audience» (Prod_Vision:21)

### P-08 · item: roadmap · OUT-03 · Medida
classe: c
por que o agente não podia: sem medida na doc. Fato do código (inventário do V1 §1.9): as rotas de artista, gênero e faixas são telas «Coming Soon»; só a série de álbuns existe de fato
O que o registro diz sobre a medida do OUT-03 (sem recomendação: a medida é sua)? (o que muda na tela: o OUT-03 do ROADMAP passa a trazer a medida)
- a) nenhuma medida está escrita na documentação (nada a citar)
- b) o MJRP declara a medida

### P-09 · item: roadmap · OUT-04 (computador e celular) · Problema
classe: c
por que o agente não podia: a doc diz o que se precisa, não o que dói
O que o registro diz sobre o problema do OUT-04 (sem recomendação: o problema é seu)? (o que muda na tela: o OUT-04 do ROADMAP passa a trazer o problema)
- a) «We need a robust experience on both Desktop (Power User) and Mobile (Consumption).» (Prod_Vision:82)
- b) «Comprehensive Mobile UX overhaul» (Legado:49, Sprint 21)
- c) «Resolve critical UX issues (ghost skeletons, deletions flashes)» (Legado:37, Sprint 21.5)

### P-10 · item: roadmap · OUT-04 · Medida
classe: c
por que o agente não podia: sem medida na doc
O que o registro diz sobre a medida do OUT-04 (sem recomendação: a medida é sua)? (o que muda na tela: o OUT-04 do ROADMAP passa a trazer a medida)
- a) «Write Once, Adapt Everywhere» (Prod_Vision:84), que é o princípio, não medida
- b) nenhuma medida está escrita na documentação; o MJRP declara a medida

### P-11 · item: roadmap · OUT-05 (Next, Sprint 22) · Problema
classe: c
por que o agente não podia: a doc dá só o objetivo do Sprint 22
O que o registro diz sobre o problema do OUT-05 (sem recomendação: o problema é seu)? (o que muda na tela: o OUT-05 do ROADMAP passa a trazer o problema)
- a) «Expand the blending experience with cross-series context and enhanced discovery tools.» (Legado:287)
- b) «Cross-Series Recipe Execution.» e «Recommendation Engine Integration.» (Legado:288-289)

### P-12 · item: roadmap · OUT-05 · Quem sente
classe: c
por que o agente não podia: sem quem na doc
O que a documentação diz sobre quem sente o problema do OUT-05 (sem recomendação: «quem sente» é seu)? (o que muda na tela: o OUT-05 do ROADMAP passa a nomear quem sente)
- a) «transcend algorithmic bubbles» (Prod_Vision:14)
- b) «a broader audience» (Prod_Vision:21)

### P-13 · item: roadmap · OUT-05 · Medida
classe: c
por que o agente não podia: sem medida na doc
O que o registro diz sobre a medida do OUT-05 (sem recomendação: a medida é sua)? (o que muda na tela: o OUT-05 do ROADMAP passa a trazer a medida)
- a) nenhuma medida está escrita na documentação (nada a citar)
- b) o MJRP declara a medida

### P-14 · item: roadmap · Horizonte dos quatro objetivos permanentes (OUT-01 a OUT-04)
classe: c
por que o agente não podia: a doc os lista como «Product Vision» sem horizonte; a prioridade entre resultados é do MJRP
Em que horizonte ficam OUT-01 a OUT-04? (o que muda na tela: os quatro cartões mudam de coluna no ROADMAP)
- a) Now, como está: 4 resultados em Now, abaixo do limite de aviso
- b) Next
- c) Later
- d) «Alcançados» para os que ele considera entregues pelos Sprints 1–23 (só o MJRP marca `achieved::`, com data, valor medido e aprendizado)

### P-15 · item: prd · A que resultado serve o Inventário (EP-07)
classe: c
por que o agente não podia: a doc chama o inventário de utilidade separada e nenhum resultado o cobre; ligar a um resultado existente ou criar um novo é decisão de produto. A colocação atual no PRD é provisória: decidida pelo agente, pendente do MJRP
A que resultado serve o épico do Inventário? Citações: «Inventory: Remains a separate utility for collectors to manage their 'Pool' of albums.» (Prod_Vision:38-39); «Inventory CRUD: Complete management of owned albums.» (Legado:245, Sprint 5). (o que muda na tela: o EP-07 passa a servir o resultado escolhido no PRD)
- a) OUT-03 «Começar a mistura por um álbum, um artista ou um gênero», como está — a reserva (pool) é onde o colecionador escolhe os álbuns que entram numa série, uma porta de entrada da mistura; é a ligação mais próxima do que a doc diz sobre o «Pool», sem criar resultado (Recomendado)
- b) OUT-01 «Ouvir uma mistura coerente e equilibrada…» — não: a doc diz que o inventário é separado do pipeline série → menu → playlist (Prod_Vision:36-39), então ele não participa da mistura em si
- c) nenhum resultado serve (restrição ou utilidade fora dos resultados) — não: o épico precisa servir exatamente um resultado e há stories entregues (R2) sem onde viver
- d) resultado novo para o colecionador (por exemplo, administrar o que possui) — não: seria inventar resultado que a doc não escreve; só faz sentido se o MJRP o declarar, com problema, quem sente e medida

### P-16 · item: prd · A que resultado servem o login com conta e guardar na nuvem (EP-08)
classe: c
por que o agente não podia: idem P-15. A colocação atual é provisória: decidida pelo agente, pendente do MJRP
A que resultado servem o login com conta e a nuvem? Citações: «Apple Sign-In: Configured via Firebase Auth.» e «Google Sign-In: Configured.» (Legado:236-237); «Firestore Persistence: Cloud sync for Albums, Series, and Playlists.» (Legado:244). (o que muda na tela: o EP-08 passa a servir o resultado escolhido no PRD)
- a) OUT-01 «Ouvir uma mistura coerente e equilibrada…», como está — o que o login e o Firestore guardam são as séries e as playlists, que são o insumo e o produto da mistura; é a ligação mais direta com o que a doc diz que o Firestore guarda, sem criar resultado (Recomendado)
- b) OUT-03 (porta de entrada) — não: conta e nuvem não ampliam por onde se começa a mistura; guardam o que já foi feito
- c) tratar como restrição (requisito não funcional de persistência) em vez de épico — não: login com Apple/Google e sincronização são capacidades que a pessoa usa (entrar, ter os dados em outro aparelho), não regra para todas as telas
- d) resultado novo (por exemplo, «ter meus dados onde eu entrar») — não: inventaria resultado que a doc não escreve

### P-17 · item: requirement-nodes · Testes ponta a ponta: quais fluxos, que ferramenta, que meta (NFR-01)
classe: c
por que o agente não podia: o Sprint 24 diz «End-to-End Testing (Cypress/Playwright)» e a constituição (Art. IV) diz «E2E Tests (Puppeteer)»; nenhuma documentação diz quais fluxos são «críticos» nem a meta de cobertura, e escolher ferramenta ou meta é conteúdo de produto e de arquitetura
Quais fluxos e que ferramenta valem para o NFR-01? (o que muda na tela: o NFR-01 deixa de ser rascunho e passa a trazer fluxos, ferramenta e meta)
- a) os quatro fluxos de EP-01 a EP-04 (montar série, misturar, revisar, exportar), com Playwright
- b) os mesmos fluxos com Puppeteer (o que a constituição já diz)
- c) outros fluxos ou ferramenta (diga quais)

### P-18 · item: requirement-nodes · Lighthouse: nota mínima e telas medidas (NFR-02)
classe: c
por que o agente não podia: o roadmap legado só diz «Performance Audit (Lighthouse)»; sem nota nem tela; a medida é do dono
Qual é a nota mínima do Lighthouse e que telas se medem? (o que muda na tela: o NFR-02 passa a trazer nota e telas, ou sai)
- a) nota mínima e telas: diga (uma por linha)
- b) só medir e registrar agora, sem nota mínima
- c) tirar o NFR (decisão de que desempenho não é restrição)

### P-19 · item: requirement-nodes · O que o «Discovery Mode» deve fazer (S-47)
classe: c
por que o agente não podia: o interruptor existe no menu de mistura e nenhum código o lê; a documentação não diz o efeito esperado (B6/B9 do inventário), e inventar a regra seria redigir produto
O que o «Discovery Mode» deve fazer? (o que muda na tela: a S-47 ganha critério, ou o interruptor sai do menu, ou a story fica parada)
- a) descrever o efeito (diga em uma frase)
- b) tirar o interruptor do menu até haver regra
- c) deixar a story em Backlog sem prazo

### P-20 · item: requirement-nodes · Séries por artista, gênero e faixas soltas (S-49 a S-51): entram na ordem?
classe: c
por que o agente não podia: a documentação descreve os quatro fluxos (Prod_Vision:26-34) mas o código só tem álbuns; a ordem e a release são do MJRP. As três stories estão em `Backlog`, sem release, em EP-01 (serve OUT-03)
As séries por artista, gênero e faixas soltas entram numa release? (o que muda na tela: as stories S-49 a S-51 mudam de release ou de épico)
- a) as três continuam Backlog sem release
- b) só a de artista entra numa release (diga qual)
- c) virar um épico novo de OUT-03 (S-49 a S-51 viram suas stories)

### P-21 · item: requirement-nodes · Telas que só abrem por endereço digitado: ranking do álbum, ranking consolidado e migração de dados (S-52, S-53)
classe: c
por que o agente não podia: as três funcionam, mas nenhum link do app leva a elas; se são capacidade do produto ou resto de obra é decisão do dono
O que fazer com as três telas sem link? (o que muda na tela: o menu ganha ou não os links, e as stories S-52 e S-53 mudam de estado)
- a) ligar as três ao menu (as stories S-52 e S-53 ficam, em Backlog)
- b) aposentar o ranking de álbum e o consolidado; ligar só a migração
- c) aposentar as três

### P-22 · item: constitution · DEBUG_LOG.md ou uat.md/log? (Art. III)
classe: c
por que o agente não podia: o Art. III exige `docs/debug/DEBUG_LOG.md` (4.544 linhas) como único lugar de bugs, e o harness registra bugs no `uat.md` e no `docs/log.md`; só o MJRP emenda a constituição (Governance)
Onde os bugs são registrados? (o que muda na tela: o Art. III da constituição e o lugar onde os bugs aparecem)
- a) emendar o Art. III: bugs passam a ir para `uat.md`/`log.md`; o DEBUG_LOG vai para `_archive/`
- b) manter o DEBUG_LOG e abrir os itens também no `uat.md`
- c) manter como está

### P-23 · item: requirement-nodes · Escrever um NFR de acesso e segurança dos dados?
classe: c
por que o agente não podia: as regras do Firestore abertas e o servidor sem autenticação não violam hoje nenhum artigo específico (a constituição só tem «Operational Excellence», Art. V); a regra «só o dono lê e escreve o que é dele» seria uma restrição nova, e restrição nova é dele
Escreve-se um NFR de acesso e segurança dos dados? (o que muda na tela: um NFR novo entra no PRD, ou a segurança fica como Fix do Art. V)
- a) sim: NFR «cada pessoa só lê e escreve os próprios dados; o servidor exige conta» (o agente redige, ele aprova)
- b) não: ficam como Fix do Art. V
- c) decidir depois da triagem de riscos (PRD, Candidatos)

### P-24 · item: constitution · Token de serviço de discos escrito em dois scripts do repositório
classe: b
por que o agente não podia: é um segredo que está no histórico do git (`scripts/generate-dataset.js:8`, `scripts/fetch-missing-artists.js:12`); girar o token é ação do MJRP no serviço, e o agente não manuseia nem copia o valor
O token do serviço de discos já foi girado? (o que muda na tela: o Fix do segredo abre com ou sem a ação de girar o token)
- a) girar o token e abrir o Fix para ler de variável de ambiente (Recomendado)
- b) o token já não vale; só abrir o Fix
- c) deixar

### P-25 · item: tech-stack · Aprovar o tech-stack.md (Draft)
classe: b
por que o agente não podia: a aprovação (`Aprovado pelo MJRP em AAAA-MM-DD`) é dele; o agente escreve o rascunho, não o aprova. A linha `status: Draft` é a verdadeira até lá
O `tech-stack.md` está aprovado? (o que muda na tela: o `status: Draft` do `tech-stack.md` sai, ou fica até a crítica de arquitetura)
- a) aprovar como está — a tabela é só leitura de lockfile e manifestos; a coluna Decisão `—` é um sinal, não um erro (Recomendado)
- b) aprovar depois de pedir ADR para alguma tecnologia (diga qual)
- c) deixar Draft até a crítica de arquitetura (CM-0011) ler os três arquivos

### P-27 · item: arch · Quem escreve em /albums e em spotify_enrichment
classe: b
Quem pode escrever em `/albums` e em `spotify_enrichment`? Hoje as regras (`firestore.rules:42-43` e `:49-51`) aceitam qualquer login, e `AuthService.js:58` faz `signInAnonymously` para todo visitante; o ranking por usuário está aberto até sem login (`firestore.rules:35`, `if true`). É decisão de modelo de autorização do produto; o juiz recomenda (b) ou (a). (o que muda na tela: o item de conserto das regras do Firestore passa a ter a regra-alvo escrita)
- a) só o servidor (o Cloud Run passaria a gravar; hoje não toca o Firestore)
- b) só o dono do dado, por `uid`
- c) manter global e aberto a qualquer login, com o risco aceito por escrito

### P-28 · item: data-model · Teto de 20 séries
classe: b
O teto de 20 séries (`SeriesService.js:140-143`, `findAll({ orderBy: ['updatedAt','desc'], limit: 20 })`) é decisão de produto? Hoje quem tem 21 séries deixa de ver a 21ª, sem aviso. (o que muda na tela: o item de conserto da lista de séries ganha o comportamento-alvo)
- a) paginar
- b) subir o teto e documentar
- c) manter 20 e sinalizar na tela

### P-31 · item: tech-stack · Qual receita implantou o backend em produção
classe: b
Qual receita implantou o backend em produção? As duas divergem: `cloudbuild.yaml` não copia `config/` nem marca `shared/` como ESM (o contêiner ficaria sem `prompts.json` e o `import()` de `shared/` falharia), e `scripts/deploy-backend.sh` faz as duas coisas; o relatório não sabe qual gerou a produção atual. São fatos que só o MJRP tem. (o que muda na tela: o `arch.md` e o `tech-stack.md` passam a dizer qual receita vale)
- a) `cloudbuild.yaml`
- b) `scripts/deploy-backend.sh`
- c) outra via (diga qual)

Seguimento (sem opções): o projeto Firebase vivo é de fato `mjrp-playlist-generator`? O código aponta para ele (`firebase-config.js:3-10`, `.firebaserc`, `scripts/deploy-backend.sh`), mas o repositório não prova.

### P-33 · item: project-palette · Par de paletas que identifica o projeto no portfólio
classe: c
por que o agente não podia: a cor do projeto no portfólio é um par da biblioteca de paletas declarado no contrato (`project_palette: {light, dark}`), e nenhuma regra aprovada escolhe o par do v0; o v0 só tem tema escuro neon (`public/css/neon.css`: ciano `#00f3ff`, laranja `#ff8800`, verde `#00ff9d`)
Qual par da biblioteca (`docs/wiki/harness/palette-library.md`) identifica o projeto no portfólio? (o que muda na tela: o `project_palette` do contrato e a cor do projeto no Control Center)
- a) só escuro, D3 Cyberpunk Neon (primário `#FF2E88`, destaque `#00E5FF`, fundo `#05050A`) — é a paleta neon escura da biblioteca; o CSS do app usa ciano `#00f3ff`, laranja `#ff8800` e verde `#00ff9d` (`public/css/neon.css:4-6`), que não são as cores do D3 (Recomendado)
- b) só escuro, D1 Moderna / Tech (primário `#7B5CFA`, destaque `#2FE6D6`, fundo `#0E0E16`) — não: o primário roxo não existe no tema atual do app (ciano, laranja, verde)
- c) par claro + escuro (diga qual: L1–L8 e D1–D5) — não: o v0 só tem tema escuro, então uma paleta clara não identifica nada do app hoje

### P-37 · item: product-structure · A troca «flavor → recipe» (Sprint 17.9, ADR-0015) não está em nenhuma história entregue
classe: c
por que o agente não podia: criar história nova para uma release entregue muda o que o MJRP aprovou.
A descrição de REL-05 fala em «receitas», mas nenhuma história Done de REL-05 carrega a troca de nome; só o «Hoje» de S-10 (REL-03) a cita. Propor uma história? (o que muda na tela: REL-05 ganha uma história `Backlog` marcada «proposta pelo agente»)
- a) deixar (Recomendado)
- b) propor uma história de REL-05 — não: a troca de nome já está na ADR-0015 e no código, a história só repetiria

### P-38 · item: uat · Clear Cache, itens «Soon» no menu do celular e reordenar álbuns na série: defeito ou ainda não existe?
classe: c
por que o agente não podia: o mapa do v0 e o código não dizem se são defeito, funcionalidade prevista ou resto de obra; classificar é decisão de produto
Os três pontos entram no `uat.md` como issue, ou ficam fora? (o que muda na tela: o `uat.md` ganha ou não três issues)
- a) abrir uma issue de UAT para cada um (Recomendado) — o que o menu mostra e não faz é o que o `uat.md` registra
- b) abrir só para o que o código mostra quebrado — não: deixa o MJRP sem saber dos «Soon» que a pessoa vê
- c) deixar fora, são funcionalidade futura — não: a pessoa vê o botão hoje

### P-39 · item: tech-stack · O Tailwind carregado em `public/index.html` foi uma decisão sua?
classe: b
por que o agente não podia: é um fato que só o MJRP tem (se pediu a troca); a divergência com o Art. II da constituição está registrada (UAT-25)
O Tailwind em `public/index.html` foi pedido por você? (o que muda na tela: a coluna Decisão do Tailwind no `tech-stack.md` cita uma ADR, ou a UAT-25 segue como conserto)
- a) sim, foi pedido — o agente abre a ADR retroativa
- b) não, foi uma entrada do código — a UAT-25 segue como conserto do Art. II
- c) não sei — a UAT-25 segue como conserto e a pergunta fica aberta

### P-40 · item: constitution · Os limites de 150 e 200 linhas por arquivo na constituição
classe: c
por que o agente não podia: o juiz de arquitetura mostrou que esses números são texto novo escrito pelo agente (não vêm da constituição aprovada); só o MJRP emenda a constituição
Os limites de 150 e 200 linhas ficam na constituição? (o que muda na tela: o artigo correspondente da constituição)
- a) ficam, com a aprovação dele registrada (Recomendado) — são a regra que o agente aplicou ao ler o código
- b) saem; a constituição volta ao texto que o MJRP aprovou — não: perde um limite que o código já respeita em parte
- c) outros limites (diga quais)

### P-41 · item: behavior · Os exemplos de `behavior.md` valem como critério de aceite?
classe: c
por que o agente não podia: o cabeçalho (`behavior.md:20-22`) diz que os exemplos foram «julgados pelo uso em produção» e «decididos pelo agente»; julgar que o uso em produção basta como critério é do MJRP
O comportamento descrito no `behavior.md` vale como critério, com as ressalvas de UAT, ou os exemplos precisam da sua leitura? (o que muda na tela: o cabeçalho do `behavior.md` e o estado dos exemplos)
- a) vale, com a ressalva da UAT em cada exemplo que o mapa nega (Recomendado) — o texto sai do uso real e a UAT diz onde falha
- b) você lê os exemplos um a um — não: gasta o uso que o conform quis poupar
- c) só vale o que a UAT confirmar — não: deixaria o `behavior.md` quase vazio

## O que o harness faz com isto

- `content-audit`: o script recusa o veredito de conteúdo de um item sem arquivo (não há âncora possível), mas a auditoria não pode ignorar a tela que falta; o item sem artefato dentro da carência deveria ter a linha «sem artefato» aceita pelo `content_audit_check.py`. Vai ao harness como `harness-feedback`.
- `memory-layer`/`english-names`: os dois checks passam por vazio (a wiki com só `index.md`; o `## Ways of Working` vazio). Já vai ao harness no parecer da executora (`reports/harness-feedback/2026-10-28-mjrpalbumblender-v0-checks-pass-untouched-templates.md`): modelo sem preencher passa na forma.
- `evidence-folder`/`record-shapes`: a forma confere que o teste existe e que o commit existe, não que ele prova o que o requisito diz (o P0 do F04). A releitura de uma evidência é do juiz de qualidade; um sinal de «teste que recebe o valor à mão» não é de script.
- `requirement-nodes`/`uat`: nenhum check cruza um nó aceito sem ressalva com uma issue de UAT que o contradiz (o P0 da S-04); o grafo sai VERDE com a S-04 aceita sem ressalva.
- `rounds::` em tasks de histórico legado (P-36): o harness decide se há exceção para o histórico legado; é parecer, não pergunta ao MJRP do v0.
