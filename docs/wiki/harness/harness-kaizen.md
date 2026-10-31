---
title: Harness kaizen
aliases: [harness-kaizen, lições, licoes, aprendizados, o que não funcionou, incidentes do harness]
summary: onde o harness falhou e o que se aprendeu com isso — o erro e a correção no mesmo lugar
tags: [harness, memoria, kaizen]
status: em formação
atualizado: 2026-10-12
fontes: [2026-claude-code-auto-memory]
---
<!-- kernel do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
O registro do que o harness **não pegou** e do que se aprendeu com isso. Achado e lição moram
juntos porque são o mesmo movimento — o erro e a correção; separados, viram duas metades inúteis.
É o `lessons.md` do transcript do Waldemar, com nome nosso (ADR-0008).

## What it is

Duas origens, o mesmo arquivo:

- **O agente escreve durante o trabalho** — quando descobre que uma checagem estava calada, que
  um sensor mentiu, que uma regra existia e ninguém verificava.
- **O `loop.py` escreve sozinho** — todo loop que esgota o teto sem convergir deixa aqui a lição,
  em vez de ela morrer no terminal. O estado bruto de cada passada fica em `.mjrp/loop-state.md`,
  que é memória de trabalho e se apaga; o que sobrevive é a linha daqui.

**O que não entra:** o que se deduz do repositório, e o que o `AGENTS.md` já diz. Memória que
repete o que se pode ler é custo sem informação.

## How MJRP uses it

Uma linha por achado, **com data e hora**, mais recente no topo. Quando um achado vira regra
permanente, ele **migra** para o `AGENTS.md` ou para uma checagem do `doctor` — e sai daqui,
deixando o ponteiro. Lição que só mora aqui é lição que ninguém aplica.

