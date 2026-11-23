# A migração das telas do site para React: o relatório do fecho (F83)

Escrito em 2026-11-22, na onda 8d, no ramo `claude/f83-wave-8d-closure`. É para o MJRP decidir o que vem depois; o detalhe técnico está atrás dos caminhos. Responde também ao ponto de revisão que nunca foi escrito (TASK-17).

**Em uma frase:** todas as telas do site agora são em React com TypeScript, nada à mão ficou nas telas, e o que sobra à mão é pouco e tem motivo. Falta **só você usar na prévia** e dizer «publica».

## 1. O que foi migrado, e o que ficou à mão de propósito

| O quê | Onde mora agora | Onda |
|---|---|---|
| A tela «Em breve» (o canário: Artists, Genres, Tracks) | `screens/coming-soon/` | 0 |
| Playlists guardadas | `screens/saved-playlists/` | 1 |
| Edição das playlists (`/playlists`, `/playlists/edit`) e o painel de gerar de novo | `screens/playlists/` | 2, 7a |
| A moldura: barra do topo, rodapé, moldura e menu do celular, janela de entrar | `shell/` | 3 |
| Create (a Start) | `screens/start/` | 4 |
| Séries e álbuns (a grade, os filtros, as janelas de editar, apagar e classificar) | `screens/albums/` | 5a, 5b |
| Inventário e as janelas do álbum, de editar e de adicionar | `screens/inventory/`, `ui/albumWindow/`, `ui/inventoryItem/`, `ui/tracks/` | 6a, 6b, 6c |
| Blend e os cartões de receita | `screens/blend/`, `ui/recipe/` | 7a, 7b |
| A janela de exportar ao Spotify; o Apple Music e o arquivo JSON mudaram de lugar sem mudar a lógica | `ui/SpotifyExportWindow.tsx`, `controllers/playlistExports.js`, `controllers/playlistExportEntries.js` | 8a |
| Os avisos, a barra de carga, as perguntas e a casca da janela | `stores/toasts.js` + `shell/Toasts.tsx`, `stores/progress.js` + `shell/GlobalProgress.tsx`, `ui/dialogs/`, `ui/ModalShell.tsx` | 8b |
| A Folha do celular | `ui/SheetWindow.tsx` | 8c |
| O fecho: o último invólucro, o ícone em texto, o título da aba, os textos que faltavam, a regra final | ver o registro (`docs/log.md`, «onda 8d») | 8d |

**Fica à mão de propósito:**

- **A página de entrada** (`public/splash/`, F80): é traduzida no build; a spec a deixa fora do React.
- **`utils/pageScrollLock.js`**: segura a rolagem da página atrás de uma Folha escrevendo o estilo do `body`; o React não tem equivalente. Decisão do orquestrador; está na lista de exceções da regra final com o motivo.
- **Os controladores, os serviços, as lojas, os repositórios e o roteador** (JavaScript). A spec deixa «passar o JavaScript existente para TypeScript» **fora do escopo**; os cinco controladores em TypeScript ficam como candidata própria, depois do fecho.
- **Quatro arquivos pequenos** que escrevem na página sem ser tela (o roteador, `MusicKitAuth`, `AuthService`, o link do arquivo JSON): estão na lista de exceções com o motivo.

## 2. O custo medido

**Ondas e juntas.** 8 ondas (0 a 8, com 5, 6, 7 e 8 divididas em sub-ondas: 5a/5b, 6a/6b/6c, 7a/7b, 8a/8b/8c/8d) e 5 juntas com a `main` (a `main` seguia à mão enquanto as ondas andavam). Tudo entre 2026-11-21 e 2026-11-22, no registro `docs/log.md`.

**Testes.** | | `main` (2ac6c84, à mão) | ponta deste ramo | diferença |
|---|---|---|---|
| Arquivos de teste | 329 | 389 | +60 |
| Testes | 4.182 | 5.189 (1 pulado) | +1.007 |

Nenhuma asserção mudou de sentido ao levar os testes das telas antigas (a contagem de casos levados está em cada onda no registro).

**Peso** (o que o navegador baixa, comprimido):

| | `main` (à mão) | ramo (ponta) |
|---|---|---|
| Script principal | 301.830 B (medido na onda 0, com as chaves) | **194.872 B** (−106.958 B, −35%) |
| Depois da primeira tela | — (tudo no principal) | 235.808 B |
| Fornecedor do React (baixado na abertura) | — | 68.691 B |
| Principal + depois da primeira tela | 301.830 B | 430.680 B |

