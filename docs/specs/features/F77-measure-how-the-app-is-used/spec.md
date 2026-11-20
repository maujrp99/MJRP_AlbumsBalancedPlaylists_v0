---
status: In Progress
lane: standard
solution_type: feature
imports: ["[[S-59-know-how-the-app-is-used]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F77: O uso do app, medido (PostHog)
**Approved**: pendente (o MJRP priorizou em 2026-11-20 e mandou o agente decidir sem perguntar; as decisões estão no `plan.md`, «decidido pelo agente — revisável»)

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
O comportamento está no `docs/specs/behavior.md`, seção «Medição do uso (F77)», cada estado com o seu ID de bloco. Nada disso se vê na tela: vê-se no console, em `window.__usageEvents` (depuração) e no PostHog.

| Estado | ID de bloco | REQ |
|---|---|---|
| Medição desligada | `^usage-off` | REQ-04 |
| Medição ligada | `^usage-on` | REQ-01, REQ-04 |
| Depuração: os eventos ficam na página | `^usage-debug` | REQ-04 |
| O que é medido, e onde sai | `^usage-events` | REQ-01, REQ-02, REQ-05 |
| O clique em link de compra | `^usage-buy-link` | REQ-02 |
| O que nunca é medido | `^usage-never` | REQ-03 |

## Success Criteria
- **A porta.** Todo evento passa por `shared/usageEvents.js`; um nome fora da lista não sai, uma propriedade fora da lista cai; nenhuma propriedade aceita texto livre (teste `test/shared/usageEvents.test.js`). Só `services/usage/posthogAdapter.js` importa a biblioteca, e só por `import()` da fiação (teste `test/architecture/usageBehindThePort.test.js`).
- **Os eventos.** Cada evento da lista sai depois da ação dar certo e não sai quando ela falha (testes `test/services/usage/eventsOf*.test.js`, com a porta de verdade). Provado num navegador (Vite em `127.0.0.1:5123`, sem conta, `mjrp.usage` = `debug`), a 1002 px e a 375 px: `screen_viewed` com `home`, `albums`, `series` (para `/albums/someSeriesId123`), `playlists`, `inventory`, `blend`, `saved_playlists`, `coming_soon`; `/series`, que só redireciona, contou uma vez, como `albums`, a tela para onde levou; nove letras na busca do inventário e cinco na dos álbuns deram um `filter_used` cada, sem o texto; um clique de verdade num link da Amazon (cartão) e num do Discogs (folha do celular) deu `buy_link_opened` com a loja e o lugar, e o clique não foi segurado (`defaultPrevented` falso).
- **O interruptor.** Sem chave, `window.__usageEvents` não existe e a página não pediu nada a host do PostHog (`performance.getEntriesByType('resource')`, conferido no navegador). No build sem chave, o host só aparece no pedaço `posthogAdapter-*.js`, que nada pede, e no CSP do `index.html` (uma regra, não um pedido); o pacote principal só nomeia o arquivo do pedaço.
- **A biblioteca.** Com as opções do adaptador, a `posthog-js` de verdade, num navegador de teste, entrega ao `before_send` o evento com `platform: 'web'` e sem `$current_url`, `$pathname` ou `$referrer`, não captura nada sozinha, não grava cookie nem `localStorage` e não faz pedido de rede (teste `test/services/usage/posthogLibrary.test.js`).
- **Os portões.** Suíte, lint e build verdes; complexidade, camadas, módulos mortos e interface em inglês sem exceção nova. **Não provado:** um evento chegando ao PostHog (falta a chave do MJRP).

## Out of Scope
- O app de celular (F78): esta feature só deixa a lista pronta para ele importar.
- Tela de consentimento, política de privacidade e opção de não ser medido para outras pessoas: entram quando o produto for público (ver os riscos do `plan.md`).
- Gravação de sessão, mapa de calor, captura automática de cliques, pesquisas, testes A/B e flags do PostHog.
- Identificar a pessoa (`identify`), juntar os eventos de visitas diferentes, perfis de pessoa.
- Painéis e funis dentro do PostHog: montá-los é do MJRP depois que os eventos chegarem.
- Medir o servidor (as rotas `/api`): só o navegador manda eventos.
- Um host próprio para o PostHog (proxy reverso).

## Open Questions
- Respondida pelo agente — revisável: a nuvem é a da Europa, por padrão (o porquê está no `plan.md`). O plano grátis e o limite de eventos não foram conferidos: com uma pessoa, o volume é pequeno.
- Respondida pelo agente — revisável: com o produto público, consentimento e política de privacidade antes de ligar para outras pessoas; enquanto só o MJRP usa, sem cookie e sem nada gravado no navegador.
- Respondida: a chave do projeto é pública por natureza e vem do `.env` na hora do build (`VITE_POSTHOG_KEY`), como o client id do Spotify; o `deploy-site.sh` confere que ela chegou ao build.
- As onze decisões «decidido pelo agente — revisável» do `plan.md`.
