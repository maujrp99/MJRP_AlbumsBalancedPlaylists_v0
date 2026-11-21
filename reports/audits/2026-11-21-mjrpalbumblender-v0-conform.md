---
type: project-bootstrap-report
status: concluído
date: 2026-11-21
branch: wip/kernel-conform-2026-11-21
---

# Conform do Album Blender V0 depois do kernel de 2026-11-21

## Resumo

O conform ficou **parcial, de propósito**. Das 90 notas pendentes, 44 foram resolvidas (38 só registradas porque o projeto já cumpria, 6 com trabalho feito). Restam 46 notas e 10 lacunas. A saída do portão (`conformance_check.py . --gaps --pending --strict`) ainda é 1, e o erro de «catálogo defasado» sumiu. Nada do produto (`public/`, `server/`, `shared/`, `app/`), de `docs/specs/priority.md` nem das especificações de features em andamento foi mudado, fora o que uma nota pediu (ver «O que fiz»).

| | Antes | Depois |
|---|---|---|
| Lacunas | 11 | 10 |
| Notas pendentes | 89 (90 depois de a `main` trazer a CM-0166) | 46 |
| Erro «catálogo defasado» (visual-sensor@12) | sim | não |
| Lacuna que era erro (nomes de relatório) | erro | aviso |

Obs.: o enunciado falava em 12 lacunas; a listagem que rodei no começo trazia 11. A diferença não pude explicar.

## 1. O catálogo defasado

Rodei `new_project.py . --refresh-kernel` do harness. **Não mudou nenhum arquivo**: a `main` já tinha, no commit `ab991ef` (chegou depois do `8731582`), o kernel de 2026-11-21 com a nota CM-0166 (visual-sensor@12). O ramo foi cortado da `main` atual e o aviso de «defasado» sumiu. `.mjrp-project.yml`, `docs/specs/board.json` e `AGENTS.md` não foram tocados pelo refresh. A passada do doctor que o refresh dispara ficou vermelha (522 erros, 25 avisos); não é do refresh e o doctor roda no merge, por ordem.

## 2. As notas

**Registradas porque o projeto já cumpre (38 notas, 10 commits, nenhum arquivo mexido):** versões do sensor visual (12), notas do board (5), fechamento de sessão (9), releases (2), estrutura de produto (3), seções do info-arch (3), nós de requisito (1), wireframes (1), notas de inception (1), merge drivers (1). Cada uma passou em `--check-note` antes de ser registrada.

**Feitas, com trabalho (6 notas):**
- Estratégia de entrega (CM-0111): escrevi a seção `## Delivery strategy` do `arch.md` lendo os scripts de deploy, o CI, o `firebase.json`, a ADR-0020 e o contrato. Está marcada **proposta do agente, à espera do MJRP**; o que o repositório não mostra está escrito «not checked».
- Sensores do processo (5 notas, CM-0107 a CM-0140): declarei no contrato os quatro que passam (vocabulário do PDLC, forma do SDD, grafo de requisitos, mapa dos ganchos).

**Com trabalho feito mas a nota segue pendente (por falta de um passo que não é meu):**
- Nomes de relatório (6 notas): renomeei 16 relatórios de `reports/audits/` para o padrão e varri os ponteiros (31 arquivos). A lacuna deixou de ser erro. Acertei o `type:` de 10 relatórios. Faltam 8 sem tipo da lista (pergunta 2) e 4 pareceres do harness sem o nome do projeto (pergunta 3).
- ADRs (3 notas): encurtei a ADR-0019 (Proposta, 8.553 para menos de 6.000 caracteres; o texto antigo está no git) e pus a linha de quem aceita. Falta a ADR-0020 (pergunta 4).
- UAT (1 nota): acrescentei «Aberta por» e corrigi «Reportado por» em 7 issues; faltam 3 (pergunta 5).

## 3. O que deixei, e por quê

