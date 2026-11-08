---
title: Governança de git
aliases: [git-governance, governança de git, conventional commits, convenção de commit, branching, tags, integração, integrador, trem de merge, merge train]
summary: como se commita, ramifica, integra e marca versão num projeto do harness — tipos e formato do commit, os commits de cada etapa do Delivery, o ramo por feature, a integração (a sessão integradora, os trens, o juiz por lote e o portão do pre-merge-commit) e suas condições, tags, brownfield, e o que os hooks exigem
tags: [kernel, git, processo]
status: firme
atualizado: 2026-11-04
fontes: [conventionalcommits.org, mjrp-deployer (aposentada, S-76), 1999-fowler-refactoring]
---
<!-- kernel do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

**Regra master** (MJRP, 2026-11-05 09:11): se o MJRP pedir para quebrar uma regra, todo agente aceita, inclusive os juízes: diz o que quebra, segue e registra no log com as palavras dele. Não alcança o que a máquina recusa (hook, Touch ID, classificador), que volta a ele sem contorno.

## Definition
**Governança de git** é o conjunto de regras que faz o histórico de um projeto ser legível por quem vem depois —
humano ou agente: cada commit diz o tipo da mudança e o porquê, os estágios do SDD deixam marca no histórico, e
o que é estável fica separado do que está em curso. Vale para todo projeto do harness; as skills que commitam
(`mjrp-implementing-tasks`, `mjrp-debugging`, `mjrp-specifying-sdd-artifacts`) seguem esta página. No loop Delivery
([[pdlc-loops]] §5), cada feature vive num ramo e volta à `main` pela integração: uma sessão integradora a junta, em trem,
quando o verificador passa e o juiz do lote avalia.

## Details

**Prioritário do MJRP — feature e requisito nascem na `main`.** Uma feature nova nasce na `main` (a pasta da feature com
spec, plan e tasks em esboço, com a via e o tipo declarados — `lane` e `solution_type` — e, num conserto, a issue que ela corrige) e um requisito novo nasce embutido no `prd.md`, na
`main`, no momento em que é mencionado — antes de qualquer ramo, protótipo ou implementação. O ramo vem depois e completa.

### Tipos de commit
| Tipo | Quando | Exemplo |
|---|---|---|
| `feat` | funcionalidade nova | `feat: add book card component with cover grid` |
| `fix` | correção de defeito | `fix: resolve filter reset on page navigation` |
| `docs` | documentação e specs | `docs: complete specify stage for bookshelf` |
| `refactor` | muda o código sem mudar o comportamento | `refactor: extract API calls into shared service` |
| `vibe` | ajuste estético de UI/UX | `vibe: adjust card shadows and hover transitions` |
| `chore` | manutenção (dependências, configs, CI) | `chore: update Next.js to 15.2` |
| `test` | testes novos ou atualizados | `test: add unit tests for BookCard component` |

### Formato da mensagem
- `<tipo>: <descrição curta no imperativo>` + corpo opcional (o **porquê**, não o quê) + rodapé opcional (referências,
  breaking changes).
- Imperativo ("add", não "added"/"adds"), minúscula depois do prefixo, sem ponto final, assunto ≤ 72 caracteres.
- O diff mostra **o que** mudou; o corpo explica **por quê**. **Um tipo por commit.**
- **O fix vai separado da limpeza que ele inspirou:** primeiro `fix:`, depois `refactor:` ou `chore:` no seu próprio
  commit. Misturados, reverter a limpeza leva o fix junto, e a revisão não sabe qual linha corrigiu o defeito.

### Commits das etapas do Delivery
| Etapa concluída | Commit |
|---|---|
| Specify | `docs: complete specify stage for <feature>` |
| Plan | `docs: complete plan stage for <feature>` |
| Tasks | `docs: generate tasks for <feature>` |
| Implement | `feat: implement <descrição>` (cita a task) |
| Escalada ao «Pronto para construir» (a spec estava errada) | `docs: revise <stage> for <feature> — requirement change` |
| Cascata de documentação | `docs: complete cascade for <milestone>` |
| Rodada de UAT | `docs: uat round <n> for <feature>` |

### Ramos e a evidência
- **`main`**: estável, implantável. **Não há `dev`:** a feature sai de `main` e volta a `main` por PR.
- **Um ramo por feature ou fix, com o número dela no nome** (`branch-convention@2`): `claude/fNN-<slug>` (o worktree de uma sessão;
  `claude/fNN-fMM-<slug>` leva várias), `feat/fNN-<slug>`, `fix/fNN-<slug>` — ex.: `claude/f132-branch-name-gate`,
  `fix/f41-cover-loading`. O board só enxerga o trabalho de um ramo por esse nome; com outro, o card fica parado enquanto a
  feature anda. Sem feature, não há ramo de trabalho: crie a feature no board, na `main`, antes. Fora da convenção, e de
  propósito, só a `main`, `wip/` (rascunho), `archive/` (guarda) e `integrate/` (o trem do integrador).
- **O ramo entregue leva a evidência:** os requisitos cobertos (REQ-IDs), o verificador verde (testes, sensores, grafo sem
  contradição), o link da spec e o relatório do juiz independente. O agente não altera o verificador no ramo que ele verifica.

