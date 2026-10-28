# PRD - MJRP_AlbumsBalancedPlaylists_v0
**Status**: Draft · **Atualizado**: 2026-10-28

## Objetivo

[O alvo do produto em uma ou duas frases. Os resultados e as medidas moram no ROADMAP.md - aponte para ele, não os repita: a medida tem uma fonte só. Métrica que ninguém mede não é métrica - ou ela vira `sensors:`/`gates:` no contrato, ou sai do ROADMAP.]

## Contexto e encaixe estratégico

[Por que agora, e como isto serve o VISION.md. Uma ou duas frases - o propósito mora lá, não aqui.]

## Personas e cenários

[Quem usa, e em que situação. Num produto agêntico, é daqui que sai a identidade de cada agente-papel.]

## Regras de negócio e restrições

[O que o sistema não pode fazer, de jeito nenhum. Distinto de "fora de escopo": aqui é proibição, lá é prioridade.]

## Dependências

[O que vem de fora do produto (outro sistema, outro time, outro projeto) e o que bloqueia ou pode bloquear. Uma linha por dependência: de quem, até quando, o que acontece se atrasar. Vazio é válido - escreva «nenhuma conhecida».]

## Fora de escopo

- [o que foi considerado e rejeitado, com o motivo - não é "ainda não": para isso existe a ordem do ROADMAP.md]

## Desenho e protótipo

[Links para o protótipo aprovado (`design/…`) e para o `docs/specs/info-arch.md`: o protótipo aprovado é a representação mestra da tela, o PRD só o liga. Sem protótipo ainda: «a desenhar» e quem decide. Não descreva a tela aqui.]

## Epics

[Um Epic é a solução escolhida (Now) ou a opção em descoberta (Next) de um resultado do ROADMAP.md. Cada linha liga o Epic ao resultado que ele serve. **Sem coluna de estado, de contagem nem de critério** ("7/9 Done"): o andamento de um épico se lê das stories que este PRD embute, nunca se escreve à mão - a contagem escrita envelhece e vira uma segunda fonte. O critério de saída mensurável de cada épico é a linha opcional `exit::` na seção dele, em "Requisitos por épico".]

| Épico | Serve |
|---|---|
| **EP-01 · [nome do épico, o que a pessoa passa a poder fazer]** | `^OUT-01` |

## Candidatos (Intake)

[A porta de entrada dos loops: o que foi pedido ou achado e ainda não foi triado. Sai daqui por uma das duas vias — padrão ou rápida — como resultado, épico ou requisito, ou é rejeitado com motivo.]

## Premissas e questões em aberto

[O que estamos assumindo sem ter verificado, e o que ainda não foi decidido.]

## Riscos

[O que pode dar errado mesmo com tudo feito como combinado. Um por bloco: `### R-01 · [o risco numa frase]`, com **Risco**, **Gatilho** (o que avisa), **Plano de resposta** e **Dono**. Sai daqui quando o plano vira mecanismo que roda, ou quando o humano o aceita.]

## Mudanças

[Uma linha por mudança relevante do próprio PRD, com data e hora: `AAAA-MM-DD HH:MM · o que mudou e por quê`. Vem das decisões do docs/log.md; aqui só o que alterou este documento. Vazio até a primeira mudança.]

## Requisitos por épico

O mapa dos requisitos: cada requisito é um arquivo em `docs/specs/requirements/<pasta do épico>/<ID>-<slug>.md` (o slug vem do título em inglês, minúsculo, com hífens, até 50 caracteres; fixo desde o nascimento), no formato de `requirements.format` do contrato, escrito pela mjrp-writing-reqs. Aqui cada épico declara a pasta dos seus requisitos (`folder::`, em inglês), o resultado que serve, e embute os seus requisitos. **Todo requisito (story, caso de uso, NFR) está embutido aqui, pelo nome inteiro do arquivo:** o PRD é a fonte do conteúdo e a tela só o organiza - um nó que existe e não está embutido é um achado. O épico herda as tags do resultado que serve; se precisar, soma até 3 próprias numa linha `tags::`.

### EP-01 · [título do épico]
folder:: ep-01-[slug-em-ingles]
serves:: [[ROADMAP#^OUT-01]] ^EP-01
exit:: [opcional: o que se mede para dar o épico por saído]

[um embed por requisito do épico, quando existir, pelo nome inteiro do arquivo - `![[S-01-<slug>]]`]

### Transversais

Os requisitos não funcionais valem para todas as features e não são importados por nenhuma: cada um é um arquivo `docs/specs/requirements/nfr/NFR-xx-<slug>.md`.

[um embed por NFR, quando existir - `![[NFR-01-<slug>]]`]
