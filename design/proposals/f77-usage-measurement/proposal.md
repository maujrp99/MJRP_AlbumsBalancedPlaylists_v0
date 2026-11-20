---
type: proposal
subject: "Medição de uso do Album Blender: análise das opções, com a adoção de cada uma, e proposta"
project: MJRP_AlbumsBalancedPlaylists_v0
feature: F77
written: "2026-11-20 13:14"
status: para o MJRP decidir
---
# Medição de uso · análise das opções e proposta

**Para quem:** MJRP. **O que decidir:** quais serviços de medição o Album Blender adota, no site e no app de celular (v6.0, F77 e F78).

## Proposta em uma frase

**PostHog para entender o uso do produto, no site e no app; Firebase Analytics com Crashlytics só no app, para a saúde técnica e a origem das instalações; e um monitor de erros no site (Sentry), que hoje não existe.**

## Como ler a coluna de adoção

Não existe uma métrica única que compare todos. Usei três, cada uma medida em 2026-11-20, e classifiquei em **muito comum**, **comum** ou **nicho**:

- **Sites que usam** (W3Techs): a parcela dos sites da web onde a ferramenta foi detectada. Mede o uso real, mas só existe para ferramentas de visita de página.
- **Instalações por semana** (npm): quantas vezes o pacote do serviço foi baixado na semana. Mede o uso por desenvolvedores; servidores de teste inflam o número, então serve para comparar ordens de grandeza, não para contar sites.
- **Estrelas no GitHub:** interesse da comunidade em projetos de código aberto. Não mede uso.
- **Apps que usam** (42matters, Appfigures): parcela dos apps de loja com o SDK, entre os apps que têm algum SDK de análise.

## As opções

| Tipo | Opção | Adoção | Classe | Serve para | Limite |
|---|---|---|---|---|---|
| Análise de produto | **PostHog** | 28,4 milhões de instalações por semana no site; 2,7 milhões no pacote de React Native; 41 mil estrelas | **muito comum** | funis, retenção, tarefas; interruptores de função; gravação de sessão | plano grátis tem limite de eventos (não conferido) |
| Análise de produto | Mixpanel | 4,0 milhões por semana no site; 0,4 milhão em React Native; cerca de 2% a 3% dos apps com análise | comum | funis e retenção | sem interruptores de função no mesmo pacote |
| Análise de produto | Amplitude | 3,9 milhões por semana no site; 0,4 milhão em React Native; cerca de 3% dos apps no Google Play | comum | funis e retenção, forte em empresas grandes | idem; pesado para um produto pequeno |
| Google | **GA4 no site** | Google Analytics está em **47,7% de todos os sites** (83% entre os que medem) | **muito comum** | ligação com a busca e os anúncios do Google | funis piores de ler; depende de cookies e consentimento |
| Google | **Firebase Analytics no app** | **65% dos apps do iPhone com análise**; primeiro no Google Play; 1,4 milhão por semana no pacote de React Native | **muito comum** | origem das instalações, campanhas; base do Crashlytics | no site, mesmo limite do GA4 |
| Erros | **Sentry** | 56,3 milhões de instalações por semana no site; 5,9 milhões em React Native; 46 mil estrelas | **muito comum** | saber quando o app quebra, com a linha do erro | não é análise de uso |
| Erros | Crashlytics (Firebase) | 0,8 milhão por semana no pacote de React Native | **muito comum** em apps | travamentos do app de celular | só para apps; não cobre o site |
| Visitas com privacidade | Cloudflare Web Analytics | 7% a 11% dos sites mais visitados | comum | visitas, origens, páginas, sem cookies | não mede tarefas dentro do app |
| Visitas com privacidade | Vercel Analytics | 10,8 milhões por semana | comum (quem hospeda na Vercel) | idem | preso à hospedagem da Vercel; o site está no Firebase |
| Visitas com privacidade | Plausible | 30 mil estrelas; 38 mil instalações por semana | nicho | idem, pago, simples | idem |
| Visitas com privacidade | Umami | 40 mil estrelas | nicho | idem, grátis se hospedado por você | você mantém o servidor |
| Visitas com privacidade | Fathom | não medido | nicho | idem, pago | idem |
| Hospedado por você | Matomo | 22 mil estrelas; abaixo de 1% no recorte do W3Techs que consultei (não achei o número) | nicho, tradicional em governo e Europa | controle total dos dados | você mantém o servidor |

**Leitura:** as três escolhas da proposta (PostHog, Firebase no app, Sentry) estão entre as mais adotadas da sua categoria. Nenhuma é aposta de nicho. A única opção mais usada que qualquer uma delas é o Google Analytics no site, que eu deixo de fora pelos motivos abaixo.

## Análise

**Que perguntas o produto precisa responder:**
1. *As pessoas completam as tarefas?* Criar série, ranquear, gerar, salvar, exportar. É análise de produto.
2. *Os links de compra são usados?* É a premissa mais frágil do estudo de viabilidade (30% tocam, 5% compram). É análise de produto.
3. *O app quebrou?* Hoje, só se sabe quando o MJRP vê. É monitor de erros.
4. *De onde vêm as pessoas?* Só importa com o produto público e com páginas públicas. É medição de visitas e de instalações.