### O integrador — só ele escreve na `main`
- **Uma sessão integradora por vez** escreve na `main` (skill `mjrp-integrating-branches`). As sessões de página — as que
  implementam, corrigem ou escrevem uma feature — trabalham no próprio ramo e no próprio worktree, terminam com o relatório
  do juiz independente e **não mergeiam**, nem a própria feature. O pedido de merge vira ramo entregue.
- **Commitar no próprio ramo e entregar à integração não se pergunta ao MJRP** (a feature F171, «o MJRP é o juiz final», e a issue UAT-477): é o caminho da feature, não uma decisão dele. Num projeto com uma só sessão orquestradora, ela é também a integradora: junta o próprio ramo pelo trem, quando o verificador passa, sem pedir a ele: é a única exceção ao «sessões de página não mergeiam». O juiz do lote e o Touch ID onde o portão pede seguem a seção de integração.
- **O trem:** o integrador abre `integrate/<lote>-onto-main`, junta cada ramo com `--no-ff`, regenera os derivados, chama
  **um juiz por lote** (nunca o próprio integrador) e só então mergeia o ramo de integração na `main`. As regras de
  conflito por arquivo e a renumeração de UAT estão na skill; a mecânica, em `mjrp-scripts/merge_train.py`.
- **Logs e memória:** o log se une por entrada, mais nova primeiro (o driver `mjrp-log`, ou `merge_train.py log-union`), e o
  `## Now` do `MEMORY.md` junta o que os dois lados acrescentaram a um bloco (o driver `mjrp-memory`). O `merge=union` do git
  **não** serve: guarda as linhas e perde a ordem das datas. Os drivers só agem com as duas peças: a linha do `.gitattributes`
  que liga o arquivo (versionada; o refresh do kernel a escreve) e a configuração do clone (`merge_train.py install-driver`,
  que só diz «instalado» quando o `git check-attr` confirma a ligação). O I5 do doctor cobra a ligação.
- **Id de UAT:** `merge_train.py next-uat-id --reserve` (main + ramos abertos + reservas dos worktrees). Se mesmo assim
  colidir, o integrador renumera o segundo e abre uma linha NOVA no log — entrada antiga nunca se edita.
- **Merge aberto de outra sessão:** o `commit-msg` avisa (nunca bloqueia) quando há `MERGE_HEAD` e o commit não é o merge.

### A integração
- **O merge é do integrador**, quando o verificador passa (exit 0) e o juiz do lote avalia — nunca pelo auto-relato. Merge com
  commit de merge (`--no-ff`): os commits de cada etapa ficam no histórico, e reverter a feature é reverter um commit.
  O avanço rápido não faz commit de merge e **nenhum hook roda**: no projeto sem trem, onde o `git merge` é a única porta, as
  travas do fecho do `pre-merge-commit` (o passo retroativo e a forma do SDD) só valem com `--no-ff`.
- **O que a integração quebrar** volta à sessão dona do ramo; o integrador não conserta código de feature, só conflito mecânico,
  derivado regenerado e id renumerado. Em último caso, `git revert` do merge enquanto a dona corrige.
- **O portão visual:** o hook `pre-merge-commit` recusa o merge de ramo que mudou tela sem relatório de reconferência avaliado e
  sem P0 ([[pdlc-loops]] §5); na via rápida, sem relatório, o próprio merge pede o Touch ID do MJRP, que é o veredito (§2, F61);
  a saída (`VISUAL_RECHECK_SKIP`, `--no-verify`) é do humano, nunca do integrador.
- **O humano decide, não executa**, só quando pede ou quando há risco de impacto financeiro ou de negócio (apagar ou
  quebrar algo e perder o cliente). Toda integração aparece no Control Center. O aceite da feature é outro ato, o «Aceite»
  dele ([[pdlc-loops]] §6).
- **Pré-condições da integração autônoma:** tudo versionado, rollback possível (o revert do merge) e backup recorrente do
  repositório. **O backup** é uma cópia diária de todos os projetos (ADR-0024): um `.tar.gz` por dia em
  `_MJRP-BCKPS/daily/`, com o histórico de cada repositório num `git bundle --all` verificado e a pasta de trabalho
  (inclusive o que não tem commit); dois arquivos ficam, relidos antes de valer, e restaura com
  `python3 mjrp-scripts/daily_backup.py --restore-test` (o teste) ou abrindo o arquivo e `git clone <arquivo>.bundle`. Quem
  grava é um agendamento do macOS (`daily_backup.py`, às 07:00); o doctor reprova quando a última cópia passa de 24 h, e o
  MJRP move o arquivo para fora do Mac e o registra (`--mark-moved`: em `daily/` fica só o marcador, ADR-0030) e o leva ao disco externo, à mão. Entre uma cópia e outra o que protege é o git (o histórico e o reflog) e o
  GitHub até o último push. **O push é do humano** (`git push origin main`): não há PR remoto —
  o agente trabalha no ramo, roda o verificador e o integrador faz o merge local em `main`.
- **«Só o MJRP dá push, a `main` fica local» é a estratégia de entrega do harness** (que não tem site no ar) **e o padrão de um projeto até ele
  escrever a dele.** Um projeto com preview e produção não herda esse desenho: ele escreve, na seção `## Delivery strategy` do `docs/specs/arch.md`,
  que ramos existem, o que gera preview, o que vai a produção, quem envia cada um, o que se confere em cada etapa, como se volta atrás e se o
  preview usa as credenciais e os dados de produção — ou uma linha «Sem produção: …». O bootstrap pergunta se ela existe e, se não, propõe
  (`mjrp-pdlc-bootstrap`, `reference/delivery-strategy.md`), marcada como proposta até o MJRP confirmar; o juiz é `delivery_strategy_check.py`
  (item `delivery-strategy`, CM-0111). A trava `human_valves_guard.py` não muda: o push continua sendo do humano em qualquer estratégia.
