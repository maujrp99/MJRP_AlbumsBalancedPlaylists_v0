---
id: CM-0158
item: prd
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0158 · prd@3 → prd@4

## Por que

O Product Brief do Control Center responde seis perguntas, da mais importante ao detalhe: para quem e por quê, aonde quer chegar, onde está agora, do que é feito, o que pode dar errado e quais são os limites. O `prd.md` do Control Center já segue essa ordem desde a F82; o modelo do kernel não, e todo projeto novo nascia com as seções numa ordem que a tela tinha de reorganizar. O MJRP pediu, em 2026-10-26: «este agora, o modelo depois». É a S-175, entregue pela F88. A abertura com «O que é» (S-220, CM-0133) continua no topo: a reordenação vem depois dela.

## O que muda

- O PRD ganha seis títulos de grupo, `##` como as demais seções, cada um com uma linha curta sobre a pergunta, e um sétimo, `O documento`. A ordem é: `O que é` · `Para quem e por quê` (Objetivo, Contexto e encaixe estratégico, Personas e cenários) · `Aonde quer chegar` · `Onde está agora` · `Do que é feito` (Epics, Requisitos por épico, Candidatos) · `O que pode dar errado` (Premissas e questões em aberto, Riscos) · `Os limites` (Regras de negócio e restrições, Fora de escopo, Dependências) · `O documento` (Desenho e protótipo, Mudanças).
- Nenhuma seção desce de nível nem muda de título: um `###` no lugar de um `##` quebra o catálogo, o leitor do PRD e o Intake. Os títulos dos grupos são fixos, porque o Brief os lê pelo nome. `O que é e para quem`, o título antigo do primeiro grupo, ainda é lido, mas `Para quem e por quê` é o que o modelo usa.
- O check do item não muda: o PRD que ainda não agrupa segue válido e o Brief o lê como antes.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o modelo novo do PRD pela skill.
2. A `mjrp-coaching-pm` reordena o `docs/specs/prd.md` do projeto no modelo: insere os títulos de grupo e move cada seção para baixo do grupo que ela responde, sem reescrever o texto. O que o projeto já tem fora do modelo (seção própria) fica no grupo mais próximo. O humano vê a ordem antes do commit. O modelo e o guia estão na skill (`templates/prd.md`, `reference/prd-guide.md`).
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0158` e acrescenta `CM-0158` a `conformance.applied`.

## Como se confere

A aba Product do projeto, no Control Center, mostra o Product Brief com as seis perguntas na ordem do modelo, e `conformance_check.py . --gaps` continua sem lacuna `prd`.

## Quando não se aplica

Num projeto sem PRD (o perfil `content`, o `meta`, ou o nível de processo `minimal`): só registra a nota. Um projeto aninhado no repositório do harness já é o harness.
