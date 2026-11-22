# Tasks — Feature F93: Chaves para ligar e desligar features em produção, pelo CMS · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [ ] o MJRP põe a F93 na «Priorizada» (depois do CMS, F82)
- [ ] o MJRP aceita, ou muda, o NFR-03 (proposta do agente)
- [ ] proposta de arquitetura (`mjrp-designing-architecture`): a porta única de chaves, a leitura das chaves do CMS, o módulo carregado sob demanda, o Discogs separado; com a crítica separada
- [ ] rodada de desenho da seção de chaves do CMS, se a tela não vier pronta do kit

## Implementation
- [ ] TASK-01 a escrever depois da proposta aprovada · implements:: REQ-01, REQ-03, REQ-04 · model:: opus
- [ ] TASK-02 a chave do Discogs, a primeira · implements:: REQ-02 · model:: sonnet

## Verification
- [ ] TASK-03 a escrever (com a chave desligada: nenhum rastro na tela e o código fora do pacote) · implements:: REQ-02, REQ-03 · model:: sonnet

## Documentation
- [ ] a escrever (`arch.md`, `behavior.md`)
