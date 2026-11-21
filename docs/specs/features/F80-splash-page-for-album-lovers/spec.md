---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-62-meet-the-album-blender-on-an-entry-page]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F80: Página de entrada para quem ama álbuns
**Approved**: decidido pelo agente — revisável (dispensa de 2026-11-19). O protótipo foi aprovado pelo MJRP em 2026-11-20 22:15 («aprovado a home v2, fogo vivo na página de entrada, ficou sensacional! bora implementar», corrigido logo depois por «fogo brando na verdade»); o aceite deste spec é dele.

## Summary
**A feature:** Uma página de entrada pública, na raiz do site, para quem ainda não entrou com conta: o caixote de discos em 3D como palco, a rolagem como o disco tocando (lado A, «Flip the record», lado B) com o fio do equalizador, e o fogo brando como a luz que vem de baixo. As chamadas levam ao app.

**Por quê:** Hoje o site abre direto no app: quem chega não vê o que o produto é, e um buscador ou um assistente de IA não tem página para ler no endereço principal.

**Como saber que funcionou:** Quem abre `https://mjrp-playlist-generator.web.app/` sem conta lê, na primeira tela, o que o Album Blender é e chega ao app por «Open the app»; quem já entrou com conta abre a raiz e cai no app sem ver a página; nenhum endereço do app mudou.

## Problem Statement
Dito pelo MJRP em 2026-11-20: «Tb gostaria de prototipo de uma home splash page para o site, com design moderno imersivo com animações, 3d...tudo relacionado a paixao por ouvir e apreciar ALBUNS completos de musica. consegue gerar prototipos?» Depois de duas rodadas de desenho ele aprovou o «Caixote v2» (`design/inception/splash-crate-v2.html`) e corrigiu o fogo para o brando (registro em `docs/specs/info-arch.md` § Protótipos aprovados).

## Requirements
- [REQ-01] Quem abre a raiz `/` sem ter entrado com conta (visitante novo ou convidado) vê a página de entrada como o protótipo aprovado a mostra, no fogo brando: a primeira tela com o título, a frase que define o produto e as duas chamadas; o lado A em cinco faixas (o que é, série, ranking, mistura, coleção), «Flip the record», o lado B em duas (por que álbuns inteiros, o convite); o caixote como palco que puxa um disco por faixa; o fio do equalizador como progresso. · fixes S-62
  verified_by:: `test/splash/splash.test.js`, `test/splash/entryPage.test.js`, `test/splash/gate.test.js`, `reports/evidence/F80/2026-11-20-entry-page-proof.md`
- [REQ-02] Quem entrou com conta (Google ou Apple) e abre a raiz vai direto ao app, sem ver nenhum pedaço da página; qualquer outro endereço (`/home`, `/albums/<id>`, `/inventory`, `/callback`…) abre o app como hoje. · fixes S-62
  verified_by:: `test/splash/gate.test.js`, `test/splash/entryPage.test.js`, `test/architecture/hostingServesFreshPage.test.js`, `reports/evidence/F80/hosting-routes.txt`, `reports/evidence/F80/2026-11-20-entry-page-proof.md`
- [REQ-03] «Open the app» leva à Home do app, onde o visitante já trabalha como convidado; «Sign in» leva ao app com a janela de entrar aberta. · fixes S-62
  verified_by:: `test/components/navigation/signInFromLink.test.js`, `test/splash/entryPage.test.js`, `reports/evidence/F80/2026-11-20-entry-page-proof.md`
- [REQ-04] O caixote cai no caixote em CSS, com as mesmas capas, antes de o 3D desenhar, sem WebGL, quando o three.js não chega e no celular; com «reduzir movimento» nada se move e o 3D nem é baixado; o movimento automático para sozinho dez segundos depois da última rolagem, e «Pause motion» para tudo. · fixes S-62
  verified_by:: `test/splash/splash.test.js`, `reports/evidence/F80/2026-11-20-entry-page-proof.md`
- [REQ-05] Sem JavaScript a página se lê inteira (o texto, as chamadas, o caixote parado com as capas do lado A); um buscador ou um assistente lê o título, a descrição, a frase que define o produto e os dados estruturados, no HTML servido, sem rodar script. · fixes S-62
  verified_by:: `test/splash/entryPage.test.js`, `reports/evidence/F80/machine-reading-fictional.txt`, `reports/evidence/F80/2026-11-20-entry-page-proof.md`
- [REQ-06] As capas vêm de um arquivo de dados só, com dois conjuntos — as reais (as do protótipo) e as fictícias (as da v1) — escolhidos por um interruptor na hora do build; o padrão é o fictício, até o MJRP liberar as reais em público. Cada conjunto traz o seu crédito: as reais, «Artwork from Apple Music», «Listen on Apple Music» e a linha de marcas da Apple; as fictícias, «Fictional album · original art». · fixes S-62
  verified_by:: `test/splash/covers.test.js`, `test/splash/entryPage.test.js`, `reports/evidence/F80/2026-11-20-entry-page-proof.md`