- **Isolamento:** um worktree por sessão de página; a trava de sessão avisa quando há outra no repositório.

### Tags
- Adoção do harness: `v0-harness-adoption` (brownfield) · marcos: `v1.0`, `v1.1` · sprints: `sprint-01-complete`.
- O próprio harness: `harness-before-loop` marca o estado antes do PDLC em loops; `v0.0`, o resultado da migração — toda
  mudança de núcleo ou de PDLC parte dela.
- `git tag -a v1.0 -m "First stable release"`.

### Brownfield
1. Nunca reescrever (rebase/squash) o histórico existente.
2. As convenções valem do commit de adoção em diante.
3. Marcar a adoção com a tag.
4. Branches existentes ficam até o merge natural; um `dev` existente fecha no próximo merge em `main` e não recebe
   feature nova.

### O que se apaga: as quatro classes e o `_backups/`
(ADR-0023.) O que não se recupera nunca se apaga; o que se recupera tem dono e teto. A classe de um caminho sai de uma função
só, `_safe.classify` (as regras são as do projeto que contém o caminho, no `structure_rules.json`):

| Classe | O que é | Como sai |
|---|---|---|
| **1 · Insubstituível** | fora do git e fora da lista de derivados, ou a edição ainda sem commit | não se apaga; `python3 mjrp-scripts/_safe.py retire <caminho>` o move para o `_backups/` |
| **2 · Versionado** | o git o rastreia e está commitado | por commit (`git rm`), nunca por `rm` |
| **3 · Derivado** | declarado em `derived` (ou um worktree mesclado, limpo, sem trava, sem ignorado fora de `derived`) | `python3 mjrp-scripts/_safe.py discard <caminho>`: quem cria, apaga |
| **4 · Rotativo** | declarado em `rotating` | o dono sobrescreve e poda; ninguém mais remove |

O `discard` é o único caminho para remover: recusa as classes 1, 2 e 4 dizendo por quê, e sai 1 (com o motivo) se a ponte não tem
a permissão de apagar. **O `_backups/` é a rede contra engano do agente, não backup:** mora no mesmo disco, tem teto de 30 dias
e 1 GB, que o `_safe` aplica sozinho depois de cada cópia (só as cópias com o carimbo dele, as mais velhas primeiro, nunca a que
acabou de fazer; o W18 avisa se ainda assim passar), e o `README.md` dentro dele diz o mesmo. O backup que sobrevive ao disco é outro (a cópia diária levada
ao disco externo e o GitHub até o último push). Cada mecanismo que grava fora do versionamento declara o teto total e o dono em
`structure_rules.json → budgets`, e o W18 do doctor os mede. O worktree mesclado e limpo sai no fim do trem, pelo integrador:
`python3 mjrp-scripts/merge_train.py clean-worktrees --apply` (cada um por `_safe.py discard`; o que não está nesse estado fica, com o motivo);
o `merge_train.py merge` que cai na `main` roda isso por si. Antes de julgar, a limpeza solta o `.mjrp/` de uma sessão encerrada e move as
cópias carimbadas do `_backups/` do worktree para o `_backups/` do checkout principal (`_safe.release_worktree`); o link `node_modules` casa a regra de
derivado; e o W18 mede o `.claude/worktrees/` inteiro contra 10 GB, seja qual for a classe de cada um (F120). O rastro que uma ferramenta
reescreve também não segura o worktree mesclado (F207): o arquivo rastreado declarado em `structure_rules.json → rewritten_traces` (o
`daily-checks/sensor-*.md` do doctor, o `web/dist/` de um ramo anterior à F57) com mudança só no disco volta ao último commit pelo
`_safe.restore`, com a edição guardada no `_backups/` do principal, e o não rastreado que `derived` cobre sai como classe 3; mudança no
índice, edição de outro arquivo e arquivo novo não declarado continuam segurando. Nos filhos vale o mesmo (o build do Next entra nas regras), e
todo o `_backups/` do worktree que o git não versiona vai para o do principal, com o nome do worktree; o versionado fica, e a poda nunca o
toca. Mesclado não é abandonado
(F123): o worktree sem commit próprio fica até 7 dias parado, e o com arquivo mexido na última hora fica, na limpeza automática e na manual.

**Para o agente é mecanismo, não pedido** (Claude Code): o hook `PreToolUse(Bash)` `deletion_guard.py` recusa `rm`, `find -delete`,
`rmtree` de um caminho literal num programa em linha (o que o programa calcula em execução passa: é a porta do script), `git worktree remove` e `git branch -D`, e `git clean`, `git reset --hard`, `git checkout --` e
`git restore` quando há edição sem commit ao alcance, se o alvo não é derivado ou não se resolve (uma variável, `$(...)`), e a
mensagem aponta o `discard` ou o `retire`. Só a posição de comando conta: `echo rm -r x` e uma mensagem de commit que cita `git
clean` passam. Se o próprio hook falha, sai 0 com «nao avaliou». Portas que ele não cobre: o script que remove (o Python com
`rmtree`), o alias, o `git stash drop` e as outras plataformas (Codex, Gemini, o Cowork).

