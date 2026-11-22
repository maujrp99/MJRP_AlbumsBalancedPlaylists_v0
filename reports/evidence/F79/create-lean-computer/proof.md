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
