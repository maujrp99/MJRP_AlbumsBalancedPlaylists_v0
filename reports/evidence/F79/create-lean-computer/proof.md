# F79 · a tela Create enxuta no computador, e a linha laranja de carregamento que sai — prova no site construído

**Ramo:** `wip/f79-create-lean-computer-and-no-loading-line` · duas entregas, dois commits (A, depois B). Esta pasta tem uma seção para cada.

**Como (as duas):** `vite build` de `main` e do ramo, cada um servido por um servidor estático pequeno que responde as rotas fundas (`/start`, `/albums`, `/blend` devolvem `app.html`); Playwright (emprestado de `MJRPpersonal`, Chromium e WebKit), `prefers-reduced-motion`, avisos (toasts) escondidos. Firebase bloqueado (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`); o catálogo é um MusicKit de mentira (capas fictícias, 11 álbuns de «Radiohead»); a conta é um stand-in de teste escrito no navegador (nunca uma senha). Nenhuma chave de API em arquivo; `.env` não lido.

## A — a tela Create enxuta no computador

**O que se pediu:** «podemos aplicar na sessão create o mesmo conceito de lean da versao mobile?»; entre a de hoje, a enxuta e a variante com os passos numa linha, ele escolheu «3. Sua recomendação» (a enxuta). Especificação: `design/proposals/f79-create-lean-computer/proposal.md`.

**Estados capturados** (com e sem conta): primeira visita, «What is a series?» aberta e fechada (mouse e teclado: Enter abre e fecha, Esc fecha), digitando, resultados, álbuns escolhidos, o último álbum tirado, lista colada, artista não encontrado, catálogo sem resposta.

| Onde | Resultado |
|---|---|
| Computador 1280 × 800 e 1440 × 900, Chromium e WebKit, com e sem conta | Em todos os estados: campo «Type an artist»; sob o campo só o link «or paste a list» («Search an artist instead» na lista colada; nenhum no «não encontrado»); sem a linha «Press Enter…»; sem os três passos; base só com a primeira capa e de volta a nada quando o último álbum sai; aviso de visitante só com álbuns, dentro da base; a frase da série abre no mesmo lugar (sem janela), `aria-expanded` vira `true`, segundo clique, Esc ou Enter fecham; antes da busca o conjunto desce (o campo a 392 px de cima no 1280 × 800; era 336 px). Sem rolagem lateral. |
| Contra a prévia aprovada | `first-visit-lean-1280.png` (800 × 500) contra a captura do ramo reduzida ao mesmo tamanho, abaixo do menu: diferença média 0,67 de 255; 0,2 % dos pontos mudam mais que 40 (o menu da prévia é o do «sem conta»). Título e campo caem nos mesmos pontos. |
| Celular, WebKit perfil iPhone 393 × 852 e 375 × 667, e 899 × 800 (Chromium e WebKit) | **Idêntico a `main`: 0 pixel de diferença em 50 de 50 capturas** (393: 20, 375: 10, 899: 20). Controle de ruído (`main` contra `main`): 0 pixel nessas mesmas. A «What is a series?» do celular continua abrindo a folha de baixo (`aria-haspopup="dialog"`, sem `aria-expanded`). |
| Fronteira 899 / 900 | 899 igual a `main`; 900 já é computador (muda como no 1280). |
| Ruído do computador | `main` contra `main` difere em até 910 pontos por captura, a fila de barras do topo (equalizador); o ramo difere de `main` por desenho, em todas as capturas do computador. |

**O que decidi sozinho, e por quê:**
- O aviso «You're not signed in» fica **na base** no computador (a prévia diz «vem com a barra»), e só com álbuns; no celular continua sob o campo.
- A busca continua redesenhando o palco a cada tecla e ao entrar/sair do campo, embora a linha «Press Enter…» tenha saído. Sem isso, uma captura do celular (Chromium 899, estado «digitando») difere de `main` em 10 pontos de serrilhado no ícone da lupa; com o redesenho mantido, 0. O celular é a restrição mais forte.
- `dockEmptyNote` (a nota da base vazia) ficou: a base vazia nunca mais aparece, mas o ramo do celular dela já era inalcançável e não é desta entrega; sai numa limpeza própria.

**Arquivos:** `desktop-1280-main-vs-lean.jpg` (main à esquerda, ramo à direita: primeira visita, resultados, escolhidos), `desktop-1440-webkit-lean-states.jpg` (oito estados no WebKit 1440, com conta), `phone-393-main-vs-branch.jpg` (iPhone: primeira visita, folha «What is a series?», escolhidos), `a-facts.json` (as medidas por estado e a contagem de pontos diferentes por perfil, com o controle de ruído).

**Não provado:** monitor maior que 1440 × 900 (o vazio embaixo cresce); Safari de verdade em Mac e iPhone de verdade (só o WebKit do Playwright); Firefox; o catálogo real (capas e discografia de exemplo); leitor de tela falando o `aria-expanded`.

## B — a linha laranja de carregamento no alto sai

**O que se pediu:** «agora que vi no menu aquela barra laranja que aparece no topo, nao deveria aparecer mesmo»; «a barra laranja aparece apenas qdo clico em album e blend»; perguntado se era a linha fina de carregamento, respondeu «1. Creio que sim».

**Como:** `/albums` e `/blend` com a leitura das séries demorada: a rota do Firestore (bloqueada) é segurada 1,5 s antes de ser recusada; conta de teste; Chromium 1280 × 800 e WebKit iPhone 393 × 852; sondas a 250, 600, 1000 e 1400 ms e a tela já assentada (14 s depois); `main` duas vezes (controle de ruído) e o ramo.

| | `main` | ramo |
|---|---|---|
| `#globalProgress` durante a leitura (250 a 1400 ms) | presente, `display: block`, 6 px no alto (no celular, logo abaixo do topo) | **não existe no DOM**; nenhum elemento fixo de 8 px ou menos no alto da página |
| Depois de assentar | escondida | não existe |
| Tela assentada, ramo contra `main` | | **0 pixel de diferença** nas quatro (1280 e iPhone, `/albums` e `/blend`); `main` contra `main` também 0 |
| Tela durante a leitura, ramo contra `main` | | só a faixa do alto (a linha e seu brilho). Fora dela: 0 pixel no `/albums` 1280 e no `/blend` do iPhone; 295 pixels no giro do ícone de espera do `/blend` 1280 (a fase do giro); 45 510 no `/albums` do iPhone, a mesma região que oscila entre dois `main` (19 527 pixels de ruído nela) |

**O que cada tela mostra sozinha enquanto as séries carregam:**
- **Blend:** mostra o seu. «Loading your series…» no celular; no computador, o giro de espera no lugar dos cartões de série (`screens-own-loading-state-branch.jpg`).
- **Albums: não mostra nada de espera.** Durante a leitura ela desenha o estado vazio («No albums match your filters» / «No albums in library, Create a series from the home page to get started») e só depois, se houver séries, os álbuns. A linha laranja era o único sinal de que algo carregava ali; **sem ela a tela Albums parece vazia por 1 a 2 s** (a leitura real, sem a espera forçada, é mais curta). Não inventei indicador novo, como mandado: fica como achado para o MJRP decidir.

**Arquivos:** `top-of-page-during-load-1280.jpg` e `top-of-page-during-load-iphone.jpg` (o alto da página a 1 s da leitura: `main` com a linha, o ramo sem), `screens-own-loading-state-branch.jpg` (as telas inteiras do ramo durante a leitura), `b-facts.json` (as sondas e a conta de pontos diferentes).

**Não provado:** a leitura real do Firestore de uma conta com séries (aqui a leitura é recusada depois da espera; o que se prova é a ausência da linha e o estado que a tela mostra durante a espera); WebKit de verdade no iPhone; a linha que a linha da migração (React) ainda desenha ao carregar uma tela sob demanda (`GlobalProgress.tsx`), que é outra peça.