> **Em formação.** Nasce vazio junto com o `loop.py` (BACKLOG #19) porque o loop precisa de um
> destino que já exista. O **28a** o preenche com o que hoje está em `MEMORY.md ## Sobre o
> próprio harness`.

## Findings

- **2026-10-27 14:43** · **O passo retroativo da via rápida era cobrado por mensagem, e a história mostra o custo.** Rodada a trava nova (F101, `retro_step_check.py`) sobre os merges da semana, só a F100 — a feature que escreveu o registro de artefatos e o aplicou linha a linha — passava; a F58, F98, F90, F93, F82 e F87 teriam sido recusadas (protótipo que não veio, documentos não declarados no `plan.md`, task fechada sem `rounds::`, nó sem `delivered_by`, o `## Now` do app sem commit da feature). O `loop.py --check-tasks` já existia e ninguém o rodava. **Lição:** regra que o agente aplica quando lembra vira lista que cada um resume do seu jeito (o próprio integrador a resumiu a «plan, info-arch e protótipo»); a lista mora num registro e a máquina a cobra no commit e no merge, lendo-a da cópia de antes, para o commit não afrouxar a própria trava. Achado lateral: o guarda das válvulas recusa todo comando com `core.hooksPath`, também o que LIGA os hooks num clone descartável — o caminho foi copiar os hooks para o `.git/hooks` do clone.

- **2026-10-27 09:54** · **O CI `verify` vermelho a cada push tinha nove causas, e a cópia «limpa» do Mac as escondia.** Seis eram código de merge recente que o Mac também reprovava (o `_boot` com `sys.path` em três autotestes, o `sdd_shape_check` fora do `new_project_selftest`, o `## Summary` da F96, duas citações de evidência de F73 e F76, o hook de feature sem os moldes — esse só aparece no teste de aceite do app —, o `Session:` da passada agendada em forma de id contra o trailer em forma de URL); três só no runner, e as três eram do ambiente de máquina: a variável `PYTHONDONTWRITEBYTECODE=1` do shell do Mac (sem ela, o Python dentro do repositório descartável deixa `__pycache__/` e o «a árvore está limpa» falha) e a falta do módulo `markdown`. A cópia limpa da F94 (sem PyYAML, HOME vazio, sem git global) deixava as variáveis do shell passarem, por isso a UAT-377 não reproduzia. **Lição:** reproduzir o runner é `env -i` (HOME, PATH, `TZ=UTC`, `GIT_CONFIG_GLOBAL=/dev/null`) numa cópia, não «uma pasta nova»; e todo autoteste que roda Python dentro de um repositório descartável fixa `PYTHONDONTWRITEBYTECODE=1` no ambiente dele. Falta: o caso do `doctor_selftest` e um nono autoteste (UAT-377), sem Python 3.12 aqui.

- **2026-10-27 09:17** · **O `## Now` do Control Center ficou três dias parado, e nenhum sensor viu.** De 24/10 16:29 a 27/10 o integrador reescreveu só o `## Now` da raiz, embora quase todo o trabalho fosse do app; o Memory Check do control-center mostrava 24/10 ao MJRP. O F1 do doctor da raiz mede só o `MEMORY.md` da raiz contra o log da raiz; o doctor do app não roda (o mesmo motivo do aviso «o sensor diário não rodou» do clean clutter). **Lição:** quem escreve no log de um projeto atualiza o `## Now` daquele projeto; o F1 precisa medir cada projeto aninhado contra o próprio log.

- **2026-10-26 21:14** · **Desde 2026-10-19 nenhuma feature segue o molde do SDD, e nada cobrou.** Das 92 features do Control Center, 42 têm o «Problem Statement»; da F43 em diante, nenhuma — 50 seguidas. Hoje o integrador criou 22 copiando a forma mínima da F78 (Summary + Requirements), sem o Problem Statement, os Observable States, os Success Criteria e o Out of Scope do molde da `mjrp-specifying-sdd-artifacts`; os `plan.md` ficaram em uma linha de esboço e os `tasks.md` sem Pre-Implementation nem Documentation. A `mjrp-ensuring-sdd` não foi chamada uma vez. O MJRP notou («os agentes não estão seguindo o SDD direito… a skill ensuring SDD não está servindo pra nada aparentemente»). **Lição:** forma de artefato que só uma skill confere, e só quando chamada, não existe sob pressão — o mesmo do passo retroativo e da gramática da `uat.md` hoje. Precisa de sensor no fecho e de um gerador a partir do molde (F95).

- **2026-10-26 19:53** · **Uma célula de Status fora da gramática derrubou a leitura inteira da `uat.md`, e nenhum sensor barrou o commit.** O integrador escreveu `fixing (UAT-373: …)`; o leitor do Control Center (`adapters/repo_fs/uat.py`) aceita só `open`, `fixing (Fxx)` e `fixed (…)` e, numa linha fora disso, falha a leitura toda — o MJRP viu as duas trilhas vazias. O `pre-commit` (o grafo, o `status_sync`) e o `merge_train uat-check` não conferem a gramática do Status. **Lição:** a gramática da `uat.md` precisa de um sensor no `pre-commit` (o mesmo parser do leitor), e uma linha ruim devia virar um aviso na linha, não a tabela inteira ilegível.

- **2026-10-26 13:20** · **O passo retroativo da via rápida ficou pela metade na F83, e nenhum sensor viu.** O integrador reescreveu o `plan.md`, mas o `info-arch.md` (`^overview-harness-applied-project-mode`) e o protótipo v4.14 continuaram dizendo que o card aparece num projeto só. O `pdlc_vocabulary_check` só cobra o `plan.md` em esboço; o `pdlc-loops` § 2 diz que o passo é «obrigatório e cobrado por sensor», e a cobrança cobre um dos três artefatos. O MJRP perguntou. **Lição:** na via rápida, o fecho de uma feature de tela inclui o `info-arch.md` e o protótipo, não só o `plan.md`; o sensor precisa cobrar os três (a feature de tela fechada sem tocar o `info-arch.md` e o protótipo depois da última mudança de tela). Retroativo da F83 delegado; a mesma regra vale para a F82 e a F87 no fecho.

- **2026-10-25 22:31** · **O portão da reconferência visual não roda num merge feito em dois passos.** O hook `pre-merge-commit` só dispara num `git merge` que já commita; `git merge --no-commit` seguido de `git commit` roda o `pre-commit`, e o ramo que mudou tela entra sem o relatório. O coordenador desta sessão integrou assim todos os ramos do dia (para resolver o `## Now` no merge), e a F76, que mudou textos do UAT Board, entrou sem a reconferência. **Lição:** o portão visual tem de rodar também no `pre-commit` de um commit de merge (`MERGE_HEAD` presente), ou o integrador nunca faz o merge em dois passos; até a correção, a reconferência visual vem antes do merge, à mão.

- **2026-10-25 22:12** · **Descrevi um estado sem medir, e a crítica achou.** Às 17:30, escrevi na ADR-0024 e na F75 TASK-09 que a pasta do iCloud tinha saído e que o hook não gravava mais, porque o MJRP disse que estava tirando. Às 17:46, a crítica mediu 11 GB ainda no iCloud, com um bundle das 17:44. Depois, a pasta mudou de lugar mais duas vezes, para `_MJRP-BCKPS/mjrp-backups/` e às 21:45 para `ToBeDeleted/`, e o texto envelheceu de novo (N11). **Lição:** estado de disco ou de destino entra no registro só medido, com a hora (`ls`, `du`), nunca a partir do que o humano disse que vai fazer. E todo registro de estado que pode mudar fora do repositório diz quando foi medido.
- **2026-10-24 20:55** · **O «System Data» do Mac tinha 92 GB de lixo dos testes do Control Center.** O `web/visual/render.mjs` cria uma pasta `cc-render-*` no `$TMPDIR` (`/private/var/folders/…/T`) a cada componente renderizado num teste (o bundle do esbuild tem ~3 MB) e nunca a apaga. Com 49 arquivos de teste, cada `npm run check` em cada worktree, juiz e trem deixou centenas dessas pastas: foram 89 mil pastas, e os 92 GB nasceram nas últimas 24 h, nos trens da 1.1. Outros ~4 GB vêm de `vp-*`, `mjrp-selftest*` e Playwright. A limpeza de 20:20 não olhou o `$TMPDIR`, por isso o disco voltou a encher. **Lição:** todo helper que cria pasta temporária apaga o que criou (o `finally` do próprio helper), e quem mede o disco olha também o `$TMPDIR`, não só o repositório e os worktrees.
- **2026-10-25 10:55** · **O backup no iCloud ocupava ~530 GB do Mac, quando devia ocupar ~9 GB.** O `backup_repo.py` roda em todo commit, pelo hook post-commit, e nomeia a pasta pelo `--show-toplevel`. Num worktree, esse nome é o do worktree (`agent-…`, `judge-train`, `uat-72`…), não o do repositório. Assim, cada worktree ganhou a sua pasta, com até 19 bundles de 0,4 a 1,2 GB. O teto de 19 valia por pasta, não para o total. Foram 182 pastas redundantes, com 203 GB em `mjrp-backups`. E, como os bundles são reescritos a cada commit, o iCloud acumulou mais 329 GB de cópias esperando o envio em `~/Library/Application Support/CloudDocs/session/i`. Todo worktree divide o mesmo banco de objetos, então cada `git bundle --all` era o repositório inteiro de novo. **Lição:** o que um hook grava fora do repositório se nomeia pelo repositório (`--git-common-dir`), nunca pelo checkout. E um teto de tamanho vale para o total que o mecanismo cria, não por unidade.

- **2026-10-24 13:24** · **O primeiro trem com a skill `mjrp-integrating-branches` (F60) devolveu seis ajustes.** O trem 1.1-a (F57, UAT-300, UAT-290 a 294) saiu verde, e o integrador apontou:
  - (1) num worktree isolado, um comando por chamada, com caminhos literais; o ambiente recusa `;`, `&&` e variável de shell;
  - (2) falta o caminho do `web/dist` com dezenas de conflitos rename/rename: `git rm -r --cached`, tomar a `main`, mover os soltos para fora, regenerar uma vez. Vale um subcomando;
  - (3) o `uat-merge` só roda em merge com conflito; quando o git funde o `uat.md` sozinho, ninguém confere id duplicado. Precisa de um check depois de todo merge que toca o `uat.md`;
  - (4) todo commit leva entrada no log do projeto dono, inclusive o de dado e o de regeneração;
  - (5) falta o modelo da entrada «trem montado, espera o juiz»;
  - (6) o `doctor` reescreve `daily-checks/` e suja o «working tree limpo» do preflight.
  - **Lição:** a skill nasceu do procedimento que o orquestrador fazia à mão. O primeiro uso real é o teste que faltava. Os seis viram tasks da F60, que só se aceita com eles.

- **2026-10-24 08:29** · **Outra sessão commitou na `main` no meio de um merge meu e deixou uma trava órfã.** Às 08:07, uma sessão de rotina (Haiku, folder-index) fez `0bf28472` na `main` enquanto o orquestrador resolvia o merge da F52, com o `MERGE_HEAD` aberto. O commit por pathspec passou e deixou `.git/HEAD.lock` sem processo dono. Não se perdeu nada: o índice batia com o HEAD novo, o merge fechou em cima dele (`411c1ecc`) e a trava foi renomeada para `.orphan-20261024`. Achado também: um shell de 18/10 ainda aberto no repo, de uma sessão antiga. **Lição:** o `session_lease` avisa, mas não impede um commit alheio durante um merge aberto. Um merge longo (dist regenerado, `uat.md` célula a célula) é a janela de risco. Vale um aviso no hook de commit quando há `MERGE_HEAD` de outra sessão.

- **2026-10-24 03:21** · **A dívida de lint do Control Center ficou escondida atrás do doctor verde.** Na `main`, `python3 mjrp-scripts/doctor.py .` saía VERDE ("34 sensores executados"), mas o `ruff check src tests` do Control Center tinha 976 achados (E501). Ninguém viu até o ramo da integração da F48, onde o doctor executou o sensor `lint` do subprojeto e reprovou com 1.202 achados. A dívida já tinha nome (F52 TASK-01, "depois da F48") e foi paga no trem sem afrouxar a regra: `chore/f52-ruff`, sem mudar o `line-length` e sem `noqa`. **Lição:** sensor declarado que não roda na `main` não é linha de base, é dívida invisível. Falta saber por que o doctor da raiz não executa o `lint` do subprojeto na `main` e o executa no ramo. Conferir isso antes de confiar no verde dele para o Control Center.

- **2026-10-23 22:22** · **Um agente instalou o pacote do worktree dele no ambiente Python da `main`.** O `.venv` do Control Center na `main` passou a importar o código-fonte do worktree do agente da F37 (`_editable_impl_control_center.pth` e o `cc` apontando para o Python do worktree). O serviço do CC (`uv run` na `main`) podia estar rodando o código de um ramo não mesclado, e o `cc tokens record` quebrou quando o worktree mudou. Consertado com `uv sync --reinstall-package control-center` na `main` e um `launchctl kickstart` do serviço. **Lição:** o agente usa só o ambiente do próprio worktree (`uv sync` dentro dele, ou o `UV_PROJECT_ENVIRONMENT` dele) e nunca instala nada no `.venv` da `main`. Todo brief diz isso. Um sensor que confira que o pacote instalado na `main` vem da `main` seria barato: fica para depois da meta.

- **2026-10-23 21:11** · **Um comando de limpeza que o orquestrador deu ao MJRP apagou evidência versionada.** Para liberar 4,2 GB de capturas soltas do juiz, o orquestrador passou um `find … -name "*.jpg" -delete` sobre `reports/evidence/UAT-visual/`. Ele apagou também 1.628 imagens **versionadas** de rodadas antigas, evidência citada pelo `uat.md`. Além disso, 1.001 arquivos versionados de `_backups/` sumiram da árvore, de origem incerta (talvez a poda sugerida). Tudo foi restaurado do git (`git checkout --`), sem perda. Outro erro do mesmo dia: o comando `open "$(cc token link)"` não abria nada, porque o `cc token link` imprime um rótulo antes do endereço. **Lição:** comando destrutivo dado ao humano só toca arquivo **não versionado** (filtrar por `git ls-files --others` ou `git clean -n` primeiro) e é testado antes de ser entregue; comando de operação é testado contra a saída real antes de entrar no roteiro. O roteiro de restart revisado está em `apps/control-center/ops/RESTART.md`.

- **2026-10-20 00:32** · **O `folder-index.md` de `mjrp-scripts/` ficou um dia atrás e ninguém avisou** (4 scripts de 2026-10-19 fora da tabela; "90 itens" que eram 94, `migrations/` "78 arquivos" que eram 81, catálogo "18 itens" que eram 34, `retired_skills.json` "37 nomes" que eram 42). O sensor que pega isto existe — `inventory_check.py` devolveu 1 nos 4 scripts — mas **nenhum o executa**: não está nos `sensors:` do contrato, não está no doctor e não está em hook; o `tree.py --check` só compara o `STRUCTURE.md` com o `structure.yml`, não toca em `folder-index.md`. **Proposta (uma linha, não criada):** ligar o `inventory_check.py --todas` ao doctor como aviso (só presença e existência; as contagens em prosa, como "94 itens", o sensor não lê, e isso a skill refaz na passada seguinte). **Feito em 2026-10-20 00:48 (W17, decidido pelo MJRP como classe (a)):** o doctor roda o `inventory_check.py --todas` como aviso e o sensor passou a conferir também o `N itens` do cabeçalho e o `· N arquivos` da árvore; a contagem solta dentro de uma descrição ("34 itens") continua sem conferência possível.

- **2026-10-20 00:09** · **Feedback do agente do MJRP Personal sobre o conform falso-verde** (o mesmo incidente de 2026-10-19). O próprio agente do filho reconheceu três erros, e dois deles o harness não tinha visto:
  1. Leu a regra ao pé da letra: a skill só manda o `--refresh-kernel` quando falta o catálogo. Já em correção: o passo 1 roda sempre o refresh.
  2. **Tratou como ruído o aviso do doctor "nenhuma skill está instalada nesta cópia"**, que indicava que a comparação com a fonte não estava sendo feita.
  3. **Escreveu no log mais do que tinha conferido** ("a auditoria segue valendo", que só vale para o catálogo antigo).
  
  **Lição:** (2) um aviso que diz que um sensor não pôde comparar com a fonte é "não avaliável", não aviso, e não pode ficar perto de um "tudo verde"; (3) a entrada de fechamento do conform cita o comando e o catálogo contra o qual cada afirmação foi conferida, e afirmação sem fonte não entra. Os dois vão para a correção do conform (ramo `fix/conform-stale-catalog-20261019`).

- **2026-10-20 00:03** · **O conform do MJRP Personal fechou verde num catálogo de 14/10.** O `/mjrp-pdlc-bootstrap` em modo conform rodou o `conformance_check.py` vendorizado do filho contra o catálogo do próprio filho e disse «0 notas, 0 lacunas», enquanto o Control Center, medindo com o catálogo do harness, mostrava 4 lacunas (`uat@3`, `adr-names@3`, `tech-stack@1`, `prd@2`), 9 notas pendentes e «catálogo defasado». **Lição:** uma checagem que julga contra a cópia velha da regra que o próprio sujeito carrega sempre passa; o critério de saída tem de ser medido contra a fonte. O conform agora começa sempre pelo `--refresh-kernel` a partir do harness, e o `--strict` e o `stop_gate` recusam fechar com o catálogo atrás (ou sem alcançar o harness).
- **2026-10-19 23:39** · **O cânone de engenharia não chegava aos subagentes.** O MJRP perguntou se os subagentes seguem o engineering-canon (padrões, componentização, modularização). Só em parte. A máquina cobra a Dependency Rule (o import-linter), o tamanho de arquivo (`test_file_size`, vermelho com o `palette.ts` em 357 linhas) e o estilo (o `ruff`, vermelho com ~380 erros acumulados). Ninguém cobra SRP, padrões com endereço, DRY e nomes. Nenhum brief do orquestrador mandou carregar a `mjrp-implementing-tasks`, que é quem leva o cânone, e os juízes revisaram correção, segurança e paridade visual, não o cânone. **Lição:** todo brief de implementação carrega a `mjrp-implementing-tasks` e cita o cânone, e a revisão de código do juiz tem uma seção fixa sobre ele, com cada achado citando a seção. Avisados na hora os três implementadores em curso (F48, F49, F52). Vem aí a auditoria de código pedida pelo MJRP.

- **2026-10-19 23:36** · **O aceite de ADR virou carimbo.** O MJRP aceitou três ADRs no mesmo dia "sem ter lido, apenas para desbloquear" (CC-ADR-0022, 0023 e 0024). Pela calibragem do AGENTS.md, o humano pulando a regra é sinal de que sobra processo. Quem de fato julga a ADR é a crítica independente; o aceite dele travou o merge da F42 por horas sem acrescentar revisão. **Lição:** a ADR que só formaliza decisões que ele já deu, com crítica independente sem P0, não deve esperar o aceite dele para o merge. A mudança da regra é dele (a proposta está feita desde 2026-10-19 22:2x e espera o "sim"). Enquanto isso, o Decisores registra o aceite como foi: sem leitura, para desbloquear.

- **2026-10-19 22:59** · **O orquestrador encheu o disco do MJRP, e só viu quando travou.** O MJRP: "vc encheu o meu drive de system data". O que o macOS mostrava como System Data eram três coisas que o harness cria e nunca limpa:
  - a pasta temporária da sessão, ~278 GB, com mais de 400 rodadas de captura dos juízes visuais a ~10 GB cada;
  - os worktrees dos agentes, ~110 GB, um clone por agente, mantido depois do merge;
  - o `_backups/`, 2,3 GB, com capturas visuais aposentadas de 400–600 MB.
  
  O sinal veio tarde e foi ignorado: o primeiro "No space left on device" apareceu num commit, e a sessão seguiu abrindo agentes e rodadas de juiz enquanto o disco oscilava entre 100 MB e 5 GB. O doctor ficou vermelho por ENOSPC, um commit de merge parou no meio, duas reconferências falharam e um designer não conseguiu commitar. Nada se perdeu, porque o trabalho estava no git ou nos worktrees. O MJRP rodou a limpeza (a pasta temporária e os backups) e o disco voltou a 176 GB livres.
  
  **Lição — o harness cria, o harness recolhe:**
  1. O juiz de paridade guarda só o resumo e as imagens que viram evidência, e a pasta da rodada é removida no fim, pelo próprio kit.
  2. O worktree de um agente sai depois do merge do seu ramo, pela limpeza do app.
  3. O `_backups/` não recebe capturas visuais: elas são derivadas e não precisam de cópia.
  4. O doctor avisa quando o disco livre cai abaixo de 20 GB, e o orquestrador confere o espaço antes de abrir uma leva de agentes.
  5. A captura roda por padrão com um navegador por vez.
  
  A conta é o mesmo desenho da regra "nada é apagado sem cópia": cópia de dado do MJRP, sim; cópia de derivado regenerável, não. Delegado para a F52 (TASK-00), antes do lint.
  
  **Corrigido (2026-10-19 23:41, ramo `fix/f52-code-health`, F52 TASK-00):** o kit de paridade (`collect.mjs`, kit 1.1.0) e o juiz do Control Center recolhem a pasta da rodada (ficam o resumo, o diff e os pares dos P0/P1); `_safe.py` remove a captura derivada sem copiar (`_safe_selftest.py`); o doctor ganhou o **W18** (era W17 no ramo; a `main` já usava o W17 para o folder-index — achado do juiz da F52, 2026-10-23) (disco livre < 20 GB, aviso); a captura roda com um navegador por padrão. Faltam o item 2 (o worktree sai depois do merge, pela limpeza do app) e a conferência do orquestrador antes de abrir uma leva de agentes: são hábito dele, sem mecanismo no repositório.

- **2026-10-19 20:58** · **O disco encheu com as capturas dos juízes visuais.** A pasta temporária da sessão chegou a 278 GB: cada rodada do juiz de paridade guarda cerca de 10 GB de capturas, e nada as limpa. Os worktrees de agentes já mesclados somam outros 110 GB. Um commit de merge parou no meio, e os agentes em curso arriscaram falhar. **Lição:** o juiz guarda só o resumo e as imagens que viram evidência, e a pasta da rodada se recolhe ao fim; os worktrees mesclados se limpam pelo app; um aviso do doctor quando o disco livre fica abaixo de um limite. Delegado para a F52.
- **2026-10-19 20:58** · **Um ramo escreveu na pasta real do Control Center e quebrou a `main`.** Às 20:56, o código do ramo da F51 regravou `~/.mjrp/control-center/cache/usage-files.json` com um `Record` de 17 campos sem subir o formato (`usage-files@1`), e o `cc tokens record` da `main` quebrou. O arquivo foi afastado, não apagado, e a `main` reconstruiu o cache. **Lição:** cache com formato mudado sobe a versão, e o leitor ignora a versão que não conhece; agente nunca roda contra a pasta real, só com `CC_HOME` descartável.
- **2026-10-19 20:58** · **O `npm run check` chama a rota de preparo da marcação do catálogo.** O `discard-focus.test.mjs` faz POST nessa rota, então todo agente que roda o `check` a chama, mesmo num clone descartável, contra a regra "o agente nunca chama a rota de preparo". Fica com o MJRP (classe b): se o teste continua no `check`.

- **2026-10-19 19:43** · **O leitor do `uat.md` mora em dois lugares e um formato novo quebra o outro.** Ao acrescentar a coluna `Reportado por` (`uat@3`), o espelho `product_structure_check.py` (harness) e o `uat.py` do Control Center só aceitam cabeçalhos exatos de 7 e 8 colunas: o harness acompanhou (`product-structure@10`, CM-0082), o CC fica para a TASK-03 da F48. A lição: mudança no formato de um artefato lido pela tela nasce com a tarefa do leitor do CC ao lado, não depois; senão o `uat.md` migrado derruba a tela. [[conformance-notes]]

- **2026-10-19 19:24** · **A pasta temporária do orquestrador é compartilhada entre os subagentes.** Com sete agentes em paralelo, o `logentry.py` que o agente da F47 deixou na pasta temporária sobrescreveu o de outro agente, e quatro entradas soltas ("TASK-08", "x") pararam no log de um worktree. Foram removidas antes do commit. **Lição:** todo brief de agente em paralelo dá a ele uma subpasta própria da pasta temporária (`<scratchpad>/<frente>/`).

- **2026-10-19 17:29** · **Entrada de log com hora à frente do relógio passava em silêncio.** Duas vezes no mesmo dia, subagentes escreveram a hora de memória ou em UTC (7 entradas estimadas, até 35 min adiante; 5 em UTC, 3 h adiante) e o `commit-msg` só exigia que a entrada existisse. **Lição:** a hora do log é do relógio, não do autor. **Corrigido:** o `log_entry_check.py` recusa a entrada nova com hora posterior ao agora, no fuso do contrato, com 2 min de tolerância (selftest no `log_entry_check_selftest.py`; vendorizado, chega aos filhos no `--refresh-kernel`).
- **2026-10-19 16:44** · **Subagentes gravam a hora do log à frente do relógio.** Aconteceu duas vezes no mesmo dia. A varredura de fechamento F39/F40/F41 tinha 7 entradas com hora estimada, até 35 minutos à frente do commit. A F42 tinha 5 entradas entre 17:05 e 19:10 para commits feitos entre 14:50 e 15:56: provavelmente UTC, ou um `date` sem o `TZ`. Os dois juízes pegaram lendo o log, mas nenhum sensor pega, e o `commit-msg` só exige que a entrada exista. **Lição:** a hora da entrada nova não pode passar da hora do commit que a leva (com uma folga pequena). Isso cabe no hook `commit-msg`, que já lê a entrada, sem checagem nova no doctor. Fila do harness.

- **2026-10-19 15:42** · **Os 6 P2 do juiz (af40409c) corrigidos no mesmo ramo.** O que o juiz achou: a regra nova do `evidence_folder` calava a feature sem `tasks.md`, e a subtask herdava o checkbox da mãe. **Lição:** quando uma regra nova depende de um estado («pendente»), diga o que acontece quando o estado não existe (sem `tasks.md`) e em que nível ele é lido (subtask). Decidido pelo agente, revisável pelo MJRP.

- **2026-10-19 15:19** · **Mudar um script que é `pattern_source` de um item do catálogo exige subir o item.** O ajuste da evidência futura (entrada acima) tocou o `evidence_folder_check.py` e o portão da aprendizagem reprovou o ramo («o padrão mudou»). **Corrigido (ramo `fix/harness-queue-20261019`):** `evidence-folder@4` + `CM-0080-evidence-folder-v4.md`, `--rebaseline`, sem o trailer do humano. **Lição:** antes de editar um sensor, `grep` o nome dele em `pattern_sources` do catálogo; se estiver lá, a mudança nasce com a nota. Decidido pelo agente, revisável pelo MJRP.

- **2026-10-19 15:10** · **O sensor da evidência ficou vermelho por uma pasta que a task pendente ainda ia criar.** O texto de uma task dizia onde a prova iria morar; a pasta ainda não existia, e o `evidence_pointer_dangling` tratou isso como evidência perdida. **Corrigido (ramo `fix/harness-queue-20261019`), decidido pelo agente (classe a), revisável pelo MJRP:** a regra distingue o que a linha afirma — task feita exige a pasta no disco (lacuna), task pendente a anuncia (aviso `evidence_pointer_future`). **Lição:** um sensor de «faltou» precisa saber se o trabalho que produz a coisa já foi dado como feito; antes disso, o que falta é futuro, não falha.

- **2026-10-19 15:09** · **Um `asked_at` do futuro passava como pergunta registrada.** Bastava o log ter uma entrada datada à frente do relógio que citasse o arquivo — a pergunta «já feita» nunca tinha acontecido. **Corrigido (ramo `fix/harness-queue-20261019`):** o `asked_entries` rejeita o carimbo posterior ao agora (e a data impossível) e diz para usar a hora real de Brasília. **Lição:** carimbo que o próprio agente escreve precisa de um limite que ele não controla — o relógio.

- **2026-10-19 15:05** · **Corrigido (2026-10-19, ramo `fix/harness-queue-20261019`): o `cowork_sync_check` acusava «editada no Cowork» em versão antiga do repo.** A impressão digital não desfazia as escritas da plataforma — `\uXXXX` na descrição entre aspas, `metadata` em fluxo, quebra final — e a fonte era digerida por uma segunda implementação (a do `doctor`). Os dois lados passam agora pela mesma `normalize_skill_text`; edição real (corpo ou valor) continua mudando o digest. **Lição:** quando dois lados precisam do mesmo hash, um só código calcula os dois, e o teste ensina a forma que a plataforma escreve, não a que o repo escreve.

- **2026-10-19 15:02** · **Um filho com catálogo velho aparecia como «0 nota(s) pendente(s)».** O MJRPpersonal recebeu só até o adr-names@2 (a fonte, em @3); o leitor lê o catálogo vendorizado, que só lista as notas que conhece, e disse que não havia nada. O Control Center, enquanto isso, mostrava ADRs que não sabe ler. **Corrigido (ramo `fix/harness-queue-20261019`):** o leitor e o W7 comparam o catálogo do filho com o da fonte e nomeiam o que falta e o `--refresh-kernel`; aviso, não erro, e não é checagem nova (ADR-0002). **Lição:** um leitor que só olha a própria cópia não vê que a cópia está velha; quem sabe é quem tem a fonte. Decidido pelo agente, revisável pelo MJRP.
- **2026-10-19 14:50** · **Os subagentes não deixavam o board visível: trabalho feito, sem commit.** O MJRP perguntou se os subagentes mantinham cards e boards atualizados para ele ver no Control Center. Não mantinham. O CC lê a pasta da feature na cabeça do ramo, mas o agente da F42 tinha 15 tasks marcadas no `tasks.md` sem commit (a tela mostrava 3), e a varredura de fechamento tinha 16 arquivos e 0 commits. A regra "feature nasce na main" cobria o nascimento, não o andamento. **Lição:** todo brief de agente de Delivery leva "cada task concluída é um commit no ramo, com a marca no `tasks.md` e o status da feature"; trabalho sem commit é invisível para o humano. (Os três agentes foram retomados com a regra.)
- **2026-10-19 14:50** · **O kernel velho de um filho mente "0 pendentes".** O CC mostra 4 ADRs do MJRPpersonal que não se leem (`# ADR 0002:` com espaço, `## Status` na linha de baixo). O harness já cobra isso desde a `adr-names@3` (CM-0076), mas o filho ainda tem o catálogo vendorizado com a `@2`. Rodado no filho, o `conformance_check.py` diz "0 nota(s) pendente(s)": ele julga contra o catálogo do próprio filho e não sabe que existe versão nova. O erro continua porque a correção não chegou ao filho, e nada avisa isso. **Lição:** o check tem que dizer quando o catálogo do filho está atrás do do harness e mandar rodar o `--refresh-kernel` (fila do harness, em curso).

- **2026-10-19 14:16** · **O `cowork_sync_check` acusa "editada no Cowork" em versões antigas do repo.** O agente do Cowork parou a subida porque
  três skills (`mjrp-coaching-pm`, `mjrp-ensuring-quality`, `mjrp-ensuring-sdd`) não batiam com nenhuma versão do histórico. Conferido
  no Mac, linha a linha: são versões antigas do repo; a do `ensuring-sdd` difere só na quebra de linha final. O empacotador junta a
  descrição do cabeçalho numa linha e tira a quebra final, e a impressão digital do compare não desfaz essas normalizações, então
  uma versão antiga empacotada parece edição feita no Cowork. **Lição:** o compare tem que aplicar a mesma normalização do
  empacotador (ou comparar o corpo sem o cabeçalho e sem os espaços finais) antes de procurar no histórico. Um alarme falso aqui
  trava a subida e faz o MJRP decidir sobre algo que não existe. Na fila.

- **2026-10-18 23:17** · **As regras do MJRP para o brownfield, entregues (ramo `harness/brownfield-accepted-adr-titles-20261018`, CM-0076).** (1) **O fechado antes do harness
  nasce aceito:** a story Done antes do harness vira `Accepted`, com `accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"`, sem pergunta e sem fila
  (`legacy-history.md`); «antes do harness» é nenhum `delivered_by` mais novo que o commit que criou o `.mjrp-project.yml`; o `requirements_graph_check.py` aceita a frase como
  aceite nesse caso e o Control Center não lista a story em «aceite pendente» (a regra espera só `Done` sem aceite); `usage.accepted_on` ignora a data da frase. Prova numa cópia do MJRPpersonal:
  50 → 0 «aceite pendente». A auditoria e os juízes do brownfield olham o que **não** está fechado. (2) **O sensor visual não roda no fechado e em produção.** O MJRP: «se é
  brownfield, a não ser que o humano demande, não devemos rodar o sensor visual no que já está FECHADO e em prod». A paridade, a reconferência e a nota `visual-sensor` valem para a
  tela nova ou alterada depois do harness; o portão de merge já só cobra a branch que muda tela, e nenhum check ou doctor conta tela legada como descoberta (conferido na cópia: o A2 só
  nota a declaração). O sensor segue **declarado**. (3) **O 5º caso de «o check não pede o que a tela lê»** fechou no `adr-names@3`: o título `# ADR 0002:` e o status em `## Status`
  passavam e a ADR não lia. O leitor passou a aceitar `# ADR 0002:` e o check exige uma forma só; **o status também**, que o plano não previa e a cópia mostrou (duas das três ADRs
  falhavam por ele). **Lição:** quando se tapa um leitor, reler a cópia pelo leitor real, não só pelo caso reportado: o primeiro furo escondia o segundo. A lista de leitores nasceu em
  `conformance-notes` (lacunas: `prd_document`, `arch`, `data-model`, `info-arch`, o parse do grafo), não construída.
  **Rodada do juiz (2026-10-19 00:40):** o P0 mostrou que a frase de aceite, escrita para poupar uma pergunta, era também uma porta para o agente aceitar o próprio trabalho: sem
  `delivered_by` ela valia. **Lição:** toda dispensa de aceite precisa de uma evidência que o agente não escreve sozinho (aqui, o commit anterior ao contrato) e de uma contagem
  à vista do MJRP; e a data que a regra usa não pode falhar aberta (sem a data, «não avaliável»).

- **2026-10-18 22:58** · **A Overview do MJRP Personal: três problemas que o conform não pegou.**
  1. **Redundância:** as perguntas da auditoria aparecem no grupo próprio e de novo em "Pendente com o humano" (o ponteiro do `## Now`,
     que a regra nova manda escrever). A tela mostra o ponteiro como uma pendência a mais.
  2. **50 aceites um a um:** são stories entregues antes do harness (brownfield), marcadas Done. O MJRP: "não seria mais simples confirmar
     se tudo foi realmente aceito?". O aceite é dele (classe b), mas o histórico pede uma pergunta só, por release ou para tudo, com a
     evidência (está no ar), e não 50 linhas.
     **Regra do MJRP (2026-10-18 23:01):** "se é brownfield e está fechada, está fechada e aceita. O que o juiz deve se preocupar é com coisa não
     fechada no brownfield". Ele já respondeu isso várias vezes hoje nos filhos e não quer repetir. No brownfield, o trabalho fechado antes
     do harness nasce aceito (com a evidência "histórico anterior ao harness"), sem pergunta; auditoria e juiz olham o que não fechou.
  3. **4 ADRs que não se leem:** os títulos são `# ADR 0002: …` (espaço), e o leitor exige `# ADR-NNNN: título`. O item `adr-names` passa.
     É o 5º caso de "a checagem não pede o que a tela lê".
  **Lição:** o compat test por leitor (proposto às 18:03) deixa de ser proposta e vira prioridade. A migração do histórico pede o aceite em
  lote, e a tela não conta o ponteiro do `## Now` como pendência.

- **2026-10-18 22:51** · **A conformidade medida no worktree não chega à tela.** O doctor (I6) grava `.mjrp/conformance_state.json` na pasta
  em que roda. O conform roda num worktree (`.claude/worktrees/…`) e `.mjrp/` é gitignorado, então o merge não leva o estado para a
  pasta principal, que é a que o Control Center lê. O MJRP Personal fez o conform hoje e aparece como "nunca medida" (a pasta principal
  tem o último doctor de 14/10). **Lição:** o conform só fecha depois do doctor rodado na pasta principal, depois do merge; e a tela
  distingue "medida num worktree, não na main" de "nunca medida". ~~Na fila do agente.~~ **Resolvido pela F50 (UAT-268, 2026-10-19 19:52):** o doctor da raiz mede o portfólio e grava na pasta do Control Center (W16), e o fechamento do conform manda rodá-lo na pasta principal.

- **2026-10-18 22:26** · **O protótipo fugiu do padrão do site, e o design system não o impedia.** No v4.11 o card Tech Stack aninhou as
  camadas de um jeito novo: um cabeçalho de tabela solto acima de grupos com outra forma, e o grupo de um item virando linha, contra uma
  decisão do MJRP de 17/10. Isso enquanto o card Decisões (ADRs), logo abaixo, usa a lista agrupada (UI-160). O MJRP: "assim a gente
  perde o padrão e identidade do site; isso não está definido no design-system, deveria estar… o design-system é um artefato pra ir sendo
  evoluído; as skills de design deveriam sempre consultá-lo e melhorá-lo". **Lição:**
  - antes de desenhar, o designer procura no `design-system.md` o padrão do que vai desenhar e o reusa;
  - padrão novo ou divergente só entra junto com a sua linha no `design-system.md` (pendente da aprovação do MJRP), na mesma rodada;
  - o crítico reprova o componente que diverge de um padrão declarado (P1) e o padrão que se repete sem estar declarado;
  - o conteúdo aninhado tem um padrão só, a lista agrupada, e isso fica escrito.

- **2026-10-18 18:26** · **Brownfield sem feature: as releases do MJRP Personal somem do Tracking.** O projeto tem 4 releases com as
  stories feitas, mas nenhuma `docs/specs/features/Fxx-*/`, porque o trabalho entregue antes do harness ficou em `docs/specs/milestones/M0..M11`.
  A tela só mostra a 1.2, porque é a única com issues (41, da rodada de UAT); o `product_structure_check` deu VERDE, já que a release
  conta stories, não features. **Lição:** no brownfield, o trabalho entregue tem que virar feature (Done, com `planned_for` da release),
  ou a regra "a story entregue fica com a sua feature" não tem onde morar. A checagem precisa cobrar uma release com stories feitas e
  nenhuma feature (aviso no brownfield, com a migração dos milestones como remédio), e a tela precisa mostrar toda release do ROADMAP
  (UAT-257). **Correção do MJRP, 2026-10-18 18:36:** *um marco legado foi uma release, não uma feature* — feature é
  funcionalidade (a menor fatia vertical com valor observável). A migração não faz «uma pasta de marco → uma feature»: mapeia o marco
  à sua release, acha as features dentro dela (spec, plan e tasks do marco + as stories) e concilia stories e features nos dois
  sentidos (toda story feita em uma feature só; feature sem story ou story do tamanho de feature vira nota; os sinais de tamanho
  do harness avisam). Entregue em `feature_history_check.py` (item `release-features`, CM-0074) e na `mjrp-pdlc-bootstrap` ›
  `reference/legacy-history.md`.

- **2026-10-18 18:03** · **O nome do épico: a terceira vez no dia em que o check do catálogo não exige o que a tela lê.** O MJRPpersonal mostrou
  todo épico como «EP-01 · OUT-03» e «Sem épico 4» (eram as 4 NFR). A tabela do PRD dele escrevia `| EP-01 · nome | OUT-03 |` (id e nome na
  mesma célula, sem negrito); o leitor do Control Center só conhecia `| **EP-xx · nome** |` e, com o id solto, tomava a segunda célula — a
  coluna *Serve* — por nome, **sem erro**; o `product_structure_check.py` copiava o leitor, então o catálogo passou verde. As duas anteriores:
  `report-names@4` (o `type:` sem o `status:`) e `design-system@4` (sem o `**Status:**`). **Lição:** um leitor que *adivinha* quando não acha
  (a coluna ao lado, um valor padrão) esconde o furo de qualquer check que o copia; o leitor tem de **falhar visível** (`failed/unsupported_format`
  com a linha) e o check tem de usar a mesma regra e listar todas as linhas, não parar na primeira. Corrigido na branch
  `fix/epic-names-nfr-board-20261018`: `epic_identity` no leitor e no espelho, lacuna `epic_name_missing` (`product-structure@8`, CM-0069),
  `test_epic_names_check.py` prende os dois, e a conferência da tela do conform passou a comparar o snapshot com o PRD e o grafo
  (`mjrp-pdlc-bootstrap`, `screen-check.md`). No mesmo achado: a NFR com `epic:` entrava na conta do épico (corrigido) e o board a
  misturava em «Sem épico» (grupo à parte «Transversais (NFR)», decidido pelo agente, revisável pelo MJRP).
  **Correção sistêmica (proposta, ainda não feita):** um teste de compatibilidade **por leitor** do Control Center, e uma lista que diga, para
  cada leitor, qual check do harness o espelha e qual teste os prende. Hoje o pareamento existe só onde alguém lembrou: `roadmap.py`, `prd.py`,
  `requirements.py`, `features.py`, `uat.py` ↔ `product_structure_check.py` (o *pin* `test_product_structure_pin.py`); `archdesign_text.py`
  (`design_system_status`) ↔ `design-system@4` (`test_design_system_status_check.py`); o tipo do relatório ↔ `report_types_check.py`
  (`test_report_types_critique_words.py`); o `prd_document.py` (as seções do PRD) ↔ as cláusulas `contains` do item `prd` — **sem teste**; a
  leitura de `arch`, `data-model` e `info-arch` ↔ seus itens — sem teste. Regra proposta: adapter novo de `repo_fs/` só entra com a linha na
  lista e o teste (ou com a frase «sem check do harness» e o porquê), e o `doctor` cobra que a lista cubra todos os arquivos de `repo_fs/`.
  **Não adicionei a lista nem a cobrança do doctor** (só o teste do leitor do épico); a proposta fica para o MJRP decidir.


- **2026-10-18 14:50** · **A política de decisão, escrita em contrato, quase desfez uma decisão explícita do MJRP.** O juiz Opus da primeira escrita
  (0 P0, 4 P1) achou que o texto aprovado, aplicado ao pé da letra, deixava o agente inventar metas e se contradizia:
  1. «técnico, organizacional **ou reversível**» faz de uma meta (barata de desfazer) uma classe (a) — contra «a medida não é decidida pelo
     agente» (`product-decisions`, o incidente do fin-control de 17/10) e a `mjrp-coaching-pm`. **Lição:** «reversível» qualifica só o
     técnico e o organizacional; a lista do (c) (meta ou medida, resultado novo, prioridade, VISION, problema, «quem sente») é (c) seja qual for a
     reversibilidade, e o padrão «na dúvida, (a)» nunca vale para ela.
  2. «toda (c) leva recomendação» choca com o «nunca pôr (Recomendado) em texto do agente» sobre conteúdo de resultado (decisão explícita do MJRP, 17/10).
     **Lição:** quando uma regra nova encontra uma decisão explícita dele, a dele vence, e a regra nova diz isso — a pergunta de medida cita o registro e
     não recomenda.
  3. O exemplo da própria referência ensinava uma pergunta evitável (regra × código) e uma organizacional (escolher tipo de relatório). **Lição:** o
     exemplo de uma regra é o que o agente copia; confira cada exemplo contra a regra nova antes de entregar. Um tipo que falta numa lista do harness é
     `harness-feedback`, não pergunta ao MJRP.
  4. A saída do conform («nada aberto que o agente podia resolver») era só texto e se contradizia. **Lição:** critério de saída sem número que um
     script leia não é critério (`AGENTS.md`, o invariante do loop): o relatório passa a contar `avoidable_questions` e `bent_rules`, como o `content_p0`.

- **2026-10-18 13:59** · **O MJRP virou gargalo do conform: o agente pergunta o que poderia decidir, e cede a regra ao código.** Dois filhos,
  o mesmo padrão, e o MJRP repetiu o pedido nos dois.
  - No `mjrp-pedroso-incorp`, 22 perguntas ao fim do conform, a maioria técnica ou de organização e reversível. O próprio agente admitiu
    que podia decidir "com qualidade", mas que uma regra do harness (o agente não decide conteúdo de produto) mandava tudo para o MJRP.
  - No `mjrp-fin-control-2026-27`, "o que fica aberto" e "perguntas para você" em vez de corrigido. Na pergunta 17, a constituição
    manda as listas virem do cadastro e o código usa lista fixa. O agente recomendou dobrar a regra para caber no código ("a regra
    quebra o código") e só refletiu depois que o MJRP perguntou duas vezes: a regra faz sentido? então o código está errado.
  **Palavras dele:** "quero que os pontos sejam levantados, observados, com reflexão do agente, endereçados e corrigidos para
  melhorar o produto"; "não posso me tornar gargalo"; "não quero nada aberto, quero tudo corrigido; se não for possível, a
  justificativa do porquê".
  **Por quê:** o harness não tem uma política de decisão. A regra "o agente não decide conteúdo de produto", sem fronteira, vira "pergunte
  tudo", porque perguntar é o caminho seguro para o agente e caro para o humano. E nada diz como julgar uma divergência regra × código.
  **Lição:** duas regras de contrato, com juiz:
  1. **Decide, registra, revisável.** O que se deriva de uma regra aprovada (PRD, VISION, constituição, NFR, cânone), ou é técnico e
     reversível, o agente decide, corrige e marca "decidido pelo agente, revisável pelo MJRP". Ao MJRP só vai:
     - fato ou ação que só ele tem;
     - escolha de produto sem regra de onde derivar (meta, resultado novo, prioridade).
     Isso vai em lote, com recomendação e sem travar. Item aberto sem justificativa de "por que o agente não podia" é achado do juiz.
  2. **Regra antes do código.** Numa divergência, primeiro se julga a regra (faz sentido? quem aprovou?). Se ela fica, o código é o
     defeito e vira issue de Fix com `violates::`; nunca se recomenda dobrar a regra porque o código faz diferente. Toda recomendação diz
     por que não as outras opções.

- **2026-10-18 14:17** · **Os três achados do fin-control e o portão do número CM foram corrigidos (ramo `harness/doctor-slows-coverage-20261018`).** I3 resolve `Fxx`, `UAT-nn`, `OUT-nn` e NFR; W11 aceita o nó `S-xx`; o grafo aceita a feature Fix só com NFR; o portão do Learn reprova o mesmo CM em duas notas. Cada formato ganhou o caso com a forma real do filho no selftest do sensor que o lê (a lição de 13:59). Medido numa cópia do fin-control: I3 9 → 0, W11 62 (o relatório dizia 64) → 0. **Lição nova:** o filho tinha aplicado a regra por decisão do titular, e o doctor dele ficou vermelho por um formato que a regra pedia e nenhum sensor lia; a lacuna de teste de formato é mais barata de fechar na regra do que no filho.

- **2026-10-18 13:59** · **A regra nova da dívida técnica deixou o doctor do fin-control vermelho** (`reports/harness-feedback/2026-10-18-fin-doctor-rejects-slows-and-s-node-coverage.md`):
  1. o `slows:: Fxx` dá ERRO I3, porque o doctor não tem alvo para o `id:` da feature (`features/<Fxx-slug>/spec.md`);
  2. o W11 (`prototype_inventory.py`) só aceita `REQ-nn` para `coberto` e recusa o nó `S-xx` do grafo (64 avisos);
  3. trabalho de engenharia sem requisito de produto vira story forçada (a S-66): a feature técnica deveria importar o NFR que serve.
  **Lição:** a regra nova nas skills foi entregue sem rodar o doctor contra um filho que a aplicou. Toda regra que muda um formato
  precisa de um caso no selftest do sensor que lê esse formato.

- **2026-10-18 13:18** · **Um feedback de filho ficou 20 dias sem triagem, e só o conform o achou.** O `mjrp-pedroso-incorp` tinha
  `reports/harness-feedback/2026-09-28-observabilidade-tokens-por-acao.md` (tokens por ação, vistos no Control Center), que nunca
  entrou em `docs/wiki/feedback-from-other-projects/`. Os outros três de 28/09 entraram. O pedido foi atendido em grande parte por
  outro caminho (o ledger `cc tokens record`, a aba Token Management), mas ninguém fechou o ciclo com o filho. **Lição:** a regra "todo
  feedback de filho vai para o kaizen na hora" (AGENTS.md, 17/10) depende de alguém trazer o arquivo. Falta um sensor que compare os
  `reports/harness-feedback/` do portfólio com o índice do harness e acuse o que não foi triado (candidato). Abertos do pedido: o ledger
  por ação nos filhos e a telemetria OpenTelemetry do Claude Code como fonte.

- **2026-10-18 12:23** · **As perguntas da auditoria do conform não se leem por máquina, e o relatório se contradiz.** A crítica de UX do
  v4.10 tentou mostrar as 22 perguntas do `mjrp-pedroso-incorp` no Control Center e achou problemas:
  - opções cortadas no meio, pergunta de seguimento grudada na última opção e um conjunto de opções sem nome;
  - nenhuma indicação de qual item do catálogo cada pergunta trata;
  - as mesmas perguntas copiadas no `## Now`;
  - o relatório diz "Veredito: não conforme" no título e "conforme, com pontos fracos" no cabeçalho, e conta o `record-shapes` duas vezes.
  **Lição:** um texto que a tela vai ler precisa de forma fixa no modelo, como as âncoras do juiz. **Decisões do MJRP:**
  - cada pergunta diz o seu item, e cada conjunto de opções tem título próprio;
  - a pergunta respondida ganha a marca `→ respondida em <data>: (x)`, escrita pelo agente do projeto ao registrar a decisão e conferida na releitura;
  - o `## Now` só aponta para o relatório.
  Ramo `harness/audit-questions-20261018`.

- **2026-10-18 11:06** · **Dívida técnica não tem onde morar no grafo, e vira um épico pendurado num resultado que ele não serve.** No conform do
  `mjrp-pedroso-incorp`, o EP-10 "Layout limpo e responsivo" (S-42..44: margens negativas, medidas fixas, blocos fora dos
  próprios limites) estava sob o OUT-01, e o agente perguntou a qual resultado ele serve. Nenhum dos quatro resultados cobre a saúde
  técnica, e a crítica de arquitetura do dia (fronteiras, testes, sensores) também não tinha onde se encaixar. **Lição (MJRP):**
  saúde técnica não é resultado; é restrição sobre todos eles. A regra vira **NFR**; cada violação de hoje vira item de **Fix** com
  `violates:: NFR-xx` (por que é dívida) e, opcional, `slows::` (a feature ou o resultado onde os juros aparecem, o que dá a
  prioridade). Dívida sem NFR que ela viole: ou falta escrever o NFR, ou é preferência e não se paga. **Exceção:** quando o
  problema técnico é sentido por quem usa (por exemplo, usar no celular é parte do valor), é story de um resultado, não dívida.
  Vai para as skills: o dono do topo do grafo, o dos requisitos, os juízes e a bootstrap. Um sensor que cobre o `violates::` fica
  como candidato.

- **2026-10-18 10:35** · **A correção dos 9 pontos do `pedroso-incorp`: duas causas que se repetiram.** (a) *A regra existia e o sensor era cego à forma do ID.*
  O ponto 2 («Done com task aberta») já era regra do grafo (`feature_done_tasks_open`, `edge_verified_by`), mas o filho escreve
  `T-230` e `REQ-F-05`, e o sensor só lia `TASK-nn` e `REQ-nn` — via zero tasks e zero REQ e dava verde. A regra virou
  `done_feature_complete` e lê qualquer caixa `- [ ]` e qualquer REQ definido, seja qual for a forma do ID. **Lição:** regra de
  status que depende de um padrão de ID reconhecer o ID falha em silêncio; o teste de um sensor de «tudo fechado» precisa de um
  caso com a forma de ID de um filho real. (b) *O check manda fazer X e não pergunta o que o leitor exige depois de X* — três
  vezes: o `type:` sem o `status:` (`report-names@4`), o design system sem o `**Status:**` (`design-system@4`), a nota que se aplica
  com o trabalho em aviso aberto (`open_warning_notes`). Nos dois primeiros o leitor é a tela do Control Center, e agora cada check
  usa a expressão do leitor e um teste de compatibilidade prende os dois. Efeito nos filhos: harness 0 achados novos; fin-control
  +1 no grafo, 9 críticas com tipo e sem `status:` e nomes fora da regra em `harness-feedback/` (aviso, depois do juiz); Control Center +2 achados no grafo.

- **2026-10-18 10:13** · **O `**Status:**` do design-system pegou o segundo filho.** O `mjrp-pedroso-incorp`, depois de corrigir as 18 críticas
  (`b4b2be6` de lá: 14 `closed`, 4 `superseded` em cadeia de `supersedes:`), avisa que o Control Center ainda não lê o card do
  design system: falta a linha `**Status: …**`, a mesma do fin-control em 2026-10-17 22:50. O modelo da
  `mjrp-defining-design-systems` nem tem a linha. Vai como 9º ponto no ramo `harness/pedroso-feedback-20261018`
  (`design-system@4` com a mesma expressão do leitor, nota CM, teste de compatibilidade). O que se repete em dois filhos não fica na fila.

- **2026-10-18 10:03** · **Dois juízes se contradizem: um pede `type:`, a tela reprova o `type:` sem `status:`.** O conform do
  `mjrp-pedroso-incorp` obedeceu ao aviso do `report_types_check` e deu `type: ux-audit` a 17 críticas antigas, só isso (commit
  `53499cd` de lá). O Control Center exige `status:` em toda crítica com cabeçalho e passou a mostrar as 17 como "não deu para
  ler" em "Pendente com o humano". Antes elas não tinham cabeçalho e se liam pelo nome. **Lição:** quando um sensor pede um campo
  que a tela lê, ele tem que pedir **tudo** o que a tela exige junto com esse campo. A lista de tipos passa a declarar os campos
  obrigatórios de cada tipo, e um teste prende a lista ao vocabulário da tela (8º ponto do ramo
  `harness/pedroso-feedback-20261018`). A tela também falhou: 17 linhas iguais e o motivo escondido (UAT-255).
  *2026-10-18 10:33:* o fin-control também — 8 críticas com `type: ux-audit` sem `status:` (commit `4573cba` de lá, o conform do
  `report-names@2`). Dois filhos, a mesma causa: confirma que a cura é no sensor, não em cada filho.

- **2026-10-18 09:44** · **O conform do `mjrp-pedroso-incorp` achou mais 7 furos de checagem que o deixaram passar** (relatório
  `reports/audits/2026-10-18-pedroso-incorp-conformance-audit.md` § O que o harness faz com isto). (2) o grafo de requisitos
  passou com seis features `Done` com tasks abertas e REQ sem `verified_by` — quem achou foi o juiz `mjrp-ensuring-sdd`, como P0;
  (3) o arquivo de juiz não aceita âncora no arquivo que o contrato declara (`sensors.visual.config`); (4) nada cruza o PRD
  § Entregue com o `status:` dos specs («F01 … Done» no PRD, `In progress` no spec); (5) a âncora do juiz envelhece — o trecho
  segue na linha, mas o arquivo mudou depois do `judged:`; (6) `--check-note CM-0043` passa com o trabalho da nota por fazer
  (19 avisos de tipo abertos); (7) `report-names` não cobra o nome em `reports/harness-feedback/`; (8) `record-shapes` sai duas
  vezes no `--audit-plan`. **Lição:** o juiz de conteúdo achou o que o script deixou passar — cada achado de juiz que um script
  poderia ter pego vira regra do script; e uma nota não se aplica com o trabalho dela em aviso aberto.

- **2026-10-18 09:41** · **Uma linha de `## History` do próprio harness, com a hora «00:3x», reprovou o conform do `mjrp-pedroso-incorp`.**
  A página `conformance-notes` vai para os filhos pelo refresh (`docs/wiki/harness/`), e lá o `record-shapes@2` (CM-0044) julga o
  formato das linhas de History de hoje em diante — hora `HH:MM`. Um agente do harness escreveu «00:3x» por não ter conferido a
  hora; o harness não julga o próprio wiki com essa checagem (ela vale para code-app, e o harness é `meta`), então só o filho
  viu. **Lição:** o que o harness manda para os filhos passa, antes, pelas checagens que os filhos rodam; e hora se escreve de
  `TZ=America/Sao_Paulo date`, nunca estimada. Relatado pelo agente do conform do pedroso-incorp.

- **2026-10-17 23:10** · **Renomear um projeto filho quebrou o Control Center — e o roteiro do rename não sabia.** O rename do
  `mjrp-pedroso-construction-sw` para `mjrp-pedroso-incorp` cuidou da pasta, do worktree, do remoto, da memória do Claude
  Code e do contrato do harness, mas não da lista de projetos do Control Center (`~/.mjrp/control-center/workspace.json`),
  que é feita uma vez e depois só lida: o seletor ficou com o nome antigo e a tela disse "não tem grafo de requisitos".
  **Lição:** todo lugar que guarda o caminho de um projeto entra no roteiro do rename; e a lista de projetos da tela tem de
  se acertar sozinha com o disco (UAT-253), não depender de alguém lembrar de editar um arquivo.

- **2026-10-17 23:07** · **A auditoria do fim do conform julga a forma melhor do que o conteúdo.** Hoje um agente separado lê o resultado
  nota a nota e amostra três issues, três resultados e três renomes — mas os artefatos canônicos (`arch.md`, `data-model.md`,
  `info-arch.md`, `design-system.md`, o PRD, o ROADMAP, o VISION, a constitution, os requisitos, spec/plan/tasks) passam se
  existirem com as seções, sem que ninguém com o olho do papel os julgue. O MJRP: "o juiz de auditoria do bootstrap deveria
  ser mais crítico quanto aos conteúdos dos arquivos canônicos também, invocando as skills corretas para julgar". **Por quê:**
  a auditoria nasceu para pegar "registrado sem ter sido feito" (a forma); o catálogo diz quem é dono de cada item, mas não
  quem o julga. **Lição:** cada item canônico declara a skill que julga o seu conteúdo, e a auditoria do conform a invoca —
  o auditor não julga arquitetura nem produto com o olho de quem só confere checagem.

- **2026-10-17 23:00** · **Um agente de filho chamou a `mjrp-pdlc-bootstrap` de "a skill dona do `prd.md`".** O texto diz o contrário (a
  `prd-guide.md`: o topo do PRD é do PM, o humano; os requisitos, da `mjrp-writing-reqs`), mas a estrutura induz o erro: (1) o
  modelo do PRD, do VISION, do ROADMAP, da constitution e do behavior e o guia do PRD moram na pasta da bootstrap, porque ela
  cria o esqueleto; (2) hoje o agente da fila do catálogo pôs `owner_skill: mjrp-pdlc-bootstrap` nos itens `vision`,
  `constitution` e `behavior` — dono pelo lugar do modelo, não pelo papel —, e ninguém conferiu; (3) o `prd.md` não é item do
  catálogo. O MJRP: "desde quando bootstrap é dono de artefato de produto, do conteúdo dele?". **Lição:** quem cria o
  esqueleto (a bootstrap) não é dono do conteúdo; o dono é a skill do papel, e o modelo mora com o dono — o lugar de um
  arquivo vira autoridade para quem o lê.

- **2026-10-17 22:50** · **Do fin-control (`reports/harness-feedback/2026-10-17-canonical-artifacts-not-checked.md`): três coisas
  passaram por todos os juízes.** (1) O `design-system@2` passa, mas o Control Center não lê o arquivo sem a linha
  `**Status:**` — o `check` do item não olha o que o leitor exige; (2) o CI que a bootstrap manda criar
  (`environment-setup.md`, passo 4) não existe e nada acusa; (3) o `requirements.format` do contrato, que a Verificação da
  bootstrap pede, falta e nada acusa. E o sensor `smoke` dele leva 492 s contra o teto de 300 s do `doctor.py`. **Por quê:**
  o item do catálogo e o leitor da tela são duas fontes da mesma regra; e o que uma skill "exige" em texto não é checagem.
  **Lição:** o `check` do item exige o mesmo que o leitor da tela (a mesma expressão), e o que a bootstrap manda criar vira
  item. Decisão do MJRP (2026-10-17): os três viram itens do harness; o teto do `smoke` vira ajuste no harness.

- **2026-10-17 22:50** · **O `session_journal` acusou respostas "sem registro" que estavam registradas — porque leu o log errado.** No
  `mjrp-pedroso-incorp` o conform rodava num worktree (`.claude/worktrees/…`); o hook leu o `docs/log.md` do checkout
  principal, não o do worktree, e cobrou registros que existiam no ramo. **Lição:** hook que lê arquivo do projeto resolve o
  caminho pelo diretório da sessão (a raiz do worktree), nunca pela raiz do repositório principal. Achado relatado pelo agente
  de lá; a correção é do harness.

- **2026-10-17 22:48** · **Relatórios sem tema no Control Center — e um deles com o tipo que o próprio harness criou no mesmo dia.**
  O MJRP viu 6 relatórios do fin-control em "outros": dois `type: conformance-audit` (o modelo da auditoria do conform, criado
  hoje na frente 2), um `tech-debt-survey` que nenhuma skill escreve e três de 13/10 sem cabeçalho. **Por quê:** (1) o tema
  sai do `type:` por uma lista fixa **no código da tela** (`rules/reports.py`), que ninguém atualiza quando uma skill ganha um
  tipo; (2) dos modelos de relatório das skills, só dois declaram `type:`; (3) nada cobra o `type:` de quem escreve — o
  `report-names` olha só o nome do arquivo. Cada skill que julga escreve o próprio relatório, então não há um dono único para
  lembrar. **Lição:** vocabulário que a tela usa para agrupar mora **no harness**, como dado (tipo → tema → skill dona), e a
  tela o lê; todo modelo de relatório declara o tipo; a checagem cobra quem escreve, no commit do filho. Quem cria um tipo
  novo (como o `conformance-audit`) o põe na lista no mesmo commit.

- **2026-10-17 21:16** · **O conform deu "conforme" com 36 modelos canônicos fora da cobrança — e nenhum sensor acusou.** Em 2026-10-16
  11:27 o MJRP decidiu na tela 38 modelos das skills (`85cd8f7e`); 36 foram para a `awaiting_item`, a fila **do agente** para
  virar item do catálogo (o que conferir, a quem se aplica, a nota CM). Ninguém executou. No dia seguinte o conform do
  `pedroso-construction-sw` terminava com 0 lacunas sem cobrar o `arch.md`, que o MJRP marcou como "tem que estar em todos os
  subprojetos que tenham código". **Por quê:** (1) o portão do Learn conta a fila como **cobertura** e só avisa depois de 14 dias,
  sem nunca mudar o exit; (2) o critério de fim do conform é a checagem dos **itens** — o que ainda não é item não existe para
  ele; (3) nada impede a sessão de fechar o conform antes do critério; (4) quando o MJRP perguntou, eu li a fila como pendência
  **dele** ("espera o seu `Catalog-editorial:`") e não do agente. **Lição:** a decisão do humano que vira trabalho do agente tem
  prazo curto e reprova quando vence; a fila não conta como feita; o conform não fecha com o catálogo incompleto e declara o seu
  critério de saída no `stop_gate`; e antes de dizer "espera o MJRP", confere-se no registro quem deve o passo. O MJRP: "o que eu
  espero é o modo conformance, não achando o que está no catálogo canônico, tomar a iniciativa e corrigir".

- **2026-10-17 21:16** · **Uma regra sem remédio vira improviso do agente.** O sensor do grafo já acusava feature que cruza releases
  (`feature_single_release`), mas nada dizia o que fazer: o conform do `pedroso-construction-sw` recomendou fatiar a F01 "uma
  feature por release" — e só depois viu Done as stories que ia mover. **Lição:** checagem nova traz o remédio escrito (a story
  entregue fica com a feature que a entregou; o `planned_for` de uma Done é a release em que saiu; nunca uma feature por release)
  — agora no `pdlc-loops` § 5, na `feature-size.md` e na bootstrap.

- **2026-10-17 21:16** · **A regra do tamanho de referência media linhas, não tamanho.** "Acima de 100 linhas, sumário" deixava passar a
  `product-structure-gaps.md` com 82 linhas e 11 mil caracteres (linhas de tabela de 900): um agente que lê o começo perde o
  resto. E as skills de hoje foram editadas sem a `mjrp-crafting-skills`. **Lição:** mede-se por caracteres também (8 mil), o
  remédio preferido é quebrar por assunto com mais linhas no índice, e editar skill passa pela skill de manutenção.

- **2026-10-14 20:19** · **A "cópia descartável" de um filho era um link para o filho real, e o teste escreveu nele.** No teste
  da `mjrp-organizing-product-structure` o agente criou a cópia do fin-control com `mkdir -p <scratchpad>/portfolio && rsync
  … <scratchpad>/portfolio/mjrp-fin-control-2026-27/`: a pasta `portfolio/` do scratchpad (que é da sessão inteira, não do
  agente) já existia, criada por outro agente às 15:24, com **links simbólicos** para os projetos reais. O `rsync` foi para
  o próprio repositório e as três rodadas (ROADMAP, 70 `planned_for`, dois `tasks.md`, uma entrada no log) caíram no
  fin-control real. Percebido no `ls` do portfólio do Control Center; desfeito em minutos, linha por linha, conferindo cada
  arquivo contra a cópia feita antes de cada edição (`git status` do filho igual ao de antes; nada commitado). **Por quê:**
  `mkdir -p` aceita pasta que já existe, e o nome "cópia" não prova nada. **Lição:** cópia de projeto real nasce numa pasta
  **nova** (`mkdir` sem `-p`), e o script que escreve nela recusa o caminho cujo `realpath` cai na pasta dos projetos —
  a mesma conferência vale para qualquer teste "numa cópia" (o protocolo dos evals da skill a cita).

- **2026-10-14 20:16** · **Metade de um card fora do produto desde a F09, e o juiz visual verde em toda passada.** No Control
  Center, "O harness, em camadas" nunca desenhou as cinco capacidades (UI-65) que o protótipo traz do v3.5 ao v4.6, e o MJRP
  achou no site (UAT-140). **Por quê:** (1) o juiz de paridade compara o card pelo **título** (e pela contagem, a ordem e um
  catálogo fixo de componentes da casca) — nenhum fato descreve o que o card contém, então o card com metade do conteúdo dá
  os mesmos fatos; (2) a reconferência de 2026-10-11 viu a falta e a chamou de "fora da 1.0", porque o `data-model.md` dizia
  isso — um corte **do agente**, de 2026-10-09, que nunca passou pela tabela de "diferenças pretendidas" do juiz, a única que
  exige a decisão datada do MJRP; (3) seis protótipos aprovados depois mostravam o card inteiro, sem marca do corte. **Lição:**
  um corte de escopo que deixa a tela diferente do protótipo aprovado **é** uma diferença pretendida e só vale entrando na lista
  do juiz com a decisão datada do MJRP — corte que mora só no `data-model.md` ou numa story é invisível para quem aprova a tela;
  e um juiz que compara cards só pelo título deixa passar o card vazio. O juiz ganhou a regra 13 (a anatomia do card,
  `apps/control-center/web/visual/anatomy.mjs`), provada pela mutação (o card antigo: P1 8 em 8 condições; o juiz de antes: 0).
  **Aberto:** a regra cobre só o card declarado; levar a anatomia a todo card com partes, e a checagem "todo corte de escopo
  visível está na tabela de diferenças pretendidas", é decisão do MJRP (F21, `apps/control-center/docs/specs/features/F21-layers-card/`).

- **2026-10-11 12:09** · **O Delivery entregou tela que não bate com o protótipo aprovado, com todos os sensores verdes.** No UAT
  do Control Center 1.0 o MJRP abriu a tela e achou, de cara: os componentes de UI padronizados do protótipo ausentes, o
  minimizar e expandir que valia para todos os cards em todas as telas, a marca "MJRP" no topo, a ordem do menu — "muitos
  detalhes de UI falhando". **Por quê:** (1) nenhuma feature comparou a tela com o protótipo. A conferência no navegador
  (`PRINCIPLES.md` I.12) foi lida como "vista rodando" e conferiu os critérios de aceite do `spec.md`, um por um, por
  texto e DOM (`read_page`, `get_page_text`), quase sempre com o painel oculto e sem captura. Só a F10 escreveu "comparado
  com o protótipo v4.1", e mesmo assim por leitura. (2) Nenhum Playwright, nenhuma captura lado a lado, nenhuma diferença
  visual. (3) A `mjrp-ensuring-quality` não foi invocada em nenhuma feature: as skills usadas foram a
  `mjrp-specifying-sdd-artifacts` e a `mjrp-implementing-tasks`, cujo passo 5.2 aceita "screenshot, snapshot ou assert
  datado" sem exigir o protótipo como referência. (4) Os critérios de aceite apontam para estados (`points_to`), não para o
  que é transversal no protótipo — o padrão de componente, o comportamento de todos os cards, a ordem do menu, a marca —, e
  por isso nenhum spec os importou. **Lição:** "a tela bate com o protótipo aprovado" tem que ser um critério com
  mecanismo (captura das mesmas telas e estados no protótipo e no produto, lado a lado, por Playwright, julgada por quem
  não implementou), não um passo de "ver rodando" que o próprio implementador cumpre lendo o DOM.
  **Fechado em 2026-10-12 15:55** (Learn aprovado pelo MJRP às 15:41) — o que mudou e onde: (L1) a `mjrp-implementing-tasks` (passo
  5.2, o item *Screen* do check e o PR) compara a tela com o protótipo aprovado pelo sensor de paridade visual e pelos
  olhos nos pares, e não mergeia feature de tela sem a reconferência; (L2) a `mjrp-specifying-sdd-artifacts` e os modelos
  (`spec.md`, `plan.md`, `tasks.md`, o cross-check, a `constitution` da `mjrp-pdlc-bootstrap`): toda feature de tela importa
  a camada transversal do protótipo, a primeira feature de tela porta o CSS, as fontes e os componentes do design system,
  a última task é a paridade visual, e cortar algo do design system exige decisão registrada (o `theme.css` cortou as
  webfonts sozinho); (L3) a etapa **reconferência visual independente** no Delivery ([[pdlc-loops]] § 5), o modo
  *visual parity* da `mjrp-ensuring-quality`, apontada pela tabela da `mjrp-pdlc`; (L4) o juiz do Control Center virou o
  kit do kernel `mjrp-scripts/visual_parity/` (o Control Center o consome; mesma saída, byte a byte, nas três passadas
  guardadas), o contrato ganhou `sensors.visual` e o doctor a checagem **A2** ([[doctor]], ADR-0017 *Proposed*); (L5) a
  `mjrp-debugging` e a `mjrp-ensuring-quality` registram a divergência confirmada como issue no `uat.md` na hora, e o
  cartão no quadro quando o projeto tem um.

- **2026-10-11 02:40** · **A conferência no navegador achou defeito real em quase toda feature do Delivery.** No Control Center 1.0, os
  sensores (lint, tipos, testes, schema, contraste) passaram em todas as features antes da conferência, e ela ainda achou: o
  git vazio mostrado como "não lido" (F01), a marca da última visita apagada por um F5 (F02), a história parada zerada pela
  renomeação dos arquivos (F03), o plural errado (F04, F05), "Sem release" sem status e a frase da história com metadados
  (F05), "de esta máquina" (F08) — além do harness mostrado "sem kernel" contra o `data-model.md` (F04, achado ao ler o
  modelo). **Lição:** a última task de tela (o navegador, `PRINCIPLES.md` I.12) não é cerimônia; e o contrato aprovado
  (o `data-model.md`) precisa ser relido pelo orquestrador na revisão, porque o subagente implementa o plano, não o modelo.
- **2026-10-11 02:40** · **Subagente com o mesmo roteiro de commit erra igual.** Dois subagentes Sonnet escreveram a mensagem de commit
  com `-m` de várias linhas e um deles saiu truncado (F05, `7721591`); outro commitou com o lint vermelho porque o roteiro
  não barrava (F03). **Correção:** os briefs passaram a pedir `git commit -F <arquivo>` com a conferência `git log -1`, e o
  auxiliar do orquestrador roda os seis sensores antes de commitar. **Lição:** o que se repete em todo brief vira ferramenta
  — candidato no Intake ("o commit não espera os sensores").

- **2026-10-10 22:01** · **O template da feature produzia link que o doctor reprovava.** O `plan.md` e o `tasks.md` da
  `mjrp-specifying-sdd-artifacts` abrem com `spec` e `plan`, o arquivo ao lado. O I3 do doctor (a checagem de
  links) só conhecia páginas da wiki, aliases e ADRs. Então a primeira feature feita pelo template, a F01 do Control Center,
  saiu vermelha sem erro de quem a escreveu. **Correção:** o I3 resolve o arquivo irmão; caso no selftest. **Lição:** o
  template e o sensor que julga o que ele gera precisam de um teste juntos. O selftest do I3 nunca rodou sobre um arquivo
  saído do template.
- **2026-10-10 22:01** · **Instalar uma ferramenta pelo Homebrew quebrou outra.** O `brew install uv node@22` atualizou `simdjson` e
  `simdutf` como dependências e deixou o Node padrão sem as bibliotecas que ele ligava. O sensor da tela do Control Center
  falhou com exit -6, e o subagente teve de contornar com um wrapper. **Correção:** `brew reinstall node`. **Lição:**
  depois de um `brew install` numa máquina de trabalho, rodar de novo os sensores que dependem do que já estava instalado.

- **2026-10-10 21:38** · **O hook de uso de skill criou uma pasta que a própria estrutura não conhecia.** Na primeira skill
  invocada numa sessão local, o `session_journal.py skill` (o hook que conta uso de skill) gravou
  `data/raw/skill-usage.csv`. A pasta `data/` não estava declarada no `structure.yml`, então o sensor de estrutura reprovou e
  deixou o doctor vermelho na sessão seguinte, sem nada de errado no trabalho. Achado ao abrir o Delivery do Control Center 1.0.
  **Correção:** `data/` e `data/raw/` declaradas no `structure.yml`; `STRUCTURE.md` regenerado. **Lição:** um hook que cria
  arquivo precisa da casa declarada na mesma mudança. O teste do hook rodou num repositório descartável, que não tem o sensor
  de estrutura, e por isso não pegou.

- **2026-10-09 22:02** · **Registrei como decisão o que era só herança.** Ao extrair o `design-system.md` do Control
  Center do protótipo aprovado, escrevi "Padrão: L2 Navy & Gold" — mas a L2 só estava no protótipo porque veio dos
  primeiros rascunhos; ninguém a escolheu. O MJRP perguntou quem definiu, e decidiu: L8 Organic Blueprint no claro, D4
  Zen Dark no escuro. **Correção:** `design-system.md` e protótipo v3.7 com o padrão dele. **Lição:** ao extrair de um
  protótipo, separar o que o humano aprovou do que só sobreviveu; o que só sobreviveu entra como proposta, com a
  pergunta.
- **2026-10-09 21:45** · **Um teste tocou a produção outra vez — a quarta da mesma classe.** O teste ponta a ponta da guarda do
  protótipo (o hook que exige wireframe e `info-arch.md` quando o protótipo muda) rodou num repositório descartável com os hooks
  do harness, e o `post-commit` (o hook que faz o backup do repositório a cada commit) gravou bundles desse repositório no
  iCloud Drive (`mjrp-backups/e2e-psc2/`). A cópia de teste herdou um efeito que só a produção devia ter. **Correção:**
  `backup_repo.py` pula repositório sem remote — um teste nunca tem, todo projeto real com esse hook tem `origin`; caso 8 no
  selftest (`f8a8d0d`). Os bundles foram para `_to_delete/` na raiz do iCloud Drive, para o MJRP apagar. **Lição:** o
  efeito colateral de um hook se desliga pela natureza do alvo, não pela lembrança de quem roda o teste.
- **2026-10-09 21:41** · **O relógio do host não é o relógio do harness.** A ponte para o Mac e a nuvem rodam em UTC; depois
  das 21:00 de Brasília, `date.today()` já era amanhã. O refresh do kernel carimbou a versão `2026-10-10` no Control Center e
  no health-control, e o `doctor_selftest.py` passou a reprovar o caso F1 (o que confere as linhas do `## Ways of Working`
  do dia) — com isso o sensor A1 do harness (o doctor rodando o próprio selftest) ficou vermelho. **Correção:** todo script
  que carimba data ou hora usa o fuso de Brasília (`new_project.py`, `doctor.py` e o selftest, `charter_to_prd.py`, os
  `gen_*`, `loop.py`, `push.py`, `_safe.py` — `ebdf6e5`, `bab1d49`); os carimbos errados foram refeitos no refresh seguinte.
- **2026-10-09 21:32** · **O tipo da entrada do log não tinha sensor — e um leitor do log quebrou.** Às 14:01 o fin-control e
  o pedroso tinham cabeçalhos com tipo de commit (`fix`, `perf`, `feat`, `docs`) e foram corrigidos à mão; às 21:26 o próprio
  agente gravou uma entrada `decisão`, e o protótipo do Control Center, que lê o log com um mapa fechado de tipos, parou de
  desenhar a Overview. Na mesma checagem, a segunda entrada do mesmo minuto não contava ("sem entrada nova") e o commit
  esperava o relógio virar. **Correção:** `log_entry_check.py` (o hook que exige uma entrada nova no log a cada commit)
  recusa tipo fora de `session · decision · inventory · ingest · harness-feedback` e vê a entrada pela linha inteira do
  título (`c9de575`); o protótipo v3.6 mostra um tipo desconhecido sem quebrar.
- **2026-10-09 21:30** · **O gerador da Wiki do protótipo nunca entrou no repositório — e a Wiki ficou quatro dias velha.**
  A aba Wiki do Control Center mostrava a leitura de 2026-10-05 17:43: o script que a gerou morreu com a sessão daquele dia,
  e o build do v3.5 (que relia Tracking e System Monitor) não tinha como reler a wiki. A auditoria de UX tinha apontado (P2,
  aberto). É a mesma classe de 2026-09-07 (o gerador do PDF do VISION fora do repositório). **Correção:** `wiki_gen.py`
  versionado na pasta do build do v3.6; a Wiki relida a cada build (36 páginas). **Lição:** todo dado que um protótipo
  mostra sai de um script versionado ao lado dele, ou o protótipo diz que o dado é congelado.
- **2026-10-09 21:16** · **Decisão gravada no kernel não chega sozinha às skills.** A revisão geral pedida pelo MJRP achou
  cerca de 45 trechos desatualizados e 9 contradições entre as 23 skills da fábrica — a regra do subprojeto sem épico
  (15:16) não tinha chegado à `mjrp-designing-ui`, ao `mjrp-pdlc`, à `mjrp-writing-reqs` nem à `mjrp-coaching-pm`; "a
  arquitetura está sã?" tinha dois donos. O kernel estava certo; quem executa lia a versão velha. **Correção:** as skills
  corrigidas na revisão (auditoria por um agente, correção por outro) e reempacotadas. **Lição:** uma decisão de processo
  termina com a busca pelo termo nas skills e no kernel, no mesmo commit — não na revisão seguinte.
- **2026-10-09 20:35** · **O Control Center chegou a requisitos Ready sem `design-system.md`.** O MJRP perguntou se o design
  system já não devia existir; devia — o passo visual do Desenhar não tinha porta, e a identidade morava só no código do
  protótipo. **Correção:** a regra `design_system_exists` do sensor do grafo (requisito Ready que aponta para um estado de
  tela exige `docs/specs/design-system.md`), o critério de saída da Discovery, e a `mjrp-defining-design-systems` extrai a
  identidade do protótipo aprovado; o `design-system.md` do Control Center foi escrito e espera a aprovação do MJRP. O
  design system do MJRP em camadas (tokens, temas, componentes) ficou como candidato no PRD, para depois da revisão.
- **2026-10-09 20:23** · **O arquivo do requisito tinha só o número — o MJRP abria um por um.** **Correção:** o nome é
  `<ID>-<slug>.md` (o slug é o título em inglês, encurtado por julgamento até 50 caracteres), links com o nome inteiro e o ID
  como texto, `aliases: [<ID>]`; regras `node_slug` e `link_stem` no sensor do grafo; `req_file_names.py` renomeou 121 no
  harness, 22 no Control Center e 167 em cinco filhos. **Lição:** nome de arquivo é interface para o humano antes de ser
  chave para o script.
- **2026-10-09 20:05** · **A primeira passada do crítico novo achou defeitos nele mesmo.** A `mjrp-critiquing-architecture`
  rodou na ADR-0002 (a arquitetura da 1.0 do Control Center) e devolveu, além dos achados, doze problemas da skill: o exemplo
  de achado era a própria ADR-0002 (prima o juiz); as restrições do dono do produto (o *Do Not Forget* do `MEMORY.md`) não
  estavam na ordem de leitura; critérios apontavam para páginas sem o conteúdo; nada cobria falha silenciosa. **Correção:**
  o handbook de Architecture Review do MJRP virou a página `architecture-review` do kernel, com IDs estáveis por regra, e a
  skill foi refeita sobre ela (vetos quando aplicáveis). **Lição:** juiz novo roda num artefato real antes de ser confiado,
  e o exemplo dele é neutro.
- **2026-10-09 19:51** · **Quem desenhou a arquitetura também a julgou.** A auditoria da ADR-0002 (16:45) foi feita pela
  mesma skill e na mesma sessão que a desenharam — a `mjrp-designing-architecture` tinha a Architecture Review dentro. O
  MJRP sentiu falta de um crítico como o de UX. **Correção:** a `mjrp-critiquing-architecture` (Reviewer) com a revisão que
  saiu da designer; os dois críticos, UX e arquitetura, seguem a mesma separação — troca de chapéu declarada ou agente
  separado, e a auditoria diz qual.
- **2026-10-09 19:40** · **O código do protótipo não seguia a definição do data-model.** Na conferência dos wireframes o
  MJRP achou dois defeitos que o build não pegou: "apaga as 1 edições" (plural fixo) e toda story em curso aparecia
  "parada" — o `track_gen.py` marcava parado o que estava em curso, mas o `data-model.md` define parada como em curso e sem
  commit na story há 14 dias ou mais. **Correção:** a chave `ad.reset.ask1` para o singular; o `track_gen.py` lê o commit
  mais novo do arquivo da story. **Lição:** código que implementa um termo definido cita a definição e tem um caso que a
  prova.
- **2026-10-09 19:36** · **O protótipo mudou e o wireframe e o `info-arch.md` não — a regra só existia em prosa.** O MJRP
  teve de pedir os dois depois de aprovar o v3.5. O `structure_check` conferia nome e pasta; nada conferia o vínculo.
  **Correção:** `prototype_sync_check.py` no hook `commit-msg` (o protótipo `<nome>-vN.html` só entra com o `info-arch.md` e
  o wireframe de toda tela no mesmo commit; a saída do humano é o trailer `Prototype-sync: skip — <motivo>`) e o check W14
  do doctor para o que escapar; distribuído ao Control Center e aos 8 filhos.
- **2026-10-09 11:54** · **O processo mandava todo item do protótipo servir a um resultado — e separava o info-arch da tela.** No inventário do v3.3 do Control Center, o agente quis cortar ou forçar um resultado para o que é só informação (o mapa do harness, a wiki), e tratou o info-arch como etapa depois do protótipo, herança das fases em cascata. O MJRP corrigiu: um control center informa, ajuda a decidir e age — informação é produto, não resultado; e o info-arch mora junto com o desenho da tela. Decisões dele: cada item do inventário termina numa função do produto (da Visão) ou num resultado, ou é cortado; `design/wireframes/` anda com o inventário; o kernel ganha temas; a biblioteca de paletas vai para o kernel (tema design). Brief e plano no `docs/log.md` desta data.
  **Correção (fechada em 2026-10-09 13:51):** (1) a `VISION.md` do Control Center declara as três funções — informar, ajudar a
  decidir, agir; (2–3) as quatro skills de tela viraram a `mjrp-designing-ui` — a tela e a descrição dela (texto,
  inventário com wireframe, `info-arch.md`) numa rodada só, cada item do inventário com destino na coluna *Serve a*
  (função do produto, `^OUT-xx` ou corte), e a leitura da reação como PM foi para a `mjrp-coaching-pm`; (4)
  `design/wireframes/` declarada, conferida pelo sensor de estrutura e criada em todo projeto novo; (5) o kernel por
  tema na fonte (ways-of-working, skills, architecture, roadmap, design), o filho achatado com o índice por tema; (6) a
  biblioteca de paletas no kernel, tema design. Os temas são refinados depois da revisão dos grupos da wiki no v3.4.
- **2026-10-09 11:10** · **Eu pus um passo que o plano não pedia na frente da tag.** Listei "rodar os cenários de eval das
  ondas A–D" como condição da tag `v0.0` (a marca do fim da migração para o PDLC em loops); o plano só exige o cenário
  **escrito** por skill. O MJRP já esperava a tag. **Correção:** a tag saiu; rodar os cenários foi para fora do caminho
  crítico. **Lição:** a porta de um marco é a que o plano aprovado declara — o que o agente acha prudente vira proposta, não
  condição.
- **2026-10-07 18:40** · **A Discovery não usou o protótipo aprovado nem o inventário** — #harness-kaizen do MJRP. Na saída da
  Discovery do Control Center, o coach partiu das 7 perguntas do MJRP e a `mjrp-writing-reqs` ia escrever requisitos
  sem o inventário do protótipo v3.3: abas aprovadas (Wiki, harness em camadas, ciclo de vida, memória × contexto) ficavam
  sem resultado nem requisito. Causa: o inventário só nascia na 2a (`mjrp-designing-information-architecture`), depois da
  Discovery; nenhuma skill da 1b o pedia. **Correção:** o inventário vira a entrada principal da Discovery — a
  `mjrp-coaching-pm` o monta antes do passo 1, os resultados o cobrem, a `mjrp-writing-reqs` não escreve sem ele, a 2a o
  completa; [[product-discovery]] ganha o item 8 do checklist. E a falha abriu o redesenho do processo: [[pdlc-loops]]
  (Intake + Discovery · Delivery · Learn), em que o "pronto" da Discovery é todo item do inventário com destino —
  checável por sensor.
- **2026-10-07 11:07** · **O coach perguntava os quatro riscos como "baixo, médio ou alto" — risco sem teste é chute.** Na 1b do
  Control Center, a `mjrp-coaching-pm` só nomeava os riscos; não tinha procedimento para transformá-los em teste. O MJRP
  corrigiu (*"como vc ajuda o PM a pensar nessas 4 dimensões ... pra testar valor, usabilidade e viabilidade técnica?"*) e
  pediu que o processo da Discovery fosse estruturado e escrito no harness, com o handbook dele como fonte (#harness_kaizen).
  **Correção:** página do kernel [[product-discovery]] — a v2 do Handbook MJRP de Product Discovery: Rapid em 5 passos, Full
  com catálogo de 12 técnicas, cada risco com "o que precisa ser verdade · evidência · teste mais barato", decisão matar ·
  iterar · avançar. Falta o `reference/` da skill, depois da leitura do MJRP. **Lição:** quando a skill só nomeia um
  conceito, o agente preenche o vazio com a pergunta mais fácil; o processo tem de dizer o que se pergunta e o que se produz.
- **2026-10-06 16:06** · **Resultado e épico não tinham categoria — o filtro por tema dependia de alguém ler o título.** Ao
  definir os dois resultados do Control Center (ver e governar), o MJRP notou que ambos são "Gestão Visual Virtual" e
  pediu que todo resultado do ROADMAP e todo épico venham com uma tag que os classifique (#harness_kaizen).
  **Correção:** campo `tags::` — resultado com 1 a 3, épico herda e soma até 3 próprias, vocabulário livre (formato e
  quantidade); regra `tags` no sensor do grafo e no selftest, `--tags` lista com a herança; página
  [[requirements-graph]], verbetes no [[terms]], modelos da `mjrp-pdlc-bootstrap` e a `mjrp-coaching-pm` escrevem o
  campo. **Lição:** categoria que mora só na cabeça do humano não aparece na tela; se vai ser filtro, é campo com
  sensor.
- **2026-10-05 17:37** · **Uma proposta só caía em `design/proposals/` se o agente acertasse.** A proposta de entrada da
  aba Wiki do Control Center se chamava `wiki-entry-options.html`: a regra de nome do `structure_rules.json`
  (`proposal` → `design/proposals`) só valia dentro de `docs/`, e o nome nem dizia "proposal". O MJRP perguntou
  como garantir que toda proposta, HTML ou PNG, vá para lá. **Correção:** regra nova `name_decides` — o arquivo
  cujo nome termina em `-proposal` só mora em `design/proposals/`, julgado na raiz, em `design/` e em
  `reports/` (código fica de fora); vale no hook de escrita, no pre-commit e no W9 (estrutura fora da
  natureza); as duas skills que propõem em três níveis nomeiam `<eixo>-proposal.<ext>`. Primeiro achado: dois
  diagramas `*-skill-roles-proposal` em `design/diagrams/`. **Lição:** lugar garantido é o que o nome do
  arquivo carrega; instrução na skill sem sensor é esperança.
- **2026-10-04 14:21** · **Uma compactação de contexto quase apagou decisões do MJRP — o registro dependia de hábito.**
  As respostas do passo 10 da S-63 só sobreviveram no resumo automático da AI Platform; o log e o `## Now`
  não as tinham, e o F1 passava porque media a data do `MEMORY.md`, não o conteúdo. O MJRP perguntou se a
  solução contra perda de contexto tinha rodado: não — a S-61 estava em Backlog. **Correção:** a S-61
  implementada no mesmo dia (`commit-msg` com entrada obrigatória no log, `## Now` julgado pelo conteúdo,
  hooks de diário e retomada, regra na `mjrp-onboarding` para a sessão remota) — [[memory-architecture]].
  **Lição:** regra que depende de o agente lembrar falha justamente quando o contexto some; ela tem que
  morar onde roda sempre — aqui, no git.
- **2026-10-02 18:53** · **O git pela ponte da AI Platform não apaga as próprias travas — a causa das travas órfãs
  em todos os filhos.** Sem a permissão de apagar concedida na sessão, o git commita, mas não consegue
  remover `HEAD.lock`, `index.lock`, `next-index-*.lock`, `objects/maintenance.lock` nem os
  `tmp_obj_*` que cria: o harness tinha 1.626 temporários acumulados e um `index.lock` de 29/09 que
  impediu as duas passadas agendadas do inventário de commitarem. O W10 (28/09) mostrava a trava e o
  `mv` que sara, mas tratava o sintoma. **A lição:** sessão que vai operar git pela ponte pede a
  permissão de apagar no começo (era a proposta 4 do parecer do fin-control, de 27/09, aceita só como
  higiene) — e o onboarding precisa dizer isso, não o handoff. **Corrigido (2026-10-02 19:01):** a `mjrp-onboarding`
  pede a permissão no começo, o `AGENTS.md` e o template do `new_project.py` dizem o mesmo.
- **2026-10-02 18:53** · **O harness tinha a ida do protótipo, não a volta.** A Inception (21/09) ensinou o harness a
  ver antes de definir; nada levava o que o humano aprovou no protótipo até o build — o `info-arch.md`
  era escrito como se a tela não existisse, e item aprovado podia sumir sem ninguém decidir. Parecer
  vindo do brainstorming do YouTube Control Center; o titular corrigiu a leitura do agente duas vezes:
  não é achar o que falta (isso é o IN-09/IN-10), é **não perder o que existe** — e o protótipo é
  **baseline, não molde**. Virou o mapeamento reverso: inventário com destino por item, W11 no doctor.
- **2026-09-28 09:21** · **O harness não tinha catálogo de componentes de interface — cada protótipo
  reinventa tabela, caixa recolhível e filtro, e nada garante que o build use o mesmo que o protótipo.**
  Levantado pelo MJRP como kaizen: elementos básicos (tabela com ordenação e filtro, caixa
  expansível/recolhível, card, abas, barra de filtro, estado vazio…) deveriam nascer como artefatos
  iniciais do projeto e ser reaproveitados em protótipo e interface. Evidência no próprio harness: o
  Control Center reinventou cards recolhíveis e abas a cada versão (v1 → v3.1); o [[design-canon]] diz
  *como* uma tela deve ser, mas nenhum artefato diz *o que já existe* para reaproveitar. **A lição:**
  uso garantido não vem de regra na skill (é o vazio de verificação registrado em 16/09 no `MEMORY.md`),
  vem de duas coisas — o componente ser o **caminho mais fácil antes** de a tela existir, e um **sensor
  que acusa o desvio depois**, com rigor crescente por fase: protótipo rápido (kit pronto embutido,
  só aviso — tem de continuar rápido); protótipo no gate de protótipo de UI (princípio I.13: verificação
  com ID no `mjrp-ux-critic`, P1 bloqueia; desvio justificado vira candidato ao catálogo, não dívida);
  build (sensor de marca no doctor e no pre-commit, frescor da cópia vendorizada, testes de contrato de
  teclado/ARIA/celular na suíte do filho). A base comum: **um único código** do protótipo ao build,
  vindo do kernel — sem tradução entre fases — e uma **marca estável** por componente
  (`data-mjrp="…"`) que torna o uso contável. **Limite:** o sensor garante presença, não bom uso; se a
  tabela era a escolha certa segue com o critic e o humano. Estado (2026-09-28 09:40): o MJRP encaixou no escopo do
  EP-07 (Discovery & Prototipação), depois do EP-08 1b — `docs/specs/prd.md`. **Correção do MJRP (2026-09-28 09:42):**
  a regra "reaproveitar antes de criar" com P1 bloqueando no gate foi rejeitada — *"mata
  criatividade, não pode ser diretiva"*. Vira **lembrete**: verificar também a alternativa de
  reaproveitar, e criar componente novo segue legítimo. A critic lembra, nunca bloqueia por isso.
  É a segunda vez do mesmo vício (ver o achado de 2026-09-21 19:00): em fase de design a skill
  **oferece** a opção, não impõe — o que se garante é que o reaproveitamento seja *considerado*,
  não que seja *usado* No build (2026-09-28 09:51), o MJRP decidiu: o sensor reprova só **infidelidade ao
  protótipo** — quando o protótipo aprovado usou um componente do catálogo e o build reescreveu a
  peça em vez de importar o mesmo código. Reaproveitamento nunca é cobrado; fidelidade ao aprovado, sim.
- **2026-09-21 19:00** · **O harness não tinha caminho de "ideia → tela para reagir → requisito", e o agente
  escreveu regra onde devia oferecer.** O EP-08 (Control Center) nasceu de uma ideia em alto
  nível; ao pedido "quero um protótipo", o agente renderizou sem enquadrar — sem info-arch, sem
  pergunta de teste, sem chamar ux-ui-designer/interface-designer — e a `mjrp-ux-critic` reprovou
  (4 P0: CP-02, DE-01, DE-06, IN-06; `apps/control-center/docs/specs/ux-audit.md`). Diagnóstico
  do MJRP: o achado não era da tela, era do processo — o lifecycle assumia "definir → renderizar",
  e um humano visual descobre "vendo → reagindo → definindo". Nasceram a **FASE 1a Inception** e
  a **`mjrp-inception`** (interface designer + PM com questionamento SVPG, fundidos). Na
  primeira redação, o agente repetiu o vício em outra forma: "≤1 rodada", "lo-fi", "2–3
  rodadas", "quem julga é o humano, a critic não", "vai ao 2c" — regra fixa numa fase que existe
  para descobrir. O MJRP reescreveu: *"pode… conforme a preferência do usuário"*, *"fica a
  critério do humano"*, *"o humano ajuda a decidir"* — e rejeitou "sonda" (jargão do agente, não
  do processo humano). **A lição, em três camadas:** (1) Discovery e Inception são o diamante
  abrindo — a skill dessas fases **oferece, recomenda e pergunta**; regra fixa ali mata o que a
  fase deveria produzir; (2) a regra ainda cabe, **restringindo o agente**, nunca o humano ou o
  processo — "não inventar dado como real" fica; "para quando…" sai; (3) o vocabulário é o do
  humano. A regra de escrita entrou na `mjrp-crafting-skills` (é ela que escreve as skills) e no
  Ways of Working; a inspeção semântica com esse critério achou 11 ajustes em svpg,
  ux-ui-designer, prompt e lifecycle — todos troca de modal, não reescrita. **Mecanismo:** o
  parecer veio de um subprojeto aninhado (`apps/control-center/docs/harness-feedback/`), que o
  `harness_feedback_check.py` não varria — passou a varrer. Loop inteiro (campo → juiz → parecer
  → cânone/skill) numa sessão. Fonte: Buxton, [[sketch-vs-prototype]].
- **2026-09-19 09:37** · **Scheduled task com `requires_local_device` que trava em `get_device_info().connectedFolders`
  vazio é auto-sabotagem — o campo vem vazio nas sessões agendadas frias mesmo com o Mac alcançável; o
  caminho certo é `device_bash` direto no path absoluto.** O sensor #62 (sincronia Repo↔Cowork) falhou em
  18 e 19/09: a execução agendada abortava em ~7s com "connectedFolders is empty" e notificava sem rodar. A
  "correção" de 18/09 (deletar e recriar o trigger com `folders` explícito) tratou o sintoma errado — o
  trigger passou a ter `folders_state: PRESENT` e mesmo assim a sessão agendada seguiu com `connectedFolders`
  vazio. A prova de que o gate era a causa veio do trigger vizinho: o **inventory** roda todo dia com
  `folders_state: NONE` (nenhuma pasta declarada) e funciona — 11 min de trabalho real em 19/09 — porque o
  prompt dele vai direto em `device_bash /Users/maujrp/mjrp/projects/mjrp-harness` sem checar `connectedFolders`.
  Declarar a pasta no trigger não popula o `connectedFolders` da sessão agendada, e não declarar não impede o
  `device_bash` com caminho absoluto. **A lição:** num prompt de scheduled task que precisa do Mac, nunca
  usar `connectedFolders` como gate de "posso continuar?" — ir direto no `device_bash` com path absoluto e só
  parar se a chamada `device_bash` em si falhar (transitório "disconnected/closing" → 1 retry; qualquer outro
  → parar e reportar). Prompt do #62 reescrito assim em 19/09 (re-assinado pelo Mac, pois o trigger exige o
  computador). Ver também `docs/log.md` [2026-09-18 12:25]. Corolário: `last_run: SUCCEEDED` de um scheduled
  task só diz que a sessão subiu e encerrou, não que o trabalho foi feito — o #62 "teve sucesso" abortando. **Desdobramento (10:35):** tirar o gate não bastou — o `device_bash` no path absoluto foi RECUSADO na sessão agendada ("No folders are connected to this device for the current session"), enquanto o inventory, sem pasta declarada (`folders_state: NONE`), escreve no Mac todo dia. A causa real: **declarar `folders` no trigger quebra o `device_bash` da sessão agendada** — o grant daquela pasta foi concedido numa sessão interativa e não persiste para runs agendados; a sessão então tenta montar a pasta declarada, falha, e recusa todo acesso. Sem pasta declarada, o bridge concede acesso à árvore normalmente e o `device_bash` com path absoluto funciona. Como `update_trigger` não remove `folders`, o #62 foi recriado sem pasta (`trig_013Q…` → `trig_01Gq48WfUC8zkmQHDqev6sxD`). **A lição final:** scheduled task que precisa do Mac roda com `requires_local_device: true` e **sem** `folders` declarado, indo direto no `device_bash` com path absoluto — declarar a pasta é contraproducente para runs não-supervisionados. **Correção (11:02):** a hipótese acima foi REFUTADA no run frio seguinte — sem pasta declarada o `device_bash` também é recusado ("No folders are connected to this device for the current session"). O run de 82s que parecia validar rodou quente (disparado pela criação numa conversa ligada ao Mac), não frio — erro de validação (ver Ways of Working 15/09). Verdade atual, sem hipótese: numa sessão agendada fria o `device_bash` não recebe pasta conectada, com ou sem `folders` declarado; só `get_device_info` responde. O inventory (agendado, sem pasta, 11 UTC) acessa o Mac e o #62 (10 UTC) não — a única variável isolada é o horário, não a config do trigger. Ação tomada: mover o #62 para 11:30 UTC (após o inventory) como teste de horário, não como causa provada. **Lição de método:** não declarar "resolvido" a partir de um disparo manual/quente — só um run agendado frio valida um fix de scheduled task; e desconfiar de hipótese que "explica" mas não foi testada no cenário real que quebrava.
- **2026-09-18 10:14** · **`rm` nos `.git/*.lock` órfãos falha mesmo com `device_request_delete_permission`
  confirmado — `mv` no mesmo arquivo funciona; o achado já tinha se repetido em silêncio em 11/09, 16/09 e
  17/09.** Toda vez que um `git commit`/`add` foi interrompido (sessão anterior encerrada, timeout), sobra
  um `index.lock`/`HEAD.lock` de 0 bytes que bloqueia o próximo `git` com `File exists`. A resposta óbvia —
  pedir a permissão de delete pro `device_request_delete_permission` e rodar `rm` — não funciona: a ponte
  remote-devices confirma a concessão ("File deletion is now enabled...") mas o `rm`/`os.remove()` seguinte
  continua batendo em `Operation not permitted`, inclusive em arquivo novo fora do `.git/`. Sessões
  anteriores já tinham topado com isso (os `.lock.stale.*` de 11/09, 16/09 e 17/09 encontrados no repo são
  a marca de outras tentativas) mas nenhuma registrou a lição — cada uma resolveu na mão e seguiu. O que
  resolve: `mv .git/index.lock .git/index.lock.orphan` (ou qualquer nome fora do padrão `*.lock`) —
  renomear escapa do gate de delete-permission porque não é uma chamada de unlink, é rename; depois disso
  o `git` volta a funcionar normalmente (ele só olha o nome exato `index.lock`/`HEAD.lock`). **A lição:**
  quando `rm`/`unlink` falha com `Operation not permitted` na ponte remote-devices mesmo após a permissão
  confirmada, tentar `mv` para um nome fora do caminho antes de escalar para o humano — e registrar aqui
  na primeira vez que funcionar, não silenciosamente resolver e seguir, senão o harness reaprende o mesmo
  workaround a cada sessão nova.
- **2026-09-14 20:04** · **O template ensinou o erro, e nenhum sensor olhava a metade episódica da
  memória.** O `mjrp-fin-control-2026-27` nasceu às 13:28 pelos **dez passos manuais** da
  `mjrp-project-bootstrap` — quarenta minutos antes de ela passar a rodar o `new_project.py` —
  numa sessão Cowork com a skill instalada defasada e sem hook nenhum. Resultado: `docs/log.md`
  batizado *"Histórico de Decisões do Projeto"* e `## Ways of Working` com **12 marcos de
  entrega num dia** ("parametrizado", "aprovado", "gerada"). O outro agente diagnosticou certo a
  instância e errou a causa ("viés de chat"); a raiz estava **aqui**: o `new_project.py` escrevia
  *"uma linha datada por decisão"* no cabeçalho de todo log novo, e a árvore da bootstrap dizia o
  mesmo — o harness ensinava a confusão que depois reprovava. E o F1 só media o tamanho de
  `Ways of Working`; **nada abria o `log.md`**. Três correções: template do `new_project.py` e
  linha da bootstrap copiados do cabeçalho canônico (não inventados — a correção do outro agente
  criou *"Registro Episódico do Projeto"*, um terceiro nome, e o sensor novo já a reprova);
  `f1_log_shape` (cabeçalho canônico + prefixo `## [AAAA-MM-DD HH:MM] tipo — título`, falha) e
  `f1_wow_growth` (mais de 4 linhas datadas de hoje em `Ways of Working`, aviso — correção de
  conduta não vem em lote; e é **aviso** porque 07/09 teve seis correções legítimas). Quatro casos
  no `doctor_selftest`. O sensor, rodado na instância, acusou o cabeçalho inventado e 5 linhas do
  dia. **Lição de mecanismo:** os dois incidentes de 14/09 (Gemini de manhã, fin-control à noite)
  têm a mesma raiz — nascimento fora do script + skill instalada defasada + sem hook fora do
  Claude Code. Guide viola-se; sensor não. O que ainda **não** tem mecanismo é o *write* da
  memória em plataforma sem hook — a `save-context-handoff` continua sendo pedido, não regra.
- **2026-09-12 12:20** · **Nem toda skill que nomeia uma plataforma está violando a regra
  plataforma-agnóstica — a `mjrp-adr` já era exceção ao critério (d), e a varredura do #40 achou
  a mesma forma no critério (a).** A `mjrp-crafting-skills` nomeia Cowork, Claude Code e Antigravity
  de propósito: o assunto dela **é** empacotar skills para cada uma dessas plataformas
  especificamente — trocar por "AI Platform" quebraria a instrução, não a tornaria mais genérica.
  A mesma varredura também achou dois sentidos diferentes para a palavra "Gemini": a plataforma
  de codificação (violação, trocada por "AI Platform") e um produto do Google citado como fonte de
  dado — Gemini Notes do Gmail (`mjrp-meeting-notes-batch`), a API de um app implantado
  (`mjrp-deployer`). **A lição:** o critério "sem nome de plataforma" não é lexical — é "esta skill
  descreve o harness assumindo qual ferramenta o executa?". Quando o nome da plataforma É o assunto
  (empacotamento) ou nomeia outra coisa (um produto de terceiro que a skill consome), a exceção é
  correta, e generalizar o texto às cegas troca precisão por conformidade de forma.
- **2026-09-12 10:07** · **Citação conferida a olho não é citação conferida.** O playbook dos cinco
  conceitos é feito de citação literal — e, ao rodar um script que compara cada trecho entre aspas
  com as páginas da wiki, **15 de 214 não batiam**. Nenhuma era invenção: um "do que" engolido, um
  ponto final que migrou para dentro das aspas, duas frases da mesma fonte fundidas numa só, um
  travessão que virou parte da citação. Erros invisíveis na releitura e fatais numa página que se
  vende como "na letra do campo". O `check_quotes.py` nasceu como critério de saída do brief e
  achou todos em três segundos; hoje roda dentro do `gen_agentic_concepts.py --check`. **A lição:**
  o II.3 — *o agente não é o juiz* — vale para **prosa**, não só para código. Toda vez que um
  entregável afirma fidelidade a uma fonte que existe em arquivo, a fidelidade é **verificável por
  mecanismo**, e verificar é barato; o caro é descobrir depois que o deck citava errado. Onde houver
  fonte em disco, o critério de saída não é "reli e está bom", é um script com exit code.
- **2026-09-11 11:05** · **A `mjrp-project-bootstrap` estava atrasada em 14 pontos — e o pior
  deles era estrutural: ela não criava o contrato.** A revisão nasceu de um achado pequeno (o
  guia do `VISION.md` de lá não tinha campo de visão) e a suspeita do MJRP de que o resto
  estivesse igual se confirmou. Os três que importam: (1) nenhum dos 10 passos criava o
  `.mjrp-project.yml` — todo projeto bootstrapado nascia **invisível** para `onboarding`,
  `lifecycle` e `doctor`, que leem o contrato primeiro, e a sessão seguinte caía na heurística;
  (2) a camada de memória inteira faltava — sem `MEMORY.md`, sem `wiki/`, com `docs/sessions/`
  aposentado desde 09/09 ainda na árvore; (3) **nenhum critério de saída** — o bootstrap
  terminava sem rodar sensor nenhum, num harness cuja tese é que erro se pega por mecanismo.
  Lição: **skill de setup envelhece calada.** Ela roda uma vez por projeto, no começo, quando
  ninguém tem repertório para desconfiar do que ela manda fazer — e o custo de estar errada é
  pago em todas as sessões seguintes daquele projeto, não na sessão em que ela rodou. Isso a põe
  na mesma classe da `mjrp-onboarding`: skill de fronteira, que merece varredura por calendário e
  não por sintoma. Achado de tabela: 9 "Related Templates" citados no cabeçalho, **nenhum existe
  no repositório**.
- **2026-09-11 10:28** · **O teste da `mjrp-onboarding` (cenário Album Blender V1) passou na
  substância e falhou na forma — e a culpa era do template, não do agente.** A síntese abriu com
  *"reescrita técnica do V0 (Vanilla JS) em Vue 3 + Pinia + TypeScript"* e só depois disse o
  propósito. No segundo turno, perguntado *"o que é este projeto?"*, o agente respondeu pelo
  produto e citou `VISION.md` + `CHARTER.md` — carregado na Phase 1, antes da pergunta. Ou seja: o
  contexto certo **estava** na cabeça dele; o formato de saída é que o pôs em segundo lugar. A
  Phase 4 pedia *"[o que é e para quê, 1–2 frases]"* — dois pedidos numa lacuna só, com o *o que é*
  primeiro na frase. Num projeto cujo *o que é* literalmente **é** uma reescrita, o template
  autoriza exatamente a saída que o aviso logo abaixo proibia. Lição: **aviso não corrige o que a
  estrutura induz.** Quando a regra e o slot discordam, o slot vence — a correção é quebrar o slot
  em dois campos ordenados (*para quê* na primeira frase, *o que é* na segunda), nos dois modos.
  Segundo achado do mesmo run: o agente **apagou** um `.git/index.lock` órfão durante o
  carregamento. Onboarding é leitura; conserto durante o diagnóstico faz a sessão começar num
  estado que ninguém pediu, e deleção é do humano. Virou regra no cabeçalho da skill.
- **2026-09-11 10:25** · **O conserto do achado do big picture chega na skill — antes ele existia só no
  `AGENTS.md`.** Em 10/09 registramos que a `mjrp-onboarding` garante "onde mexer" e não "para que
  serve o todo", e corrigimos o `AGENTS.md` (VISION virou leitura incondicional, README saiu da
  lista). Mas o formato da síntese da própria skill continuou pedindo só mecânica —
  *"Contexto carregado: [arquivos]. Padrões chave: [...]. SDD status: [...]"* —, que é exatamente
  o formato que produziu o problema. Consequência que só apareceu ao planejar o teste: a correção
  valia apenas para sessões abertas **no harness**, porque em outro projeto quem manda é o arquivo
  de instrução daquele projeto. Agora a Phase 1 diz que ler o `VISION.md` **não é item de
  checklist** — é extrair a frase que responde "por que este projeto existe" —, a confirmação
  abre por ela nos dois modos, e entrou o teste: *se alguém lesse só a sua primeira frase, saberia
  o que este projeto é e para que serve?*. Com a regra explícita de **não deduzir o propósito** do
  README, do nome da pasta ou do que o código faz, e de **dizer em voz alta** quando o projeto não
  declara propósito em lugar nenhum. **A lição:** corrigir a regra no documento de instrução
  conserta um projeto; corrigir o **formato de saída da skill** conserta todos — e foi a diferença
  entre as duas que quase passou como "feito".
