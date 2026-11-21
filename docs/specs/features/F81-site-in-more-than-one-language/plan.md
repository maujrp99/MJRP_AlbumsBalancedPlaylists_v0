# Plan — Feature F81: O site em mais de um idioma · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Esboço, com o que as duas conversas de 2026-11-21 08:12 trouxeram (relato dos outros agentes, a conferir):
- O harness não impõe biblioteca de idiomas. Valem o cânone IA-02 (um conceito, um rótulo só em todas as telas e idiomas), o documento de copy por idioma e as skills `mjrp-generating-copy-deck` e `mjrp-generating-copy-doc`; na reconferência o juiz troca o idioma na tela.
- O MJRPpersonal usa pt (padrão) e en: os textos da interface em `messages/pt.json` e `messages/en.json`, o conteúdo editável como par `{pt, en}` por campo, a primeira visita pelo idioma do navegador, e a regra de mostrar o campo no idioma da página quando preenchido, senão no idioma em que foi escrito. Lá isso é feito com o next-intl, que não serve ao V0.
- Caminho recomendado por eles para o V0: um dicionário por idioma e o conteúdo no mesmo formato de par `{pt, en}`, para o CMS (F82) editar sem adaptação; prefixo de caminho (`/en/...`).
- A conferir antes de decidir: se o Firebase Hosting serve `/en/*` como o app (as regras de reescrita, que a F80 acabou de mudar) e o que o prefixo faz com a leitura por buscadores.
Nenhum código de produto antes da proposta aprovada.

## Technical Design
A escrever: vem da proposta de arquitetura da F83 (que também define o contrato do dicionário).

### O que já se sabe do código (do levantamento, para quem escrever o desenho)
- **1106 textos distintos, 1437 pontos** em `public/js` (DOM por `SafeDOM`, `innerHTML` com texto no meio, `toast.*`, `confirm`/`prompt`), `public/splash.html`, `public/splash/*.js`, `public/index.html`. Mapa: `design/copy/album-blender-copy.md`; o script `scripts/i18n/scan-copy.cjs` o refaz.
- **O servidor não manda texto** para as pessoas: responde `{ error: { code, retryable } }` (8 códigos em `server/lib/outcome.js`); só as rotas de depuração mandam `error: '…'`. Os textos de falha são do cliente. Os prompts de IA do servidor (`server/lib/aiClient.js`, `config/prompts.json`) são instrução para o modelo, não interface.
- **23 pontos repassam `error.message`** à tela (toast, modal): o REQ-08 pede um texto próprio por caso.
- **Datas, horas e moeda** já usam `toLocale*` em 13 pontos, com a localidade fixa (`en-GB`, `en-US`, `pt-BR`) ou a do navegador; precisam seguir o idioma da tela.
- **Nomes gerados** («Greatest Hits Vol. 1», «Deep Cuts Vol. 3», nomes de lote) são gravados e exportados ao Spotify e ao Apple Music: o idioma deles é o do momento da geração.
- **Textos montados** (234 textos com pedaços `{}`): plural (`n álbum/álbuns`), contagem, «Added 13 albums. Undo».

## Sequência com a F83
A feature acompanha a migração para React, tela a tela: cada tela migrada já nasce com seus textos no dicionário. Antes da primeira tela: o contrato do dicionário (F83), o seletor e a decisão do idioma (TASK-02, TASK-03).

## Dependencies
- **F83** (a proposta de arquitetura e o contrato do dicionário): bloqueia TASK-01 e TASK-04.
- **F85** (item «Start»/«Inicie» do menu): o rótulo já decidido entra no dicionário como está.
- **F82** (CMS): vem depois e edita o dicionário; o formato `{pt, en}` é o que o CMS espera.
- O mapa revisado e as decisões D-01 a D-10 do MJRP, antes de TASK-04.

## Documents Consulted
Ainda não lidos pelo agente do V0; apontados em 2026-11-21 08:12 pelo orquestrador do MJRPpersonal e pelo agente mestre do harness (o que segue é o relato deles, a conferir na proposta):
- O kit: `/Users/maujrp/mjrp/projects/MJRPpersonal/src/admin-kit/` (entrada `index.ts`; `ports.ts`, `skin-contract.ts`, `schema.ts`, `example/`), regido pela ADR-0011 do MJRPpersonal, aceita pelo MJRP em 2026-11-07.
- ADRs do MJRPpersonal em `/Users/maujrp/mjrp/projects/MJRPpersonal/docs/decisions/`: 0003 (gravação), 0008 (ler o que gravou), 0009 (um admin por site), 0013 (publicar sem deploy), 0015 (texto rico).
- `/Users/maujrp/mjrp/projects/MJRPpersonal/reports/evidence/F96-two-way-translation-in-the-admin-kit/` (tradução nos dois sentidos).

## Risks & Considerations
- **Texto montado em pedaços** (plural, ordem de palavras): traduzir pedaço a pedaço dá português errado; o dicionário precisa de mensagens inteiras com variáveis nomeadas e regra de plural (ICU ou equivalente).
- **O país no Firebase Hosting:** a rota `/` hoje é decidida pela F80/F85; ler o país (cabeçalho do Hosting ou do servidor) sem piscar o idioma errado e sem atrapalhar a leitura por buscadores é a parte arriscada (a conferir na proposta).
- **Conteúdo já gravado em inglês** (nomes de playlists e de lotes) continua em inglês: dizer isso à pessoa, ou não gravar texto de interface.
- **Rótulos que mudam de sentido ao traduzir** («Series», «Blend», «Owned»): decisão do MJRP no relatório antes da migração, senão se traduz duas vezes.
- **178 dos 289 arquivos de teste comparam texto de interface** literal (351 textos): vão quebrar ao tirar o texto do código, e quebrariam de novo quando o CMS editar; os testes passam a ler o dicionário pelo id. Lista: `scripts/i18n/tests-with-literal-text.py`.
- **O mapa envelhece** a cada commit; o sensor da TASK-08 (rodar o script e comparar com o dicionário) segura isso.
- O levantamento por busca no código não vê texto montado por função externa nem o que o navegador mostra (ver o relatório, «O que a busca não vê»).
