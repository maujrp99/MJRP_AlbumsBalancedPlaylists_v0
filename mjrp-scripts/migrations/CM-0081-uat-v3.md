---
id: CM-0081
item: uat
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0081 · uat@2 → uat@3

## Por que

O MJRP decidiu em 2026-10-19 que o trabalho corre em duas trilhas paralelas. **Humano:** os requisitos do PRD e as issues que ele abriu — a prioridade, e ele aceita por feature. **Agente:** as issues que juízes e agentes abrem — quem abre delega a correção na hora e uma reconferência independente a fecha. Uma issue de agente só sobe para a trilha Humano se for **P0** ou de **segurança**, marcada com o motivo. O `uat.md` não dizia quem abriu a linha: o marcador `**Aberta por:**` vive dentro da descrição e a lista de aceite misturava as duas trilhas.

Nasceu de: o brief das trilhas (F48, S-155), decidido pelo MJRP em 2026-10-19.

## O que muda

- coluna **Reportado por** logo depois de **Reportado em** (nove colunas): `MJRP` · `juiz` (um juiz, uma crítica, um verificador, uma reconferência) · `agente` (qualquer outro agente: o implementador).
- uma linha de `juiz`/`agente` pode subir para a trilha dele na própria célula: `agente · prioridade: humano — P0: <motivo>` ou `— segurança: <motivo>`. `prioridade: humano` só com P0 (e `Gravidade` `P0`) ou segurança, e nunca numa linha do MJRP.
- o **OK do humano** de uma linha de agente é preenchido pela reconferência independente: `recheck independente: <relatório>, AAAA-MM-DD HH:MM` (no lugar de `(conferida por agente)`). A reconferência nunca fecha uma linha do MJRP, nem uma que subiu com `prioridade: humano`: só o OK dele.
- o marcador `**Aberta por:** agente (<quem>)` continua, e concorda com a coluna: linha do MJRP não o tem; linha de `juiz`/`agente` o tem.
- o `check` do item vira o `uat_tracks_check.py` (a coluna, os valores, a regra da prioridade, o marcador e o OK). As linhas anteriores a 2026-10-19 19:34 (a aprovação do MJRP) só são julgadas no cabeçalho, no valor e na prioridade.
- o leitor `product_structure_check.py` aceita o cabeçalho de nove colunas (`product-structure@10`, CM-0082).

## O que o filho faz

1. `mjrp-specifying-sdd-artifacts`: em `docs/specs/uat.md`, inserir a coluna `Reportado por` depois de `Reportado em` em todas as tabelas e preencher cada linha, sem apagar nada:
   - com `**Aberta por:** agente (<quem>)` na descrição → `juiz` se `<quem>` ou o texto falam de juiz, crítica, verificador, recheck ou reconferência; senão `agente`;
   - sem o marcador → `MJRP` se a descrição cita «o MJRP», «print do MJRP» ou «pedido do MJRP»; senão `agente`, e liste a linha para o MJRP corrigir se ela for dele.
2. Acrescentar ao comentário de cabeçalho a frase das duas trilhas (o modelo `templates/uat.md` tem o texto).
3. Commit por pathspec com entrada no log: «uat@3 (CM-0081)».

Depois de conferir, acrescente `CM-0081` a `conformance.applied` no contrato.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0081` sai 0 e `python3 mjrp-scripts/uat_tracks_check.py .` sai 0.

## Quando não se aplica

Projeto sem `docs/specs/uat.md` (nada implantado ainda): a nota fica de fora até o arquivo existir — e ele nasce do modelo, já com a coluna.