- **2026-09-10 21:58** · **O selftest achou um bug latente no parser YAML ao declarar as pastas do
  inventário.** Ao acrescentar `- mjrp-scripts/   # o inventário do código: um script por linha` ao
  contrato, o `doctor_selftest` acusou divergência entre o `_yaml_minimal` e o PyYAML: o parser
  procurava o `:` que decide **escalar ou mapa** no corpo do item **com o comentário junto**, então
  a linha virava um dicionário cuja chave era o caminho mais o comentário. O mesmo valia para
  `- "x: y"`. Nenhum contrato tinha exercitado o caso — é o mesmo tipo de cegueira registrada em
  09/09, quando a amostra comparada não exercitava a diferença e a lista em bloco passou anos
  quieta. Corrigido (o `:` se procura no corpo sem comentário e fora de aspas) e fixado como caso
  6 do selftest. **A lição:** o parser mínimo existe para a máquina sem PyYAML — ou seja, roda
  exatamente onde não há oráculo para conferi-lo. Toda sintaxe nova que entra no contrato tem que
  virar amostra do selftest **no mesmo commit**, senão o contrato é lido de um jeito na máquina do
  MJRP e de outro na máquina de quem clonar.
- **2026-09-10 21:45** · **Os dois arquivos que o agente lê primeiro estavam mandando fazer o que
  o sensor reprova.** Revisão do `AGENTS.md` e do `CLAUDE.md` contra as mudanças do dia achou 12
  incoerências; duas passavam de defasagem: (1) o `CLAUDE.md` mandava gravar decisão de meio de
  sessão em `## Decidido` — seção que a ADR-0008 esvaziou e que o `doctor` (F1, linha 599)
  **reprova** se reaparecer, ou seja, quem obedecesse a instrução deixava o repo vermelho; (2) os
  dois mandavam `TZ` cru (`rode date`), que é exatamente o bug de três horas corrigido hoje de
  manhã — certo no `MEMORY.md`, errado nos dois arquivos que são lidos antes dele. As outras dez:
  a tabela "Onde mora cada memória" estava **partida ao meio** por um blockquote inserido entre as
  linhas 7 e 8 (as seis linhas seguintes não renderizavam como tabela); o mapa da memória apontava
  para a **ADR-0008** quando o próprio arquivo diz três parágrafos depois que "ADR não é onde regra
  operante mora" — agora aponta para [[memory-architecture]] e [[context-vs-memory]]; `PRINCIPLES`
  ainda descrito como "como se decide aqui"; `log.md` descrito como "onde a última sessão parou",
  que é o `## Now`; um caminho que não existe (`docs/sources/harness-evolution-proposal.md`); oito
  diagramas que são nove; "~900 linhas" que são 2.858; a tensão entre o cabeçalho "sob demanda" e
  dois itens marcados "sempre"; e a linha **Semântica** sem `docs/wiki/`, que é onde a semântica
  mora. **A lição:** o arquivo de instrução é o último a ser revisado porque não é entregável de
  nenhuma tarefa — e é o primeiro que todo agente lê. Toda mudança de regra tem que voltar para
  ele no mesmo dia, ou ele vira o lugar onde a versão antiga sobrevive com autoridade.
  **De passagem:** o aviso sobre o caminho do Mac anterior (`/Users/mpedroso/…`) saiu do topo do
  `AGENTS.md` — decisão do MJRP: caminho que não existe é trabalho de sensor (I2 resolve todo
  caminho absoluto), não de prosa que custa token em toda sessão.
