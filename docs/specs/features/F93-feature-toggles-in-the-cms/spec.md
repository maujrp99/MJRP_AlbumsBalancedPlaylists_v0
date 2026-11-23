---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-75-turn-features-on-and-off-from-the-cms]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F93: Chaves para ligar e desligar features em produção, pelo CMS
**Approved**: pendente. Em esboço, esperando o MJRP. Depende do CMS (F82). Arquitetura decidida pelo MJRP em 2026-11-22 (`design/proposals/f82-cms/architecture-proposal.md`; ADR-0024 em `Proposed`). O NFR-03 (REQ-04) continua proposta do agente, à espera da aceitação dele.

## Summary
**A feature:** No CMS (o Painel, F82), uma chave por feature para ligá-la e desligá-la em produção, a começar pela integração com o Discogs; e uma arquitetura em que desligar uma feature não deixa rastro na tela nem carrega código dela.

**Por quê:** O MJRP quer tirar features de produção com facilidade.

**Como saber que funcionou:** O MJRP desliga o Discogs no Painel e, na próxima vez que alguém abre o site (inclusive quem já o visitou), não há valor, botão, aviso nem espaço do Discogs, e o navegador nem pede o arquivo da função; ele religa e tudo volta; com o banco fora, o site nunca liga uma função por engano.

## Problem Statement
Dito pelo MJRP em 2026-11-22: «no CMS importante termos feature toggle para ligarmos e desligarmos features em prod. A começar pela integração com a discogs. A ideia é facilmente tirar features de prod por isso creio que a componentizacao e modularização sejam essências na arquitetura da plataforma, to certo?»

Decidido por ele em 2026-11-22 (`docs/log.md`): a cópia guardada no navegador só pode desligar uma função, nunca ligar; a medição de uso é a exceção, que segue a configuração do site como hoje e que o CMS só pode desligar: «Aceito».

## Requirements
- [REQ-01] O CMS tem uma seção de chaves: o dono liga e desliga cada feature em produção, sem publicar de novo; ligar e desligar pede confirmação e vale na próxima abertura do site (o servidor, em até 60 segundos). Cada chave mostra o que faz, onde aparece, o estado em produção e o que a pessoa vê com ela desligada · fixes S-75
- [REQ-02] A primeira chave é a da integração com o Discogs (valor do álbum e links de compra que dependem dele), com a opção «para quem» (todos, ou pessoas nomeadas) · fixes S-75
- [REQ-03] Feature desligada não deixa rastro na tela (nem botão, nem aviso, nem espaço) e não carrega código próprio; o resto do produto segue funcionando. Medido como no REQ-09 · fixes S-75
- [REQ-04] Componentização e modularização como requisito da arquitetura: proposta do agente como NFR-03, pendente do MJRP (a constituição não foi mudada). O que a proposta de 2026-11-22 acrescenta: a regra é verificável (REQ-09) e vale só para as funções com chave, com a lista de exceções, hoje o Discogs, que só encolhe · fixes S-75
- [REQ-05] As chaves formam uma **lista fechada** (hoje três: `discogsValues`, `usageMeasurement`, `portugueseForAll`), cada uma `true` ou `false`, com um padrão declarado para quando a chave é desconhecida; o validador (um só, em `shared/content`) serve ao Painel, ao site e ao servidor; uma chave fora da lista ou com outro tipo é recusada, e as outras seguem. Os identificadores das chaves podem ser lidos por qualquer pessoa, mesmo os de funções ainda fechadas · fixes S-75
- [REQ-06] A cópia guardada no navegador só pode **desligar**: da cópia, uma chave nunca liga uma função; ligar espera a leitura nova do banco, então quem abre sem rede não liga nada por cópia. Desligar vale já na próxima abertura de todo mundo, inclusive de quem já visitou. «Desconhecida» (sem leitura e sem cópia que desligue) não é «desligada»: o site guarda o estado com o motivo e o Painel mostra «não foi possível ler». Sem leitura e sem cópia: o Discogs pergunta ao servidor (REQ-08) e «Português para todos» fica fechado (o site fala inglês, como hoje). Palavras do MJRP (2026-11-22): «Aceito» · fixes S-75
- [REQ-07] A medição de uso (F77) é a exceção: segue a configuração do site, como hoje, e o CMS só pode **desligá-la**; sem leitura do banco, a medição segue a variável do build, para que a primeira tela de todo visitante novo continue sendo medida. Desligar pelo CMS vale já pela cópia. Nasce desligada (F82, REQ-02). Palavras do MJRP (2026-11-22): «Aceito» · fixes S-75
- [REQ-08] O Discogs tem duas travas e uma autoridade: o servidor só liga quando a variável do serviço (`DISCOGS_VALUES`) está ligada **e** a chave do CMS está ligada, e o site pergunta ao servidor, como hoje (`GET /api/value-sources`). O servidor lê a chave num documento público do banco, em cache de 60 segundos, e responde três estados: **ligado**, **desligado** e **desconhecido** (não conseguiu ler a chave); em «desconhecido» o inventário não mostra o Discogs, o diz no registro do servidor, e o Painel o mostra (nunca calado, nunca confundido com «desligado»). O primeiro pedido de uma instância nova espera a leitura da chave por até 1,5 segundo antes de responder. «Para quem» fica na variável `DISCOGS_VALUES_FOR`, porque o documento é público. A variável do serviço continua o corte de emergência · fixes S-75
- [REQ-09] Um modelo só para esconder e para não carregar: a tela pergunta ao **registro das features** (só dados: o identificador, o padrão quando desconhecida e o `import()` do módulo); com a chave desligada, o registro devolve «nada» e **nunca chama o `import()`**, e o encaixe na tela não desenha nem a caixa. Os módulos das funções com chave e o do Painel ficam fora da lista de pré-carga do site. Verificado em duas frentes: na suíte, o módulo da função só é importado pelo registro (as exceções só encolhem); no navegador, com a função desligada, não há marca da função na página e nenhum pedido do arquivo dela (os pedidos de rede só se veem lá) · fixes S-75

