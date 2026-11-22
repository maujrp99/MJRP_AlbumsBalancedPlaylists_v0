# Plan — Feature F83: As telas do site em React, tela a tela · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
O desenho inteiro, com os riscos, as opções e as vistas, está em `design/proposals/f83-react-screens/architecture-proposal.md`; a decisão, na ADR-0023 (Proposed). Em resumo:

- A tela em React é mais uma «view» do roteador da casa (`public/js/router.js`), montada no mesmo `#app` por uma ponte (`ReactView`). O roteador não muda.
- Debaixo da tela nada muda: controladores, stores (ADR-0017), serviços (ADR-0016), repositórios, `shared/` (ADR-0022). A regra de dependência continua tela → controlador → serviço → repositório. O React fica na borda: nada abaixo da tela o importa.
- O CSS, a camada do celular e o design system são portados, não reescritos: as mesmas folhas e classes.
- O que isto refina em `arch.md`, depois da aceitação: o mapa de componentes ganha `screens/`, `ui/`, `react-bridge/` e `i18n/`. `data-model.md` não muda nesta feature (a preferência de idioma é da F81).

Nenhum código de produto antes de a ADR-0023 e as emendas da constituição serem aceitas pelo MJRP.

## Technical Design
Fluxo: o roteador casa a rota → a fábrica da rota carrega a tela (`import()`) → `ReactView.render()` esvazia `#app` → `ReactView.mount(params)` abre a raiz do React e desenha na hora → a tela lê as stores por `useStore` e chama o controlador ou o serviço → ao sair, `destroy()` desmonta a raiz e todo efeito para.

| Módulo | O que recebe e o que devolve ou desenha | REQ |
|---|---|---|
| `public/js/react-bridge/ReactView.tsx` (novo) | uma tela e as propriedades dela; para o roteador é uma view (`render`, `mount`, `destroy`); traz a barreira de erro com o painel de erro do roteador | 01 |
| `public/js/react-bridge/useStore.ts` (novo) | uma store e uma função de leitura; redesenha quando a store avisa (conta versões, com um ouvinte fixo da ponte por store; não usa a foto do `getState()`); o contrato inteiro na proposta § 4.3 | 01, 04 |
| `public/js/react-bridge/usePhone.ts`, `useScreenTitle.ts`, `navigation.ts` (novos) | «é celular?» sobre `utils/isPhone.js`; o título da aba e da barra do celular pelas funções de hoje; navegar por código pelo roteador | 01, 05 |
| `public/js/react-bridge/legacy/` (novo, temporário) | um invólucro por pedaço antigo que vive dentro de uma tela nova, e `mountReactPiece` para uma peça nova dentro de uma tela antiga; cada uso numa lista que só encolhe | 03 |
| `public/js/shell/` (novo, onda 3) | a moldura em React (barra do topo, rodapé, moldura do celular, login), montada pelo `app.js`, uma raiz por contêiner | 05, 09 |
| `public/js/router.js`, `public/js/utils/staleBuild.js` | o painel de erro numa função partilhada com a barreira de erro; `afterNavigate` devolve como parar de ouvir; «sem rede» distinto de «versão nova», com prazo de 10 s | 01, 10 |
| `public/js/ui/` (novo) | as peças do design system em React, portes das de hoje (ícone, janela, Folha, barra e folha de filtros, cartão, linha de faixa…); não importam store nem serviço | 05 |
| `public/js/screens/<tela>/` (novo) | uma pasta por tela; a tela, os pedaços só dela, os tipos | 02, 09 |
| `public/js/app.js` | as rotas das telas migradas passam a carregar a tela em React sob demanda; continua a entrada única, com a mesma ordem das folhas de estilo | 01, 07 |
| `vite.config.js` | `@vitejs/plugin-react`; o React num arquivo próprio (`react-vendor`) | 07, 10 |
| `tsconfig.json` (novo), `eslint.config.mjs`, `vitest.config.js`, `tailwind.config.js`, `package.json` | tipos estritos só no código novo (`allowJs`, sem `checkJs`); lint de `.ts`/`.tsx` com complexidade 10 e as regras dos hooks; testes `.test.ts(x)`; o Tailwind lê `.tsx`; `npm run typecheck` dentro de `npm run lint` | 05, 06 |
| `test/architecture/support/importGraph.js`, `sourceImports.js`, `measureComplexity.js` e os sensores que os usam | leem `.ts`/`.tsx` | 06 |
| `test/architecture/` — sensores novos | `handMadeScreensOnlyShrink`, `bridgesOnlyShrink`, `reactStaysAtTheEdge`, `oneStyleSystem`, `lazyOnlyAtTheRoute`, `oneReact`, `everyScreenHasTheLeaveTest` (a lista inteira, os limites e o que nenhum sensor prova: proposta § 11) | 03, 04, 05, 06, 10 |
| `test/support/renderScreen.tsx` (novo) | monta uma tela em React num teste (`createRoot` e `act`), para os testes levados lerem o DOM como liam | 02 |
| `scripts/bundle-budget.mjs` (novo), `scripts/deploy-site.sh` | o teto de peso conferido sobre `dist/`; a verificação de tipos e o teto entram na publicação | 07, 10 |
| `scripts/migration-status.mjs` (novo) | imprime o que falta: arquivos, linhas, pontes, textos | 03, 09 |