\n
- **2026-09-10 21:20** · **Dois documentos de entrada disputando o mesmo chão — e o sensor cobria
  só um.** O `README.md` e o `HOWTO.md` ensinavam instalação por caminhos diferentes: o HOWTO via
  `build_plugin.py` + `/plugin marketplace add ./dist`; o README § 6.2 mandando copiar pastas para
  `.claude/skills/`, que o próprio HOWTO chamava de fallback. O `entry_check.py` só lia o HOWTO,
  então a versão divergente do README nunca foi testada. Cada um se declarava a porta: o HOWTO
  dizia "o que ler antes: nada", o README se dizia "guia operacional" — e mandavam o leitor um
  para o outro. **Resolvido pela decisão do MJRP:** se dois arquivos se sobrepõem, deve haver
  **um**. O HOWTO foi absorvido pelo README (que o GitHub renderiza e onde o catálogo gerado já
  morava) e aposentado em `_archive/root-docs-2026-09/`; o `entry_check.py` passou a ler o README.
  **A lição:** a duplicação não foi pega por um sensor porque o sensor *fazia parte* da
  duplicação — ele validava um dos dois documentos e por isso dava verde enquanto o outro
  prometia coisa diferente. Sensor que cobre só metade de uma duplicidade atesta a metade certa.
