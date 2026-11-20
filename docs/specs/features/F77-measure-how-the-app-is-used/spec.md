---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-59-know-how-the-app-is-used]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F77: O uso do app, medido (PostHog)
**Approved**: pendente

## Summary
**A feature:** O site passa a registrar as tarefas que as pessoas fazem, por uma porta única de eventos, com o PostHog atrás dela.

**Por quê:** Hoje nada é medido: não se sabe o que é usado nem quantos tocam num link de compra, que é a premissa mais frágil do estudo de viabilidade.

**Como saber que funcionou:** No PostHog aparecem, com o uso real, o funil criar série → ranquear → gerar → salvar → exportar e os toques em links de compra por loja.

## Problem Statement
Dito pelo MJRP em 2026-11-20: «como ficamos com o analytics do site que hj não existe?» e «implementar o posthog no site e na app em reactive native». Conferido no código em 2026-11-20: o site não tem nenhum código de medição.

## Requirements
- [REQ-01] O app registra cada tarefa por uma porta única de eventos, com nomes fixos; nenhuma tela fala direto com o serviço de medição. · fixes S-59
- [REQ-02] São medidos: abrir cada tela, criar e editar série, gravar ranking, gerar, gravar e exportar playlists, mudar status e valor no inventário, e tocar em link de compra (com a loja). · fixes S-59
- [REQ-03] Nenhum evento leva dado pessoal nem texto da pessoa (nome de série, de playlist, e-mail). · fixes S-59
- [REQ-04] A medição tem um interruptor: desligada, o app funciona igual e nada é enviado. · fixes S-59
- [REQ-05] A mesma porta e os mesmos nomes de evento servem ao app de celular (F78). · fixes S-59

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
A escrever.

## Open Questions
- Nuvem do PostHog na Europa ou nos EUA? O plano grátis e o limite de eventos precisam ser conferidos.
- Com o produto público: consentimento e texto da política de privacidade (LGPD). Enquanto só o MJRP usa, medir sem cookies.
- A chave do projeto do PostHog é pública por natureza (vai no navegador); ainda assim, de onde o app a lê?
