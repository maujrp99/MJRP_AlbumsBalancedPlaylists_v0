# Plan — Feature F77: O uso do app, medido (PostHog) · Spec: [[spec]]
**Approved**: pendente (o MJRP priorizou em 2026-11-20 e mandou o agente decidir; as decisões abaixo esperam o julgamento dele)

## Architecture Approach
Uma porta de eventos com nomes fixos, e um adaptador trocável atrás dela, no molde das fontes do servidor (`server/lib/rankingSources/`, `valueSources/`: uma fonte por arquivo, um interruptor lido do ambiente) e da porta das rotas pagas do cliente (`api/paidRoutes.js`: uma regra pura num lugar só, e quem chama pergunta a ela).

1. **A lista é compartilhada.** `shared/usageEvents.js` diz quais eventos existem e, para cada um, quais propriedades e de que tipo. Uma propriedade só pode ser uma contagem ou um valor de um conjunto fechado: não há lugar para texto livre. O site importa esse arquivo; o app de celular (F78) importa o mesmo.
2. **Uma porta no cliente.** `services/usage/track.js` confere cada evento na lista e o entrega ao adaptador em uso. Sem adaptador, não faz nada. Nunca lança erro e nunca espera.
3. **O adaptador fica atrás da porta.** Só `services/usage/posthogAdapter.js` importa a biblioteca do PostHog, e só a fiação o carrega, de forma preguiçosa (`import()`), quando a medição está ligada. Um teste de arquitetura segura isso.
4. **O evento sai onde a ação deu certo**: no serviço ou no controlador, depois da gravação, nunca no clique do botão. Assim o celular e o computador mandam os mesmos eventos, porque as peças do celular chamam os mesmos serviços. As duas exceções têm um lugar só cada uma: a tela (o roteador, depois de mostrar a rota) e o link de compra (um ouvinte só na página, para os links marcados).

## Technical Design
- `shared/usageEvents.js` — a lista fechada (`USAGE_EVENTS`, `EVENT_NAMES`, `SCREENS`, `RECIPES`, `INVENTORY_STATUSES`, `FILTERS`, `OUTCOMES`) e `describeEvent(name, properties)`: devolve o evento limpo ou recusa nome desconhecido; propriedade fora da lista, ou de tipo errado, cai. Sem API de navegador nem de servidor, sem import. (REQ-01, REQ-03, REQ-05)
- `public/js/services/usage/track.js` — `track(name, properties)` e `screen(name)`; os estados `off`, `loading` (até 100 eventos esperam o adaptador) e `on`; `startUsage({ loadAdapter })` e `stopUsage()`. (REQ-01, REQ-04)
- `public/js/services/usage/usageSwitch.js` — `usageMode({ key, buildSwitch, flag })` e `readUsageFlag(storage)`: ligado só com chave no build e nada desligando. (REQ-04)
- `public/js/services/usage/posthogAdapter.js` — `createPosthogAdapter`, `posthogOptions(host)`, `withoutPageAddress` (o `before_send`). A única porta para a biblioteca. (REQ-03, REQ-04)
- `public/js/services/usage/memoryAdapter.js` — o adaptador de depuração: guarda os eventos em `window.__usageEvents` e não manda nada. (REQ-04)
- `public/js/services/usage/usageWiring.js` — `startUsageMeasurement({ router })`, chamado pelo `app.js` antes da primeira rota: decide o modo, escolhe o adaptador, mede a tela (`SCREEN_OF_ROUTE`, pelo nome da rota) e o clique em link de compra (`buyLinkClickOf`). (REQ-01, REQ-02, REQ-04)
- `public/js/router.js` — as funções de depois da troca recebem também a rota que casou (`'/albums/:seriesId'`), para a tela ser medida pelo nome. (REQ-02, REQ-03)
- `public/js/models/buyLinks.js` — `BuyLinkPlace`, `buyLinkMarks`, `buyLinkAttributes`: cada link de compra leva `data-buy-store` e `data-buy-place`; os quatro lugares que desenham links passam a marcá-los (`InventoryCardValue.js`, `InventoryValueSection.js` duas vezes, `InventoryPhoneSheets.js`). (REQ-02)
- `public/js/models/filterUse.js` — `filterUseOf(screen, type, value, before)`: quando escolher um filtro conta, e a busca só quando começa. (REQ-02, REQ-03)
- `public/js/models/exportOutcome.js` — `exportOutcome(report)`: `complete`, `partial` ou `failed`, lido do relatório do Spotify ou do Apple Music. (REQ-02)
- `public/js/models/inventoryValueRun.js` — `valuesRunOutcome(count)`. (REQ-02)
- Onde cada evento sai (REQ-02):