*Como ler:* o script principal encolheu muito, porque as telas saíram dele e viraram arquivos que descem só quando a tela abre. Mas a pessoa baixa **mais** no total (o React e as telas), e baixa o React já na abertura (a moldura é em React). O teto está em 195.022 B para o principal, com folga de 150 B, medido numa construção do formato da publicação (`npm run budget:publication`).

**Tempo da primeira tela** (nenhum agente mediu de novo no fecho; estes são os números dos relatórios, perfil lento, Chromium 1280): onda 0, `/start`: 3,74 s contra 3,70 s na `main`; depois da moldura em React (onda 3): +85 kB e cerca de +0,4 s; no juiz da junta do menu novo, a tela pronta em 4,6 s contra 3,3 s da produção de antes (a produção não tem o React na abertura). **É o preço pago pela migração; a medição no site publicado, no mesmo perfil, é um item da verificação da publicação (seção 8).**

**O que os juízes independentes acharam** (agentes que não construíram; relatórios em `reports/audits/2026-11-2x-mjrpalbumblender-v0-react-*-visual-parity-recheck*.md`):

| Onda | P0 / P1 / P2 | Falhou na primeira passada? | Por quê |
|---|---|---|---|
| 0 base | 0 / 0 / 3 | não | |
| 1 playlists guardadas | 0 / 0 / 1 | não | |
| 2 playlists | 0 / 1 / 2 | **sim** | sair pelas migalhas com mudança não salva perguntava duas vezes (consertado) |
| 3 moldura | 0 / 0 / 3 | não | |
| 4 Create | 0 / 0 / 1 | não | |
| 5a álbuns | 0 / 0 / 3 | não | |
| 5b janelas dos álbuns | 0 / 0 / 3 | não | |
| 6a inventário | 1 / 0 / 2 | **sim** | «Show 50 more» no celular jogava a página além dos álbuns novos; na segunda passada 0 / 0 / 1 |
| 6b janelas do álbum e do inventário | 0 / 0 / 3 | não | |
| 7a painel de gerar de novo | 0 / 0 / 1 | não | tetos de peso sem folga |
| 7b Blend | 0 / 2 / 3 | **sim** | a página saltava 112 a 254 px ao apertar um ingrediente; e a construção da publicação reprovava o teto de peso; segunda passada 0 / 0 / 1 |
| junta: o menu novo | 0 / 1 / 3 | não (aprovou com um P1 a consertar) | uma «diferença de propósito» declarada que não existia no navegador |
| junta 2 (exportar + inventário) | 0 / 0 / 3 | não | |
| junta 3 (Create enxuta no celular) | 0 / 0 / 1 | não | |

**Três quedas na primeira passada** (ondas 2, 6a e 7b) e um P1 aceito para consertar na junta do menu: todos consertados e reconferidos. **Nenhum P0 aberto.** Correção do integrador (2026-11-23): as sub-ondas 8a (`…react-exports-…`), 8b (`…react-window-engines-…`) e 8c (`…react-phone-sheet-…`) **têm** relatório de juiz independente em `reports/audits/`, e o juiz final (`reports/audits/2026-11-22-mjrpalbumblender-v0-react-final-visual-parity-recheck.md`: passa, 0 P0, 0 P1, 4 P2) julgou o app inteiro, com a junta 5 e a onda 8d pela primeira vez. Só a 6c e a junta 4 não tiveram juiz próprio; o juiz final as cobriu na varredura do app inteiro.

## 3. Cada requisito da spec

