# Tasks — Feature F93: Chaves para ligar e desligar features em produção, pelo CMS · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [ ] o MJRP põe a F93 na «Priorizada» (depois do CMS, F82)
- [ ] o MJRP aceita, ou muda, o NFR-03 (proposta do agente) · waiting:: human — é uma regra de arquitetura que vale para as outras features e só ele a aceita · action:: dizer sim ou não ao NFR-03 (a fatia 2 só segue com a resposta)
- [ ] FEITO: proposta de arquitetura (`mjrp-designing-architecture`): `design/proposals/f82-cms/architecture-proposal.md` (o registro das features, a leitura das chaves, o Discogs com duas travas), com a crítica separada
- [ ] FEITO: rodada de desenho da seção de chaves do Painel: o protótipo aprovado como direção (`design/proposals/f82-cms/prototype.html`)
- [ ] o MJRP aceita a ADR-0024 · waiting:: human — só ele aceita uma ADR da rota dele · action:: ler a ADR-0024 e carimbá-la no commit dele
- [ ] o MJRP liga a chave do Discogs no console do Firebase (sem Painel ainda), depois de as regras estarem publicadas (F82) e de o servidor com a TASK-05 estar no ar · waiting:: human — o documento de conteúdo e a variável do serviço são dele; nenhum pipeline grava no console · action:: criar a chave `discogsValues` no documento de conteúdo do console (e conferir a variável `DISCOGS_VALUES` no serviço)

## Implementation

### Fatia 0 · Alicerce (nada disto espera o React nem o kit)
- [ ] TASK-04 `shared/content` com o validador das chaves: a lista fechada (`discogsValues`, `usageMeasurement`, `portugueseForAll`), cada uma `true` ou `false`, o padrão de cada uma, a chave fora da lista ou de outro tipo recusada sozinha; núcleo puro, sem Firebase nem `fetch` (`coreStaysPortable` o cobre sem exceção); usado pelo servidor · implements:: REQ-05 · model:: opus
- [ ] TASK-05 o servidor lê a chave do Discogs num documento público do Firestore por leitura REST, em cache de 60 s, prazo de 1,5 s, pelo validador da TASK-04; duas travas (a variável `DISCOGS_VALUES` e a chave do CMS; `DISCOGS_VALUES_FOR` para «para quem»); responde três estados (`on`, `off`, `unknown`); em «desconhecido» o inventário não mostra o Discogs, o servidor o diz no registro e o app o entende (`public/js/api/valueApi.js`); o primeiro pedido de uma instância nova espera a leitura até 1,5 s · implements:: REQ-02, REQ-08 · model:: opus

### Fatia 2 · Chaves (esperam a F82 fatia 1, a linha do React em produção e o kit; e a resposta ao NFR-03)
- [ ] TASK-01 o registro das features (`public/js/features/registry.js`, só dados) ligado às telas: a tela pergunta ao registro, desligada ele devolve «nada» e nunca chama o `import()`, o encaixe não desenha nem a caixa; os módulos com chave e o do Painel fora da pré-carga de `app.js`; a cópia que só desliga, «desconhecida» com o motivo, a medição como exceção (segue o build, o CMS só desliga), «Português para todos» fechada sem leitura; a seção de chaves do Painel (confirmar, o estado, a segunda trava visível) · implements:: REQ-01, REQ-03, REQ-04, REQ-06, REQ-07, REQ-09 · model:: opus
- [ ] TASK-02 o Discogs atrás do registro, separado do resto do inventário (os cerca de oito arquivos da pergunta em aberto); até lá a chave esconde e o Discogs fica na lista de exceções do sensor, que só encolhe · implements:: REQ-03, REQ-09 · model:: sonnet

## Verification
- [ ] TASK-03 a prova: o sensor que garante o módulo da função só pelo registro; no navegador real, com o Discogs desligado, nenhuma marca da função na página e nenhum pedido do arquivo dela, também para quem já visitou (cópia); cada combinação das duas travas e o «desconhecido» do servidor; a medição seguindo o build sem leitura · implements:: REQ-02, REQ-03, REQ-06, REQ-07, REQ-08, REQ-09 · model:: sonnet

## Documentation
- [ ] `docs/specs/arch.md` (o registro das features e o NFR-03, se aceito), `behavior.md`, `data-model.md` (`published/site`), `tech-stack.md` (a linha do servidor, depois da aceitação da ADR-0024)