### O que os hooks exigem
- **`commit-msg`:** todo commit traz uma entrada nova no `docs/log.md` (o registro da sessão) — isento só o derivado, o
  merge, o script declarado e o arquivo que carrega o próprio histórico (`mjrp_harness.self_logged`, com item novo no
  histórico dentro dele; [[memory-architecture]]); o commit que toca mais de um projeto (a raiz e `apps/<app>/`) deve
  a entrada ao log do projeto **dono** — a raiz se tocar um dos `log_owner.root_paths` do contrato dela, senão o projeto
  com mais arquivos tocados, empate para a raiz —, e os outros ficam dispensados; e todo commit que traz
  versão nova ou mudada em `design/inception/<name>-vN.html` traz o `info-arch.md` e os wireframes de todas as telas da
  versão — o wireframe regenerado idêntico ao do HEAD não aparece no índice e conta como refeito quando o arquivo no disco
  é mais novo que o protótipo (F111, UAT-387); o trailer `Prototype-regenerated-identical:` é a marca da própria checagem, e o
  `commit-msg` recusa o que ela não escreveu (com `Prototype-sync: skip`, ou nomeando protótipo fora do índice; F117, UAT-394). Ir por cima (`--no-verify`, ou o trailer `Prototype-sync: skip — <motivo>`)
  é decisão do humano, nunca do agente.
- **`pre-commit`:** a estrutura por natureza (inclusive `design/wireframes/` e `design/diagrams/<tema>/ep-NN/`) e as
  contradições do grafo de requisitos nos nós tocados.
- **`pre-commit` e o nome do ramo (F132, UAT-411):** o commit num ramo de trabalho fora da `branch-convention@2` é recusado, com o
  comando exato que o renomeia (`git branch -m claude/fNN-<slug>`); passam a `main`, `wip/`, `archive/`, `integrate/`, o HEAD destacado e o
  rebase em curso. A convenção não é copiada: o `branch_name_check.py` a lê do `rules/delivery.py` do Control Center, o mesmo que o board usa
  (no filho, do harness achado pelo `harness_root:` do contrato); sem ela, num ramo de trabalho, é «não avaliável», nunca passe.
- **`pre-commit` e a mudança de copy (F158, S-208):** na linha principal, o commit que muda uma linha de `Tipo` `copy` do `uat.md` só toca `content/copy/*.json`, o `uat.md` e o `docs/log.md`, e dentro do JSON só o `pt` e o `en` de entradas que existem, que continuam texto, com os mesmos marcadores e até 10 entradas (`copy_change_check.py`; saída 0, 1 e 2). Só uma linha nova nasce `copy`. A página de texto mudada sem uma linha `copy` também é recusada, menos o salvar da tela (só páginas, cada uma com item novo no `history`), que só muda o texto, sem a conferência de marcador. Um `--amend` é julgado pelo commit inteiro. Ramo, merge e o primeiro commit do repositório não são julgados, nem o arquivo em `content/copy/` de quem não tem esse registro; a regra é a de [[pdlc-loops]] § 2.
- **`pre-commit` e a «Priorizada» (F125, UAT-407):** o commit que COMEÇA uma feature da trilha Humano (a primeira task marcada, ou o spec que sai de
  Draft para `In progress`) é recusado quando a feature não está no `docs/specs/priority.md` do projeto — o humano a arrasta no board; dentro da lista
  passa, e avisa se uma de cima não começou; a trilha Agente e o registro de um Draft passam; lista ilegível ou apagada é «não avaliável», nunca passe
  (`priority_gate_check.py`; `priority_next.py` é o comando que lista as não começadas e o bloco do início de sessão).
  **A lista se lê na `main`** (F217, UAT-537): o arraste grava sempre na `main`, e o board, o comando, o hook e a trava leem a `priority.md` de lá,
  nunca a cópia do ramo em que o checkout está (a trava usa a cópia do índice só no commit que muda a própria lista).
  **Sem a lista não há trava** (F173, UAT-480): um projeto sem `docs/specs/priority.md` não tem ordem nenhuma (o app lê o arquivo ausente
  como lista vazia), e o `priority_gate_check.py` deixa passar os commits dele. Com a lista, a trilha Humano só começa o que está nela, e o que já começou quando ela existe segue
  (não é recusado). O refresh do kernel não cria a lista nem liga a trava. O primeiro arraste dele cria a lista com a ordem que ele deu, com o título `# Prioridade` (emenda à CC-ADR-0029 § 3, aceita pelo MJRP como CC-ADR-0040): o commit de ordem leva o arquivo novo, e a lista passa a existir.
- **`pre-commit` e a tela compilada (F57, CC-ADR-0027):** recusa qualquer entrada do índice sob `apps/control-center/web/dist/`,
  que não é versionada (o serviço compila a tela). Num merge de ramo anterior à F57, `merge_train.py dist-resolve` mantém a
  remoção (`git rm --cached`; o disco fica, derivado).
- **`commit-msg` e os carimbos de aceite (CC-ADR-0024):** recusa `Human-accepted:` e `Human-reopened:` ao lado de um
  `Co-Authored-By:` de agente — o aceite e a reabertura de uma feature são do humano, pelo «Aceite».