| REQ | Resultado | Onde está a prova |
|---|---|---|
| REQ-01 uma tela em React abre e fecha pelo mesmo roteador; guardas, versão nova, barra do celular, medição; ao sair não ouve mais nada; erro mostra o mesmo painel | **cumprido** | `react-bridge/ReactView.tsx`; o teste-molde «entrar e sair cinco vezes» em toda tela (`everyScreenHasTheLeaveTest`); `test/react/bridge/` |
| REQ-02 a tela migrada mostra e faz o mesmo | **cumprido com diferenças de propósito** (seção 4) | os dourados de cada onda em `test/fixtures/*Before*.json`, as provas em `reports/evidence/F83/*/proof.md`; esta onda: `reports/evidence/F83/wave-8d/proof.md` |
| REQ-03 tela nova nasce em React; nenhum arquivo novo em `views/` ou `components/`; só diminui | **cumprido** | `test/architecture/noHandMadeScreens.test.js`; `node scripts/migration-status.mjs`: 0 arquivos à mão, 0 pontes |
| REQ-04 o que fica debaixo não muda e não conhece o React | **cumprido** | `reactStaysAtTheEdge.test.js`, `layerBoundaries.test.js` |
| REQ-05 camada do celular e design system sem mudança visual; um só sistema de estilos | **cumprido** | `oneStyleSystem.test.js`; as provas de pixel por onda |
| REQ-06 as regras de arquitetura valem para o código novo (tipos, complexidade 10) | **cumprido** | `npm run typecheck` dentro do lint; `complexityLimit.test.js` |
| REQ-07 o que o navegador baixa tem teto | **cumprido** | `scripts/bundle-budget.json`; `npm run budget:publication`; `scripts/deploy-site.sh` |
| REQ-08 todos os textos vêm do dicionário em inglês e em português | **cumprido em inglês; português proposto, ainda não lido por você** | `public/js/i18n/en|pt/`; `scripts/migration-status.mjs`: 0 textos fora (a contagem é aproximada, ±10%); a lista dos que ficam de fora de propósito está na seção 5 |
| REQ-09 todas as telas migram; no fim apagam-se as pontes, o `SafeDOM` e a base das telas | **cumprido** | `views/`, `components/`, `react-bridge/legacy/` e `utils/SafeDOM.js` não existem |
| REQ-10 publicar e voltar atrás pelo mesmo caminho; aba antiga se recupera; sem rede diz «sem rede» | **cumprido no código e nos testes; a volta atrás só você prova na prévia** | `utils/staleBuild.js`, `router.js`; a TASK-05; ensaio de volta: seção 8 |

## 4. As diferenças de propósito em relação à produção (o que uma pessoa vê)

Cada uma é para melhor, para você concordar ou mandar desfazer:

| O que a pessoa vê | Onde | Onda |
|---|---|---|
| A barra do topo no computador segue o endereço, e a gaveta gira a seta | moldura | 3 |
| Com um «Undo» valendo, fechar a Folha do celular mostra a faixa de Undo de novo | Create, celular | 4 |
| «Connect» (Apple Music) mantém o painel da conta aberto | moldura | junta 1 |
| O botão «Exportar» mantém o foco depois de apertado | janela de exportar | junta 2 |
| O toque em «Search» no Safari é recebido (o defeito não existia no React) | Create | junta 3 |
| A janela do álbum fecha quando a tela sai (a antiga ficava por cima da tela seguinte) | inventário, álbuns | 6b |
| As capas que chegam na Blend não roubam o foco do cartão; a lista de séries guarda a rolagem ao escolher uma série | Blend | 7b |
| Escolher «Create» onde dizia «Start» (o nome novo da `main`, F91) | menu, rodapé, abas | junta 4 |
| Os avisos e a barra de carga são desenhados um instante depois da chamada (um quadro); ninguém vê | avisos | 8b |
| Uma Folha aberta some junto com a tela que a abriu; uma Folha que está fechando guarda o que tinha dentro enquanto desce | Folha do celular | 8c |
| A linha laranja de carregamento no alto da Create saiu; a tela Albums diz que está carregando | Create, Albums | junta 5 |

Esta onda (8d) **não mudou nada que se veja**: a prova dela é a de que um site construído do pai e um da ponta não se distinguem (seção 7).

## 5. Defeitos que já existiam antes da migração e foram levados iguais («defeitos mantidos»)

*Cada um é um candidato a issue, para o orquestrador abrir. Compilado dos relatórios das ondas (as colunas «como ver» vêm da descrição deles; não foram ensaiadas de novo).*