- **2026-09-10 19:55** · **A correção do achado acima começou pelo `AGENTS.md`, não pela
  onboarding.** O agente do exemplo 2 leu o `README.md` antes do `VISION.md` porque o "O que ler"
  do `AGENTS.md` listava o README como "guia operacional" e o VISION com a cláusula *"leia antes
  de decisão estrutural"* — condição que o agente julga sozinho (`PRINCIPLES.md` #3: opção
  deixada ao agente desaparece sob pressão). E o README ainda carregava uma segunda explicação
  do harness (§1–§4), onde o agente achou "resposta" e parou. Feito: BACKLOG #31 executado
  (README sai do "O que ler"; VISION vira leitura incondicional, com o porquê); README §1–§4
  viraram ponteiros — o README **aponta**, não explica; §5–§8 ficam por serem de humano e sem
  outra casa. **Falta:** a mesma cláusula vive nas *instruções do Projeto Cowork* (citadas em
  external-locations) — fora do repo, só o MJRP alcança.
- **2026-09-10 19:43** · **Onboarding garante "onde mexer", não "pra que serve o todo" — e um
  agente que substitui um humano só é efetivo se souber as duas coisas.** Dois onboardings reais
  mostraram o mesmo padrão: no Album Blender V1, a "identidade do projeto" que saiu foi stack e
  constraints (Vue 3, Pinia, TS strict) — nunca por que o rewrite existe. No próprio harness (o
  caso mais grave, porque é o repo de casa), o agente respondeu "o que é este projeto?" com
  README+ROADMAP+contrato — mecânica — e só leu o `VISION.md` (leitura obrigatória da Phase 1,
  primeira da lista) quando cobrado duas vezes. A resposta mudou depois de ler: apareceu o
  propósito real (a família, não o software, é o fim) e uma consequência de arquitetura que a
  mecânica sozinha não explica — memória mora em arquivo no repo porque harness/plataforma/
  instância/usuário são domínios que se desacoplam, e ferramenta muda sem avisar. **A lição
  (MJRP, verbatim, 10/09):** *"se um agente for substituir um humano num projeto, essa
  substituição só é efetiva se, como o humano, o agente souber onde ele entrou e qual o objetivo
  final do que ele está fazendo... um humano nunca deveria trabalhar sem entender o contexto e
  por que e pra que."* Sem esse mínimo de big picture, mexer no específico arrisca quebrar o todo
  sem o agente perceber que quebrou — porque ele nunca soube que aquele invariante existia. Bug
  do harness por `PRINCIPLES.md` #4, não falha do agente: faltou o guia (uma síntese que carregue
  propósito antes de estado), não faltou capacidade de ler o `VISION.md`.
