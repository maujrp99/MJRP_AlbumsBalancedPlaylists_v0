---
title: Hooks — o conceito
aliases: [hooks-concept, hook, hooks, matcher, pretooluse, pre-tool use, evento + script, injeção de determinismo, prompt level, harness layer]
summary: hook como evento + script — a camada de determinismo dentro de um sistema probabilístico, e a regra que decide o que vai para hook e o que fica no prompt
tags: [harness, verificacao, fundamento, conceito]
status: firme
atualizado: 2026-10-09
fontes: [agentic-lab-claude-code-hooks-explained, don-woodlock-what-is-harness-engineering, quintanilha-o-que-e-harness, austin-marchese-karpathy-method, pasquadev-harness-e-loop-engineering, fernanda-kipper-harness-alem-do-claude-md]
---
<!-- kernel do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
Um **hook** é um evento que dispara um script: **o evento responde *quando* o código roda; o
script responde *o que* ele faz**. É a camada de **determinismo** que se injeta num sistema
probabilístico — o que precisa *sempre* acontecer deixa de depender de o modelo escolher fazê-lo.

## What it is

### A definição canônica

Agentic Lab, *Claude Code Hooks, Explained Simply*:

> "A hook is an event that triggers a script. The event answers *when should my code run* and the
> script answers *what should it do*."

O nome vem dos webhooks: *"the harness would be listening for one of the events to occur and then
attach a script to it — that's why they call it a hook, very similar to webhooks in traditional
software development."*

A fonte abre com uma tese forte e uma ressalva: *"hooks are the most powerful feature for coding
agents — yet most people don't really understand them. They are an extremely simple feature to
understand and their skill ceiling on mastery is near infinite."*

### O argumento central — pedido × regra

É a passagem que dá sentido ao conceito inteiro:

> "A language model is probabilistic in nature. For a given input there's no guarantee of a good
> output or even the same output across many trials. There are no guarantees with agents — and
> this means that the rule that you wrote, or the many rules that you write in your CLAUDE.md,
> **don't always get followed**, especially over the course of a long session. Now a script is the
> opposite: cheap, instant, identical every single time. **Hooks let you add that layer of
> determinism into this probabilistic system.** They're like the glue."

Os docs da Anthropic dizem o mesmo com outras palavras: hooks fazem certas ações **"always
happen"** em vez de depender de o LLM escolher rodá-las.

Austin Marchese, no *Stop Prompting Claude. Use Karpathy's Method Instead*, dá o exemplo que
torna a distinção concreta:

> "You could have a rule in CLAUDE.md that says *'Don't touch anything in the /important folder'*.
> That might get you 80% of the way there, but **it's essentially a request, not a rule** — Claude
> can still touch those files. So instead you add a **pre-tool-use hook** before Claude uses the
> write or edit tool, and it checks the file it's trying to edit. Now Claude literally can't make
> the edit, and **it's enforced at the tool level, not the prompt level**."

### A regra de bolso — o que vai para hook

> "If the check is **binary and mechanical**, it should be in a hook. But if it needs **judgment**,
> you have to leave it in the prompt level."

Prompt level = skill, `CLAUDE.md`, rules, o que você põe no prompt. O hook *"is a layer up and it
interacts in the harness layer"*.

Marchese organiza as regras em **três baldes**, pelo custo de errar: *always do* (autopilot) ·
*ask first* (confirmar) · *never do* (linha que não se cruza). **Hooks são o mecanismo do
"never do"** — e da parte mecânica do "always do".

### A mecânica

**Eventos** — o ciclo de vida do agente: o usuário submete um prompt · o contexto compacta · um
subagente nasce · uma ferramenta é chamada (**antes** e depois) · a sessão começa · a sessão
termina · o agente para. A fonte mostra a lista completa em tela e não a lê; o único nome técnico
dito em voz é **PreToolUse**.

**Matcher** — *"like an if statement at the hook layer that will only ever run the hook if the
matcher hits"*. Exemplo: `matcher: bash` faz o PreToolUse rodar só quando a ferramenta é o Bash.
Servem para *"your hooks don't constantly run"*.