- **Sensor de estados do board** (8 notas de process-sensors, CM-0144 a CM-0157): o juiz acha 54 features sem registro no board. O conserto é `python3 mjrp-scripts/board_move.py seed`, que grava em `.mjrp/board.jsonl` do **checkout principal** (fora do git e fora do meu ramo). Não rodei. Lista do orquestrador, abaixo.
- **Planos de teste** (record-shapes, CM-0109): faltam `## Test plan` no `plan.md` de F73, F74, F77, F78, F81, F83, F84 e F85. São features em andamento, com ramos de outras sessões mexendo nos mesmos arquivos; escrever agora geraria conflito. Melhor cada ramo trazer o seu no fecho.
- **Inventário de telas do info-arch** (CM-0008, CM-0126): pede linhas `UI-xx`. Mexer nele com protótipo em andamento aciona a trava do espelho do protótipo (wireframes refeitos). Do orquestrador com a `mjrp-designing-ui`.
- **Design system** (8 notas): pede a seção de temas, as Identity Specs e o espelho publicado no Claude. O que for escolha (o site troca de paleta? qual identidade?) é do MJRP; o espelho é da F86, que está em esboço.
- **Cor do projeto** (2 notas, só aviso): escolha de design do MJRP.
- **Auditoria de conteúdo** (13 notas): exige agentes separados, um juiz por item, em cima de artefatos que ainda vão mudar (PRD, design system, info-arch). Não rodei: a auditoria só vale depois que esses artefatos fecharem, e custa uns oito agentes. É o último passo.
- **Abertura do PRD «O que é»** (2 notas): a nota manda o MJRP aprovar o texto antes do commit. Deixei um rascunho abaixo, fora do `prd.md`.
- **Dois pontos que o refresh listou e eu não toquei:** `docs/archive/`, `docs/debug/` e outros itens de `docs/` fora da natureza.

Também ficaram sem trocar, de propósito, os pontos que citam o nome antigo dos relatórios dentro de protótipos (`design/inception/home-transformar-v2.html`, o css e duas prévias da F79, `design/proposals/info-arch/info-arch.html`): mexer neles dispara a trava do espelho do protótipo. São comentários; a decisão é da `mjrp-designing-ui` na próxima rodada de tela.

## 4. Decidido pelo agente (revisável pelo MJRP)

1. Renomear 16 relatórios para o padrão `AAAA-MM-DD-mjrpalbumblender-v0-<assunto>`.
2. `type: architecture-audit` com `status: open` nas críticas F52 e F78 (na dúvida, aberta).
3. `type: research` em sete relatórios de pesquisa ou comparação e `content-audit` no levantamento de textos da F81.
4. Encurtar a ADR-0019 e declarar o aceite como `tech lead` (escolha técnica; se ele entender que é decisão de produto, a linha vira `MJRP`).
5. Declarar quatro sensores do processo no contrato.
6. «Aberta por: agente (…)» lido da evidência que cada issue cita; `Reportado por: juiz` em UAT-231 a 234.
7. Este relatório usa `type: project-bootstrap-report` por ser o tipo da lista mais próximo; não há tipo «relatório de conform».

## 5. Para o orquestrador

1. No checkout principal: `python3 mjrp-scripts/board_move.py seed`. Depois, declarar `board_states: "python3 mjrp-scripts/board_states_check.py ."` em `sensors:` e registrar CM-0144, 0148, 0150, 0153, 0154, 0155, 0156 e 0157.
2. O merge: rodar o doctor, os testes e o build (não rodei). O ramo mexeu em um teste (`test/components/home/HomeRecheckShapes.test.js`) e em `scripts/i18n/scan-copy.cjs`, só para trocar o nome de relatório que citavam.
3. Planos de teste das oito features em andamento: cada ramo no fecho.
4. Inventário do info-arch e a trava do protótipo: junto da `mjrp-designing-ui`.
5. Auditoria de conteúdo: por último, quando os artefatos acima fecharem.
6. Pedir ao harness a decisão sobre tipos de relatório que faltam (pergunta 2).