- **2026-09-10 19:22** · **Os achados do schema/`.claudeprompt` na `mjrp-onboarding` foram
  resolvidos no mesmo dia em que foram encontrados**, a pedido explícito do MJRP ("não gosto de
  tech debt, resolve agora"). Junto, apareceram mais 2 ocorrências do mesmo bug de schema
  (`type: content`/`path: content`) dentro do próprio `mjrp-project-lifecycle` que a revisão
  daquele arquivo, horas antes, não pegou — a busca original só olhava o bloco YAML completo
  (`mjrp_project:` sozinho numa linha), não as menções soltas em prosa. **A lição:** ao corrigir
  um schema, grep pelo valor errado (`type: content`), não só pela chave estrutural — prosa cita
  o valor sem repetir a estrutura do bloco.
- **2026-09-10 19:13** · **`.claudeprompt` sobrevivia como artefato a criar em 3 skills, mesmo
  morto.** `AGENTS.md` é canônico desde a reestruturação de 09/09 (`CLAUDE.md`/`GEMINI.md`
  importam ele) — mas `mjrp-project-lifecycle`, `mjrp-onboarding` e `mjrp-project-bootstrap`
  ainda mandavam configurar `.claudeprompt`/`.gemini/GEMINI.md` como se fossem os artefatos
  primários. Nenhum dos três apontava pra `AGENTS.md`. Corrigido nos três — `.claudeprompt` só
  sobra como sinal de detecção em inventário de projeto brownfield (pode existir num projeto
  antigo), nunca mais como algo a criar. **A lição:** um nome legado não morre sozinho quando o
  canônico muda em um lugar só — quem cita o legado em prosa continua citando até alguém ir atrás
  de cada ocorrência.
- **2026-09-10 18:44** · **O save deixou uma seção fantasma no `MEMORY.md`, e o F1 deu verde.** Ao
  reescrever o `## Now`, o corte foi no primeiro "`## Ways of Working`" do arquivo — que estava
  **dentro do texto antigo** (a frase "headers em inglês (`## Now`, `## Ways of Working`…)"), não no
  header. Sobrou meio `## Now` velho, com rótulos em português, colado numa linha que começava com
  "## Ways of Working`, `## History`…". O F1 comparava título por **prefixo** e aceitou a linha como
  a seção legítima; o `now_section` parava nela e contava 4/4 blocos. MJRP viu abrindo o arquivo.
  Lição dupla: (1) título de seção se compara pelo nome exato — prefixo é convite a fantasma;
  corrigido em `doctor`, `memory_check` e com caso de selftest; (2) script que fatia um arquivo por
  marcador tem que ancorar o marcador no **início de linha**, nunca em `str.index` solto — o mesmo
  texto pode aparecer citado no conteúdo.
- **2026-09-10** · **O mesmo bug do dia anterior, mas a causa já não era a mesma.**
  Um novo transcript apareceu em `transcripts/` na raiz de novo — hoje, 13:42, quase
  o mesmo horário do flagrante de 09/09. Mas a cópia instalada da
  `mjrp-youtube-transcript` já estava corrigida (verificado agora, byte a byte
  contra a fonte): as 5 menções a destino no `SKILL.md` apontam certo para
  `docs/raw/transcripts/`, sem sobra do caminho antigo. A skill estava certa e o
  arquivo saiu errado assim mesmo — instrução correta não é garantia de execução
  correta; foi outra sessão/superfície que não seguiu a skill, não uma cópia
  desatualizada. Dois achados diferentes com a mesma assinatura de sintoma ensinam a
  mesma lição duas vezes: o sensor de `estrutura` (arquivo fora do lugar) pega o
  efeito, não a causa — e a causa muda. Movido para `docs/raw/transcripts/`, campo
  `Destino:` interno corrigido no arquivo.
- **2026-09-10** · **Duas vistas do mesmo doc, mantidas à mão, saíram de sincronia — e uma
  delas ainda avisava um problema já resolvido.** O `roadmap.html` tem uma versão paisagem
  (slide) e uma retrato (Kindle) do mesmo conteúdo, alternadas por classe de `<body>`. Quando a
  fase D (Ambiente — sandbox + infra) nasceu para resolver "o furo" do roadmap, só a versão
  paisagem foi atualizada; a retrato ficou uma fase atrás — sem a fase D, e com o box final
  ainda alertando sobre um furo que o `ROADMAP.md` já registra como resolvido. É a mesma classe
  da duplicação prosa/gatilho da `mjrp-deployer` (skill-distribution): duas cópias do mesmo
  fato, mantidas por mão humana, e nada compara uma com a outra. Sincronizadas as duas com o
  `ROADMAP.md`, PDFs regenerados a partir do HTML corrigido.
- **2026-09-09 19:47** · **Um selftest de 8 casos achou dois defeitos que a leitura não achou** —
  o piso de 30% aprovava a entrada reduzida ao título, e a guarda da linha de base vazia matava o
  `--forma`, que não depende de linha de base nenhuma. Os dois estavam no código que eu tinha
  acabado de escrever *para corrigir* defeitos. A lição não é "escreva testes": é que **o caso que
  prova o sensor é o caso trivial** — a frase idêntica tem que casar, e a entrada gutted tem que
  reprovar. Sem esses dois, todo o resto que o script imprime é ruído.
- **2026-09-09 19:45** · **O verificador reprovava a frase idêntica a si mesma, e ninguém viu.**
  O `memory_check.py` tirava as *stopwords* da assinatura e **não** as tirava do texto de destino:
  procurava um alfabeto dentro de outro. A consequência não foi um falso verde — foi um falso
  vermelho, "99 de 100 sem destino", que eu apresentei como linha de base e usei para dimensionar
  o 28a. **Número de sensor quebrado não é número conservador; é número inventado**, e serve tanto
  para superestimar quanto para subestimar. Junto vinha o segundo furo: nada media *volume*, então
  uma entrada de 308 chars migrada como 85 passava por "encontrada". Corrigido com uma peneira só
  (`sieve()`) usada nos dois lados, retenção medida por palavra significativa em janela, e piso
  declarado (40% reprova, 40–70% fica registrado). A linha de base honesta é outra: **107 entradas,
  10 com destino, 6% do volume**. Quem pegou foi o Zé, perguntando o que o verificador media.
- **2026-09-09 19:30** · **Eu inventei a coluna "por onde volta" e travei o 28a nele com ela.** A
  pergunta dele era sobre truncamento e eficácia; eu respondi mudando a classificação, que é o que
  ele **não** questionou, e transformei isso em bloqueio do lado dele. O agrupamento está aprovado.
  O que está errado é o verificador, e o conserto é meu.
- **2026-09-09 18:55** · **Terceira vez no dia que um teste tocou a produção — e a cópia já
  estava lá.** O `hooks_selftest.py` monta um repositório falso e copia o `stop_gate.py` para
  dentro dele… e então roda o **caminho do original**, passando só `cwd=` o repo falso. Como o
  gate resolve a própria raiz por `__file__`, ele leu o repositório **real** o tempo todo: os
  casos 3, 4 e 5 passaram por coincidência (o repo real estava sujo) e o `--declare true` escreveu
  no `.mjrp/turn.json` **de verdade**. A lição não é "isolar o teste" — eu tinha isolado. É que
  **isolar o dado e não isolar o executável não isola nada**, e o sintoma é o teste passando por
  motivo errado. Tirei a constante com o caminho real do arquivo: guardá-la é convidar o erro de
  volta.
- **2026-09-09 18:55** · **Aposentar não é copiar — e eu chamei nos dois destinos reescrevendo um
  só.** O `gen_vision_pdf.py` chamava `retire_path` no HTML *e* no PDF antes de renderizar; numa
  máquina sem renderizador de PDF, ele escrevia só o HTML e o PDF anterior **sumia** (o
  `_safe.retire_path` **move**, não copia — está escrito na docstring dele). Recuperado do
  `_backups/`, que é justamente por isso que a regra existe. A regra corrigida: **aposente só o
  que você vai reescrever nesta execução** — aposentar o que não se reescreve é apagar com passos
  a mais. Quem pegou foi o `--until` do próprio item, que exige o PDF existir.
- **2026-09-09 18:05** · **Segundo item que estava feito e o backlog não sabia.** O #30 (tirar os
  ponteiros ao `CHARTER.md` de VISION e HOWTO) já estava cumprido — zero ocorrências nos dois
  arquivos. Descoberto do mesmo jeito que o #37: escrevendo o critério de saída, não lembrando.
  **Dois em dois dias.** O sintoma não é esquecimento — é que **escrever o `--until` virou o
  único momento em que alguém confere o estado real**. Enquanto o `BACKLOG.md` (hoje arquivado; o papel é do PRD) for a única fonte
  do que está aberto e ninguém o medir, ele erra para mais: acusa aberto o que está fechado, e o
  planejamento em cima dele custa tempo em item que não existe.