**O que o script pode ser** — *"hooks can trigger an HTTP call, an MCP tool, a prompt, or even
spawn a subagent"*. E podem viver **dentro de uma skill ou de um agente customizado**, ativos só
na sessão que os invocou.

**O que a fonte não diz:** stdin, JSON, exit codes, mensagem de bloqueio, `settings.json`. A
postura é deliberada — *"Claude handles the schema and the wiring. You just have Claude eat that
complexity for you. Engineering is not dead; you're just abstracting up a layer."*

### Como pedir um hook — as quatro seções

1. **Event** — qual evento do ciclo de vida dispara.
2. **Behavior** — o que o script faz.
3. **Why** — a motivação, *"to point it in that north-star direction"*.
4. **Edge cases** — só os óbvios: *"I prefer to **eval my hooks** rather than trying to
   predefine every single edge case ahead of time."*

### Os exemplos das fontes

| Evento | O que o script faz | Fonte |
|---|---|---|
| Sessão termina | dispara um agente que **resume a sessão numa base de conhecimento** — memória persistente do que se trabalhou | Agentic Lab |
| Agente para | dispara um agente para **red-team da implementação** e abre a análise | Agentic Lab |
| Antes de Write/Edit | inspeciona o caminho e **bloqueia** se for pasta protegida | Marchese |
| Depois de editar | **roda o linter** | Quintanilha |
| Antes de qualquer tool | *"make sure that I want that tool to be called"* — confirmação | Woodlock |

### Onde as fontes se posicionam

- **Woodlock** lista hooks como componente do harness ao lado de tool loop, MCP, skills e
  memória — um *gate* pré-ferramenta.
- **Quintanilha** os pareia sempre com *middleware* — *"execuções determinísticas"*, exemplos:
  compactação, continuação, lint. *"Programador gosta de determinismo."*
- **Kipper** os põe no **user harness** — a parcela que o usuário manipula, ao lado de
  `CLAUDE.md`, skills e rules — distinta dos guardrails e policy checks que a ferramenta implementa
  por dentro.
- **pasquadev** dá o sentido mais distinto: hooks são *"os pontos definidos em que o humano ou um
  sistema automatizado intervém. **Não é o agente decidindo quando escalar, é o harness**."* Mesma
  tese, ênfase em human-in-the-loop em vez de automação.

### Cuidados que as fontes registram

- **Não use hook para o que exige julgamento** — é a regra de bolso ao contrário.
- **Matcher, senão o hook roda o tempo todo.**
- **Cuidado com bloat da base de conhecimento** no hook de fim de sessão, e *"don't let subagents
  or automations summarize their own sessions"*.
- **Não sobre-especificar edge cases** — avaliar depois é mais barato que prever antes.
- **Proporcionalidade** (Marchese): *"depending on the cost of getting something wrong, you need
  different guardrails"* — hook é para o que não pode errar.
- Nenhuma fonte trata de hook que trava, timeout, ou custo de execução.

### O exercício que fecha o vídeo

> "Go open up your CLAUDE.md or your rules files. **Read every single line and ask one question:
> could this be a hook instead?** Pick your battles, but go install some of these hooks so that you
> can remove this bloat from your CLAUDE.md. **This is how you actually guarantee the behavior in
> your agent.**"

## How MJRP uses it

- **Hook é o T4 em forma de código.** A quarta condição para algo ser harness — *"mecanismo que
  não dependa do modelo cooperar"* — é exatamente o que a regra de bolso descreve. O verbete
  *Pedido × regra* do glossário é essa distinção com nome próprio: *uma linha no `CLAUDE.md` é
  pedido; um hook que intercepta a chamada é regra.*