| Evento | Propriedades | Onde |
|---|---|---|
| `screen_viewed` | `screen` | `usageWiring.js`, depois do roteador |
| `series_created`, `series_edited`, `series_deleted` | `album_count` | `services/SeriesService.js` |
| `ranking_saved` | `track_count` | `services/ranking/OwnRankingService.js` (pela porta `measure`, dada em `ownRanking.js`) |
| `playlists_generated` | `recipe`, `playlist_count`, `track_count` | `services/PlaylistGenerationService.js` (o blend e «gerar de novo») |
| `playlists_saved` | `playlist_count`, `batch` (`new`, `edited`) | `services/PlaylistsService.js` |
| `playlists_exported` | `target` (`spotify`, `apple_music`, `json`), `outcome`, `playlist_count` | `SpotifyExportService.js`, `AppleMusicExportService.js`, `views/playlists/PlaylistsExport.js` (o JSON) |
| `inventory_status_changed` | `from`, `to` | `controllers/InventoryController.js` |
| `inventory_value_written`, `inventory_value_removed` | — | `controllers/InventoryValues.js` |
| `inventory_values_read` | `scope` (`all`, `one`), `count`, `outcome` | `controllers/InventoryValues.js` |
| `inventory_albums_added` | `from` (`one`, `series`), `count` | `services/inventory/InventoryService.js` |
| `buy_link_opened` | `store`, `place` | `usageWiring.js`, um ouvinte na página |
| `filter_used` | `screen`, `which` | `SeriesController.js`, `InventoryController.js`, `views/SavedPlaylistsView.js` |
| `sign_in` | `provider` | `components/LoginModal.js` |
| `sign_out` | — | `components/navigation/AuthNav.js` |

- `public/index.html` — o CSP (`connect-src`) aceita `https://eu.i.posthog.com` e `https://us.i.posthog.com`; nenhum script do PostHog. (REQ-04)
- `scripts/deploy-site.sh` — diz se o site sai com a medição ligada ou desligada; com `VITE_POSTHOG_KEY` e sem `off`, recusa publicar se a chave não chegou aos scripts do build (o mesmo jeito da conferência do client id do Spotify). (REQ-04)
- Testes: `test/shared/usageEvents.test.js`, `test/services/usage/*.test.js` (a porta, o interruptor, o adaptador com um cliente falso, a biblioteca de verdade com `before_send` que não manda nada, a fiação, e os eventos de cada área com a porta de verdade e um adaptador que guarda), `test/architecture/usageBehindThePort.test.js`, `test/router.test.js`.

