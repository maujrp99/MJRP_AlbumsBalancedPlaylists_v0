---
title: Contexto e memória
aliases: [context-vs-memory, contexto, memória, memoria, memória de trabalho, contexto × memória, janela, progressive disclosure, revelação progressiva, recuperação just-in-time]
summary: a fronteira entre os tokens que estão na janela agora e o que persiste fora dela — e por que a memória existe para não perder e retomar o contexto
tags: [harness, memoria, fundamento]
status: firme
atualizado: 2026-09-09
fontes: [2023-09-coala-cognitive-architectures-language-agents, 2025-anthropic-effective-context-engineering, 2025-langchain-context-engineering-for-agents, 2026-claude-code-auto-memory]
---
<!-- kernel do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
**Contexto** é o conjunto de tokens presentes na janela do modelo **nesta chamada**: estado
momentâneo, finito, reconstruído a cada turno. **Memória** é o que persiste **fora** da janela e
precisa ser recuperado para virar contexto. A memória existe por um motivo só — **não perder e
retomar o contexto** — e é isso que a arquitetura de memória do MJRP Harness tem que garantir.

## What it is

### As duas definições, e a diferença de natureza

Contexto, na definição do fornecedor do modelo: *"the set of tokens included when sampling from a
large-language model"* (Anthropic). No agente LLM, contexto **é** a memória de trabalho —
*"on each LLM call, the LLM input is synthesized from a subset of working memory"* (CoALA). Ele
não é um lugar: é o que está na mesa agora.

Memória é lugar. Dura entre sessões, é praticamente ilimitada, e **custa zero enquanto ninguém a
lê**. Memória é *fonte* de contexto, não a mesma coisa que ele.

| | Contexto | Memória |
|---|---|---|
| O que é | os tokens desta chamada | o que persiste fora da janela |
| Dura | um turno | entre sessões |
| Custo | alto e recorrente — paga-se em todo turno | zero até ser lido |
| Limite | duro (a janela) e degradante (*context rot*) | prático (achabilidade), não técnico |
| Erro típico | carregar demais | não escrever, ou escrever onde ninguém acha |

### As duas setas

A fronteira entre os dois conceitos são duas das quatro operações de [[terms|context
engineering]]: ***write*** leva contexto → memória (o agente registra antes de perder);
***select*** traz memória → contexto (o agente carrega o que a tarefa pede). As outras duas —
*compress* e *isolate* — operam dentro do contexto.

### Progressive disclosure — o mecanismo que faz a memória voltar

O *select* não é "ler tudo o que está guardado". É **revelar em camadas**: o índice barato entra
sempre, o detalhe entra quando a tarefa pede. A Anthropic chama isso de **recuperação
just-in-time** — *"manter identificadores leves e carregar sob demanda, em vez de pré-carregar"*
(fonte) — e é a mesma forma que a
própria plataforma usa nas skills: a `description` sempre na janela, o corpo do `SKILL.md` quando
a skill é invocada, os `references/` quando o passo precisa.

```
camada 1   sempre        índice · description · MEMORY.md ## Now     barato, e roteia
camada 2   sob demanda   a página do assunto · o corpo da skill        entra quando a tarefa pede
camada 3   deliberado    o log · o transcript · o raw                  só quem já sabe o que procura
```

**É isto que fecha o ciclo `contexto → memória → contexto`.** Sem a camada 1, a camada 2 é
inalcançável: página que nenhum índice anuncia não é aberta por ninguém, e memória que não volta
não é memória — é acervo. E o custo da camada 1 é o que decide se o mecanismo é sustentável: o
`docs/wiki/index.md` tem ~30 linhas e diz, por página, **o que ela responde**. É um roteador de
400 tokens para uma wiki inteira.

O contraexemplo está fichado: o Cline Memory Bank manda
ler os seis arquivos *"at the start of EVERY task — this is not optional"*. É eficaz e
insustentável — tudo é camada 1.