- **`commit-msg` e o merge aberto (F60):** com `MERGE_HEAD` e uma mensagem que não é a do merge, o hook só avisa.
- **Duas sessões no mesmo repositório:** commit só por *pathspec* — nunca `git add -A` com outra sessão ativa.

## History
- **2026-11-07 13:49** · **Driver de merge só vale ligado** (F218, UAT-539): no `MJRPpersonal` o `install-driver` dizia «instalado» e os merges seguiam em conflito no log e no `## Now`, porque o filho não tinha as linhas do `.gitattributes` nem o `merge_train.py` que o driver chama; um desses conflitos custou ao MJRP uma segunda passkey. O kernel passou a levar o script e as linhas, o `install-driver` confere a ligação e o I5 do doctor a cobra (decidido pelo agente, revisável pelo MJRP).
- **2026-11-07 13:16** · **Todo lote da tela grava na `main`, e a ordem se lê lá** (F217, UAT-537; decidido pelo agente, revisável pelo MJRP). No trem de 2026-11-07 o checkout da raiz estava no `integrate/…`; o lote anotava o ramo do checkout e o comando commitava nele, e os arrastes do MJRP (a F205 entre eles) ficaram fora da `main` que o orquestrador e o `priority_next.py` liam, enquanto o board lia o disco do checkout. Agora o lote (aceite, reabertura, troca de chaves, ordem) é preparado com os arquivos da `main` e commitado nela: no worktree que a tem, ou num worktree temporário (`$TMPDIR/cc-main.*`) que o comando abre e remove; `main` ausente ou presa num merge recusa com o motivo. A marcação do catálogo recusa com a raiz fora da `main`. O board, o `priority_next.py` (e o hook de início de sessão) e a trava leem a lista na `main`. A regra: **o checkout não diz para onde vai um commit da tela**.
- **2026-11-07 09:21** · **A limpeza vale nos filhos: o build do Next e o `_backups/` do worktree** (F207, UAT-527; o `_backups/` inteiro ao principal é decisão do integrador, o resto do agente; revisáveis pelo MJRP). No `MJRPpersonal` nenhum dos 44 worktrees mesclados saía. A soltura levava só a cópia carimbada e movia a versionada (o que sujou 7 deles); agora leva tudo o que o git não versiona e nunca o versionado, e a poda do `_backups/` não apaga cópia versionada. Prévia: 25 dos 44 sairiam.
- **2026-11-07 09:15** · **O avanço rápido não roda hook, e a página diz isso ao filho** (F209, UAT-501: o P2-2 da reconferência da F182; decidido pelo agente, revisável pelo MJRP). A nota CM-0107 publicada não muda (o portão do catálogo recusa a nota publicada que muda de bytes), e o filho lê esta página do kernel: a regra do `--no-ff` passou a dizer por quê, no próprio lugar da integração.
- **2026-11-07 09:08** · **O rastro do doctor e do build não segura o worktree mesclado** (F207, UAT-527; decidido pelo agente, revisável pelo MJRP). A limpeza de 7/11 viu 37 worktrees e tirou 4: uns 20 ficavam só pelo `daily-checks/sensor-*.md` reescrito, pelo `web/dist/` de ramos antigos ou pelo `.mypy_cache/`. Agora o juiz conta esse rastro como de saída (a seção nova `rewritten_traces`, e o `.mypy_cache/` em `derived`), e o `_safe.release_worktree` o desfaz antes da remoção: o rastreado pelo `_safe.restore`, guardando a edição no `_backups/` do principal. A remoção continua exigindo `git status` vazio; o `classify` e o hook de deleção não mudam.
- **2026-11-04 22:10** · A F186 (UAT-496) separa a estratégia do harness da do projeto: «só o MJRP dá push, a `main` fica local» é a do harness e o padrão até o projeto escrever a dele (seção `## Delivery strategy` do `arch.md`, item `delivery-strategy`, CM-0111). Nasceu de a regra ter sido copiada para o site pessoal, com preview e produção, e de um lote de 50 commits ir direto ao ar. Decisão do MJRP de 4/11: a estratégia é escrita para o projeto, não copiada.
- **2026-11-04 11:25** · **Commitar no próprio ramo e entregar à integração não se pergunta ao MJRP; a sessão orquestradora única também integra** (F171, UAT-477; a regra do juiz final está em `pdlc-loops` § 2; decidido pelo agente, revisável pelo MJRP).
- **2026-11-01 23:02** · **A mudança de copy direto na `main`, por máquina** (F158, S-208; a regra é do MJRP, 2026-11-01): a exceção a «feature nasce no board» é a issue de tipo `copy`, e o `copy_change_check.py` a segura no que ela é. Só o integrador escreve na `main`, como antes.