### Decisões do agente — revisáveis
1. **A nuvem padrão é a da Europa** (`https://eu.i.posthog.com`), decidido pelo agente — revisável. Por quê: lá a captura de IP já nasce desligada («IP data capture configuration», em Settings > Project > Privacy, segundo a página de privacidade do PostHog), os dados ficam sob o GDPR, que é o mais próximo da LGPD, e um usuário brasileiro não fica mais longe da Europa do que dos EUA de um jeito que importe para eventos em lote. A dos EUA é uma variável (`VITE_POSTHOG_HOST`).
2. **O interruptor tem três chaves**, decidido pelo agente — revisável: a chave do projeto no build (`VITE_POSTHOG_KEY`; sem ela, nada), uma variável de build para desligar com a chave posta (`VITE_USAGE_MEASUREMENT=off`) e uma chave do navegador, sem build novo (`localStorage` `mjrp.usage` = `off`). A mesma chave do navegador com `debug` liga o adaptador de depuração.
3. **Pacote `posthog-js` 1.447.0, fixo, no build `module.no-external`**, decidido pelo agente — revisável. A versão tem duas semanas (a mais nova era de hoje). O build sem código de fora é o documentado para quem não usa replay, pesquisas nem barra de ferramentas; o «slim» é menor (cerca de 170 kB contra 420 kB, sem compressão) mas a documentação o chama de experimental.
4. **A tela é o nome da rota, nunca o endereço**: `/albums/abc123` é `series`. Uma rota que só redireciona (`/series`, `/callback`, `/album-series`) não é tela.
5. **Uma busca conta uma vez, quando começa** (da caixa vazia para algum texto); limpar um filtro não conta; escolher o mesmo valor de novo não conta.
6. **Dois eventos a mais**, decidido pelo agente — revisável: `inventory_value_removed` («Use the Discogs value instead») e `inventory_albums_added` (do cartão do álbum ou «Add the albums of my series»), para o funil do inventário. Ficaram de fora, por não serem tarefas do funil: conectar o Spotify, apagar um lote salvo, desfazer e refazer, trocar a moeda.
7. **O desfecho da exportação** é `complete`, `partial` ou `failed` (`exportOutcome`); o de «Update values» também pode ser `stopped` (a pessoa parou ou saiu da tela). Um álbum sem edição em CD é resposta, não falha.
8. **O link de compra é medido por um ouvinte só, na fase de captura do clique e do clique do meio**: lê as marcas do link e segue; não chama `preventDefault`, não espera nada. O link abre em outra aba, então a página continua viva para mandar o evento.
9. **O `ranking_saved` sai pela porta `measure` do `OwnRankingService`**, dada pela fiação (`ownRanking.js`): o serviço continua sem importar nada (teste `ownRankingBoundaries`).
10. **O identificador anônimo vive o tempo da página** (`persistence: 'memory'`): cada recarga é uma pessoa nova para o PostHog. É o preço de não gravar nada no navegador sem uma tela de consentimento; ver os riscos.
11. **`platform: 'web'`** vai em todo evento (`register`), para o app de celular mandar o seu e os dois serem lidos juntos.

## Dependencies
- **`posthog-js` 1.447.0** (npm, MIT), dependência de produção nova. Entra num pedaço próprio do build, carregado só com a medição ligada: `posthogAdapter-*.js`, **419,64 kB (129,20 kB com gzip)**. O pacote principal passou de 1.072,37 kB (292,42 kB com gzip) para 1.079,49 kB (295,29 kB com gzip): **+7,1 kB (+2,9 kB com gzip)**, a porta, a lista, a fiação e os eventos. Com a medição desligada, o pedaço do PostHog nunca é pedido.
- Depende do MJRP: o projeto no PostHog e a chave dele (ver `tasks.md`, a tarefa aberta).

## Documents Consulted
`AGENTS.md`, `docs/specs/features/F77-measure-how-the-app-is-used/spec.md`, `docs/specs/arch.md` (as fontes trocáveis do servidor, a porta das rotas pagas, a camada do celular), `vite.config.js`, `scripts/deploy-site.sh`, `.env.example`, `public/js/router.js`, `public/js/app.js`, `public/js/models/buyLinks.js`, `test/architecture/` (complexidade, camadas, módulos mortos, interface em inglês), a documentação do PostHog: https://posthog.com/docs/libraries/js/config (as opções), https://posthog.com/docs/libraries/js (os builds `no-external` e `slim`, os hosts EU e US), https://posthog.com/docs/product-analytics/privacy (IP, nuvem da Europa, sem cookies), e os tipos do pacote instalado (`@posthog/types/dist/posthog-config.d.ts`, onde `ip` diz que não tem mais efeito).