**Consequência para o harness:** enquanto nada carrega o índice, mover conteúdo do `MEMORY.md`
(que hoje entra na janela em toda sessão, a 8.558 tokens) para a wiki **reduz** a memória
disponível, por mais bem organizada que ela fique. A ordem certa é construir a camada 1 antes de
esvaziar o que hoje chega por força bruta.

### A fronteira que se borra: onde mora ≠ quando carrega

O erro fácil, e que já foi cometido aqui, é tratar *"carrega sempre ou sob demanda"* como se fosse
atributo do **tipo de memória**. Não é. Onde uma coisa mora é decisão de arquitetura de memória;
quando ela entra na janela é decisão de *select* — **as duas colunas são independentes**. O mesmo
fato pode ser carregado em todo turno ou nunca; isso muda o custo dele, não o que ele é.

Consequência prática: a pergunta *"isto é contexto ou memória?"* quase sempre tem a mesma resposta
— **é memória**, porque quase tudo que se discute guardar é durável. A pergunta útil é a outra:
**isto muda a resposta de qualquer tarefa?** Se muda, entra na janela por padrão. Se não, mora
onde se acha e entra quando é chamado.

## How MJRP uses it

**O propósito, em uma frase:** a memória serve para **não perder e retomar o contexto**. Não é
arquivo, não é documentação, não é histórico por gosto de registro — é o mecanismo que faz a
próxima sessão começar de onde a anterior parou. Tudo o mais é consequência disso.

E "garantir" aqui tem duas metades, que **puxam em direções opostas**:

- **Eficácia — retomar sem perder.** O que precisava sobreviver sobreviveu, *e foi encontrado*.
  A falha tem sintoma conhecido: decisão já tomada sendo reaberta — a forma mais cara de
  retrabalho, porque parece progresso enquanto acontece (recurring-pains, dor 1).
- **Eficiência — retomar barato.** O menor conjunto possível de tokens de alto sinal. A falha
  também tem sintoma: pagar milhares de tokens de carregamento em toda sessão para escrever uma
  linha — e, por *context rot*, o excesso não é só caro, **é pior**.

Guardar tudo e carregar tudo é eficaz e insustentável; guardar pouco é barato e inútil. **O
projeto inteiro da arquitetura de memória é resolver essa tensão** — e é por isso que ela se
decide por arquivo, e não por princípio geral: cada coisa que persiste ganha uma casa (memória) e
uma política de carga (contexto), decididas separadamente. O mapa está em
[[memory-architecture]]; a decisão que o fixa, na ADR-0008.

**A medida.** O custo fixo de abrir uma sessão é de **20.177 tokens** (09/09): instruções 3.208 ·
**memória 8.558** · descriptions das 53 skills 8.410. A memória é 42% do total e cresceu 1.860
tokens só hoje. A ADR-0008 leva essa parcela para ≈ 500 — mas o "sem perder nada" só é
verdade **depois** que a camada 1 existir: hoje esses 8.558 tokens voltam ao contexto por força
bruta, e força bruta que funciona é melhor do que elegância que não é lida.

## History

> A decisão mora na página do assunto que ela muda, com data (ADR-0008). As entradas abaixo
> vieram **inteiras** do `MEMORY.md` na migração do BACKLOG #28a (09/09/2026) — nada foi
> condensado na mudança.
- **2026-09-08 21:34** · **Onde eu borrei contexto × memória:** na tabela dos tipos, a coluna "Carrega (sempre/sob
  demanda)" é **context engineering** (a operação *select*), não atributo do tipo de memória. Memória é
  onde a coisa mora; contexto é o que está na janela nesta chamada. O Zé pegou.
- **2026-09-08 21:49** · **Para que serve a memória, em uma frase (dele):** *"a memória serve para não perder e
  retomar o contexto"* — e garantir isso com eficácia (nada se perde, e se acha) **e** eficiência (o
  mínimo de tokens) é o projeto inteiro da arquitetura. As duas metades puxam em direções opostas.
  Virou o `## How MJRP uses it` de `context-vs-memory.md`.

## Related
[[memory-architecture]] · [[terms]] · [[harness-elements]] · recurring-pains · ADR-0005 · ADR-0008