- **2026-10-31 00:46** · **O ramo recém-aberto lê-se como começado, no board e na trava** (F140, UAT-424; o pedido do MJRP de 2026-10-30 20:48; decidido pelo agente, revisável pelo MJRP). «Mesclado» era «a ponta do ramo é ancestral da `main`», o que vale também para o ramo sem commit próprio; a F131 e a F139 apareciam na «Priorizada» com as sessões trabalhando. Agora é «ancestral da `main` **e** fora da linha de primeiro pai dela» (o trem junta com `--no-ff`, então o ramo mesclado tem a ponta fora da linha; o recém-aberto, não — o critério do `has_own_commit` da F123), no adaptador git do board (`adapters/git_cli/branches.py`) e em `priority_next.branch_features`. A `mjrp-implementing-tasks` traz o commit de início como item 6 do pré-voo. Custo: um ramo antigo e vazio, ainda na linha de primeiro pai, lê-se como começado (o lado seguro; o spec `Done` na `main` encerra a questão).
- **2026-10-30 21:14** · **A feature fecha pela reconferência quando não há nada para o MJRP** (F139, S-206; o pedido do MJRP de 2026-10-30 20:22, sobre a F57; decidido pelo agente nos detalhes, revisável pelo MJRP). A regra do `AGENTS.md` § Duas trilhas ganhou o registro e o board. A spec `Done` que não pede o olho dele declara `closed_by: "recheck independente: <relatório>, <AAAA-MM-DD HH:MM>"` e fica no estado **Fechado**, nunca «Aceito» (o `Human-accepted:` continua só dele). Quem sobe é um arquivo do kernel, o `mjrp-scripts/feature_closure.py`: uma story que ela importa e aponta para um estado de **tela** (o de comportamento não é), uma issue **dele** em `fixes:`, ou a marca `needs_human: "<decidir|ver|segurança>: <motivo>"`. O sensor do grafo recusa o `closed_by` nesses casos (`closed_by_fits`, `needs_human_shape`); o board põe a feature em `closed` (a coluna «Fechado» da página Board, com a story dela; a estação `closed` no contrato do Delivery); a trava do aceite recusa preparar o «Dar o OK» dela (`not_his`). Aplicada à F57, F129, F130, F134 e F136; F124, F127, F132, F137 e F138 seguem com ele. Escolhas do agente: só o `info-arch` conta como tela; a issue conta só pelo `fixes:`; a regra ilegível não fecha nada.
- **2026-10-30 11:54** · **O nome do ramo, por máquina** (F132, UAT-411; a opção 1 do MJRP em 2026-10-30: só a trava, sem o Control Center reconhecer o ramo pelo conteúdo). O board lia o trabalho em ramo só pela `branch-convention@2` (F67) e nada a cobrava: a F127 andou num `f127-outcome-measure-optional` e os subagentes das F119 a F125 em `worktree-agent-…`, com os cards parados na «Priorizada». O `branch_name_check.py` roda primeiro no `pre-commit` e recusa o commit num ramo de trabalho fora da convenção, com o `git branch -m` que sana (o número da feature já no nome vira `claude/fNN-<resto>`; sem ele, o molde). A convenção é lida do `rules/delivery.py` pela árvore sintática — o módulo importa o contrato do app e o pydantic, que um hook não deve exigir —, nunca copiada. O molde antigo desta página (`feat/<nome>-<AAAAMMDD>`) saiu. Escolhas do agente, revisáveis pelo MJRP: o `integrate/` do trem passa (leva várias features, e o `merge_train` o cria); `master` conta como linha principal num filho que ainda a tem; o filho que não acha o harness, num ramo de trabalho, é exit 2 (o mesmo do conform), e na `main` nem procura. Autoteste: `branch_name_check_selftest.py`, com 6 mutações.
- **2026-10-30 11:51** · **A tela compilada sai do git** (F57 TASK-03, CC-ADR-0027 §§ 1 e 12; decidido pelo agente, revisável pelo MJRP). O `apps/control-center/web/dist` saiu do índice e do `.gitignore` do app; o `pre-commit` da raiz recusa qualquer entrada do índice ali (o índice inteiro, não só o commit: pega o `git add` que resolve um *modify/delete* guardando o lado do ramo); o `merge_train.py dist-resolve` mantém a remoção quando um dos lados não versiona mais o build (nos dois sentidos), sem compilar, e o `merge` acusa um merge limpo que traga o build de volta. Um commit que tira um caminho só do índice não vai por *pathspec*: o `git commit -- <caminho>` o devolve (provado num repositório descartável); vai pelo índice do próprio worktree, conferida a lista. O `web/dist` local ficou classe 3 (`structure_rules.json → derived`), para não prender worktrees (P1-1 do juiz).
- **2026-10-29 19:18** · **A «Priorizada» manda no que começa, por máquina** (F125, UAT-407; o pedido do MJRP de 2026-10-28; decidido pelo agente, revisável pelo MJRP). A regra «fora da lista não começa» vivia só como disciplina do orquestrador. Agora são três peças: `priority_next.py` (as features da ordem do MJRP que não começaram, com o título; o `--session-start` é o bloco do hook de início de sessão, mudo sem o que perguntar), o `priority_gate_check.py` no `pre-commit` (recusa o commit que começa uma feature da trilha Humano fora do `priority.md`; avisa a de cima não começada; Agente, registro de Draft e segunda task passam; lista ilegível ou apagada é exit 2) e o passo da skill `mjrp-integrating-branches` (rodar o comando e perguntar com `AskUserQuestion` antes de despachar trabalho novo da trilha Humano). As regras do app (formato da lista, «começou», ramo da feature, trilha) são espelhadas, cada uma citada no docstring. Escolhas do agente: o projeto sem `priority.md` não tem coluna e o portão o deixa passar; o spec `In progress` sem task marcada já é «começou»; o filho recebe o portão e o comando, não o lembrete de início de sessão. Autoteste: `priority_gate_check_selftest.py`, com 13 mutações.

