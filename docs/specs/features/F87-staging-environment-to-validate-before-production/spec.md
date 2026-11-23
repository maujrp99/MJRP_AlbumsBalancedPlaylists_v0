---
status: In Progress
lane: standard
solution_type: feature
imports: ["[[S-69-see-the-site-in-a-separate-environment]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F87: Um ambiente separado para validar o site antes da produção
**Approved**: pendente

> **Nota de 2026-11-23 (arrumação do board).** A fatia A está construída e em uso: `scripts/deploy-preview.sh` publica a prévia (canais `staging` e `home-menu`, usados pelo MJRP em 2026-11-21 e 22) e o servidor aceita o endereço dela. Falta: provar que a prévia não grava preço do Discogs no banco (TASK-02), a confirmação do MJRP na linha de proposta do `arch.md` § Delivery strategy, e as seções «A escrever» desta spec.

## Summary
**A feature:** Um jeito de publicar o site num endereço que não é o da produção, para o MJRP ver e aprovar a versão em React (F83) e a nova home antes de ela ir ao ar.

**Por quê:** Hoje o site só vai direto para a produção (`scripts/deploy-site.sh`); o `arch.md` diz que não há prévia.

**Como saber que funcionou:** O MJRP abre o endereço da prévia, vê a versão nova e a produção segue intacta.

## Problem Statement
Dito pelo MJRP em 2026-11-21, sobre validar a versão em React e a nova home antes da produção: «O firebase não nos dá um ambiente de staging pra homologarmos a versão em react?» e depois «Eu preferia ver tudo num ambiente separado»

## Decision
O MJRP escolheu a fatia A em 2026-11-21, respondendo «A)» à pergunta entre «só o site separado» e «tudo separado»: só o site num canal de prévia do Firebase Hosting, com os dados, o login e o servidor da produção. A fatia B fica na spec, não escolhida por ora.

## Slices
- **Fatia A, um canal de prévia do Firebase Hosting (ESCOLHIDA).** O mesmo site num endereço temporário, com os mesmos dados, o mesmo login e o mesmo servidor da produção. Precisa pôr o endereço da prévia nos domínios autorizados do Firebase Auth. As conexões com o Spotify e a Apple Music podem não funcionar lá.
- **Fatia B, um ambiente totalmente separado (não escolhida por ora).** Um segundo projeto Firebase, com Firestore, login e a sua própria cópia do servidor no Cloud Run, segredos e endereços de retorno próprios no Spotify e na Apple. Custa um projeto novo que só o MJRP pode criar, cópias de segredos que ele mesmo cuida (o agente nunca lê nem digita um token) e um custo mensal pequeno.

## Requirements
- [REQ-01] Publicar o site num canal de prévia do Firebase Hosting por um comando · fixes S-69
- [REQ-02] Os mesmos testes da publicação em produção rodam antes de publicar lá · fixes S-69
- [REQ-03] O endereço aparece no fim do comando · fixes S-69
- [REQ-04] Nada no ambiente separado consegue gravar um preço do Discogs no Firestore · fixes S-69
- [REQ-05] O comando da prévia nunca toca a produção · fixes S-69

## Nota — a prévia e o servidor
A prévia usa o servidor de produção (Cloud Run `mjrp-proxy`, pela reescrita `/api/**` do Hosting). O servidor passou a reconhecer os canais de prévia do próprio site (`https://<site>--<canal>-<hash>.web.app`, `server/lib/corsOrigin.js`); sem isso ele recusava o `Origin` da prévia (UAT-261). A correção só vale depois que o servidor é publicado.

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
Publicar o servidor (Cloud Run) por esta feature; automatizar a prévia no CI; a fatia B.

## Open Questions
- Na fatia A os dados são os da produção: como garantir que nada grave preço do Discogs no Firestore real (REQ-04).
- O endereço da prévia precisa entrar nos domínios autorizados do Firebase Auth: o MJRP faz, ou o comando sincroniza (o `firebase` tem a opção para isso).
