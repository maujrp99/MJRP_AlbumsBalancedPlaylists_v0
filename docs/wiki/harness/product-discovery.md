---
title: Product Discovery — do problema à decisão (Rapid × Full)
aliases: [product-discovery, discovery, enquadrar, FASE 1b, rapid discovery, full discovery, handbook de discovery, quatro riscos, premissa mais arriscada, matar iterar avançar]
summary: o processo da etapa Enquadrar da Discovery do MJRP — Rapid (cinco passos essenciais, iterativo com o LLM) e Full (o Rapid mais técnicas que o PM marca no início), os quatro riscos transformados em teste, a decisão matar · iterar · avançar e onde cada saída mora no grafo do projeto
tags: [kernel, pdlc, discovery, produto]
status: em formação
atualizado: 2026-10-09
fontes: [originals/product-discovery-handbook/2026-10-07-handbook-v0.md, originals/product-discovery-handbook/2026-10-07-handbook-v1.md, wiki/sources/2026-10-07-mjrp-product-discovery-handbook.md, kernel/roadmap/requirements-graph, kernel/design/sketch-vs-prototype]
---
<!-- kernel do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

# Product Discovery — do problema à decisão (Rapid × Full)

> Kernel · página de processo · criada 2026-10-07 · é a **v2 do Handbook MJRP de Product Discovery**: junta a v0 e a v1 do MJRP
> (originais em `docs/originals/product-discovery-handbook/`) e encaixa o processo no grafo do projeto · fluxo em diagrama:
> `design/diagrams/ways-of-working/2026-10-07-1059-discovery-rapid-vs-full.png` · fontes de fundo: Cagan (*INSPIRED*), Torres (*Continuous
> Discovery Habits*), Perri (*Escaping the Build Trap*), Olsen (*The Lean Product Playbook*), Levine (*Apaixone-se pelo
> Problema*), Fadell (*Build / Criar*)

## Definition

O **Enquadrar** é a etapa da Discovery ([[pdlc-loops]] §3) em que o responsável pelo produto (o PM), com o agente coach,
transforma o que o Explorar mostrou numa decisão: o problema que vale resolver, o resultado que se quer mover e como medi-lo, os quatro riscos
do produto convertidos em testes, a premissa mais arriscada e o desenho do teste dela — e então **matar, iterar ou avançar**.
Tem dois modos: o **Rapid** (o essencial, em cinco passos, iterativo com o LLM) e o **Full** (o Rapid mais as técnicas que o
PM escolhe no início). É uma etapa aberta: o processo oferece, o PM decide quanto basta.

## 0. Como usar

- **O coach abre perguntando: Rapid ou Full?** No Full, mostra o catálogo de técnicas (§4) para o PM marcar e desmarcar.
  Quem conduz é a `mjrp-coaching-pm`; esta página diz *o que é* o processo, a skill diz *como* conduzi-lo.
- **Tempo é referência, não regra.** Numa sessão entre pessoas, o Rapid cabe em cerca de 60 minutos (quatro blocos de 15);
  com o LLM, o ritmo é o da conversa. Os números do handbook (60 min, 5 usuários no teste de usabilidade, debriefing em
  15 min) são padrão recomendado e ajustável.
- **Quem decide.** O PM decide o modo, as técnicas, quanto basta em cada passo e a decisão final. O agente propõe, pergunta,
  registra e lembra — não fixa número de rodadas, fidelidade nem condição de parada.
- **A entrada principal é o protótipo aprovado e o seu inventário** — escrito pela `mjrp-designing-ui` na mesma rodada
  da tela (`info-arch.md` § *Inventário do protótipo*, com os wireframes em `design/wireframes/`). O coach lê, manda
  escrever se faltar, e cada item termina numa função do produto (do `VISION.md`) ou num resultado, ou é cortado pelo PM
  com motivo. O resultado e a medida cobrem o que o protótipo aprovado mostra. Pular isso é
  escrever resultados e requisitos que deixam de fora o que o PM já aprovou (o furo de 2026-10-07).
- **Um tema por vez, com candidatos.** Em cada passo o coach traz perguntas ou respostas candidatas, tiradas do que já existe
  (as Inception Notes do Explorar, o ROADMAP, o log), para o PM marcar e completar — não pede lista do zero.
- **Produto só para o próprio PM.** A "amostra de um" e o tamanho do público não são risco. Viram risco quando houver desejo
  de escalar o produto para outras pessoas — o coach lembra, o PM decide.

## 1. Mentalidade — o filtro de tudo

- **Apaixone-se pelo problema, não pela solução** (Levine). A narrativa é "ajudamos o grupo Y a evitar a dor Z", nunca "nosso
  sistema faz X". Se a solução falhar, o problema continua sendo o norte.
