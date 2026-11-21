# Limpeza de worktrees antigos - 2026-11-21

Objetivo: tirar de `.claude/worktrees/` os worktrees de agentes internos já encerrados, cujo ramo está inteiro na `main`, sem perder nada.

## Resultado em uma linha

Nenhum worktree foi removido nesta passada. O que dependia de mim foi feito: os arquivos fora do git que o `session-check` chamou de «ignorado e não é derivado» saíram dos worktrees para o `_backups/` do checkout principal. O que impede a remoção agora é a regra de 60 minutos de atividade recente da própria ferramenta: mexer nas pastas (mover os arquivos) renova o relógio. Depois de uma hora, `python3 mjrp-scripts/merge_train.py clean-worktrees --apply` deve remover os sete marcados abaixo como «sai na próxima».

## O que foi movido (por `retire_path` da `_safe.py`, com `root` na `main`)

A linha de comando `_safe.py retire` guarda a cópia no `_backups/` do worktree (o que seria apagado junto com ele). Por isso usei a função `retire_path(caminho, root=<main>)`, a mesma porta do `retire`, que leva a cópia para o `_backups/` do checkout principal, com carimbo e o caminho de origem no nome (`.claude__worktrees__<worktree>__...`). Nada foi apagado com `rm`.

| Worktree (ramo) | Movido para `_backups/` da `main` | Situação |
|---|---|---|
| agent-ad748a493a4829d7e (feat/f76-mobile-inventory) | 1 print: `reports/evidence/F76/inventory/after/list-393x852-full.png` | sai na próxima |
| agent-aacc147b31b120e69 (feat/f76-mobile-playlists) | prints de `reports/evidence/F76/playlists/` (antes e depois) | sai na próxima |
| agent-af521fd67358b7430 (feat/f76-mobile-polish-home-playlists) | pastas `home-blend/polish-n15`, `polish-n4`, `playlists/polish-reconf` e os prints de `playlists/before-polish` | sai na próxima |
| agent-a84294b0c53742ff5 (feat/f76-mobile-redesign) | prints de `reports/evidence/F76/after` e `before` (3 tamanhos por tela) | sai na próxima |
| agent-a6600263aa300f09c (fix/f59-escape-outside-text) | `.mjrp/before.mjs`, `.mjrp/doctor.txt`, `.mjrp/survey.txt` | sai na próxima |
| agent-aac78742ceffe1bce (feat/f78-app-skeleton) | `app/dist` (23 MB, saída do export do app) | sai na próxima |
| busy-agnesi-bddfbe (claude/f86-site-design-system) | `.claude/launch.json` (não existe na `main`) | sai na próxima |

Os prints que já existiam iguais na `main` seriam pulados; nenhum caso assim apareceu. `node_modules`, `dist/` e `.mjrp/` de sessão são derivados: a própria ferramenta os descarta ao remover (o `_backups/` carimbado de dentro de cada worktree ela leva para o da `main`).

## O que ficou, e por quê

| Worktree | Motivo |
|---|---|
| agent-a27867d9f30ec4eba (feat/f78-first-simulator-run) | tem `app/ios` com 2,3 GB (Pods e build do Xcode) e `app/.expo`; mover isso estoura o teto de 1 GB do `_backups/` e o prune apagaria cópias. Decisão do MJRP: descartar o que é regenerável, ou declarar `app/ios` como derivado. Não toquei. |
| agent-ac0891fb935133065 (feat/f78-spike-s1-core-on-hermes) | `spikes/f78-s1-core-on-hermes/out` tem 585 MB de saídas do spike, fora do git. Mesma razão: grande demais para o `_backups/`. O MJRP diz se guardamos o resultado ou se pode sair. |
| agent-acfc7b768bff35219 (claude/f84-visual-sensor-with-playwright) | a ferramenta vê atividade recente (`shared` mexido há menos de 60 min). Não mexi. |
| agent-a4806cd05ee3c9cc0, agent-ab02e260ef0d377e1 | travados (`git worktree lock`); a ferramenta recusa e não usei `--force`. |
| agent-a0f44a58f175bda39 (wip/react-measurement-spike) | tem 3 commits que a `main` não tem. |
| agent-a3ecf632f98c04aa1 (wip/f80-home-menu-and-slider), agent-ad689f892c127d767 (claude/f45-visual-recheck-batch) | agentes trabalhando agora. |
| agent-a30a32ac29112c133, agent-a33d3c84b8f2469be, agent-a5962d35764676e05 | têm edição sem commit (trabalho de F85, `launch.json` e `vite.config.local.js`); não são resto, são trabalho. |
| agent-ac42a2dfaae6c100d, agent-af375e13e047be0da | travados (wip dos desenhos de F80 e F79). |
| dazzling-haslett-d4b727, peaceful-clarke-ca78a2 | atividade recente / recém-aberto. |
| fix-albums-loading-and-cache-d92daf, agent-ac30caf3aa8a96dd0 | fora do escopo: sessão do orquestrador e a prévia local. |

Nenhum ramo foi apagado. Nada foi empurrado.
