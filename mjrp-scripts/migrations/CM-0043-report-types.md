---
id: CM-0043
item: report-names
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0043 · report-names@1 → report-names@2

## Por que

O Control Center agrupa os relatórios por tema, e tira o tema do `type:` do cabeçalho — por uma lista fixa que morava no código da tela. Só dois modelos de relatório das skills declaravam `type:` (a crítica de arquitetura e a de UX); no fin-control, seis relatórios ficaram sem tema: dois `type: conformance-audit` (o tipo do modelo que o harness criou no mesmo dia e que a tela não conhecia), um `tech-debt-survey` (sem skill) e três de 2026-10-13 sem cabeçalho. Ninguém cobrava de quem escreve o relatório que ele declarasse o que é.

Nasceu de: decisão do MJRP (2026-10-17 22:48, «sim, siga com as três»): uma lista única de tipos de relatório no harness, todo modelo declarando o seu `type:`, e o `report-names` cobrando.

## O que muda

- Existe uma **lista única de tipos** no harness, `mjrp-scripts/report_types.json` (tipo → tema → skill dona → pasta; viaja para o filho com o kernel). O Control Center tira o tema daqui; os modelos das skills declaram o `type:` dela.
- O item `report-names` passa a cobrir **todo** `reports/` (não só `reports/audits/`) e ganha uma segunda cláusula, a `report_types_check.py`: todo relatório `.md` sob `reports/` declara no cabeçalho um `type:` que está na lista. Ficam de fora as quatro pastas cujo tema vem da pasta (`evidence/`, `harness-feedback/`, `handoffs/`, `presentations/`) e o `folder-index.md`.
- **Corte de data:** relatório de **2026-10-17 em diante** sem `type:` da lista é **erro** (reprova o item). Os anteriores são **aviso** — a checagem os lista mas não reprova —, porque relatório não se reescreve para uma regra que não existia; quem os corrige é o conform, lendo o conteúdo. A data é a do nome do arquivo (`AAAA-MM-DD-...`), senão a do `judged:` do cabeçalho; sem nenhuma das duas, aviso.
- A mensagem nomeia os **tipos mais próximos** (o tipo declarado errado, as palavras do nome do arquivo), cada um com o seu tema.
- A cláusula de nome (`AAAA-MM-DD-<projeto>-<tipo>.md` em `reports/audits/`) continua como era.

## O que o filho faz

1. `python3 mjrp-scripts/report_types_check.py .` — a lista inteira: os erros (relatórios de 2026-10-17 em diante) e os avisos (os anteriores), cada um com os tipos mais próximos.
2. Para cada relatório da lista, **leia o relatório** e escolha o tipo pelo que ele é, não só pelo nome do arquivo; some `type: <tipo>` ao cabeçalho (um relatório sem cabeçalho ganha um de três linhas: `---`, `type: <tipo>`, `---`). O conteúdo do relatório não se toca. A `mjrp-syncing-docs` executa (a tabela dela diz como).
3. **Nenhum tipo serve?** Não invente um: pergunte ao MJRP, com as opções (os dois tipos mais próximos e «tipo novo»). O tipo novo entra na lista **no harness** (`report_types.json`, por decisão dele) e chega ao filho no próximo `--refresh-kernel`.
4. Commit por pathspec, com entrada no log.

Depois de conferir, acrescente `CM-0043` a `conformance.applied` no contrato.

## Como se confere

`python3 mjrp-scripts/report_types_check.py .` sai 0 (sem erro) e `conformance_check.py . --gaps` não lista mais `report-names`. Os avisos que sobrarem são os relatórios anteriores a 2026-10-17 que ainda não ganharam o `type:`: o conform os fecha, e a auditoria final do conform lê o que a checagem não vê (o tipo escolhido bate com o conteúdo?).

## Quando não se aplica

Projeto sem `reports/`. Um relatório de outro autor, em outro formato (HTML, PDF), não leva cabeçalho: a checagem só lê `.md`.
