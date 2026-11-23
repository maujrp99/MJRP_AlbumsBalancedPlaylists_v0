# Tasks — Feature F82: Um admin para o site, com o CMS-kit do MJRP · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [ ] FEITO: proposta de arquitetura (`mjrp-designing-architecture`): `design/proposals/f82-cms/architecture-proposal.md`, com a crítica separada (`reports/audits/2026-11-22-mjrpalbumblender-v0-cms-published-content-architecture-audit.md`, pode ir) e as quatro decisões do MJRP (2026-11-22)
- [ ] FEITO: rodada de desenho do admin: o protótipo aprovado como direção (o Painel), `design/proposals/f82-cms/prototype.html`
- [ ] o MJRP aceita a ADR-0024 (o conteúdo publicado no Firestore, o emulador das regras, o servidor que lê um documento público) · waiting:: human — só ele aceita uma ADR da rota dele (segurança e produto) · action:: ler a ADR-0024 e carimbá-la no commit dele; depois entram as linhas em `tech-stack.md`
- [ ] o MJRP publica as regras (TASK-07 e TASK-08) depois de o teste da TASK-05 passar · waiting:: human — `firestore.rules` é dele e nenhum pipeline o publica (constituição V.5) · action:: publicar as regras no console do Firebase (ou pela publicação que ele já usa)
- [ ] o MJRP cria o registro do administrador: `cmsAdmins/{o identificador da conta dele}` com `role: "super"`, no console do Firebase; nada disso entra no repositório · waiting:: human — só ele cria o registro, e o identificador dele não pode ficar no repositório · action:: criar o documento no console, depois de as regras estarem publicadas
- [ ] o MJRP revisa e aprova o português no Painel (fatia 1, depois de o Painel de textos existir) · waiting:: human — o português é proposto pelos agentes e só ele o aprova · action:: abrir `/admin` com a conta dele e aprovar as telas
- [ ] o MJRP põe a F82 na «Priorizada»; só então o ramo
- [ ] conversa com o orquestrador do MJRPpersonal e com o agente mestre do harness: o que é o CMS-kit e como um projeto filho o adota (a F332 do harness; só as fatias 1 a 4 esperam)

## Implementation

### Fatia 0 · Alicerce (nada disto espera o React nem o kit)
- [x] TASK-07 o rascunho das regras do conteúdo publicado em `firestore.rules`: `published/*` (leitura de todos; escrita só do administrador, com login que não seja anônimo; campos e tipos listados; contagens e tamanhos; `_schemaVersion` que não desce; `rev` igual ao anterior mais um) e o fechamento de `albums/` (sem escritor desde a F65); sem regra curinga na raiz. O arquivo é do MJRP: o agente escreve o rascunho no ramo, ele publica (o passo dele, abaixo) · implements:: REQ-06, REQ-07 · model:: opus
- [x] TASK-08 o rascunho das regras da lista de administradores e da área de trabalho do Painel: `cmsAdmins/{uid}` (cada pessoa lê só o seu; ninguém grava pelo app) e `cmsWork/*` (só o administrador), com o `get()` de caminho absoluto sobre `cmsAdmins` e `role == 'super'` · implements:: REQ-07 · model:: opus
- [x] TASK-05 o teste que roda as regras no emulador do Firestore (`@firebase/rules-unit-testing` como dependência de desenvolvimento, um passo na suíte; substitui a leitura do arquivo como texto em `test/security/firestoreRules.test.js`): convidado, outra conta, a conta dele com login anônimo, qualquer um em `cmsAdmins/*`, campo fora da lista, `_schemaVersion` descendo e `rev` errado são recusados; o administrador é aceito. A escrita de convidados em `spotify_enrichment/` entra como exceção declarada numa lista que só encolhe (a F92, TASK-09) · implements:: REQ-04, REQ-07 · model:: opus (o emulador é tecnologia nova: pede a ADR-0024 aceita, caixa dele em Pre-Implementation)

