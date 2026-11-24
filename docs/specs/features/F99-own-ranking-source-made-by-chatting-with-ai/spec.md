---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-81-create-a-ranking-source-by-chatting-with-ai]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F99: Fonte de ranking própria, criada conversando com a IA
**Approved**: pendente. Em esboço, esperando o MJRP (o protótipo, a crítica da proposta de arquitetura e as três decisões dele).

## Summary
**A feature:** Uma tela nova e limpa no Painel: à esquerda, um chat em que o dono descreve em palavras a fonte do ranking que quer; à direita, a prévia dessa fonte aplicada a uma série de exemplo. A IA propõe a definição; nada liga sem a prévia e sem os testes. Sai do construtor de blocos (F92) o botão «Uma fonte própria, criada com IA · depois», que passa a abrir esta tela.

**Por quê:** O MJRP: a criação de verdade é a fonte do ranking (S-74), e o construtor de blocos já está cheio demais para ter a IA dentro. Palavras dele (2026-11-24): «acho que a tela tá muito cheia pra  ter a parte de ía ali, deveríamos ter uma tela nova e limpa só cum campo de chat pra gerar a receita com IA, por exempo, todo o lado esq do print, vira um chat e todo o lado direito o preview»

**Como saber que funcionou:** O dono descreve uma fonte no chat, vê a prévia numa série mudar, salva, e gera uma playlist com ela na Mistura.

## Problem Statement
Hoje só existem as fontes fixas (Spotify, BestEverAlbums, combinada, a nota dele). Criar uma fonte como a «equilibrada» pede código.

## Requirements
- [REQ-01] Uma tela própria no Painel para criar uma fonte de ranking: à esquerda, só um chat; à direita, só a prévia. Palavras do MJRP (2026-11-24): «acho que a tela tá muito cheia pra  ter a parte de ía ali, deveríamos ter uma tela nova e limpa só cum campo de chat pra gerar a receita com IA, por exempo, todo o lado esq do print, vira um chat e todo o lado direito o preview» · fixes S-81
- [REQ-02] A prévia aplica a fonte proposta a uma série de exemplo (vários álbuns): por álbum, a ordem das faixas e o porquê; atualiza a cada proposta da IA · fixes S-81
- [REQ-03] A IA propõe a fonte como dados numa linguagem fechada, nunca como código, conferida por um validador só antes de chegar à prévia (a forma vai à proposta de arquitetura, criticada antes de construir) · fixes S-81
- [REQ-04] No construtor de receitas (F92), «Uma fonte própria, criada com IA» abre esta tela; a fonte salva aparece como fonte do ranking no construtor · fixes S-81

## Observable States
A desenhar no protótipo.

## Out of Scope
Sinais que o app ainda não tem (por exemplo, as reproduções da biblioteca do Apple Music): cada um é uma feature à parte.

## Open Questions
- As três decisões da proposta de arquitetura (§ 9): fonte como dados (A) ou código (B); que sinal novo ele quer; a primeira fatia sem tela.