- **O inventário de hoje** (2026-10-09). **AI Platform** (`.claude/settings.json`): `SessionStart` → `doctor`;
  `SessionStart` (compact) → `session_journal reinject`; `Stop` → `stop_gate.py`, `session_journal gate`,
  `requirements_graph_check --changed --gate`; `PreToolUse` (Write|Edit) → `path_guard.py`; `PreCompact` e
  `PostToolUse` (Skill) → `session_journal`. **Git** (`mjrp-scripts/hooks/`, `core.hooksPath`): `pre-commit` →
  estrutura por natureza + contradição do grafo nos nós tocados; `commit-msg` → entrada nova no log + protótipo ×
  info-arch × wireframes (`Prototype-sync: skip — <motivo>` é do humano); `pre-merge-commit` → a
  reconferência visual do ramo que mudou tela. (O `post-commit` que fazia o backup a cada commit saiu em 26/10: o backup é a
  cópia diária, ADR-0024, fora do caminho do commit.) O `Stop` de critério de saída é o que torna o princípio II.4 **executável**, não só escrito; o
  `SessionStart` é o que faz o aviso de arquivo sem commit (W4) chegar sozinho.
- **O limite** (S-61, 04/10): hook de AI Platform só roda onde a plataforma
  carrega as configurações do projeto. A sessão remota que alcança o repo por ponte não carrega — prova:
  o `Stop` de critério de saída nunca bloqueou nela. Hook do git roda onde o git roda, em toda sessão;
  por isso a regra que não pode falhar (todo commit com entrada no log) mora nele.
- **O exercício "poderia ser um hook?" já foi feito uma vez aqui**, ao contrário: na revisão do
  `AGENTS.md` de 10/09, uma instrução que mandava o agente fazer o que o sensor reprovava saiu do
  texto — o mecanismo (I2) é a regra, a prosa era o pedido redundante.
- **Os três baldes de Marchese são o verbete *Governança de ferramenta*** (proposto): always do /
  ask first / never do, aplicados no nível da chamada da ferramenta. O balde "never do" é hook; o
  "ask first" é gate.

**Onde o MJRP diverge:** as fontes tratam hook como o lugar do **determinismo que impede**. O MJRP
tem um segundo uso, que nenhuma delas descreve — o hook como o lugar do **sensor que detecta**: o
`SessionStart` não bloqueia nada, ele mede e avisa. Guardrail impede antes; sensor acusa depois; o
hook é o ponto de encaixe dos dois.

## History

- **2026-10-26 05:33** · **Saem os hooks `post-commit`, `post-merge`, `post-rewrite` e o `backup-trigger`** (F75 TASK-08, ADR-0024): os quatro só serviam ao `backup_repo.py`, que gravava um `git bundle --all` no iCloud a cada commit, merge e rebase. O backup é agora a cópia diária (`daily_backup.py`, um agendamento do macOS), que não passa pelo caminho do commit. A entrada de 2026-10-14 abaixo conta por que o `post-commit` já tinha deixado de esperar o backup.
- **2026-10-14 14:05** · O `post-commit` deixou de esperar o backup. Medido num clone do harness com os hooks reais: o `git bundle --all` levava ~5,8 s de ~6,5 s por commit (o `.git` foi de 119 MB para 422 MB, 84 refs, o bundle de 147 MB em 11/10 para 299 MB), contra ~0,7 s de `pre-commit` + `commit-msg`; o orçamento de commit do Control Center reprovava na `main` por isso, e o commit pela tela (teto de 15 s) esperava o mesmo bundle. Agora o hook lança `backup_repo.py` com `nohup` e descritores fechados (linha em `.git/mjrp-backup.log`); dois backups simultâneos se serializam por um `flock` no destino (o atrasado, vendo o `HEAD` já feito, não faz nada) e o `freshness` (W13) não acusa atraso enquanto o lock está preso. `MJRP_BACKUP_DIR` apontando para um caminho que não existe passou a significar "sem destino" (antes caía no iCloud real: os clones de teste do app gravaram ~5 GB de bundles lá).
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: o texto contava dois hooks e depois "mais cinco"; passou a trazer o inventário de hoje, conferido no `.claude/settings.json` e em `mjrp-scripts/hooks/` (inclusive `path_guard`, `requirements_graph_check`, `pre-commit`, o guarda do protótipo no `commit-msg` e o `post-commit`).
- **2026-09-11** · Página criada a partir da mineração do acervo, a pedido do MJRP, no meio do
  brief do playbook de conceitos. Fonte canônica: Agentic Lab; complementos de Woodlock,
  Quintanilha, Marchese, pasquadev e Kipper. O corpus vive fora deste repositório —
  external-locations.
