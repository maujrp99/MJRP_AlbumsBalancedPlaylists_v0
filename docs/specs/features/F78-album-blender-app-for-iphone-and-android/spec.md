---
status: In Progress
lane: standard
solution_type: feature
imports: ["[[S-60-use-the-album-blender-as-an-app-from-the-store]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F78: O Album Blender como app para iPhone e Android
**Approved**: pendente (a F78 é a 2.ª da fila do MJRP; em 2026-11-20 13:44 ele mandou seguir a recomendação da proposta e construir o app, e às 13:45 seguir a recomendação nas decisões da proposta; esta spec, o plano e as tarefas do primeiro marco esperam o julgamento dele)

## Summary
**A feature:** Um app do Album Blender para iPhone e Android, com as mesmas contas e dados do site. Esta spec cobre o primeiro marco: as perguntas que decidem a pilha, a casa das regras do produto num núcleo usado pelo site e pelo app, e um primeiro app que entra na conta e lista as séries, inclusive sem rede.

**Por quê:** O MJRP quer evoluir o produto para as lojas de apps, nas duas plataformas, sem ter duas cópias das regras.

**Como saber que funcionou:** No iPhone do MJRP, o app entra com a conta dele, mostra as mesmas séries do site e, sem rede, mostra as que já tinha visto; o site segue funcionando igual.

## Problem Statement
Dito pelo MJRP em 2026-11-20: «gostaria de considerar Android e ser pública … Seria uma evolução do produto», «Vamos criar a V6.0 para implementação da app» e, depois da proposta de arquitetura, «Vc consegue seguir sua recomendação da f78 e construir a app registrando tudo conforme nosso pdlc?».

O desenho está na proposta de arquitetura (`design/proposals/f78-app-architecture/architecture-proposal.md`), criticada (`reports/audits/2026-11-20-mjrpalbumblender-v0-f78-architecture-critique.md`), revista e reconferida. Ela diz que as regras do site são reaproveitáveis só em parte e que nada foi rodado num aparelho: **cerca de 34% portável depois de um conserto pequeno, 0% provado**. Por isso o primeiro marco é o que a seção 15 da proposta põe primeiro: os spikes, a refatoração do site que dá casa ao núcleo, e o esqueleto ambulante. O resto do app vem nos marcos seguintes.

## Requirements
O primeiro marco: **o esqueleto ambulante e o que tem de vir antes dele** (proposta, § 15, fatias 0, Ref-0, 1, Ref-A, Ref-B e 2). Cada spike é uma pergunta de sim ou não com prazo; um «não» volta à proposta (§ 12, «O que mudaria a recomendação») antes de qualquer código do app.

**Os spikes: antes de se comprometer**
- [REQ-01] Spike S1, prazo de 1 dia e meio: o núcleo dá no app o mesmo resultado que no site? **Sim** só quando todas as receitas, todas as estratégias de ranking e a identidade de álbum e de faixa, rodadas no motor do app (Hermes) no simulador do iPhone e no emulador do Android sobre o corpo dourado, saem byte a byte iguais às do site (Node); quando, com o gerador de id real do aparelho (não um fixo), cada id sai no formato de UUID e sem repetição; e quando `shared/` é resolvido por um caminho só nos dois empacotadores (uma store, não duas). O corpo dourado junta dados reais de álbuns da conta do MJRP, com faixas **sem `id`**, e as entradas dos testes do núcleo (vazios, empates, acentos). Uma amostra que já traga `id` nas faixas não vale. · fixes S-60
- [REQ-02] Spike S2, prazo de 1 dia e meio: qual Firebase no app? O Firebase JS e o pacote nativo (React Native Firebase) respondem, lado a lado, às seis perguntas do § 15 da proposta. **A pergunta 4 decide sozinha:** uma gravação feita sem rede sobrevive a fechar o app e chega depois, e uma transação sem rede falha (não fica pendente) no pacote nativo. O resultado diz qual dos dois o app usa e se os repositórios de `shared/data/` servem aos dois recebendo as funções de fora. · fixes S-60
- [REQ-03] Spikes S3 e S4, prazo de 1 dia cada: dá para criar uma playlist no Apple Music, a partir de um app Expo, com um módulo nativo que só entrega o token do usuário? S3 no iPhone; S4 no Android, com o SDK de login da Apple, num aparelho com o app Apple Music. · fixes S-60
- [REQ-04] Spike S5, prazo de meio dia: uma lista de 300 álbuns com capa rola a pelo menos 55 quadros por segundo num iPhone 15 Pro e num Android de entrada, e arrastar para ordenar 20 faixas funciona? · fixes S-60
- [REQ-05] Spike S6, prazo de 2 horas: quanto custa hoje um mês do MJRP em IA, servidor e banco, e quanto custa um álbum novo? É medida, lida do faturamento; vira sim ou não quando o MJRP disser o teto de gasto por dia. · fixes S-60
- [REQ-06] Spike S7, prazo de meio dia: o núcleo dá o mesmo resultado no motor de JavaScript do iOS, dentro de um app SwiftUI vazio? Mesmo corpo dourado e mesma comparação do S1. · fixes S-60

**O site muda primeiro, e funciona a cada passo**
- [REQ-07] Ref-0: `Track` e `TrackTransformer` pedem o id a `newId()`, em `shared/platform/`; nenhum arquivo fora de `shared/platform/` chama `crypto.randomUUID`. A suíte do site passa e o site publicado funciona. · fixes S-60
- [REQ-08] O núcleo ganha casa e sensor: `shared/` vira pacote de espaço de trabalho do npm; o teste `coreStaysPortable` falha quando um arquivo de `shared/` cita o navegador, `fetch(`, `MusicKit` ou `import.meta`, importa `firebase`, `react`, `react-native`, `expo*` ou `posthog*`, ou cita, fora de `shared/platform/`, `crypto.`, `Intl.`, `toLocale`, `localeCompare`, `.normalize(`, `URLSearchParams` ou `structuredClone` — sem lista de exceções; as regras (`models`, `algorithms`, `ranking`) não importam `shared/data/`; `app/` e `public/` não se importam e `app/` não tem pasta `models`, `algorithms`, `ranking` nem `repositories`; os testes do núcleo rodam uma segunda vez sem `jsdom`, e todos passam. · fixes S-60
- [REQ-09] Ref-A: `BaseRepository` e os cinco repositórios moram em `shared/data/` e recebem as funções do Firestore de fora; o site entrega as do Firebase JS. Os testes dos repositórios e o `firestoreBehindRepositories` passam; o site lê e grava séries, playlists, inventário e rankings como antes. · fixes S-60
- [REQ-10] As regras de convivência entre versões (proposta, § 6.2), no caminho de gravação de `shared/data/`: gravar é atualizar só os campos que mudaram; numa lista de objetos (`albumQueries`), um campo desconhecido volta como veio; um documento com `_schemaVersion` maior do que o de quem lê abre só para leitura e a gravação é recusada; **nenhum escritor rebaixa o `_schemaVersion`** de um documento, nem pelo código nem pelas regras do Firestore. O nome é o do código, `_schemaVersion`. · fixes S-60
- [REQ-11] Ref-B: `SeriesService` recebe de fora o repositório, a guarda local e o aviso de progresso, e mora no núcleo; gravar uma série é uma transação que relê o documento e confere que ninguém o mudou, com prazo de 10 s, e devolve um de quatro desfechos — gravada, não gravada sem rede, mudou em outro aparelho, recusada —, nunca «gravada» antes da confirmação. `SeriesFactsService.saveAlbumFacts`, que hoje grava a série sozinho, passa pelo mesmo caminho, classificado como gravação «com conferência». No site, a série que mudou em outro aparelho diz «This series changed on another device. Reload to see it.» e o que a pessoa fez não se perde. · fixes S-60

**O esqueleto ambulante (o marco A começa)**
- [REQ-12] O app (Expo, pacote nativo do Firebase) entra com a Apple ou com o Google — sem visitante — e lista as séries da conta pelo `SeriesService` do núcleo, as mesmas do site, num iPhone de verdade (build de desenvolvimento) e, da mesma base, no emulador do Android. Falhar ao entrar diz «Couldn't sign in. Try again.». · fixes S-60
- [REQ-13] Sem rede, o app abre: mostra a cópia guardada das séries, marcada «Saved earlier», e tenta ler as atuais com prazo de 10 s; sem resposta, mantém a cópia e diz «No connection: showing what was saved»; sem cópia, mostra a tela «No connection» com «Try again», nunca uma lista vazia. · fixes S-60
- [REQ-14] Versão mínima do app: `GET /api/app-config`, pública e sem segredo, diz a versão mínima por plataforma; abaixo dela o app abre na tela «Update to continue», com o botão da loja; sem resposta em 5 s, o app segue. · fixes S-60
- [REQ-15] O app mede pela porta da F77: os mesmos nomes de evento de `shared/usageEvents.js`, uma ligação própria com o PostHog para React Native, o mesmo interruptor (sem chave, nada sai); o PostHog só é importado nas duas ligações, a do site e a do app. · fixes S-60
- [REQ-16] O autoteste do corpo dourado: uma tela de autoteste do app roda o núcleo sobre o corpo dourado e mostra «N of N match»; um comando só, do Mac do MJRP, a abre no simulador do iPhone e no emulador do Android por um roteiro de automação de tela (Maestro) e lê o resultado; o roteiro de publicar o app recusa publicar sem 100% iguais nas duas plataformas. · fixes S-60
- [REQ-17] Nada secreto no pacote do app: `app/` e a sua configuração não citam os nomes das chaves do servidor (IA, Apple, Discogs, Spotify, administrador do Firebase), e o build procura padrões de chave no pacote e falha se achar. · fixes S-60
- [REQ-18] O servidor tem o pior caso conhecido: o deploy fixa o número máximo de instâncias (`--max-instances`), e um teste do deploy falha se o comando não o fixar. A proposta põe este degrau «já, sem peça nova» (§ 8). · fixes S-60

## Observable States
Nenhum estado julgado ainda. O que este marco precisa, e de onde vem:

| Estado | Onde vai morar | REQ |
|---|---|---|
| Entrar (Apple, Google), lista de séries, cópia «Saved earlier», «No connection», «Update to continue», autoteste | `info-arch.md`, a partir da rodada de desenho das telas do esqueleto (`mjrp-designing-ui`), julgada pelo MJRP | REQ-12, REQ-13, REQ-14, REQ-16 |
| Os quatro desfechos de gravar uma série, e a convivência entre versões | `behavior.md`, com exemplos julgados | REQ-10, REQ-11 |
| O resultado de cada spike | um relatório por spike em `reports/audits/`, com o sim ou o não | REQ-01 a REQ-06 |

Os REQ-07, REQ-08, REQ-09, REQ-15, REQ-17 e REQ-18 não têm tela: a prova é a suíte e o site conferido.

## Prototype Parity
- Protótipo: a escrever — a rodada de desenho das telas do esqueleto, a partir do desenho de celular da F76 (que ainda espera o juízo do MJRP no iPhone).
- Camada transversal tocada: as medidas de `design-system.md` § Celular (alvo de 44, texto de 12 no mínimo, margem de 16). Os tokens e as fontes vão para componentes nativos; as classes do Tailwind e o CSS de `public/css/mobile/` não passam (proposta, § 4.6).
- Cortes ou trocas do design system: a decidir na rodada de desenho; um corte pede decisão registrada.

## Success Criteria
- **Os spikes.** Cada um dos S1 a S7 tem relatório com «sim» ou «não», dentro do prazo, ou diz por que estourou. Um «não» volta à proposta antes do código do app.
- **O site.** A suíte, o lint e o build passam depois de cada fatia (Ref-0, núcleo, Ref-A, convivência, Ref-B), e o site é conferido num navegador de verdade: entrar, abrir séries, gravar uma série, ranking, inventário e playlists funcionam como antes.
- **Os sensores.** `coreStaysPortable`, `appAndSiteApart`, `oldWriterKeepsNewFields`, `usageBehindThePort`, `noSecretsInTheApp` e o teste do deploy falham quando a regra quebra (cada um com um caso que quebra de propósito) e passam no código.
- **A gravação.** Com a porta de dados falsa, gravar uma série nunca devolve «gravada» sem confirmação; contra o emulador do Firestore, cortar a rede no meio dá «não gravada sem rede»; um documento com campo desconhecido e outro com `_schemaVersion` maior passam pelo caminho de gravação sem perder o campo e sem rebaixar a versão.
- **O esqueleto.** No iPhone 15 Pro do MJRP: entrar com a Apple e com o Google, ver as mesmas séries do site, abrir em modo avião e ver a cópia marcada, abrir sem cópia e ver «No connection»; com a versão mínima acima da instalada, ver «Update to continue». No emulador do Android, da mesma base: entrar e listar. O autoteste diz «N of N match» nas duas plataformas.
- **A medição.** Com a chave do PostHog, um `screen_viewed` do app chega lá com `platform` do app; sem a chave, nada sai.

## Out of Scope
Deste marco. Cada linha é uma fatia ou um marco seguinte, com a sua spec quando chegar a vez:
- Ref-D e a fatia 3: Albums e a janela do álbum, pelo `AlbumLoadService` do núcleo, catálogo pela API da Apple.
- A fatia 4: ranking próprio, com gravação sem rede («A enviar»).
- Ref-C e a fatia 5: blend e playlists, gravação com conferência, exportar para o Apple Music (iPhone, depois Android).
- A fatia 6: inventário, com gravação sem rede, sem preço do Discogs.
- O fim do marco A: o app do MJRP no TestFlight interno.
- O Android na loja do Google: teste fechado (12 testadores por 14 dias), depois do iPhone.
- **Antes do público (marco B):** o limite por pessoa fora da instância; o teto global de gasto por dia, que para; o App Check no site, no app e no servidor; fechar as regras do Firestore de `albums/` e `spotify_enrichment/`; apagar a conta pelo servidor (spike S8); política de privacidade e rótulos das lojas; conta de demonstração; a fonte de nota por faixa sem o BestEverAlbums (spike S9).
- Spotify, preço do Discogs, editar série e playlist sem rede, widget, Atalhos, Siri, iPad, conta de visitante no app, compra no app, avisos.

## Decisões do MJRP (2026-11-20)
Palavras dele, às 13:45: «Recomendação sua da proposta». Onde a proposta (§ 13) recomenda, vale a recomendação:
- (4) Android na mesma base desde o primeiro dia; a loja do Google depois do iPhone.
- (5) Dois marcos: A, o app para ele (TestFlight interno); B, o app público.
- (6) Emendar a constituição só para `app/`. O texto da emenda ainda passa por ele: `design/proposals/f78-app-architecture/constitution-amendment.md`. **Depois, às 14:03, ele escolheu substituir a constituição em vez de emendá-la:** «Sobre a constitution pode ser superseded já envelheceu»; e às 14:04, sobre a tipagem: «Ignora o sem typescript, podemos ter typescript, creio que devemos inclusive». A constituição v2.0.0 foi proposta em `design/proposals/f78-app-architecture/constitution-v2.md`, com o app em TypeScript. **Em 2026-11-20 15:16 ele aceitou a constituição v2.0.0 e o ADR-0022 para esta iteração:** ao item «1. Ler e aceitar a constituição v2.0.0 e o ADR-0022», respondeu «1.aceito pra essa iteração» (revisáveis na próxima iteração). A v2.0.0 está em vigor em `docs/specs/constitution.md`. A pergunta aberta da proposta (o núcleo em TypeScript agora ou depois dos spikes) ele não respondeu: segue em «Open Questions».
- (7) App Check; visitante só no site, com limite menor e sem gravar em cache de todos; no app, conta obrigatória.
- (9) Versão mínima do app, com atualização obrigatória.
- (10) Sem rede: inventário e ranking próprio funcionam; série e playlists pedem rede.
- (11) Apagar a conta pelo servidor, com credencial de administrador no Secret Manager.
- (12) Fechar as regras do Firestore de `albums/` e `spotify_enrichment/` antes de qualquer conta de fora.
- (14) Exportar para o Apple Music só no iPhone, se o Android falhar, dito na tela.
- (15) Meio dia para medir a opção (f): o spike S7 (REQ-06).

## Open Questions
As que a proposta não recomenda, e continuam dele:
- O núcleo (`shared/`) passa a TypeScript agora, ou fica em JavaScript com JSDoc até o primeiro marco do app? Recomendação: ficar até os spikes S1 e S2 terminarem, e decidir por ADR com o caminho de build do servidor medido (`constitution-v2.md`, «Uma pergunta aberta ao MJRP»). **Não bloqueia este marco.**
- (1) Quantas horas por mês ele aceita gastar só mantendo? (estimativa: 6 a 11.) **Não bloqueia este marco**; pode mudar a pilha (só iPhone, ou sem app de loja) e bloqueia o compromisso com o Android na loja.
- (2) Quanto tempo o site continua? **Não bloqueia este marco**: a refatoração do site vale sozinha. Se o site for acabar, a vantagem do núcleo em JavaScript cai e a escolha da pilha volta à mesa antes da fatia 3.
- (3) Se o BestEverAlbums disser não, o app público ainda vale, e de onde vem a nota por faixa? **Não bloqueia este marco**; bloqueia o marco B.
- (8) O teto global de gasto por dia, e a partir de quanto avisar. **Não bloqueia este marco**; precisa do S6 (REQ-05); bloqueia o marco B.
- (13) As contas de desenvolvedor. **Bloqueia este marco:** a da Apple é precisa para os spikes S2, S3 e S5 num iPhone de verdade e para o REQ-12 (entrar com a Apple, build no aparelho). A do Google (US$ 25) só bloqueia o teste fechado do Google, fora deste marco.
- Fora do § 13, também bloqueiam este marco, e só ele resolve: o Xcode e o Android Studio nesta máquina (hoje só as ferramentas de linha de comando: nenhum simulador roda); a chave do PostHog, para o REQ-15 ser provado com um evento chegando.