## 6. Perguntas para o MJRP

Cada uma com a recomendação marcada. Nenhuma foi respondida nem registrada como respondida.

**1. O texto que abre o PRD («O que é»), serve?** Depois da sua palavra eu o ponho no topo do `prd.md`.
- (a) Serve como está (recomendada: é só o que a documentação já diz, na ordem do produto).
- (b) Quero ajustar: me diga o que mudar.

Rascunho (proposta do agente, lida da visão, do PRD e dos épicos; não verifiquei contra o código): «O Album Blender é uma aplicação web que mistura álbuns, aclamação da crítica e popularidade em playlists equilibradas, para quem ainda ouve música álbum por álbum. A ordem do produto é **montar, misturar, ouvir**: 1. montar uma série de álbuns, de um artista, de um gênero ou de faixas soltas; 2. escolher a receita de mistura; 3. rever as playlists geradas e guardadas; 4. exportar para o Spotify ou o Apple Music. No celular e no computador; com o inventário de álbuns que a pessoa possui ao lado.»

**2. Oito relatórios não cabem em nenhum tipo da lista do harness (regressão no navegador, cruzamento com o plano da v5, triagem de issues, varredura de fontes das notas, mapa da v5, e-mails de contato, a atualização do kernel e a limpeza de worktrees). O que fazer?**
- (a) Pedir ao harness um ou dois tipos novos (por exemplo `analysis` e `draft`) e usar quando existirem (recomendada: a regra é que tipo novo nasce no harness).
- (b) Enquadrar cada um no tipo mais próximo, mesmo que não descreva bem.
- (c) Deixar sem tipo e aceitar o aviso.

**3. Os 4 pareceres para o harness (`reports/harness-feedback/`) não têm o nome do projeto no nome do arquivo. Renomear?**
- (a) Não renomear agora e registrar a pergunta (recomendada: se o harness já triou esses pareceres, renomear quebra a triagem; confirme com o orquestrador).
- (b) Renomear os 4.

**4. A ADR-0020 (Node 24, já aceita por você) não tem a linha de quem aceita. Acrescentar `Acceptance: MJRP` ao cabeçalho, sem tocar no texto da decisão?** Eu não edito ADR aceita sozinho.
- (a) Sim, só essa linha (recomendada: a ADR diz que foi você quem decidiu, em 2026-11-19).
- (b) Não; prefiro dispensar a regra para ela.

**5. Em UAT-224, 225 e 226 (de 2026-11-20) a coluna «OK do humano» diz «histórico anterior ao harness» e a âncora é `^UAT-171`, copiadas da UAT-171. Corrigir?** Anterior ao harness não são.
- (a) Tirar a frase, pôr a âncora própria de cada uma e deixar o OK vazio até haver o recheck independente ou os testes verdes (recomendada).
- (b) Deixar como está.

**6. A estratégia de entrega que escrevi no `arch.md` (a Delivery strategy) está certa?** Em resumo: só a `main` vai a produção; o site e o servidor saem pelos dois scripts, da sua máquina; não há preview automático; para voltar atrás, o histórico do Hosting e a revisão anterior do Cloud Run.
- (a) Confirmo (recomendada, depois de você ler a tabela; então a linha de status passa a «confirmada»).
- (b) Ajusto: me diga o quê (principalmente: existe canal de preview no Firebase, ou projeto de teste separado? não verifiquei).

**7. Qual a cor do V0 no Control Center?** É só aviso, nunca vira erro.
- (a) A `mjrp-defining-design-systems` propõe dois pares da biblioteca de paletas e você escolhe (recomendada).
- (b) Deixar sem cor por ora.

**8. O site vai trocar de paleta (temas)?** O design system precisa declarar isso, e as Identity Specs são do seu gosto.
- (a) Não troca de paleta: uma identidade só (recomendada, o site atual tem uma).
- (b) Troca: me diga quais.
- (c) Decidir quando a F86 (o design system como artefato) entrar.