- **2026-10-28 10:35** · **A limpeza poupa o worktree recém-aberto e o que foi mexido na última hora** (F123, UAT-405, P2-2 da reconferência do lote F119–F122; decidido pelo agente, revisável pelo MJRP). «Mesclado» era «o ramo está contido na `main`», o que vale também para o ramo sem commit nenhum; com o fim do trem automático da F120, o worktree que o app acabou de abrir, antes do primeiro commit e da trava, saía no merge do integrador. O `judge_worktree` (o único juiz da limpeza do fim do trem, do `clean-worktrees --apply` e do W18) agora poupa, depois das quatro regras de git: o worktree cujo `HEAD` está na linha de primeiro pai da `main` (sem commit próprio) enquanto algo nele foi mexido nos últimos 7 dias (`FRESH_WORKTREE_DAYS`), com a razão «recém-aberto, sem commit próprio»; e qualquer worktree com arquivo modificado na última hora (`ACTIVE_WORKTREE_SECONDS`), em qualquer ponto da árvore. A idade é o mtime do sistema de arquivos, sem o `.git` da raiz. Consequência aceita: o ramo que acabou de ser juntado, com arquivo escrito há menos de uma hora, sai no trem seguinte. Autotestes: bloco «UAT-405 (F123)» do `_pathclass_selftest.py` e `case_clean_worktrees_f123` do `merge_train_selftest.py`.

- **2026-10-27 22:24** · **Os worktrees mesclados saem, e o teto os vê** (F120, UAT-401; decidido pelo agente, revisável pelo MJRP). A reauditoria achou 20 dos 24 worktrees mesclados como «insubstituíveis» (29 worktrees, 31 GB; o arquivo diário em 25 GB e 34 min): o `web/node_modules` em link não casava `**/node_modules/`, o `.mjrp/` da sessão e as cópias do `_backups/` do worktree eram rotativos «declarados» que mesmo assim barravam, o teto contava só os 4 derivados e ninguém rodava a limpeza. Agora o link para pasta casa a regra; `judge_worktree` julga o worktree como se o `.mjrp/` de uma sessão encerrada (sem trava ativa, sem escrita há 1 h) e as cópias carimbadas já tivessem saído, e `release_worktree` faz isso de verdade, movendo as cópias para o `_backups/` do principal; o que tem edição sem commit, `.env`, trava ou sessão viva não é tocado. O `structure_rules.json → budgets` ganhou `worktrees-total` (10 GB do `.claude/worktrees/` inteiro) e `**/.ruff_cache/` entrou em `derived`; o `merge` que cai na `main` roda a limpeza. Teto de 10 GB e janela de 1 h: escolha do agente.

- **2026-10-27 17:23** · **O trailer do «regenerado idêntico» é só da checagem** (F117, UAT-394, P2-5 da reconferência da F111; decidido pelo agente, revisável pelo MJRP). O trailer escrito à mão depois da válvula do humano (`Prototype-sync: skip`) fazia o merge aceitar uma tela que ninguém refez. O `prototype_sync_check.py --staged` agora recusa a mensagem que traz a linha `Prototype-regenerated-identical:` e a válvula juntas, ou que nomeia um protótipo que não está no índice; a checagem só grava o trailer depois de passar, e num `--amend` (o hook passa `$AMEND`) ficam as linhas que o commit emendado já levava. Autoteste: caso 15.

- **2026-10-27 16:56** · **O merge do ramo que refez as telas entra pelo trailer do ramo** (F111, P1-1 da reconferência `reports/audits/2026-10-27-f111-retro-and-sync-checks-recheck.md`; decidido pelo agente, revisável pelo MJRP). A prova pela data no disco não vale no checkout do integrador: o `merge --no-ff` não reescreve o PNG idêntico, e o merge do ramo que tinha passado era recusado. Agora o `commit-msg` grava, no commit que aceita a tela sem ela estar no índice, o trailer de máquina `Prototype-regenerated-identical: <protótipo>: <telas>`, que fica no histórico (o P2-1). No merge, a tela conta como refeita quando o arquivo é o mesmo no índice, no HEAD e no ramo mesclado e um commit do ramo, do último que mudou o protótipo em diante, tocou o wireframe ou traz o trailer com ela. O ramo que passou pela válvula do humano não traz trailer e é recusado de novo no merge.

- **2026-10-27 16:10** · **O wireframe regenerado idêntico conta como refeito** (F111, UAT-387; decidido pelo agente, revisável pelo MJRP). O merge da F67 precisou do `Prototype-sync: skip` do MJRP porque, regerados os 11 wireframes, só o do Tracking mudou e os outros, idênticos, não entram no índice. O `prototype_sync_check.py --staged` aceita a prova da regeneração: o arquivo no disco igual byte a byte ao do HEAD e ao do índice, e mais novo que o protótipo no disco. O que não foi regenerado (mais velho) segue recusado; o regenerado diferente tem de entrar no commit.