### Fatia 1 · Textos (esperam a linha do React em produção e o kit do CMS)
- [ ] TASK-01 o Painel de textos em `/admin`: as áreas por tela com inglês e português lado a lado, a busca pela palavra, a revisão e a aprovação do português (um, vários, todos da tela), o adaptador entre um arquivo por idioma e os pares do kit, os textos do Painel no dicionário (`admin.*`), e o carregamento só para o administrador (a rota lê o registro antes do `import()`; fora da pré-carga) · implements:: REQ-01, REQ-09 · model:: opus
- [ ] TASK-11 o validador de textos em `shared/content` (marcadores iguais aos do inglês, não vazio, sem `<` nem `>`, até 3 vezes o inglês, aviso a partir de 1,5) e o repositório do conteúdo (`shared/data/PublishedContentRepository`, mais o lado do site), usados pelo Painel e pelo leitor · implements:: REQ-06 · model:: opus
- [ ] TASK-12 o leitor do conteúdo no arranque, sem esperar: as camadas do `t()` (publicado, dicionário do código, inglês do código), a versão dos textos que faz `useLocale` e as telas à mão se redesenharem, a cópia no navegador (30 dias; só desliga chaves; apagada quando o documento some), o prazo de 3 s, o estado «publicado, cópia, código» e a contagem de recusados · implements:: REQ-10 · model:: opus
- [ ] TASK-14 a gravação do Painel: transação com `rev` igual ao lido mais um, o `previous` com o valor anterior só das chaves que mudaram, `updatedBy` e hora em `cmsWork/*`, e o conflito entre aparelhos (como está, a outra, a sua) · implements:: REQ-06, REQ-08, REQ-09 · model:: opus
- [ ] TASK-13 a conferência dos textos vivos na publicação do site: o script de publicação lê `published/texts_*` (leitura pública) e lista as chaves que o build novo vai recusar, antes de publicar (aviso, não bloqueio); e o Painel lista «recusado pela versão atual» por chave · implements:: REQ-06 · model:: sonnet
- [ ] TASK-15 os textos corridos no editor rico do kit: a marca «rico» por chave no dicionário, o validador por tipo de chave em `shared/content` (a chave rica passa pelo leitor do kit e só aceita os links permitidos), o `tRich` que alimenta o desenhador seguro do kit, a conversão das chaves que passam de simples a ricas; espera o kit (F332) · implements:: REQ-12 · model:: opus
- [ ] TASK-16 a tradução de um campo para o outro: a porta `translate` do kit ligada a uma rota do servidor só para o administrador, com a revisão do kit e a falha nomeada; o serviço da Claude (D-01 do lote de 2026-11-23); espera o kit (F332) e a chave que o MJRP cria no cofre do servidor · implements:: REQ-13 · model:: opus

### Fatia 2 · Página de entrada (espera a fatia 1)
- [ ] TASK-04 os álbuns da página de entrada escolhidos no CMS (lado e ordem), com o conjunto fixo como reserva; o leitor depois do `load` com o validador do núcleo, `textContent` (também em `public/splash/lang.js`), a conferência de endereços, só o servidor de imagens da Apple, e a política de `public/splash.html` liberando o servidor do banco · implements:: REQ-03, REQ-11 · model:: opus

### O que depende do kit (F332 do harness)
- [ ] TASK-03 a chave de ligar e desligar a medição de uso no CMS: pela F93 (REQ-07), que a trata como exceção (segue a configuração do site; o CMS só a desliga); a peça nasce no kit · implements:: REQ-02 · model:: sonnet
- [ ] TASK-06 acesso por papéis no CMS (a peça nasce no kit, F332 do harness; o V0 a adota quando o kit a trouxer: o campo `role` do registro já espera); a escrever depois que o kit trouxer o desenho · implements:: REQ-05 · model:: opus

## Verification
- [ ] TASK-02 a prova no navegador real (as regras no emulador estão na TASK-05): a primeira tela desenha no mesmo tempo (±50 ms) com a leitura bloqueada; quem não é administrador vê «não encontrado» em `/admin` e o arquivo do Painel não é pedido; um texto com marcação não vira elemento na página de entrada; os estados do Painel a 1440 e 393 px, sem erro no console · implements:: REQ-01, REQ-09, REQ-10, REQ-11 · model:: sonnet

## Documentation
- [ ] `docs/specs/tech-stack.md` (o emulador; o servidor lê um documento público do Firestore: depois da aceitação da ADR-0024), `data-model.md` (`published/*`, `cmsAdmins/*`, `cmsWork/*`), `arch.md`, `behavior.md` e `info-arch.md` (o Painel e os estados)
