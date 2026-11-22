# Tasks — Feature F89: A galeria de capas do inventário no celular · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [ ] o MJRP põe a F89 na «Priorizada» (ele pediu a galeria em 2026-11-21: «1. Acrescenta»; a S-71, a F89 e a UAT-274 foram registradas antes de construir)
- [ ] protótipo: dispensado, como na F76 (o desenho segue o cartão do computador e o de Albums; o juízo do MJRP é no iPhone) — a confirmar

## Implementation
- [x] TASK-01 a visão que vale no celular e a escolha guardada (a função pura e o controlador) · implements:: REQ-01, REQ-03 · model:: sonnet
- [x] TASK-02 o cartão e a grade da galeria, e a tela que escolhe entre ela e a lista · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet
- [x] TASK-03 a troca «View» na folha «Filters and order» · implements:: REQ-01 · model:: sonnet
- [x] TASK-04 o CSS da galeria, só no celular · implements:: REQ-01, REQ-02, REQ-04 · model:: sonnet

## Verification
- [x] TASK-05 a prova no navegador (WebKit, iPhone 14, iPhone 393, SE 375, SE 320 e 820 px; capturas; sem rolagem lateral nem erro no console) — `reports/evidence/F76/inventory-gallery-phone/` (um iPhone de verdade não foi usado) · implements:: REQ-01, REQ-02, REQ-04 · model:: sonnet

## Documentation
- [x] `docs/specs/behavior.md` (a linha da grade ou lista), `docs/specs/info-arch.md` (os estados da galeria)