**As ondas** (proposta § 15): 0 a base e o canário («Coming soon»); 1 playlists guardadas; 2 edição das playlists (a segunda medição e o ponto de revisão com o MJRP, antes de a moldura migrar); 3 a moldura; 4 Start; 5 séries e álbuns; 6 inventário; 7 Blend; 8 fecho. Cada onda é um ramo próprio, entra pelo trem e vai sozinha para produção.

**A onda 5 foi dividida (decisão do orquestrador em 2026-11-21, revisável; mapa em `map-wave-5-albums.md`):** a **5a** é a tela de álbuns em si (séries, grade e lista, filtros, busca, páginas, contagens, os estados da carga e os avisos de falha, os estados vazios, o layout do celular; `ui/FilterToolbar.tsx`, `screens/albums/`), com a janela de editar série, a de classificar e a tabela de faixas / janela do álbum **à mão atrás de `react-bridge/legacy/`** (listadas em `BRIDGE_USES`); a **5b** é a dessas janelas: editar série com o painel do seletor, apagar série e classificar com o arrastar. **Está feita** (ramo `claude/f83-wave-5b-albums-windows`, sobre a 5a; mapa em `map-wave-5-albums.md`, «A 5b», e prova em `reports/evidence/F83/wave-5b/`): as janelas, o seletor único (`ui/albumPicker/`, que a Start também usa) e o casco da janela (`ui/ModalShell.tsx`) são React; a ponte do arrastar da onda 2 ganhou um perfil por tela em vez de uma segunda ponte. A tabela de faixas, a comparação e a janela do álbum (que o inventário também usa) **ficam à mão para a onda 6**, atrás dos invólucros, e o controlador da sessão em JavaScript para a onda 8.

**Em cada onda, na ordem:** o mapa da tela (pedaços, estados a conferir, os `set` das stores que ela lê, o que o controlador faz no DOM) → as peças de `ui/` que faltam → a tela → os testes levados (muda o andaime, não a asserção) → os textos pelo dicionário da F81 → a prova de HTML igual → a tela antiga e os testes dela apagados → a reconferência visual → o MJRP usa a tela com a conta dele. Um defeito achado ondas depois é consertado à frente (proposta § 9.4).

## UI/UX Design (if the feature touches a screen)
Nenhum desenho novo. A referência de cada tela é a tela de hoje com os mesmos dados; onde `info-arch.md` tem protótipo aprovado (a Home da F79), ele continua valendo. As peças de `ui/` consomem o CSS do design system; nenhuma é redesenhada. O que o sensor visual compara: cada tela migrada, nos estados dela, a 1280 e a 393, antes e depois (proposta § 9.2).