- **Resultado antes de entrega** (Perri). A *Build Trap* é medir o progresso pelo que se entregou, não pelo que mudou. O
  `ROADMAP.md` do MJRP já é de resultados; a Discovery decide qual resultado e como medi-lo.
- **A amostra de um** (Levine). Como indivíduos, somos uma amostra de exatamente uma pessoa — o que vale para quem vai escalar.
- **Pergunte sobre o passado, nunca sobre o futuro.** "Você usaria?" e "quanto pagaria?" produzem cortesia, não evidência. A
  evidência é o que a pessoa fez: a última vez, a gambiarra, o tempo e o dinheiro perdidos.
- **Errar rápido, recuperar rápido** (Levine). A maior parte das hipóteses estará errada; o que importa é a velocidade de
  descartar e tentar a próxima. Duas regras no "deserto sem tração": não mudar de direção sem dado, não ficar sem combustível.
- **Bom o bastante antes de perfeito** (Levine, Fadell). A "coisa principal" primeiro; o resto é corte de escopo.

## 2. Rapid — os cinco passos

Cada passo tem as perguntas que o coach traz, o que ele produz e onde a saída mora. A ordem importa: nada de solução antes de
o passo 1 fechar.

### Passo 1 · Problema

- **Perguntas.** Quem sente a dor? Quando foi a última vez? O que fez para contornar (a gambiarra)? Quanto custou em tempo,
  dinheiro ou frustração? Com que frequência acontece?
- **Produz.** A declaração do problema: *"Ajudamos [segmento X] a eliminar [dor Y] no [contexto Z] para mover [resultado W]"*;
  e o sofrimento, como **intensidade × frequência**.
- **Mora em.** O "quem sente" do resultado no `ROADMAP.md`; depois, no épico do PRD.

### Passo 2 · Resultado e medida

- **Perguntas.** O que muda no comportamento de quem sente? Como saberemos que mudou? Qual o valor hoje e o alvo?
- **Produz.** Um resultado `^OUT-xx` com medida (hoje → alvo; opcional — sem ela, `sem medida`) e 1 a 3 tags de categoria, em *Now*, *Next* ou *Later*. Quando o
  produto é de uso recorrente, a retenção é a medida mais forte (o "modelo escova de dentes": usado duas ou mais vezes ao dia).
- **Mora em.** `ROADMAP.md` — formato e tags em [[requirements-graph]].

### Passo 3 · Os quatro riscos → a premissa mais arriscada

- **Perguntas, para cada risco (§3).** O que precisa ser verdade? Que evidência já temos — uso real ou só reação a uma tela?
  Qual o teste mais barato para gerar evidência?
- **Produz.** A **premissa mais arriscada** (*leap of faith*): a que, errada, derruba tudo.
- **Mora em.** `docs/specs/inception-notes.md` (as premissas) e `docs/log.md`.

### Passo 4 · Desenho do teste

- **O que se faz.** Desenha-se o teste da premissa mais arriscada — **não se roda**. Quatro linhas: a premissa; o teste sem
  código (concierge, Wizard of Oz, protótipo, teste de fumaça); o critério de corte, combinado antes; quem roda e por quanto
  tempo.
- **Rodar é opcional e fica fora da sessão.** O PM escolhe: em paralelo (avança com a premissa como risco aberto) ou como
  portão (espera o resultado para decidir).
- **Mora em.** `docs/log.md` — o desenho agora, o resultado quando houver.

### Passo 5 · Decisão — matar · iterar · avançar

- **Matar.** A dor é fraca ou esporádica, ou ninguém faz nada hoje para contorná-la. A decisão vai para o log; o resultado sai
  de *Now* (vai para *Later* ou é retirado); nada entra no PRD.
- **Iterar.** A dor existe, mas é diferente do que se supunha. Volta ao passo 1 (ou ao 3) com o ângulo novo.
- **Avançar.** A dor é real e frequente, e a premissa mais arriscada foi testada ou aceita pelo PM como risco. Os épicos entram
  no PRD (cada um com `serves::` para um resultado), o checklist de saída (§5) é revisto, e os requisitos vão para a
  `mjrp-writing-reqs`.
- A decisão é do PM e vai para o log com data e hora.

## 3. Os quatro riscos, transformados em teste (Cagan)