| # | O quê | Onde | Como ver | Quem registrou |
|---|---|---|---|---|
| 1 | A janela de editar série não fecha com Escape nem clicando fora, não prende o foco e não tem nome para o leitor de tela | Albums, «Edit Series» | Abrir; Esc e clique fora não fecham; Tab sai da janela | prova da 5b; mapa da onda 5 |
| 2 | A janela de classificar não prende nem dá foco; só no celular tem `role=dialog` | Albums, «Rank Your Album» | Abrir e apertar Tab: o foco vai para a página | prova da 5b |
| 3 | Os botões «Back» e «Reset» da janela de classificar (computador) não têm ícone (os dois ícones pedidos não existem) | Albums, classificar | Abrir no computador: só texto | prova da 5b |
| 4 | Uma classificação «parcial» é gravada como inteira (1 a N) e não se distingue nos dados | Classificar | Mover uma faixa só, salvar, ler o gravado | prova da 5b; lições §11 |
| 5 | No celular, Subir/Descer não recalculam o estado depois de arrastar | Classificar, celular | Arrastar uma faixa e olhar Subir/Descer | prova da 5b |
| 6 | Dois cliques rápidos em «Save» gravam duas vezes e dão dois avisos | Classificar | Duplo clique em Save | juiz da 5b (P2-3) |
| 7 | «All Years» e «All Sources» aparecem duas vezes nas listas de filtro | Albums | Abrir a lista de ano ou de fonte | prova da 5a; juiz da 5a (P2-1) |
| 8 | «Refresh» recarrega o escopo do endereço de abertura, não a série escolhida depois no filtro | Albums | Escolher outra série no filtro e apertar Refresh | prova da 5a; juiz da 5a (P2-2) |
| 9 | Todo filtro conta como «ligado» no aviso «No albums match» | Albums | Um filtro sem resultado | prova da 5a |
| 10 | «Go to Start» do estado vazio recarrega a página inteira em vez de navegar | Albums vazio | Conta sem álbuns; apertar o botão | prova da 5a; juiz da 5a (P2-3) |
| 11 | Ao falhar o login, o botão volta sem a sombra de passar o mouse | Moldura, janela de entrar | Falhar o login e passar o mouse | mapa da onda 3 |
| 12 | O fundo da gaveta da tela média (768–899 px) tem o tamanho da barra: tocar ao lado não fecha | Moldura | Abrir a gaveta e tocar fora | mapa da onda 3 |
| 13 | A janela de entrar não tem Escape, prisão de foco nem retorno; o menu de séries e a gaveta não fecham com Esc | Moldura | Abrir e apertar Esc ou Tab | juiz da onda 3 (P2-2) |
| 14 | O painel de falha é técnico («View Error», com a pilha); «Try again» sem rede não sinaliza o toque; texto branco sobre o botão de fogo (contraste 2,8:1) | Telas «Em breve», sem rede | Desligar a rede e apertar «Try again» | juiz da base (P2-1 a P2-3) |
| 15 | Create, folha do celular: as linhas e o rodapé são refeitos a cada desenho e o foco vai para a página; o aviso «falta o nome» fica até sair do campo | Create, celular | Digitar o nome na folha e tocar numa linha | mapa da onda 4 |
| 16 | A frase «Your series still has its N albums» usa a contagem do momento da busca | Create | Buscar e depois mudar a seleção | mapa da onda 4 |
| 17 | Inventário lendo mostra o vazio («Your collection is empty»); uma leitura com erro também vira vazio; no computador, a mesma frase para vazio e para filtro sem resultado | Inventário | Abrir com rede lenta ou com erro | mapa da onda 6 |
| 18 | Editar item dá dois avisos de sucesso («Album updated» e «Inventory item updated»); a falha mostra mensagem crua; inventa BRL; preço 0 vira vazio | Inventário, editar | Editar e salvar | mapa da onda 6; juiz da 6b |
| 19 | «Add to Inventory» pode ser apertado durante a escrita (dois toques adicionam duas vezes); começa em BRL | Inventário, adicionar | Dois toques rápidos | mapa da onda 6; juiz da 6b |
| 20 | «Paid» só em BRL ou «$» (EUR e GBP saem com «$»); preço 0 some | Janela do álbum | Um item em EUR | mapa da onda 6 |
| 21 | As janelas do álbum, de editar e de adicionar não têm `role=dialog`, foco ao abrir e fechar, nem Esc e fundo; a do álbum ficava sobre a tela seguinte (esta foi consertada de propósito na 6b) | Inventário, Albums | Abrir e apertar Esc | mapa da onda 6; prova da 6b |
| 22 | A comparação das faixas desenha um esqueleto por uma volta, e a tabela e as abas (o CSS esconde uma) | Janela do álbum | Abrir a comparação | mapa da onda 6 |
| 23 | O aviso do Discogs no rodapé fica ligado depois de sair do inventário | Rodapé | Sair do inventário com a fonte ligada | mapa da onda 6 |
| 24 | O botão «View» do cartão não tem ícone (o ícone pedido não existe); duas funções do inventário (ordem e preço) não têm quem as chame | Inventário | Olhar o cartão; ler o código | mapa da onda 6 |
| 25 | Os cartões de receita não têm `role`, `tabindex` nem `aria-pressed`: a receita não se escolhe pelo teclado | Blend | Tab nos cartões | mapa da onda 7 |
| 26 | Nome de série com entidade HTML aparece cru no computador («Rush &amp; Friends») e decodificado no celular | Blend | Uma série com «&» | mapa da onda 7 |
| 27 | A faixa de passos nunca marca o passo 3 como atual | Blend | Percorrer os passos | mapa da onda 7 |
| 28 | O progresso mostra o id da receita («mjrp-balanced-cascade»), não o nome; o resumo diz sempre «(60 min, auto mode)» | Blend, geração | Gerar | mapa da onda 7 |
| 29 | Os ingredientes não zeram ao trocar de receita; uma opção escondida ainda vai para a geração | Blend | Escolher uma opção, trocar de receita e gerar | mapa da onda 7 |
| 30 | A lista de séries é uma foto (uma série nova só na próxima visita); as capas vêm só do conjunto local; o painel de erro fica até o próximo desenho, com a mensagem crua | Blend | Criar uma série e voltar | mapa da onda 7 |
| 31 | O círculo do progresso usa uma classe que não existe; dois textos de sucesso diferentes («Generated N playlist(s)!» e «Generated N playlists»); o painel de gerar de novo tem classe repetida, botão sem `type` e ouvintes no documento | Blend, Playlists | Olhar a geração | mapa da onda 7 |
| 32 | Peças mortas (receitas não registradas, `DURATIONS`, `getSelection`) e uma troca de entidade que nunca roda | Código da Blend | Ler o código | mapa da onda 7 |
| 33 | A janela do Spotify: sem Escape, sem prender o Tab, sem foco ao abrir e fechar, sem `role`; o fundo não fecha enquanto exporta; diz «1 tracks»; é refeita a cada palavra (a animação e o foco recomeçam) | Exportar ao Spotify | Playlists > exportar ao Spotify | prova da 8a; cabeçalho de `ui/SpotifyExportWindow.tsx` |
| 34 | Avisos: o botão de fechar não tem nome, os ícones têm traço ignorado, o «info» não tem fundo no computador (classe inexistente), a saída de 300 ms ignora «reduzir movimento», duram 4 s fixos, sem pausar, sem limite, sem `role=status` | Avisos | Disparar um aviso | prova da 8b |
| 35 | Perguntas: sem prender Tab, sem foco ao abrir e fechar, sem nome para o leitor, o fundo não fecha; `alert` deixa um botão vazio | Perguntas | Apagar uma playlist e apertar Tab | prova da 8b |
| 36 | A pergunta com campo de texto ignora o valor inicial e não se alcança pelo app (o erro que a chama nunca é lançado) | Remover álbum à mão | Só no teste e chamando o motor direto | prova da 8b; lições §21 |
| 37 | Apagar série com o banco recusando: a pessoa recebe «could not count» e nunca a pergunta | Albums | Banco recusando | prova da 8b |
| 38 | Os avisos do `app.js` («Authentication issue…») eram literais fora do dicionário | Abertura | Entrar sem login | prova da 8b (**já consertado na 8d**: foram ao dicionário) |
| 39 | Uma pergunta aberta de dentro de uma Folha fica por baixo dela (camada 1000 contra 50) e a Folha ouve o Esc primeiro | Celular: Menu > Disconnect Spotify; apagar playlist; limpar o cache | Abrir a pergunta; o Esc fecha só a Folha | prova da 8c; cabeçalho de `ui/SheetWindow.tsx` |
| 40 | A Folha não trata o teclado do celular (`visualViewport`), o arrastar não tem velocidade (mais de 80 px fecha, 80 exatos não), a rolagem dela não passa para a página | Folha do celular | Abrir uma Folha, o teclado, arrastar | prova da 8c |