Declarações dos documentos:
- `docs/specs/constitution.md` — sem mudança: nenhum padrão novo de código; a porta segue o molde das fontes e da porta das rotas pagas
- `docs/specs/arch.md` — atualizado: «A medição do uso: a porta e o adaptador (F77)», e as linhas novas no mapa de componentes
- `docs/specs/data-model.md` — atualizado: os eventos de uso (aponta para `shared/usageEvents.js`) e a chave `mjrp.usage` do navegador
- `docs/specs/tech-stack.md` — atualizado: a linha do `posthog-js`
- `docs/specs/design-system.md` — sem mudança: nenhuma tela, token ou componente visual mudou
- `docs/specs/behavior.md` — atualizado: a seção «Medição do uso (F77)» e a chave do navegador
- `docs/specs/info-arch.md` — sem mudança: nada que se vê na tela mudou
- `docs/manual/00_Deployment_and_Setup.md` — atualizado: as variáveis do build, como ligar, como desligar
- `docs/wiki/` — sem mudança: nenhuma página descreve uma regra que esta feature mudou

## Risks & Considerations
- **Privacidade e LGPD, hoje.** Com uma pessoa só (o dono) e sem tela de consentimento, a medição não grava nada no navegador (sem cookie, sem `localStorage` do PostHog), não manda o endereço da página, o referenciador nem parâmetros de campanha, não cria perfil de pessoa e nunca chama `identify`. Nenhum evento leva texto da pessoa: a lista não tem onde pôr. O IP chega ao PostHog com cada pedido (é assim que a internet funciona); o que impede que seja guardado é a configuração do projeto, não o código: o dono confere «IP data capture configuration» desligado ao criar o projeto. Se o PostHog enriquece com GeoIP antes de descartar o IP não foi verificado.
- **Quando o produto for público, muda:** (a) uma tela de consentimento antes de ligar a medição para quem não é o dono (o caminho é `opt_out_capturing_by_default` ou `cookieless_mode` da biblioteca, mais a porta continuar sem texto livre); (b) uma política de privacidade que diga o que é medido (a seção do `behavior.md` é o rascunho), por quanto tempo fica e com quem (o PostHog como operador, na linguagem da LGPD); (c) a decisão de guardar ou não um identificador entre visitas, que hoje não se guarda; (d) o pedido de apagar os dados de uma pessoa, que hoje não se aplica porque nada liga um evento a uma pessoa.
- **Funis entre recargas se partem.** Como o identificador vive o tempo da página, um funil «criar série → … → exportar» só junta o que aconteceu sem recarregar. A saída da conta recarrega a página (F60). Para uma pessoa só, a ordem dos eventos no tempo ainda conta a história; para o produto público, isto se decide junto com o consentimento.
- **O `sign_out` pode se perder.** A saída recarrega a página logo depois; o evento depende de a biblioteca mandar a fila no fechamento (ela usa `sendBeacon`), e isso não foi provado com o serviço de verdade.
- **Contagens, não verdade absoluta.** Bloqueadores de anúncio barram `*.i.posthog.com`; o «Do Not Track» do navegador é respeitado (`respect_dnt`). Para uma pessoa, poucos eventos perdidos não mudam a leitura.
- **Um host próprio (proxy reverso) exige mexer no CSP** do `public/index.html`; hoje só as duas nuvens estão liberadas.
- **Nada foi mandado ao PostHog.** Sem a chave, a prova é o adaptador falso nos testes, a biblioteca de verdade com um `before_send` que não manda nada, e o adaptador de depuração num navegador. A chegada dos eventos é a tarefa aberta.