| Risco | A pergunta | Teste mais barato | Quem julga no MJRP |
|---|---|---|---|
| **Valor** | Vão escolher usar (ou comprar)? | Concierge ou Wizard of Oz (o valor entregue à mão, sem código); teste de fumaça; pré-cadastro | O PM — e o cliente, quando houver |
| **Usabilidade** | Conseguem usar sem ajuda? | Protótipo navegável com tarefas reais, de baixa fidelidade (referência: 5 pessoas do público) | `mjrp-critiquing-ux` e o PM |
| **Viabilidade técnica** | Conseguimos construir com o que temos? | *Spike* — prova de conceito técnica curta | `mjrp-designing-architecture` |
| **Viabilidade de negócio** | Funciona para o negócio (custo, margem, legal)? | Simulação de margem e custo; análise legal ou regulatória | O PM |

Duas notas: o Wizard of Oz testa **valor** e **adia** o risco técnico — não o testa; e a ordem natural é valor primeiro, porque
produto que ninguém usa não precisa ser viável.

## 4. Full — o catálogo de técnicas

O Full é o Rapid mais as técnicas que o PM marca no início. Cada técnica aprofunda um passo.

| Técnica | Autor | Passo | Quando usar | Produz |
|---|---|---|---|---|
| **Product Kata** — estado atual → condição-alvo | Perri | 2 | Quando o resultado ainda é vago | Uma meta intermediária mensurável e os obstáculos até ela |
| **Matriz público × sofrimento** | Levine | 1 | Quando se pensa em escalar | O quadrante: Vencedores, Nicho, Sonhos e Pesadelos, Perdedores |
| **Entrevistas de comportamento passado** | Levine, Torres | 1 | Quando há usuários além do PM | Fatos: última vez, gambiarra, custo, frequência |
| **Árvore de oportunidades (OST)** | Torres | 2–3 | Quando há várias dores ou soluções candidatas | Resultado → oportunidades → soluções → experimentos |
| **Pirâmide de PMF** | Olsen | 1 e 3 | Quando a proposta de valor está difusa | Cliente-alvo → necessidades não atendidas → proposta de valor |
| **Teste de fumaça** | Cagan | 3–4 | Para medir intenção antes de construir | Taxa de conversão contra uma meta |
| **Protótipo testado com usuários** | Cagan | 3–4 | Quando a usabilidade é a dúvida | Onde as pessoas travam, por tarefa |
| **Spike técnico** | Cagan | 3–4 | Quando "dá para construir?" é a dúvida | Sim ou não, com o caminho e o custo |
| **Margem e regulatório** | Cagan | 3 | Quando há dinheiro, dado pessoal ou regra envolvidos | Viável ou não, com a condição |
| **Disrupção: os quatro vetores** | Levine | 3 | Para posicionar contra quem já existe | Qual vetor: preço/gratuidade, modelo de negócio, transparência, ecossistema |
| **Retenção e "modelo escova de dentes"** | Levine, Page | 2 | Quando o produto é de uso recorrente | A medida de retenção do resultado |
| **Corte do supérfluo: "a coisa principal"** | Fadell | 4 | Sempre que o escopo cresce | O que fica e o que vai para fora de escopo |

## 5. Checklist de saída — o que convém ter claro

Não é portão: é o que o processo recomenda ter claro antes de seguir para o Desenhar. O PM decide quanto basta.

1. O problema está escrito como dor, não como solução.
2. O resultado tem tags e a linha de medida no `ROADMAP.md` (hoje → alvo, ou `sem medida`: a medida é opcional).
3. Os quatro riscos têm "o que precisa ser verdade" e o teste de cada um.
4. A premissa mais arriscada foi testada, ou o PM a aceitou como risco aberto.
5. Cada épico serve exatamente um resultado (`serves::`).
6. O fora de escopo está explícito — a "coisa principal" separada do resto.
7. Existe um critério para abortar, combinado antes.
8. Todo item do inventário do protótipo aprovado tem destino: ligado a uma função do produto ou a um resultado (e, depois, a um requisito) ou cortado com motivo.

Quando o produto vai **escalar** para outras pessoas, entram também: a amostra de um superada (entrevistas fora do PM), o
problema qualificado na matriz (Vencedores ou Nicho) e a usabilidade testada com o público.

**"Pronto" é a medida mover.** Uma funcionalidade só está pronta quando o comportamento esperado muda — o *Accepted* do
[[requirements-graph]] é o aceite do humano; a confirmação do resultado volta para a Discovery como aprendizado.

## 6. Onde cada saída mora no MJRP