## Observable States
Na seção do Painel, por chave: **ligada**, **desligada**, **só pessoas nomeadas** (Discogs), **não foi possível ler** (desconhecida), com a segunda trava do servidor visível (variável do serviço desligada, ou servidor sem conseguir ler). Para quem usa o site: a função aparece por inteiro ou não deixa vestígio.

## Success Criteria
- **REQ-01, REQ-02** · Dado o dono no Painel, quando desliga o Discogs e salva, então a próxima abertura do site, em outro aparelho que já o visitou, não mostra nada do Discogs; quando religa, volta.
- **REQ-05** · Dado `{discogsValues: "yes", foo: true}`, então as duas chaves são recusadas e as demais seguem; dado um documento válido, então as três são lidas.
- **REQ-06** · Dado uma cópia com `discogsValues: true` e o banco fora, então a função **não** liga por cópia; dado uma cópia com `false`, então desliga já; dada leitura e cópia ausentes, então o estado é «desconhecida» (o Painel diz «não foi possível ler»), e «Português para todos» fica fechado.
- **REQ-07** · Dado o banco fora e nenhuma cópia, então a medição segue a variável do build; dado o CMS com a medição desligada, então ela desliga já na próxima abertura.
- **REQ-08** · Dado cada combinação das duas travas, então o servidor liga só com as duas ligadas; dado o banco que não responde, então o servidor devolve «desconhecido» (≠ «desligado»), o registra, e o inventário não mostra o Discogs; dado uma instância nova, então o primeiro pedido espera até 1,5 s.
- **REQ-03, REQ-09** · Dado o Discogs desligado, então a página não tem a marca da função e o navegador não pede o arquivo dela (prova no navegador real); dada a suíte, então o módulo do Discogs só é importado pelo registro e nenhum módulo de função com chave entra na pré-carga.
- **REQ-04** · Fica pendente da aceitação do MJRP; até lá os sensores do REQ-09 valem só como proposta.

## Out of Scope
O CMS em si (F82); a chave da medição de uso como peça do kit (F82, REQ-02; a regra dela está no REQ-07 daqui); decidir quais features terão chave além das três; chave por pessoa que usa o site; mudar a regra de «quem vê o Discogs» além do que já existe.

## Open Questions
- **Resposta do orquestrador à pergunta dele («to certo?»): sim**, é essencial; falta o MJRP aceitar o NFR-03 (tarefa da fatia 2).
- Separar o Discogs em um módulo atrás do registro mexe em cerca de oito arquivos do inventário (`models/inventoryValue.js`, `buyLinks.js`, `controllers/InventoryValues.js`, `components/InventoryValueSection.js`, `Footer.js`, as telas do inventário, `services/albums/clearAlbumCaches.js`); até lá a chave só esconde, e a lista de exceções do REQ-09 o registra: o ritmo é decisão do plano.
- Que outras features ganham chave depois (candidatas: exportar para o Spotify e para a Apple Music); a lista é do dono, uma a uma.
- Se as duas travas do Discogs (a variável e a chave do CMS) forem aceitas como estão na proposta: é escolha técnica da ADR-0024; ele já aceitou o que a chave pode ou não fazer sem leitura (REQ-06, REQ-07).
- O dia em que ligarem a proteção App Check no banco: o servidor passa a ler pela conta de serviço (ADR-0024, gatilho escrito).