- **2026-09-09 17:30** · **Regex em código é a mesma classe do rename cego da manhã.** A
  tradução dos identificadores dos 16 scripts começou por substituição regex e quebrou três
  coisas de uma vez: renomeou dentro de *string literal* (`harness-kaizen.md` virou
  `harness-kaizen_path.md`) e **deixou de renomear** acesso a atributo (`rep.erros`), porque o
  lookbehind que eu pus para não tocar em objeto alheio também pulava o nosso. O certo é
  **tokenizar** — `tokenize` distingue NAME de STRING por construção. Segunda armadilha, já com
  o tokenizador: antes do Python 3.12 a f-string é **um token STRING só**, então nome dentro de
  `{...}` não chega como NAME. E terceira: reescrever dentro de f-string por regex renomeia
  também o que está entre aspas lá dentro (`m['total']` virou `m['total_']`). A regra que fica:
  **para código, a ferramenta é o parser da linguagem, não o casamento de texto** — e o que salva
  em todo caso é rodar os verificadores depois de cada passada.
- **2026-09-09 17:30** · **O cache do A1 serviu o resultado do estado quebrado.** Durante a
  tradução, o `loop_selftest` reprovou; consertado, o `loop_selftest` passava sozinho e o
  **doctor continuava vermelho** — porque o `.mjrp/sensors.json` guardava o `code: 1` de dois
  minutos antes. É o `BACKLOG.md` #10 (arquivado em 17/09) (*"resultado de sensor guardado em cache mente com o
  tempo"*) acontecendo ao vivo, com hora. Não consertei: é a vez dele, não a minha — one-piece
  flow. Cache invalidado à mão, cópia em `_backups/`.