- **2026-10-31 10:20** · **O `.tar.gz` da cópia diária sai do Mac e deixa o marcador em `daily/`** (F81, S-171, ADR-0030, que emenda a ADR-0024; decidido pelo MJRP em 2026-10-26 10:23, desenho do agente, revisável). `daily_backup.py --mark-moved <destino>` confere o tamanho e o `sha256` do arquivo que ele moveu contra o manifest e grava `projects-<data>.moved.json`; o manifest, as entradas e o registro contam como cópia feita, então o `--check`, o W13 e a passada das 07:00 não refazem o dia. Mover sem registrar é acusado, e a passada sem `--force` manda registrar em vez de refazer. A poda tira só o marcador; o arquivo no destino é do MJRP.
- **2026-10-26 05:33** · **O backup deixa de ser um bundle a cada commit no iCloud e passa a ser a cópia diária de todos os projetos** (F75 TASK-08, ADR-0024). Saem o hook `post-commit` (e os `post-merge`, `post-rewrite` e o `backup-trigger` que dividiam o corpo dele) e o `backup_repo.py`; o parágrafo «O backup» e a lista «O que os hooks exigem» dizem o novo. Motivo: o upload de ~1,2 GB por commit (203 + 329 GB no iCloud), o custo de manter (13 correções, F70) e a cobertura de um projeto só. A primeira cópia real foi relida e restaurada (8,65 GiB, 5 min 30 s; restauração em 112 s) antes de qualquer remoção.
- **2026-10-26 03:22** · **Seção nova: as quatro classes de caminho e o `_backups/`** (F74 TASK-04 e TASK-06, ADR-0023, Accepted 2026-10-25). O `_backups/` passa a dizer o que é: rede contra engano do agente, não backup (mora no mesmo disco; teto de 30 dias e 1 GB). O `README.md` dentro dele é gerado pelo `_safe`. Nasceu de quatro incidentes de disco por acúmulo e de a regra «nada é apagado sem cópia» sugerir mais proteção do que dava.

- **2026-10-24 14:34** · «O merge» vira **«A integração»** (F63 TASK-02, a proposta 5 da revisão de 2026-10-24): a sessão integradora, os trens com um juiz por lote, o portão `pre-merge-commit` e a recusa dos carimbos de aceite no `commit-msg` entram na lista dos hooks. «PR por feature» e «merge do agente» saem: o ramo é entregue e quem integra é o integrador. As entradas abaixo ficam como foram escritas.

- **2026-10-24 11:42** · O integrador (F60, S-161; revisão do processo da 1.1, decidida pelo MJRP em 2026-10-24 11:10): só uma sessão escreve na `main`, em trens de lote com um juiz por lote. Nasceu das integrações da 1.0 (23 e 24/10), feitas à mão com um ajudante fora do repositório: conflitos de log em todo ramo, ids de UAT colididos, juízes repetidos e um commit alheio no meio do merge da F52. O `merge=union` foi testado e recusado (perde a ordem das datas); o driver próprio fica no lugar.

- **2026-10-19 12:28** · Regra prioritária do MJRP: "feature nova se cria na main, requisito novo no PRD, na main, pra todos os projetos". Nasceu de a F41 ter sido aberta no ramo e de a F42/F43 terem sido mencionadas sem aparecer no board.
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: *O que os hooks exigem* ganhou o guarda do protótipo no `commit-msg` (info-arch e wireframes de todas as telas da versão; o trailer de saída é do humano), as pastas novas da estrutura no `pre-commit` e o `post-commit` do backup.
- **2026-10-04 17:32** · Nasce da aposentadoria da `mjrp-deployer` (S-76, decisão do MJRP): a governança de git era
  a parte da skill que as outras citavam (`mjrp-dev`, `mjrp-debug`, `mjrp-pdlc`); como regra de todo projeto, mora no
  kernel e chega aos filhos no refresh. A tag de adoção passa a ser `v0-harness-adoption` (a do bootstrap
  brownfield); a antiga `v0-framework-bootstrap` fica no arquivo.
- **2026-10-07 19:55** · PDLC em loops (onda B.4 de `design/proposals/pdlc-loops-migration-plan.md`; decisões do MJRP de 07/10):
  sai o `dev` — branch por feature com PR direto em `main`; o PR leva a evidência e o CI roda o mesmo verificador; o
  merge é do agente quando o verificador passa, o humano decide só quando pede ou há risco financeiro ou de negócio;
  pré-condições: versionado, rollback, backup recorrente — até lá, merge local e push do humano. Tags do harness
  `harness-before-loop` e `v0.0`.

- **2026-10-08 17:43** · Backup recorrente do repositório (onda F de `design/proposals/pdlc-loops-migration-plan.md`; decisões do
  MJRP de 08/10): iCloud Drive, a cada commit, antes da tag `v0.0`; o push sem credencial sai do caminho — o push é dele.
- **2026-10-11 06:39** · O `commit-msg` ganhou a isenção `self_logged` (ADR-0004 do Control Center, aceita pelo MJRP): o arquivo declarado no contrato, com item novo no histórico dentro dele, dispensa a entrada no log; o porquê em [[memory-architecture]].

- **2026-10-13 17:58** · O `commit-msg` passou a cobrar a entrada só no log do projeto **dono** num commit que toca mais de um projeto (ADR-0020 D.1, aceita pelo MJRP; trilho T4.1): `mjrp_harness.log_owner.root_paths` no contrato da raiz (lido do `HEAD`) diz o que é sempre da raiz; fora disso, o projeto com mais arquivos tocados (os logs não contam), empate para a raiz. Antes o hook exigia entrada nos dois logs, e o log da raiz acumulou entradas-ponteiro ("detalhe no log do Control Center").

## Related
[[pdlc-loops]] · [[spec-kit]] · [[requirements-graph]] · [[hooks-concept]] · [[engineering-canon]]
