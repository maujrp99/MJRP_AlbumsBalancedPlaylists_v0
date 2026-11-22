---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-64-edit-the-site-content-from-an-admin]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F82: Um admin para o site, com o CMS-kit do MJRP
**Approved**: pendente

## Summary
**A feature:** Um admin, feito com o CMS-kit do MJRP, onde o dono edita o conteúdo do site.

**Por quê:** Hoje todo texto do site mora no código; os sites do MJRPpersonal já têm um admin com o CMS-kit.

**Como saber que funcionou:** A escrever com a proposta.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «As próximas features agora serao de internacionalizar o site e criar um admin como temos nos sites do MJRP personal, utilizando o CMS-kit nosso.»

## Requirements
- [REQ-01] «a escrever depois das conversas com o MJRPpersonal e o harness e da proposta de arquitetura» · fixes S-64

- [REQ-02] O CMS traz uma chave para ligar e desligar a medição de uso do site (F77, PostHog), que nasce desligada. Palavras do MJRP (Control Center, D-05, 2026-11-21 09:08): «Deixar desligada e entrar no CMS uma feature toggle pra ligar assim que terminarmos a Migracao para o react e o buil do CMS». Como foi lido: a medição continua desligada agora; a chave entra no CMS, e ele liga depois da migração para o React e de o CMS estar construído. A regra dele para o kit vale: recurso de CMS nasce no kit e serve a todos os CMS, então a peça «chave de liga e desliga» é assunto da F332 do harness · fixes S-64

- [REQ-03] No CMS o dono escolhe quais álbuns aparecem na página de entrada (a «nova home», o caixote da F80), e em que lado e ordem. Palavras do MJRP (2026-11-21): «ah e gostaria que no CMS fosse configurável os albuns que aparece na nova home». Hoje os álbuns são um arquivo de dados fixo (`public/splash/covers.js`, 14 álbuns, lados A e B). A resolver na proposta: a página de entrada é estática e lida sem script, então como a escolha feita no CMS chega a ela (leitura em tempo de execução com o conjunto fixo como reserva, ou publicação que refaz a página) · fixes S-64
- [REQ-04] Na primeira versão o único administrador é a conta do próprio MJRP (nunca um convidado), garantido nas regras do banco e no servidor. Decisão do MJRP (2026-11-22), à pergunta «o administrador é só a sua conta (Google ou Apple), fixa nas regras do banco? Recomendo sim»: «2. Sim? Mas poderíamos evoluir o kit do CMS pra ter rbac em que eu sou o super admins. Atriibuo e crio roles» · fixes S-64

- [REQ-05] O kit do CMS evolui para acesso por papéis (RBAC): o MJRP é o superadministrador, cria papéis e os atribui a pessoas. Pedido dele (mesma resposta, 2026-11-22), ainda sem desenho. Como o kit é do harness, o pedido foi ao harness (`harness-feedback` no log de 2026-11-22); este projeto só adota o recurso quando o kit o trouxer (F332). Fica dentro da F82, e não numa feature própria, porque a F82 já lista os requisitos pequenos do CMS (REQ-02, REQ-03) e este é, no V0, a regra de quem entra; vira feature própria se a proposta de arquitetura mostrar que pede uma · fixes S-64

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
A escrever.

## Open Questions
- O que o admin edita: os textos das telas, a página de entrada, as traduções (F81), mais alguma coisa.
- O que é o CMS-kit hoje: onde mora, que stack pede, como se instala num projeto que não é dele (este site é JavaScript puro com Vite e Firebase).
- Quem entra no admin e como: decidido para a primeira versão (REQ-04), só a conta do MJRP; o resto cai nas perguntas dos papéis abaixo.
- Papéis (REQ-05), a decidir, nenhuma respondida: quais papéis existem primeiro (por exemplo, editor de textos, gestor de receitas, gestor de chaves de feature); se um papel vale por seção do CMS; como uma pessoa é convidada; como as regras do banco leem o papel (declarações personalizadas no token ou um documento de papéis); a auditoria de quem mudou o quê.
- Onde o conteúdo fica guardado e como chega ao site publicado.
- Pedidos do MJRP de 2026-11-22 que dependem deste CMS e são features próprias: a F92 (algoritmos de mistura criados e gerenciados no CMS) e a F93 (chaves de ligar e desligar features, a começar pelo Discogs; generaliza o REQ-02 daqui).
- A ordem entre F81 e F82: o admin antes, para as traduções já nascerem nele, ou depois.
