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

## C — a tela Álbuns diz que carrega; um Escape, uma coisa; os atributos do celular

Site construído (`vite build`) e servido estático; Chromium e WebKit; Firebase bloqueado, a leitura das séries segurada 1,5 s (e, para a leitura rápida, 0 s); catálogo de teste. `main` = `336385a`.

| | `main` | ramo |
|---|---|---|
| `/albums` a 300, 800 e 1300 ms (computador 1280, Chromium) | «No albums match your filters» e «No albums in library», sob a linha laranja | o círculo de espera no lugar da lista; cabeçalho e filtros iguais; nenhum texto de vazio |
| `/albums` a 300, 800 e 1300 ms (iPhone 393, Chromium e WebKit) | o cartão «No albums in library · Go and create!» | «Loading your series…»; nenhum cartão de vazio |
| Quando a leitura acaba | o estado vazio | o estado vazio (a leitura foi recusada: o que mostrava antes); tela assentada **0 pixel** de diferença contra `main` em `/albums` e `/blend`, Chromium 1280, Chromium e WebKit iPhone |
| Leitura rápida | sem espera | o estado de espera nem chega a aparecer (a leitura acaba antes da primeira amostra, ~130 ms); deslocamento de layout 0,0025 (Chromium 1280), igual ao de `main`; 0 nos demais |
| Leitura segurada, troca do círculo pelo estado vazio | | 0,14 de deslocamento no Chromium 1280 (o cartão vazio é mais alto que o círculo e empurra o rodapé); 0 nos outros três perfis. Vem da espera forçada de 1,5 s |
| `/blend` | | 0 pixel de diferença |
| Escape, Chromium e WebKit 1280 | | foco no menu: fecha o menu e a frase fica; foco no link: fecha a frase; foco no campo: nada; menu aberto e foco no link: um Escape fecha só o menu |
| Celular, `What is a series?` | `aria-haspopup="dialog"` | igual: só `aria-haspopup="dialog"`, sem `aria-expanded` nem `aria-controls`, antes e depois do toque (a folha abre) |
| Celular `/start`, 393 e 375, Chromium e WebKit, primeira tela e folha aberta | | **0 pixel** de diferença contra `main` nas 8 |

**Arquivos:** `albums-loading-1280-main-vs-branch.jpg` (da esquerda: `main` a 300 ms, ramo a 300 ms, ramo a 1300 ms, ramo assentado) e `albums-loading-iphone-main-vs-branch.jpg` (o mesmo, no iPhone).

**Não provado:** uma conta com séries de verdade (a passagem do estado de espera para os álbuns está provada em jsdom, `SeriesView.loading.test.js`, não no navegador); o WebKit de 1280 ficou sem sessão (o login de teste não pega ali), então a espera no WebKit está provada só no iPhone; o tempo real do Firestore; Safari de verdade.

### C.2 — o bloco de espera com a altura do cartão vazio (2º parecer do juiz, P2-A e P2-B)

Medido no site construído, Chromium 1280 e iPhone 393 (WebKit), com a leitura das séries devolvendo duas séries (ou nenhuma, ou falha) depois de 1,5 s, na mesma ponte de teste do juiz. O cartão vazio mede 391 px a 1280 e 282 px a 393: esse é o `min-height` do bloco (círculo ou frase centrados). A grade fica invisível, não escondida, para guardar o espaço da sua mensagem.

| Deslocamento de layout na troca (Chromium 1280) | `main` | ramo antes | ramo depois |
|---|---|---|---|
| Álbuns aberto pelo menu: a lista chega | 0,112 | 0,663 | **0,031** |
| Álbuns direto: a lista chega | 0,040 | 0,041 | **0** (só o ruído de 0,0025 do botão de playlists) |
| Leitura sem séries ou com falha: o cartão vazio chega | 0 (sem troca) | 0,141 | **0** (0,0025, o mesmo ruído) |
| Leitura rápida | 0,034 | 0,034 | 0,034 |

O rodapé fica no mesmo lugar (y = 1040 a 1280 px) durante a espera e com o cartão vazio. Telas assentadas contra `main`: **0 pixel** nas 10 (cinco cenários × dois perfis); `/blend` 0 pixel. No iPhone o deslocamento não é medido (o WebKit não tem a API); o bloco de 282 px é o cartão vazio.

### C.3 — o círculo logo sob os filtros (3º parecer do juiz)

O bloco de espera guarda o lugar e a altura (391 px no computador, 282 px no celular); só o conteúdo sobe sobre o espaço da grade invisível, por `transform` (não move o layout). Site construído, leitura segurada, série devolvida.

| Janela | topo do círculo / da frase | base | altura da janela | rodapé (y) |
|---|---|---|---|---|
| 1280×720 | 446 | 484 | 720 | 1040 |
| 1366×768 | 446 | 484 | 768 | 1040 |
| 1280×800 | 446 | 484 | 800 | 1040 |
| 1440×900 | 446 | 484 | 900 | 1040 |
| iPhone 393×852 | 256 | 338 | 852 | — |
| iPhone 375×667 | 256 | 338 | 667 | — |

Deslocamento (Chromium 1280): pelo menu 0,031; lista direto 0 na troca; cartão vazio e falha 0 (0,0025 de ruído, igual a `main`); leitura rápida 0,034 (igual a `main`). Rodapé: 1040 direto, 995 pelo menu. Telas assentadas: 0 pixel contra `main` nas 10; `/blend` 0.