- **2026-09-09 14:55** · **A cópia instalada no Cowork É alcançável — de dentro do Cowork.** A
  ADR-0002 §7 afirma que nada no harness alcança a skill instalada, e por isso o
  `skills_status.py` responde por *proxy* (diff do git contra um marco de subida). A afirmação vale
  para o shell do Mac; **não vale para uma sessão do Cowork**, que recebe as skills da conta
  sincronizadas em disco e pode compará-las byte a byte com `mjrp-skills/`. Feito hoje: das 53
  skills, **52 batem e 1 diverge** — a `mjrp-debug`, cuja cópia instalada ainda manda escrever ADR
  em `docs/architecture/` enquanto a fonte diz `docs/decisions/`. O proxy tinha respondido "20
  skills desde 01/09": **19 falsos positivos**. Sensor por proxy, quando a medida direta existe,
  é ruído com cara de rigor. Ressalva honesta: o que a sessão vê é um instantâneo, que pode ficar
  atrás de uma subida muito recente — é evidência, não oráculo. Mudar a regra da 0002 exige ADR
  nova; aqui fica o fato.
- **2026-09-09 14:35** · **O drift de três vias apanhado em flagrante, com hora.** Às 13:42 de
  hoje um transcript novo foi gravado em `transcripts/` na raiz — pasta aposentada pelo 26b. A
  fonte da `mjrp-youtube-transcript` aponta para `docs/raw/transcripts/` desde 09/09, e o `dist/`
  também. Quem escreveu no lugar errado foi a **cópia instalada no Cowork**, que ninguém
  atualizou. Não é hipótese da ADR-0002 §7 — é o caso, datado. E o sensor que acusou foi o
  `estrutura`, não um sensor de skill: nada no harness compara a cópia do Cowork com a fonte,
  porque nada a alcança. O `skills_status.py` é o mais perto que dá — e ele só sabe responder
  depois que alguém rodar `--marcar` uma primeira vez.
- **2026-09-09 14:05** · O `harness-kaizen.md` tinha **161 linhas idênticas** escritas pelo
  `loop_selftest.py` — 35% do arquivo. O selftest guardava e restaurava o arquivo, mas capturava
  o estado **depois** dos primeiros casos já terem escrito. Corrigido: `MJRP_LOOP_KAIZEN` desvia o
  destino, e o caso 5c prova que o real não mudou. Condensadas em 1 linha, cópia em `_backups/`.
- **2026-09-09 14:05** · **Guarda na linha errada é guarda que não existe.** O
  `loop_selftest.py` *sabia* que não devia sujar a memória — guardava o `harness-kaizen.md` e
  restaurava no fim. Só que capturava o estado **depois** de os casos 1–4 já terem escrito: o
  guarda protegia o único caso em que alguém pensou e deixava vazar todos os anteriores. 161
  linhas idênticas, 35% do arquivo, ao longo de um dia. Corrigido na raiz: `loop.py` lê
  `MJRP_LOOP_KAIZEN` (como já lia `MJRP_LOOP_AGENT`), o selftest desvia a corrida inteira para um
  temporário, e o caso **5c** — que faltava — prova que o arquivo real não mudou um byte.
  A lição geral: **um teste que protege a produção precisa de um caso que verifique a proteção.**
  Sem o 5c, o guarda quebrado passaria verde para sempre.
- **2026-09-09 13:45** · O `entry_check.py` ganhou a **c7**: clona o próprio repositório num
  diretório temporário e roda ali o caminho do HOWTO. As checagens 1–6 liam o disco **desta**
  máquina, onde `dist/` já existe porque alguém rodou o build um dia — quem chega novo não tem
  isso. É a mesma cegueira do I2 vista de outro ângulo: **o sensor validava o desenvolvedor, não
  a porta**. E a c7 provou-se na primeira execução, reprovando o estado real (`dist/` ainda no
  HEAD) enquanto o desrastreio estava só no índice.
- **2026-09-09 13:20** · **Comentário no fim da linha do `.gitignore` desliga a regra.** Só o `#` no
  **começo** da linha é comentário; no resto da linha ele vira parte do padrão. As duas linhas de
  build do harness estavam assim desde 05/09 — o padrão real era `mjrp-skills-packages/   # pacotes
  .skill para o Cowork`, que não casa com nada. Resultado: **94 arquivos de `dist/` (1,2 MB) e 23
  `.skill` (252 KB) versionados**, em 14 commits, sob um comentário que diz *"nunca commitado"*.
  A lição maior é a forma do erro: **o comentário que documenta a intenção foi o que a desligou** —
  e o arquivo continuou parecendo certo para quem lê. Achado da sessão do Claude Code do Zé, que
  viu `main` sujo com três `.skill` ao criar os worktrees.
- **2026-09-09 13:20** · `git add -A` num commit meu levou junto três `.skill` que a mensagem não
  mencionava. A mensagem descrevia critérios de saída e mapa de faixas; o commit também carregava
  binário de build. Não corrompeu nada, mas quebra a regra que o próprio repo cobra dos outros: o
  commit tem que dizer o que ele contém. `add -A` é conveniente e mente.
- **2026-09-09 12:05** · O `BACKLOG.md` listava o **#37** (cabeçalho do `PRINCIPLES`) como aberto.
  Ele estava feito. Eu não descobri por lembrar — descobri por `grep`, ao escrever o critério de
  saída dele. O Zé nomeou na hora: *"não é surpresa, é o uso do memory ainda não funcionando"*.
  É o argumento da ADR-0008 em estado puro — trabalho aconteceu, ninguém registrou, e o arquivo
  de estado passou a mentir. A cada item assim, o backlog vale um pouco menos como fonte. O sintoma
  não é esquecer: é **planejar em cima de estado falso**.
- **2026-09-09 12:00** · O **I3** confere link markdown **dentro de bloco de código**. A
  ADR-0007 §1 diz que "trechos em código (cercado ou inline) ficam fora", e o `doctor.py`
  aplica isso **só à metade dos wikilinks**: `sem_codigo` é calculado depois do laço dos links
  markdown, então um `grep` de exemplo cujo padrão seja um link markdown reprova como se fosse
  referência quebrada. **Esta entrada provou o defeito ao ser escrita**: a primeira versão citava o
  padrão literal e o doctor ficou vermelho por causa dela. É a mesma classe do I2 que não distinguia
  gabarito de caminho — o padrão citado num comando não é ponteiro. Achado, não corrigido:
  `doctor.py` é território do
  28c e dos itens 5/9b/10, e mexer nele agora é o atropelo que as faixas existem para impedir.
  Decisão pendente do Zé.
- **2026-09-09 00:55** · **O parser que eu escrevi perdia dado em silêncio, e o F2 ficou verde por silêncio.**
  O `_yaml_min` não lia **lista em bloco** (`- item`) nem convertia data: o `gates_open` virava um mapa
  solto, o F2 não via gate aberto nenhum e o relatório dizia "0 gates abertos" — verdade acidental.
  Só apareceu porque o **selftest rodou na máquina do Zé**, que não tem PyYAML: aqui o PyYAML mascarava
  o fallback, que era código morto. **Três lições:** (1) o parser agora levanta `YamlNaoSuportado` no que
  não sabe ler, e o doctor sai 2 — *sensor que inventa é pior que sensor que falta*; (2) a comparação que
  eu mesmo pus no selftest **passou** porque comparava no contrato do harness, onde `gates_open` está
  vazio — *teste que compara duas implementações numa amostra que não exercita a diferença não prova
  nada*; (3) o caminho de fallback só roda onde a dependência falta, então o teste dele precisa de
  **expectativa escrita à mão**, que vale sem oráculo. Agora são 5 amostras + frontmatter + 1 caso sem
  oráculo, e o selftest acusa **8** checagens na instância quebrada, não 7.
- **2026-09-09 00:47** · **O `entry_check` reprovou por não enxergar, e isso é erro de sensor.** Ele acusou o
  `marketplace add ~/mjrp/projects/.../dist` do HOWTO porque o `~` daqui não é o `~` do Mac. Caminho
  escrito para **outra máquina** verifica-se pela cauda, não pelo prefixo — é a mesma disciplina que a
  I2 já tinha ("não avaliável ≠ reprovado") e que eu não apliquei ao escrever a checagem nova. Sensor
  que reprova o que não consegue ver ensina a ignorar vermelho.
- **2026-09-09 00:44** · **O `entry_check.py` achou algo na primeira execução** — o `README` mandava invocar
  `mjrp-env-setup`, skill que **não existe** em `mjrp-skills/`. Documento citando skill aposentada é
  a mesma classe de falha do caminho quebrado, e nada olhava para isso. **E ele não pode ser sensor
  declarado no contrato:** o `entry_check` roda o `doctor`, e o `doctor` executa os sensores — seria
  recursão. Fica avulso, e entra pelo hook `SessionStart` do A4.
- **2026-09-09 00:39** · **A I2 não distingue molde de caminho.** Dos seis erros do primeiro A3, três eram
  *template* — `Books/<Título>`, `Meeting-Notes/{category}/…`, `_logs/{ISO-timestamp}.json` — e não
  caminho quebrado. A checagem resolve tudo que parece caminho absoluto, e um molde nunca existe.
  Virou convenção no `AGENTS.md`: **prefixo fixo dentro das crases, parte variável fora**. Alternativa
  descartada por ora: ensinar a I2 a ignorar `{...}` e `<...>` — mas aí ela deixaria passar caminho
  de verdade com chave no nome. A convenção custa menos e não cria ponto cego.
- **2026-09-08 23:28** · **A porta de entrada não tem sensor, e é onde ele mais falta.** O Zé rodou o harness
  numa máquina limpa e gastou **seis intervenções manuais** antes do primeiro comando útil:
  (1) o `environment.setup` do contrato manda `pip install --user pyyaml`, que o Homebrew
  *externally-managed* recusa; (2) o `doctor` exigia PyYAML para rodar; (3) `doctor.py .` apontou
  para a pasta-mãe, que não é instância; (4) seis caminhos de skills quebrados que ninguém sabia;
  (5) dois contratos-filhos num schema que o `README` **ainda ensina**; (6) `marketplace add ./dist`
  com o caminho errado no documento. **O `HOWTO.md` abre dizendo "o que ler antes: nada" e trava no
  primeiro comando.** O harness verifica a instância (`doctor`), os links (`check_docs`) e o build
  (`build_plugin`) — e **não verifica que as próprias instruções funcionam**. É a dor 4 na porta de
  entrada, e contradiz a métrica do roadmap ("~20 intervenções → 1"). Frase dele: *"imagina que eu
  sou um novo funcionário da MJRP; isso que eu estou passando é justamente o que o harness deve
  prevenir"*. Candidato a checagem com incidente documentado, pela regra da ADR-0002.
- **2026-09-08 22:32** · **Eu estava devendo o `log.md`.** A última entrada era da manhã: seis horas de
  trabalho existiam só no `MEMORY.md`, e a `mjrp-onboarding` **não lê o MEMORY** — uma sessão nova no
  Claude Code começaria sem nada disso. O protocolo diz "checkpoint ao fechar um bloco", e eu deixei
  para o fim. É o argumento do 28d em estado puro, e apareceu porque o Zé perguntou sobre a onboarding.
- **2026-09-08 22:28** · **O `ESTADO.unlink()` do `loop.py` mascarou três falhas do selftest de uma vez.** O mount
  da ponte proíbe apagar, então o loop.py morria em silêncio na 2ª chamada em diante e os casos 3, 4b e
  5b reprovavam por motivos inventados. A regra do repo — *nada se apaga, sobrescreve* — não estava no
  código que eu mesmo escrevi. Corrigido: `write_text` em vez de `unlink`, no loop e no selftest.
- **2026-09-08 20:06** · **BACKLOG #13 estava meio feito e meio errado.** `mjrp-adr` já grava em `docs/decisions/`
  desde `6351e6e`; `mjrp-onboarding` nunca leu `CURRENT.md` — lê `log.md` e SpecKit. O furo
  real: **a onboarding não lê o `MEMORY.md`**, que o `AGENTS.md` manda ler primeiro. A ADR-0006
  registrou o pendente errado. Inventário completo em `_archive/docs-2026-09-16/duplication-inventory.md`.
- **2026-09-08 18:26** · **Perda encontrada e revertida:** o invariante do critério de saída (antigo nº 12 dos
  Princípios de governo) tinha saído do VISION como "governança" e não entrou no PRINCIPLES —
  sobrevivia só no AGENTS.md. É o II.4 agora.
- **2026-09-08 14:30** · **Segunda vez que aponto para o que não existe.** Propus "as onze peças vira
  ponteiro para `docs/wiki/`" sem a página existir — o Zé pegou de novo: *"vc vai construir
  o md lá? senão não adianta apontar para o nada e remover o conteúdo"*. **Regra: remoção com
  ponteiro só depois que o destino existe, no mesmo commit.**
- **2026-09-08 14:24** · **Primeiro incidente de `MEMORY.md` parado:** o Zé tomou seis decisões e eu as
  escrevi num brief em vez do arquivo — ele teve que perguntar. A ADR-0005 previu o custo ("não
  há sensor que detecte um MEMORY parado"); agora existe o incidente que, pela regra da ADR-0002,
  justifica a checagem.
- **2026-09-08 14:24** · Fronteira borrada por mim: eu venho pondo *o que aconteceu* no "Foco agora" do
  `CURRENT.md`. Relato é do `log.md`; decisão é do `MEMORY`. O CURRENT devia ter ~15
  linhas, não 34.
- **2026-09-07** · O gerador do PDF do VISION **não está no repositório**; enquanto estiver fora,
  nada que o Zé marcar na capa é encontrável por busca no repo.

## Lições do loop

- **2026-09-09 13:24** · **161 execuções do `loop_selftest.py`** entre 2026-09-08 19:30 e 2026-09-09 13:24 escreveram esta mesma lição (`loop.py` esgotou o teto sem que `false` passasse). Não é histórico — é o defeito descrito acima: o selftest guardava o `harness-kaizen.md` e restaurava no fim, mas capturava o estado **depois** dos primeiros casos já terem escrito. As 160 linhas ocupavam 35% do arquivo. Condensadas aqui em 09/09 (cópia integral em `_backups/`), com a origem corrigida no mesmo dia: `MJRP_LOOP_KAIZEN` desvia o destino, e o caso **5c** prova que o teste não tocou no arquivo real.

## Related
[[memory-architecture]] · [[context-vs-memory]] · recurring-pains · ADR-0008

- **2026-10-28 12:16** · Quem insere uma entrada no `docs/log.md` pela primeira linha que começa com `## [` cai no exemplo do cabeçalho (`> \`## [AAAA-MM-DD HH:MM] <tipo>\``, partido em duas linhas) e grava dentro dele: o integrador em 27/10 e a tarefa agendada de inventário (Cowork) em 28/10 08:07. O doctor pega (F1, entrada fora do formato), mas só no doctor completo. Lição: inserir antes da primeira entrada datada (`\n## [20`), nunca pela primeira `## [`; vale corrigir a skill `mjrp-inventorying-folders` e oferecer um ajudante único no `mjrp-scripts/` — depois de 30/10.

- **2026-10-30 21:02** · **Sessão de feature nascida de um commit velho da `main`.** O `start_session` sem `source_branch` corta o worktree da base da sessão integradora (o commit em que ela começou), não da ponta da `main`: a F131 nasceu 237 commits atrás, e a sessão da UAT-421, 238 — sem a auditoria que ela devia aplicar. Lição: o integrador passa `source_branch: main` em toda sessão que abre, e a sessão confere a base no primeiro passo (o commit de início já vem depois de um `git merge --ff-only main`).
