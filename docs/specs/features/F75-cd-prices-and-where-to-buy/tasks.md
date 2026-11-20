# Tasks — Feature F75: Preço de CDs e onde comprar, no inventário · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [ ] ramo criado da `main` local, depois de priorizada
- [ ] lidos o `AGENTS.md`, o `spec.md`, a proposta, o protótipo v5.1, o `info-arch.md` e o relatório de viabilidade (com os termos de uso da API do Discogs)

## Implementation
- [ ] TASK-01 o cartão no padrão da v5.1 e as contagens como filtro · implements:: REQ-01, REQ-02 · model:: opus
- [ ] TASK-02 o valor escrito à mão, gravado no item, e o total do cabeçalho · implements:: REQ-03, REQ-07 · model:: opus
- [ ] TASK-03 «Where to buy» no cartão e na janela; a ordem por valor · implements:: REQ-11, REQ-12 · model:: opus
- [ ] TASK-04 a fonte de valor do Discogs no servidor, com o interruptor e a resposta tipada de cada falha · implements:: REQ-04, REQ-10, REQ-13 · model:: opus
- [ ] TASK-05 a leitura no app: a fila, a validade de seis horas, o aviso «Data provided by Discogs.», a janela com os três estados · implements:: REQ-04, REQ-05, REQ-06, REQ-09, REQ-13 · model:: opus
- [ ] TASK-06 as quatro moedas com o câmbio do dia · implements:: REQ-08, REQ-13 · model:: opus

## Verification
- [ ] TASK-07 suíte, lint e build; publicar o servidor e o site; prova no navegador na conta do MJRP · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10, REQ-11, REQ-12, REQ-13 · model:: opus

## Documentation
- [ ] `docs/specs/behavior.md`, `docs/specs/data-model.md`, `docs/specs/arch.md`, `docs/specs/info-arch.md` e o manual