**Textos que ficam fora do dicionário de propósito** (não são texto que a pessoa leia na tela, ou pertencem à F81): as mensagens de `Error` que não chegam à tela, os nomes e as descrições das receitas e das estratégias de ordem (`algorithms/`, `ranking/`), `models/recipeSources.js` (a frase que a Blend mostra dentro do aviso de fonte faltando), e os textos de `services/` e `models/` que o contador não vê. **Português proposto nesta onda: 64 frases em `public/js/i18n/pt/notices.js`, à espera da sua revisão.**

## 6. O que nenhum agente provou, e é seu para tentar na prévia

Nenhuma prova de agente tocou: um **iPhone de verdade**, o **Safari de verdade**, o **Apple Music e o Spotify de verdade**, os **dados de uma conta de verdade** e o **português no app** (só o teste o leu). Os roteiros usam o WebKit do Playwright com perfil de iPhone, um MusicKit de mentira que anota as chamadas e dados de mentira.

**Correção do integrador (2026-11-23):** os relatórios dos juízes da 8a e da 8c estão em `reports/audits/`, e a lista que vale para o seu teste é a do juiz final (8 passos, seção «O que só o dono pode provar» de `reports/audits/2026-11-22-mjrpalbumblender-v0-react-final-visual-parity-recheck.md`). As duas listas abaixo foram escritas pelo construtor e ficam como complemento.

