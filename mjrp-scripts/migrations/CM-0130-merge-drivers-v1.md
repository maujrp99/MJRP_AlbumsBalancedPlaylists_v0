---
id: CM-0130
item: merge-drivers
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0130 · merge-drivers@0 → merge-drivers@1

## Por que

No `MJRPpersonal` (UAT-539, 2026-11-07) o `merge_train.py install-driver` disse que instalou os drivers de merge do log e da memória, e os merges seguiram em conflito no `docs/log.md` e no `## Now` do `MEMORY.md`. Faltavam duas peças: as linhas do `.gitattributes` que ligam os dois arquivos aos drivers (o harness as tinha; o kernel nunca as levou) e o próprio `merge_train.py`, que o driver chama a cada merge e que não viajava com o kernel. Um desses conflitos, num ramo que muda tela, refez o merge e custou ao MJRP uma segunda aprovação por passkey (F83).

## O que muda

- O refresh leva `mjrp-scripts/merge_train.py` (os drivers `log-merge` e `memory-merge` e o `install-driver`).
- O refresh acrescenta ao `.gitattributes` do filho as duas linhas que faltam (`**/docs/log.md merge=mjrp-log` e `**/MEMORY.md merge=mjrp-memory`), sem reescrever o que já existe, e configura os dois drivers no git do clone.
- O `install-driver` só diz «instalado» quando o `git check-attr` confirma a ligação: escreve as linhas que faltam e recusa (exit 1) no clone sem o `merge_train.py` ou com outra linha que desliga o driver.
- O I5 do doctor (a herança do kernel) reprova o log ou a memória sem a ligação, e avisa quando o clone não configurou os drivers.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness: traz o script, escreve as linhas e configura os drivers; o `.gitattributes` vai no commit do refresh.
2. Confere: `git check-attr merge -- docs/log.md MEMORY.md` responde `mjrp-log` e `mjrp-memory`.
3. Em cada outro clone do projeto (o checkout principal de outra máquina, por exemplo), roda `python3 mjrp-scripts/merge_train.py install-driver` uma vez: a configuração do git é por clone.
4. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0130` e acrescenta `CM-0130` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0130` sai 0 (o `.gitattributes` liga o log e a memória), e `python3 mjrp-scripts/doctor.py .` não traz erro do I5 (a herança do kernel) sobre os drivers de merge.

## Quando não se aplica

Projeto sem repositório próprio, aninhado no do harness: as linhas `**/` do `.gitattributes` do harness já o cobrem.