## Dependencies
Novas, cada uma pela ADR-0023:
- `react` e `react-dom` 19.3.0, versão exata — a mesma do app (o `overrides` da raiz): um React só no repositório.
- Só para desenvolver: `typescript` (6.0.3 na medição), `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `typescript-eslint`, `eslint-plugin-react-hooks`.
- Nenhuma biblioteca de estado, de rotas, de formulário, de estilos nem de componentes. Nenhuma biblioteca de teste além do próprio React.

Constitution Check: a v2.0.0 proíbe framework de interface e `.ts` em `public/` sem ADR, e o art. II.1 pede o ADR antes da linha do `tech-stack.md`. A ADR-0023 é esse registro; as emendas (proposta § 9.1) são do MJRP.

Depende de: a **F85** juntada (as rotas `/start` e a moldura de onde a migração parte); a **F81** para os textos de cada onda (o dicionário e a escolha de idioma são dela, sobre o contrato da proposta § 5.2 e § 5.3); a **F84** para o sensor visual cobrir as telas (sem ela, a reconferência é feita por agente). A **F82** depende desta.

## Documents Consulted
- `design/proposals/f83-react-screens/architecture-proposal.md` e a crítica `reports/audits/2026-11-21-mjrpalbumblender-v0-f83-architecture-critique.md`
- `reports/audits/2026-11-21-mjrpalbumblender-v0-frontend-framework-analysis.md`; o rascunho da medição no ramo `wip/react-measurement-spike`
- `docs/specs/constitution.md` v2.0.0, `docs/specs/arch.md`, `docs/specs/tech-stack.md`, `docs/specs/design-system.md`
- `docs/decisions/0016`, `0017`, `0019`, `0021`, `0022`
- `test/architecture/` (os 28 sensores), `public/js/router.js`, `public/js/app.js`, `vite.config.js`, `scripts/deploy-site.sh`

## Risks & Considerations
A tabela completa, com o estado de cada risco, está na proposta (§ 3). Os que seguem abertos e viajam com este plano:
- **A migração parar no meio (R1):** as listas que só encolhem e o ponto de revisão da onda 2; o ritmo espera o MJRP (D-1).
- **A ponte com as stores (R4) e o ícone sem HTML cru (R20):** desenho, não medida; provados na onda 0, antes de qualquer tela.
- **O site misturado em produção (R21):** o português fica fechado por uma chave da F81 até a cobertura que o MJRP escolher (D-8).
- **Sem sinal de erro em produção:** a medição de uso está desligada; até ela ligar, o único sinal de tela quebrada é o painel que o dono vê.
- **Arrastar e soltar com o React (R5):** medido na onda 2; a escolha entre o `sortablejs` atrás de uma ponte e o `@dnd-kit` sai de lá, registrada antes de construir.
- **Listas grandes (R17):** medido na onda 5.
- **O custo da conferência visual por onda (R18):** depende da F84.
- **Peça partilhada com tela antiga no script principal (achado da onda 1; decidido pelo agente — revisável; aceito pelo coordenador em 2026-11-21):** a proposta (§ 4.4, caso 3) manda portar uma vez para `ui/` e montar nas telas antigas por `mountReactPiece`. Mas uma tela antiga está no script principal, e uma peça em React ali o faz importar o React, contra a decisão da onda 0 (a primeira carga não baixa React até uma tela em React abrir; `bundle-budget.json` `reactAtStart: false`). Na onda 1 a barra de filtros e a linha de faixa ficaram as antigas, por invólucros em `react-bridge/legacy/` (3 usos na lista `BRIDGE_USES`, que a proposta esperava vazia até a onda 8), e a cascata de capas ficou com duas escritas até a onda 7. A conta se resolve quando a moldura virar React (onda 3, que já carrega o React na abertura): dali em diante `mountReactPiece` é de graça. Alternativas: antecipar a decisão de carregar o React na abertura (custo: ~68,7 KB comprimidos a mais na primeira carga de todos), ou aceitar os invólucros até a onda em que cada peça migra (o que foi feito).
- **Os números:** a medição não foi entregue; o teto de peso e a estimativa de horas entram quando ela chegar, e a estimativa é refeita depois da onda 2.