**Apple Music, uma exportação de verdade** (na prévia, com a sua conta; nada disto foi tocado por agente):
1. Em Playlists guardadas, abra uma playlist e use «Exportar» → Apple Music, **com uma pasta nova** (digite um nome): confira, no app Música, a pasta e a playlist com as faixas.
2. Repita **escolhendo uma pasta que já existe** na lista que a janela mostra.
3. Repita **sem pasta** (o topo da biblioteca).
4. Exporte o **lote inteiro** (todas as playlists de uma vez) pela tela de playlists guardadas e pela tela de edição; confira os avisos do fim (o que foi criado, o que não foi e por quê).
5. Aperte «Exportar» uma segunda vez enquanto uma exportação roda: deve avisar que já está rodando e **não criar nada duplicado**.
6. Feche a janela do MusicKit sem autorizar: deve avisar a falha, sem travar a janela.
(O Spotify você não usa; se quiser, conecte e exporte uma playlist.)

**iPhone de verdade, os gestos da Folha** (a Folha é o motor de mais risco: toque, foco, arrastar):
1. Em cada tela com Folha (Create, Albums, Inventário, Playlists, Playlists guardadas, Blend, o menu): abra e feche pelo **«fechar»**, **tocando fora** e **arrastando para baixo** (mais de 80 pixels fecha).
2. Com o **teclado na tela** aberto num campo dentro de uma Folha: o campo continua visível e a Folha cabe.
3. **Gire o aparelho** (retrato e paisagem) com uma Folha aberta; a Folha não deve ficar presa nem cortada pela área segura.
4. Role o conteúdo da Folha até o fim e **puxe além** da borda: a página de trás não deve rolar nem pular.
5. Abra uma pergunta de dentro de uma Folha (Menu → «Disconnect Spotify», apagar uma playlist, limpar o cache): hoje a pergunta fica **por baixo** da Folha (defeito mantido, item 39 da tabela).
6. Em todas as telas: nenhum painel de erro e o botão de voltar do Safari volta à tela anterior.

## 7. O que esta onda provou no navegador

Dois sites construídos (o do pai desta onda, `66cb1ee`, e o da ponta), servidos por um servidor próprio que responde rota funda, com o Firebase e todo hospedeiro de fora bloqueados, comparados nos roteiros das ondas anteriores **sem mudá-los**, cada um com o pai contra o pai como controle de ruído (`reports/evidence/F83/wave-8d/proof.md`, `summary.json`):

- **Todas as telas** (varredura de 187 conferências no Chromium 1280; 106 no WebKit iPhone 14 e SE; o fluxo da Blend; os saltos de página): no Chromium, **0 diferença, 0 pixel**. No WebKit, as únicas diferenças são de pixel dentro da marca de fogo do topo (o mesmo número aparece do pai contra o pai e da ponta contra ela mesma): ruído do WebKit, já visto pelo juiz da junta 4; a estrutura, as caixas, o foco e o texto passam.
- **Os avisos, as perguntas e a barra de carga** (onda 8b): 237 e 264 conferências, **0 falha**, inclusive a linha do tempo de cada aviso, janela e barra.
- **Todas as Folhas** (onda 8c): 1.247 conferências no Chromium 899 sem falha; no WebKit iPhone 14 e SE duas conferências de tempo falharam por poucos milissegundos e **não voltaram** em quatro repetições.
- **A exportação ao Apple Music no site construído** (a gravação de 264 chamadas ao MusicKit, a mesma do pai): **106 conferências sem falha no Chromium; no WebKit o pai e a ponta dão o mesmo resultado** (uma linha do próprio roteiro que não acha a loja, nos dois). `exportMusicKitRecording.json`: byte a byte igual.
- **O título da aba nas 18 rotas** (as telas, os desvios e uma rota que não existe), nos dois motores: **nenhuma diferença**.
- **Um achado que não é desta onda e que vale olhar antes de você exportar:** nos roteiros da janela de exportar, **o pai e a ponta** soltam um erro de página («`removeChild`: o nó não é filho deste nó») em toda execução do Apple Music. Não achei a origem (pode ser o roteiro ou a linha do React desde a onda 8a). A gravação das chamadas não é tocada por ele. Está na lista «a olhar» abaixo.

