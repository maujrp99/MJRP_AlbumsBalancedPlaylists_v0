---
title: A prática de ADR
aliases: [adr-practice, disciplina de ADR, como ADR nasce]
summary: quando uma decisão vira ADR, o que a ADR pode e não pode mudar depois, e o gate Proposed → Accepted
tags: [harness, decisao, processo]
status: em formação
atualizado: 2026-10-09
---
<!-- kernel do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
Uma **ADR** registra uma decisão grande — a que tem alternativas, custos e consequências
que sobrevivem a quem a tomou. A prosa dela é **imutável**: depois de aceita, só mudam links,
caminhos renomeados e ponteiros de supersessão. O que envelhece não se reescreve, se emenda.
E ela nasce `Proposed`: vira `Accepted` quando o MJRP lê e aceita — depois de a `mjrp-critiquing-architecture`
julgá-la (troca de chapéu declarada ou agente separado; critérios na página [[architecture-review]]); com P0 aberto, ela
nem chega a ele. Não quando o agente termina de escrever.

**O critério concreto (14/09/2026, ADR-0010 do harness):** vira ADR quando a mudança — de uma feature, um
componente, um módulo, uma regra de negócio ou uma UI — **conflita** com o que já está declarado
em `arch.md`, `info-arch.md` ou `design-system.md`. Não escala por `process_level:` — a mesma
regra vale nos três níveis; em projetos `minimal`, que raramente têm esses três documentos, ela
simplesmente dispara pouco, o que é a medida certa, não uma exceção.

## History

- **2026-10-09 20:55** · Revisão geral de 2026-10-09: antes do aceite do MJRP, a `mjrp-critiquing-architecture` julga a ADR (troca de chapéu declarada ou agente separado; critérios em [[architecture-review]]) — com P0 aberto, ela não chega a ele. As ADRs citadas passam a dizer "do harness", em texto, porque a cópia do kernel nos filhos ligava à ADR de mesmo número do filho.
- **2026-09-14 11:02** · **O gatilho de ADR ganhou critério concreto.** Fechando o BACKLOG #46,
  o MJRP definiu: vira ADR quando a mudança conflita com o que já está declarado em `arch.md`,
  `info-arch.md` ou `design-system.md` — mesma regra nos três níveis de `process_level:`. Como
  detectar isso automaticamente é julgamento semântico, não checagem mecânica: fica registrado
  como o desenho do BACKLOG #22 (Fase F), não um sensor do doctor. Ver ADR-0010.

> Página criada em 09/09/2026 pelo BACKLOG #28a, por indicação do Zé. As entradas abaixo vieram
> **inteiras** do `MEMORY.md` — nada foi condensado na mudança; a edição, se vier, vem depois e
> com o `memory_check` capaz de vê-la.
- **2026-09-08 21:16** · **A ADR nasce `Proposed`; só o Zé a torna `Accepted`.** O campo *Decisores* só o nomeia
  quando a decisão foi dele — senão, "redigida por Claude, pendente de aprovação". E o aviso de
  supersessão vai **nos dois arquivos**, não só no novo. Regra no `AGENTS.md` e na skill `mjrp-adr`.
- **2026-09-08 21:16** · **ADR não é onde regra operante mora** — ela guarda o porquê e envelhece de propósito; o que
  vale hoje está no VISION/PRINCIPLES/concepts, e o que tem que ser obedecido vira linha no `AGENTS.md`
  ou checagem com exit code. A ADR-0002 valia porque o `doctor.py` a implementa, não porque estava escrita.
- **2026-09-08 21:16** · A ADR da memória (#28) passa a ser a **0008** — a 0007 foi usada pelas checagens extraídas.
- **2026-09-08 14:24** · O Zé suspeita que **as ADRs não refletem o pensamento dele** — vão para revisão à
  mão no Kindle antes de qualquer coisa se apoiar nelas.
- **2026-09-09 16:10** · **Regra minha vestida de decisão dele.** A ADR-0003 dizia *"Decisores: Zé
  Pedroso, com Claude"* e ele não aprovou o texto — nasceu `Accepted` no commit `3882130`, antes
  do gate existir. A regra que ela criou — *"um conceito só ganha página quando alguém precisou
  explicá-lo duas vezes"* — é **minha**, e já se espalhou por **11 arquivos ativos**, inclusive o
  plano de migração de hoje, onde eu a usei para justificar três páginas novas. Ele pegou.
  Atribuição corrigida na 0003; as outras cinco ADRs antigas seguem por examinar (#38b).
- **2026-09-08 21:16** · **Eu editei ADR aceita, duas vezes** — a I3 ampliada (07/09) e o W4 (08/09) foram escritos
  dentro da tabela da ADR-0002, de 05/09, que o próprio `AGENTS.md` manda nunca editar. O Zé pegou ao
  ler as ADRs. Extraídas para a **ADR-0007** (`Proposed`); a 0002 voltou ao texto do dia dela.
- **2026-09-08 21:16** · **Ninguém lê ADR numa sessão normal** — não estão em "o que ler antes de decidir" do
  `AGENTS.md`; a `mjrp-onboarding` só as abre no papel de arquiteto. Foi por isso que a defasagem passou
  meses sem ninguém notar: o que governa a sessão é `AGENTS.md` + `MEMORY.md`.

## Related
[[harness-elements]] · [[harness-kaizen]] · [[memory-architecture]] · [[architecture-review]] · ADR-0002, ADR-0007 e ADR-0010 do harness (`docs/decisions/`)