**Por que PostHog para 1 e 2:**
- É análise de produto, e a mais instalada da categoria.
- Funciona no site e no React Native, com os mesmos nomes de evento.
- Roda sem cookies e sem perfil de pessoa, o que serve enquanto não há tela de consentimento.
- Traz os interruptores de função, que o MJRP já pediu na F75.
- Região da nuvem: União Europeia (não há região no Brasil).

**Por que não o Google Analytics no site, por ora:**
- Mede bem visitas e mal tarefas.
- Depende de cookies: com o produto público, pede tela de consentimento desde o primeiro dia.
- Dois serviços medindo o mesmo no site dobram o peso de carregamento, e os números não batem entre si.
- Volta à mesa quando existirem páginas públicas e interesse em anúncios ou em ligar com a busca do Google.

**Por que o Firebase no app:**
- O Crashlytics é o padrão de relatório de travamentos em apps, e usa a mesma base do Firebase Analytics.
- Mostra de onde veio cada instalação.
- O app já vai usar o Firebase para conta e dados.
- No app não há o problema de cookies do site; as lojas pedem o rótulo de privacidade, que cobre os dois serviços.

**Por que um monitor de erros no site:**
- É a lacuna mais barata de fechar e a que mais dói: um botão quebrado em produção passa despercebido.
- O Sentry é o mais adotado, com folga, e tem pacote para o site e para o React Native.
- Alternativa sem serviço novo: o próprio PostHog captura erros; menos completo, mas evita um fornecedor.

## Proposta de adoção, em ordem

| Passo | O que | Onde | Estado |
|---|---|---|---|
| 1 | Porta única de eventos, com a lista fechada de nomes, sem dado pessoal | site (e depois o app) | F77, em construção |
| 2 | PostHog atrás da porta, sem cookies, nuvem da União Europeia, com interruptor | site | F77, em construção; falta a chave do projeto (conta do MJRP) |
| 3 | Monitor de erros (Sentry, ou a captura de erros do PostHog) | site | **a decidir**: não está em nenhuma feature |
| 4 | PostHog pelo pacote de React Native, pela mesma porta | app | F78 |
| 5 | Firebase Analytics e Crashlytics | app | F78, a entrar na proposta de arquitetura |
| 6 | Visitas das páginas públicas e ligação com a busca (Search Console, Bing Webmaster; talvez GA4) | páginas públicas | só com a decisão do produto público (candidato de GEO e AEO) |

**Regras que valem para todos:** nenhum evento com texto digitado pela pessoa nem e-mail; um interruptor que desliga tudo sem publicar código; aviso na política de privacidade e consentimento antes de o produto ser público (LGPD).

## Decisões para o MJRP

1. **A proposta serve?** PostHog no site e no app; Firebase Analytics e Crashlytics só no app.
2. **Firebase Analytics também no site?** Eu não recomendo agora; é possível, como segundo adaptador da mesma porta.
3. **Monitor de erros no site:** Sentry (mais completo, um fornecedor a mais) ou a captura de erros do PostHog (menos completo, nenhum fornecedor novo)? Ou deixar para depois.

## O que não foi verificado

- Preços e limites dos planos grátis (PostHog, Sentry, Mixpanel, Amplitude).
- A parcela de sites de Matomo e Plausible no W3Techs; a adoção do Fathom.
- A parcela de apps com Crashlytics.
- As instalações por semana incluem servidores de teste e projetos que não são sites em produção.
- O número do Appfigures para o Firebase no Google Play («100%») não traz base nem data; usei só a ordem.

## Fontes

- npm, instalações da última semana, lidas em 2026-11-20: `api.npmjs.org/downloads/point/last-week/<pacote>` para `posthog-js`, `posthog-react-native`, `mixpanel-browser`, `mixpanel-react-native`, `@amplitude/analytics-browser`, `@amplitude/analytics-react-native`, `@sentry/browser`, `@sentry/react-native`, `@react-native-firebase/analytics`, `@react-native-firebase/crashlytics`, `@vercel/analytics`, `plausible-tracker`.
- GitHub, estrelas lidas em 2026-11-20: `PostHog/posthog`, `getsentry/sentry`, `umami-software/umami`, `plausible/analytics`, `matomo-org/matomo`.
- W3Techs, ferramentas de análise de tráfego: https://w3techs.com/technologies/overview/traffic_analysis
- W3Techs, Cloudflare Web Analytics: https://w3techs.com/technologies/details/ta-cloudflare
- 42matters, SDKs de análise na App Store: https://42matters.com/sdk-analysis/app-store/top-analytics-sdks
- 42matters, SDKs de análise no Google Play: https://42matters.com/sdk-analysis/top-analytics-sdks
- Appfigures, SDKs de análise: https://appfigures.com/top-sdks/analytics/social