## 8. O que você decide ou carimba, nesta ordem

1. **Use a prévia com a sua conta**, tela por tela (a lista da seção 6 ajuda). É a parte que nenhum agente faz.
2. **Aceite a ADR-0023** (React com TypeScript no site): `docs/decisions/0023-site-screens-in-react-screen-by-screen.md`, hoje «Proposed». O carimbo é um commit seu. **Eu não a aceitei.** Ela diz: o site usa React com TypeScript, tela a tela, sobre o Vite e o roteador que já existem, sem mexer no que fica debaixo das telas.
3. **Aceite a emenda da constituição** (`docs/specs/constitution.md`, v2.0.0 → a emenda da proposta § 9.1). **Eu não a toquei.** Ela diz três coisas: (a) o site pode usar React e `.ts`/`.tsx` em `screens/`, `ui/`, `shell/` e `react-bridge/` (Proibições, art. II, Tipagem); (b) o art. I.2 «a interface fala inglês» passa a «o código fala inglês, todo texto visível vem do dicionário»; (c) no art. III.1 a palavra «view» passa a incluir a tela em React. Depois dela, `tech-stack.md` e a constituição deixam de dizer «durante a migração» (a parte do `tech-stack.md` já está pronta).
4. **Leia e aprove (ou troque) as 64 frases em português** de `public/js/i18n/pt/notices.js`, e as das ondas 4 a 7 que o agente propôs; a chave da F81 decide quando o português abre ao público.
5. **Diga «publica».** É a **primeira publicação da linha do React em produção**, com todas as ondas juntas.

## 9. O que a publicação final tem de verificar, e como voltar atrás

**Antes:** anote o id da versão anterior do Hosting; ensaie a volta na prévia.

1. `npm run deploy:site`: confere os tipos, o teto de peso e um só `react-vendor`.
2. Uma aba aberta na versão antiga se recupera sozinha ao pedir uma tela que mudou de arquivo; sem rede, uma tela ainda não baixada diz «No connection» e «Try again» funciona sem recarregar.
3. Cada rota abre a 1280 no Chromium e no WebKit com iPhone 14 e SE, **no site publicado**: `/start`, `/albums`, `/albums/:id`, `/inventory`, `/blend` (e `?seriesId=`), `/playlists`, `/playlists/edit`, `/saved-playlists`, `/artists`, `/genres`, `/tracks`, e os desvios (`/home`, `/album-series`, `/series`, `/playlist-series`, `/callback`).
4. A conta: entrar, sair, a home com conta levando ao app; o inventário lido na entrada.
5. O Apple Music: o botão da moldura, a busca da Create pelo catálogo e **uma exportação de verdade** (seção 6).
6. O Spotify: conectar e voltar por `/callback`.
7. O português fechado em produção (a chave da F81), salvo decisão sua.
8. O peso e o tempo da primeira tela medidos **no site publicado**, no perfil lento da onda 3, contra a produção de antes.
9. Nenhum painel de erro durante a passada; **e o erro de página «`removeChild`» da janela de exportar (seção 7): abra o console do navegador ao exportar e diga se aparece**; se a medição de uso estiver ligada, `screen_error` em zero no primeiro dia (hoje ela está desligada: o único sinal é o painel que você vê).

**Voltar atrás:** pelo mesmo caminho de sempre, a versão anterior do Hosting (o id anotado). Uma aba aberta que pediu um arquivo da versão nova se recupera sozinha ao carregar de novo. A publicação do React é **uma só**: não há meia-volta por tela.