- [REQ-07] No celular (até 899 px) a página é a do protótipo: uma coluna, o caixote em CSS sob a primeira tela, cada faixa com o seu disco e o crédito dele, e a barra de baixo com o fio (só progresso) e «Open the app». · fixes S-62
  verified_by:: `test/splash/splash.test.js`, `reports/evidence/F80/2026-11-20-entry-page-proof.md`
- [REQ-08] O peso da primeira visita fica dentro do que a proposta mediu: até ~250 KB no celular e ~405 KB no computador (com o three.js), com o texto pintado antes de qualquer script pesado. · fixes S-62
  verified_by:: `reports/evidence/F80/2026-11-20-entry-page-proof.md` (padrão fictício: ≈ 77 KB no celular, ≈ 234 KB no computador; com as capas reais ≈ 285 e ≈ 442 KB, ≈ 35 KB acima da proposta)

## Observable States
Os estados da tela são os do protótipo aprovado (`docs/specs/info-arch.md` § Estados, «Rodada 2 · Caixote v2»); os da raiz e do interruptor das capas não têm tela própria e estão no `docs/specs/behavior.md`, seção «A raiz do site e a página de entrada (F80)».

| Estado | ID de bloco | REQ |
|---|---|---|
| Primeira tela (lado A · 1) | `^splash-v2-hero` | REQ-01 |
| Uma faixa do lado A tocando | `^splash-v2-track` | REQ-01 |
| Virando o disco | `^splash-v2-flip` | REQ-01 |
| Lado B | `^splash-v2-side-b` | REQ-01, REQ-03 |
| Antes do 3D, sem WebGL ou no celular | `^splash-v2-css-crate` | REQ-04 |
| Movimento reduzido | `^splash-v2-reduced-motion` | REQ-04 |
| O movimento que para sozinho | `^splash-v2-motion-rest` | REQ-04 |
| Sem JavaScript | `^splash-v2-no-js` | REQ-05 |
| Celular | `^splash-v2-phone` | REQ-07 |
| A raiz para quem não entrou | `^entry-root-signed-out` | REQ-01 |
| A raiz para quem entrou com conta | `^entry-root-signed-in` | REQ-02 |
| Os endereços do app não mudam | `^entry-app-addresses` | REQ-02 |
| «Sign in» da página | `^entry-sign-in-link` | REQ-03 |
| O que o buscador lê | `^entry-machine-reading` | REQ-05 |
| As capas, fictícias ou reais | `^entry-covers-switch` | REQ-06 |

## Success Criteria
- A 1280 x 800 e a 393 x 852, a página servida pelo build de produção (`vite preview`) fica ao lado das capturas do protótipo aprovado e mostra a mesma composição, a menos das capas (fictícias por padrão) e do que só o protótipo tinha (a faixa e as notas para o MJRP).
- Sem conta, `/` mostra a página; com uma conta gravada no navegador, `/` vai a `/home` sem pintar a página; `/albums/<id>` e `/inventory` abrem o app.
- `curl` da raiz devolve o título, a descrição, a frase que define o produto, os oito títulos de seção e os dados estruturados.
- Testes: as capas e o interruptor, a decisão da raiz, as regras do caixote e do fio, a configuração do servidor de arquivos e o link de entrar (arquivos em `test/splash/` e `test/architecture/`).

## Out of Scope
- Publicar com as capas reais: espera a palavra do MJRP sobre os termos da Apple (DPLA 3.3.6(D), App Review 4.5.2(ii)); o interruptor existe, o padrão é o fictício.
- O selo oficial «Listen on Apple Music» (o arquivo não foi baixado): o botão de texto do protótipo fica até as capas reais irem a público.
- Uma página de privacidade (o protótipo tinha o link «Privacy» sem destino; saiu do rodapé).
- Medição de uso na página de entrada (F77): nenhum evento novo; a página é estática e não carrega a medição.
- Som, trechos de música, depoimentos, números de uso.
- A Home do app (F79, em paralelo): esta feature não toca nos arquivos dela.

## Open Questions
- Decidido pelo agente — revisável: a página mora na raiz só para quem não entrou com conta; o convidado (sessão anônima) vê a página na raiz. O porquê e as opções estão no `plan.md`.
- Decidido pelo agente — revisável: `/?entry` mostra a página mesmo para quem entrou com conta (para o MJRP, que é o único usuário com conta, poder vê-la).
- Decidido pelo agente — revisável: o three.js continua vindo do CDN jsDelivr, na versão fixa 0.185.0, como no protótipo (nada novo no `package.json`).
- Do MJRP: as capas reais em público (o interruptor está pronto); o selo oficial do Apple Music; o texto em inglês (proposta do agente, não copy deck).