| Saída | Onde mora | Quem escreve |
|---|---|---|
| Problema ("quem sente") | `ROADMAP.md`, depois o épico em `docs/specs/prd.md` | `mjrp-coaching-pm` |
| Resultado, medida e tags | `ROADMAP.md` (`^OUT-xx`, `tags::`) | `mjrp-coaching-pm` |
| Premissas e desenho do teste | `docs/specs/inception-notes.md` e `docs/log.md` | `mjrp-coaching-pm` |
| Decisão (matar · iterar · avançar) | `docs/log.md`, com data e hora | o PM decide, o agente registra |
| Épicos e fora de escopo | `docs/specs/prd.md` | `mjrp-coaching-pm` |
| Inventário do protótipo aprovado | `docs/specs/info-arch.md` § *Inventário do protótipo* | `mjrp-designing-ui`, na mesma rodada do protótipo; o coach lê e liga cada item |
| Requisitos | `docs/specs/requirements/` | `mjrp-writing-reqs` (no nível do problema aqui; Ready no «Pronto para construir») |

## Anexo A · Casos citados nos handbooks

- **Waze** — o valor percebido não era "o caminho mais rápido", era a paz de espírito de saber a hora de chegada; o
  lançamento global sem mapa denso derrubou a retenção, recuperada cidade por cidade.
- **Mego** — validou a entrega de encomendas dos correios só com WhatsApp e operação manual, sem uma linha de código.
- **FeeX / Pontera** e **Refundit** — dados digitados à mão antes de investir em OCR e automação (Wizard of Oz).
- **Refundit × Fibo** — dois problemas de restituição de imposto, de públicos e modelos operacionais diferentes.
- **Telmap** — o incumbente que recusou o tráfego gerado pelos motoristas e foi superado pelo Waze.
- **Netflix × Blockbuster, Kodak, Yahoo × Google** — incumbentes protegendo o próprio resultado contra a disrupção.

## Anexo B · Os seis autores

| Autor | Obra | O que traz para a Discovery |
|---|---|---|
| Marty Cagan | *INSPIRED* | Os quatro riscos; Discovery antes de Delivery; o trio PM, design e engenharia |
| Teresa Torres | *Continuous Discovery Habits* | A árvore de oportunidades (OST); contato contínuo com o usuário |
| Melissa Perri | *Escaping the Build Trap* | Resultado antes de entrega; Product Kata |
| Dan Olsen | *The Lean Product Playbook* | A pirâmide de Product-Market Fit |
| Uri Levine | *Apaixone-se pelo Problema, Não pela Solução* | Problema antes da solução; amostra de um; matriz público × sofrimento; errar rápido; retenção |
| Tony Fadell | *Build / Criar* | Simplicidade; a "coisa principal"; corte do supérfluo |

## History

- **2026-10-29 20:19** · A medida do resultado é opcional (ordem do MJRP, UAT-409, F127): o passo 2 pede hoje → alvo só quando há medida; sem ela a linha diz `sem medida` ([[conformance-notes]]).
- **2026-10-13 19:00** · A linha *Épicos e fora de escopo* perde a exceção do subprojeto (ADR-0020): o app dentro do harness tem épicos próprios.
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: o inventário do protótipo é escrito pela `mjrp-designing-ui` na mesma rodada da tela (com os wireframes); o coach lê, manda escrever se faltar e liga cada item a uma função do produto ou a um resultado; no subprojeto do harness o `prd.md` organiza por release, sem épicos.
- **2026-10-07 20:29** · Onda E do PDLC em loops (`design/proposals/pdlc-loops-migration-plan.md`): a numeração antiga de fases deu lugar às estações e ao contrato de [[pdlc-loops]] §11.
- **2026-10-07 18:40** · #harness-kaizen: o protótipo aprovado e o seu inventário viram a entrada principal (antes do passo 1); o checklist ganha o item 8 (todo item com destino) e a tabela, onde o inventário mora. Origem: na Discovery do Control Center o coach partiu das 7 perguntas e deixou de fora abas que o MJRP tinha aprovado no protótipo v3.3. O processo vive agora dentro do loop Discovery de [[pdlc-loops]] (o *Enquadrar*).

- **2026-10-07** · Página criada como v2 do Handbook MJRP de Product Discovery (#harness-kaizen). Origem: na 1b do Control
  Center o coach perguntou os quatro riscos como "baixo, médio ou alto"; o MJRP pediu que o processo da Discovery fosse
  estruturado e escrito no harness, com o handbook dele como fonte. Decisões do MJRP: o processo mora no kernel e num
  `reference/` da `mjrp-coaching-pm`; cobre a 1b inteira; a skill abre perguntando Rapid ou Full; tempo é só referência; o Full
  é um catálogo de técnicas marcado no início; produto só para o próprio PM não tem a amostra de um como risco; no Rapid, o
  passo 4 desenha o teste e rodá-lo é opcional; a v2 é esta página, e v0 e v1 ficam em `docs/originals/` como fontes.
