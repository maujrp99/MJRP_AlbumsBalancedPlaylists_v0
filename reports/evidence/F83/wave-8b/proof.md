# F83 onda 8b: a prova dos motores de aviso, barra de carga, pergunta e janela

Ramo `claude/f83-wave-8b-window-engines` (a partir de `claude/f83-wave-8a-exports`, f4eae56). O pai da comparação é o f4eae56, construído em um worktree solto. O dourado dos motores à mão foi capturado **antes** de tocá-los (f897501).

## 1. O que cada motor virou

| Motor à mão | Decisão | Onde está agora |
|---|---|---|
| `components/Toast.js` (os avisos) | **reescrito** | `stores/toasts.js` (a API `toast.success/error/warning/info(texto, ms)` e `showToast`, a lista e os relógios, sem React: controladores e serviços a chamam) + `shell/Toasts.tsx` (a moldura os desenha em `#toast-container`) |
| `components/GlobalProgress.js` (a barra) | **reescrito** | `stores/progress.js` + `shell/GlobalProgress.tsx` (o mesmo `#globalProgress`, as mesmas classes) |
| `components/ui/BaseModal.js` (a casca da janela) | **reescrito** | `ui/ModalShell.tsx` (já existia desde a 5b; ganhou `sheet`); `useModalWindow` passou a usá-lo |
| `ConfirmModal.js`, `InputModal.js`, `services/DialogService.js` | **reescritos** | `ui/dialogs/` (`dialogs.ts`: `dialogService.confirm/prompt/alert/dismiss`; `ConfirmWindow.tsx`; `InputWindow.tsx`) sobre `ui/windowLayer.tsx`; a janela de descartar da classificação (`RankWindow`) usa `ConfirmWindow` |
| `components/ui/windowsHoldThePage.js` | **mudou de lugar, com um gancho** | `shell/windowsHoldThePage.ts` (`holdPageBehindWindows`, `giveBackAStrayHold` e `usePageHold`) |
| `components/ui/coverImage.js` | **mudou de lugar** (sem desenho) | `ui/coverStandIn.ts` (o endereço do substituto e `watchCovers`); a imagem é `ui/CoverImage.tsx`; a função `coverImage()` à mão saiu |
| `signInFromLink.js`, `startRoute.js` | **mudaram de lugar** (sem desenho) | `utils/` |
| `utils/pageScrollLock.js` | **MANTIDO** | utilitário de página, não desenho: escreve o estilo do `body` (a contagem de trancas da lição 15), o React não tem equivalente, e a Folha (8c) e a moldura o partilham; sai da lista com a nota, e `handMadeScreensOnlyShrink` deixa de vigiá-lo na 8d |

`ui/` não importa loja: `AddWindow`, `EditWindow` e o seletor de álbuns (`pickerController`) recebem `notify`/`warn` de quem os abre (`ui/notify.ts` é só o tipo). Arquivos criados: `stores/toasts.js`, `stores/progress.js`, `shell/Toasts.tsx`, `shell/GlobalProgress.tsx`, `shell/windowsHoldThePage.ts` (movido), `ui/dialogs/{dialogs.ts,ConfirmWindow.tsx,InputWindow.tsx}`, `ui/coverStandIn.ts`, `ui/notify.ts`. Apagados (`git rm`): `Toast.js`, `GlobalProgress.js`, `BaseModal.js`, `ConfirmModal.js`, `InputModal.js`, `DialogService.js`, `coverImage.js`. Os arquivos à mão da lista foram de 15 para 5 (`Icons.js`, `Sheet.js`, `SafeDOM.js`, `pageScrollLock.js`, `BaseView.js`; 633 linhas).

## 2. O método: o dourado primeiro, e o teste que não é cego

- `test/support/engineScenarios.js` + `engineWorld.js`: **33 cenários** (13 de avisos, 4 de barra, 16 de perguntas) e a forma do casco em **30 tamanhos**, com tempo falso (`setTimeout`, `requestAnimationFrame`), toques, teclas e o foco; cada passo escreve `document.body` inteiro (elementos, atributos, o valor dos campos, o elemento com foco, cada nó de texto como está escrito), o foco e o que quem perguntou recebeu. Os avisos: cada tipo a 0, 16, 3.999, 4.000, 4.299 e 4.300 ms; duração própria; duração zero; vários empilhados; o botão de fechar (e duas vezes); o texto que é texto; a caixa que fica vazia. As perguntas: cada variante, o fundo e o painel (nada), Escape, o ✕, Cancelar, uma no lugar de outra, `alert`, o campo (foco um quadro depois, validação, Enter, texto só de espaços).
- Capturado de `Toast.js`, `GlobalProgress.js`, `DialogService.js` e `BaseModal` na ponta f4eae56 (`test/fixtures/enginesBeforeF83.json` 90 KB e `windowShellBeforeF83.json`): duas capturas seguidas saíram **idênticas**. `reports/evidence/F83/wave-8b/capture-before.test.js` é o registro (não roda).
- O teste falhou primeiro (o módulo novo não existia) e passou: `test/ui/engines.sameAsBefore.test.tsx`, 40 casos, sem diferença; e **3 casos provam que a conferência vê** uma palavra, uma classe e **1 ms** postos de propósito. Mais `test/stores/toasts.test.js` (8: a API, os relógios, a barra) e `test/ui/dialogs.test.tsx` (3: o campo, achado da prova no WebKit, abaixo).
- Os testes levados: `windowsHoldThePage` (8, agora `test/shell/`), `coverImage` (agora `test/ui/coverStandIn.test.js`, os mesmos casos, a imagem agora pela peça de React), `signInFromLink` (5) e `startRoute` (7) em `test/utils/`, `DialogService.dismiss` (4, agora `test/ui/dialogs.dismiss.test.js`), `ModalShell` (a comparação com a casca à mão virou o retrato de 30 tamanhos; ficam o botão de fechar, o fundo e `sheet`). Os `vi.mock` de `Toast.js`, `DialogService.js` e `GlobalProgress.js` em ~110 arquivos só mudaram de caminho; **o dourado `exportMusicKitRecording.json` está byte a byte igual** (`git diff` vazio; o teste de gravação, 30 casos, verde; só a linha do `vi.mock` do aviso mudou de caminho).

## 3. No navegador, sites construídos e servidores de desenvolvimento, o pai (f4eae56) contra este ramo

`browser-proof.mjs` (`run-all.sh`, `summarize.py`, `compact.py`, `merge.py`): Firebase (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`) e todo outro host bloqueados; nenhuma chave lida ou escrita. As telas que abrem aviso, pergunta ou barra, pelo toque ou pelo mouse conforme o perfil:

- **Construídos:** a carga (o aviso «Authentication issue» do login bloqueado, na hora da carga), o Start (Buscar sem texto três vezes: três avisos empilhados), `/callback` (o aviso de falha do Spotify), a tela de álbuns (remover um álbum: a pergunta; o fundo e o painel; Escape; o ✕; Cancelar; Remover e o aviso que vem), o inventário (apagar um item), as playlists guardadas (apagar um lote), as playlists (gerar de novo sem série: aviso; no celular, apagar uma playlist pela folha: a pergunta), a moldura (desconectar o Spotify: a pergunta, Escape, o aviso «Disconnected»), a janela de entrar (o aviso da falha) e a barra num câmbio de tela lento (os arquivos da tela chegando 1,6 s atrasados).
- **Servidores de desenvolvimento das duas árvores, o motor chamado pela própria página** (cenários `direct*`; os módulos são os mesmos que o app usa, então o aviso chamado é desenhado pela moldura e a pergunta é posta como uma tela a põe): cada tipo de aviso, empilhados, o botão de fechar, `showToast` com cada argumento, duração zero, texto que é texto; a barra (dois carregadores, os 200 ms, `forceHide`); `confirm` (o fundo e o painel, Escape, ✕, Cancelar, Confirmar), `prompt` (o campo, o foco, os espaços, Enter, Escape, Salvar), `alert` e uma pergunta no lugar de outra. **A pergunta de texto não é alcançável pelo app** (ver os defeitos): só aqui ela se prova no navegador.
- **Perfis:** Chromium 1280, 900 e 899 (a faixa do celular, sem toque); WebKit 1280, iPhone 14 e iPhone SE (as duas com toque). **Controle pai contra pai** (o mesmo código nos dois lados) no Chromium 1280, no WebKit 1280 e no iPhone 14, construído e em desenvolvimento (e o 899 nas telas de celular).
- Depois de cada passo, nos dois lados: o que a página diz em cada camada (avisos, barra, janelas, folhas: elementos, atributos, nós de texto e a caixa de cada elemento), o foco, a trava da página (o estilo do `body`, a marca e a rolagem), a figura (os pixels abaixo da barra do topo; a barra do topo tem um equalizador que se mexe sozinho e é contada à parte), os erros da página e a **linha do tempo**: quando cada aviso veio, entrou, saiu e saiu da página, quando a barra apareceu e sumiu, quando uma janela veio e foi, quando a página foi presa e solta, onde o foco foi; cada hora medida **a partir da causa** (um aviso que vem, do toque que o fez; o que entra e sai, do seu próprio vir, ou do toque no seu botão; o resto, do último toque).
- **Total: 4.177 conferências passadas e 43 não, em 48 arquivos** (`raw/*.json.gz`, 31 de «pai contra este ramo» e 17 de controle). **Do pai contra este ramo: 2.593 passadas e 24 não; do controle (pai contra pai): 1.584 passadas e 19 não.** **Tempos: 2.101 eventos medidos, 2.096 dentro de um quadro (20 ms: 16,7 ms mais o que a página sabe dizer dele), o pior 24 ms; no controle 1.402 de 1.402, o pior 18,4 ms.** Os avisos de cada tipo entram, saem e somem nos mesmos instantes (o pior de um aviso: 12,4 ms), na mesma ordem e empilhados do mesmo jeito; cada pergunta responde o mesmo (`confirm`: falso, falso, falso, verdadeiro; `prompt`: «   Rock classics», nulo, «Jazz»; `alert`: nada; a primeira no lugar da segunda: falso e nulo); a janela não ganha foco ao abrir, o campo o ganha um quadro depois, e nada o devolve ao fechar (nos dois); a página fica presa enquanto uma pergunta está aberta no celular e volta ao mesmo lugar.

### As 24 conferências que não passaram do pai contra este ramo: todas explicadas

| Quantas | O que é | Por quê |
|---|---|---|
| 9 | pixels (até 4/255 e 6.649 pixels) na região de um equalizador ou de um degradê da página: Chromium 1280 inventário (2), WebKit 1280 álbuns (5) e o fim de duas perguntas no WebKit 1280 (2) | **o controle (pai contra pai) mostra as mesmas regiões** (inventário `x 64-75, y 386-402` e `x 653-659`; álbuns `x 945-1215, y 165-214`; perguntas `x 906-1010, y 289-336`); dois pixels 1/255 contra 2/255 num preto de degradê |
| 6 | a ordem de duas escritas quando **uma pergunta toma o lugar de outra** (uma por perfil de desenvolvimento) | a diferença de propósito 3 (abaixo); o controle passa |
| 4 | a barra mostra ou some 21 a 24 ms depois (uma figura de 20 ms de tolerância): Chromium 1280, WebKit 1280 e iPhone 14 em desenvolvimento e a barra no iPhone 14 | um quadro mais o que a página sabe dizer dele; o controle chega a 17 ms; a hora de sumir da barra é a da chegada do arquivo da tela, que balança |
| 3 | o aviso do login bloqueado chega tarde num dos lados (WebKit 1280 e SE em desenvolvimento, e a moldura no SE) e cai dentro de uma foto | **o controle tem o mesmo** (`webkit-1280-dev-control`, 13 conferências, todas ruído do mesmo tipo): o WebKit trata a segunda página aberta do navegador como página de fundo |
| 2 | a barra no WebKit 1280 (o pai não mostra, este ramo mostra) | **o controle (pai contra pai) tem o mesmo uma vez em 4**: a corrida com a descida dos arquivos das telas em segundo plano; isolada (uma página por vez, 4 vezes) a barra é igual nos dois (`barprobe`) |

**Diferenças sem explicação: nenhuma.**

### O que a prova achou (e foi consertado)

- **WebKit com iPhone 14, `prompt` com texto inicial:** a janela à mão deixava o texto **selecionado** ao focar o campo; a nova, com `defaultValue` do React, deixava o cursor no fim (9.246 pixels de diferença na figura; `figures/webkit-iphone14-prompt-with-a-name-before-the-fix-{parent,mine}.png`). Causa: o motor à mão escrevia o texto como o atributo `value` (valor «não sujo», que o WebKit seleciona); o React escreve a propriedade. Conserto (e57fa50): o campo escreve `value` e `autofocus` como atributos e ouve o evento nativo `input` (o `onChange` do React não ouviria um campo esvaziado de um texto inicial que ele nunca escreveu); `test/ui/dialogs.test.tsx` o prende. Depois do conserto, as figuras do mesmo passo ficaram iguais nos dois lados.
- Um defeito da primeira passada do roteiro, não do produto: no celular a pergunta de desconectar o Spotify fica **por baixo** da folha do menu (z-index 1000 contra 50) e o Escape é ouvido primeiro pela folha; o roteiro foi refeito para esse fluxo (igual nos dois lados).

## 4. As diferenças de propósito (nenhuma que a pessoa veja)

1. **O React desenha um microtask depois da chamada** (o motor à mão desenhava na hora): antes do quadro. O dourado tira a foto depois de soltar os microtasks. Medido no navegador: do toque ao aviso na página, 0,1 a 0,5 ms nos dois.
2. **`#globalProgress` está no fim do `body` desde o começo da moldura** (o à mão o punha no começo do `body` ao importar o módulo): é fixo e escondido; os testes que contam filhos do `body` o ignoram (como `AlbumWindow.leave` já fazia).
3. **Uma pergunta no lugar de outra põe a nova antes de a velha sair** (a velha sai no microtask seguinte, no mesmo quadro): a ordem de duas escritas na mesma tarefa. Efeito: a página presa **não é solta e presa de novo** entre as duas (a à mão soltava e prendia, com um `scrollTo` no meio); sem efeito visível.
4. **`showToast` devolve o id do aviso** (devolvia o elemento; ninguém lia) e **`dialogService.activeModal` é o cabo da janela** (era o elemento).
5. **`useModalWindow` troca a janela aberta** (a à mão empilhava uma segunda casca de mesmo id; só se abre de um toque, com a primeira cobrindo a tela).
6. **A barra, com `start()` e `forceHide()` na mesma tarefa**, não escreve o `display` que não mudou (a à mão escrevia três vezes).
7. **Uma pergunta que a tela deixou continua** (como a à mão): `showWindow(..., { staysWhenTheScreenIsLeft })`; as janelas de uma tela ainda saem com ela.

## 5. Os defeitos mantidos (a migração não conserta; cada um é candidata a issue)

- O botão de fechar do aviso pede o nome por `arialabel` (nenhum navegador o lê): o botão fica sem nome. Os ícones do aviso levam `strokeLinecap`, `strokeLinejoin` e `strokeWidth` escritos assim, que um svg ignora: linha fina de ponta reta.
- O aviso «info» pede `bg-surface-dark/95`, que não existe: no computador fica sem fundo (D3 do `design-system.md`; no celular o CSS lhe dá um).
- A saída do aviso dura 300 ms e **ignora o «reduzir movimento»**; 4 s para qualquer texto, sem pausar com o ponteiro em cima, sem limite de avisos, sem `role="status"`.
- As perguntas: sem prender o Tab, sem foco ao abrir (o campo o ganha um quadro depois) nem ao fechar, sem `aria-labelledby`; o fundo não fecha; no celular a pergunta de uma folha fica por baixo dela.
- `alert` deixa um botão vazio onde estaria «Cancel» (nenhuma tela o chama).
- `prompt` ignora `defaultValue`, que `albumActions` passa (lê `initialValue`): o campo começa vazio.
- **A pergunta de texto não é alcançável pelo app:** a «remoção à mão» de um álbum só a abre se o erro tiver «Could not find album query in series», que `SeriesService.removeAlbumFromSeries` nunca lança (lança `Could not find album "X" in series`).
- A pergunta de apagar uma série só vem depois de contar as playlists guardadas dela: com o banco recusando a pessoa recebe o aviso «could not count» e nunca a pergunta.
- O aviso «Authentication issue» da carga é escrito como literal em `app.js` (os textos de `app.js` entram na 8d).

## 6. O que a prova não cobre

- A pergunta de texto no site construído (nenhuma tela a abre): provada no jsdom (16 cenários) e chamando o motor direto nos servidores de desenvolvimento.
- O aviso com ação: o motor de avisos não tem ação; a faixa «Undo» da classificação é de outro motor (`rank-toast` de `useAlbumWindows`), fora desta fatia.
- A pergunta «descartar mudanças» da janela de classificar (`ConfirmWindow`): só no jsdom (`RankWindow` e os dourados de 5b); mudar a ordem arrastando uma linha não se faz com o mouse sintético do roteiro.
- Apagar uma série (esbarra no banco recusado) e «sair com mudanças não salvas» (usa a caixa do navegador, `window.confirm`, não os motores desta onda).
- A rodada de valores do inventário e as exportações ao Apple Music: avisos e perguntas da 6b e da 8a, provados por elas; aqui só se provou o motor.
- Um iPhone de verdade: só o WebKit com perfil de iPhone 14 e SE (a janela de entrar com uma conta de verdade, nem tocada: o login está bloqueado).
- O português: só as 4 chaves novas dos botões da pergunta (abaixo), lidas por quem as propôs.

## 7. Totais (a ponta do ramo, pela fila da máquina)

- Suíte inteira: **381 arquivos, 5.076 testes passados (1 pulado)**, contra 378 e 5.031 do pai; inclui `test/security/noSecretsInRepo.test.js` e a gravação do MusicKit. `test/architecture` + `test/security` + `test/services/musickit`: 52 arquivos, 442 testes, verdes.
- `tsc` limpo. `eslint`: **0 erros e 67 avisos (os mesmos do pai)**.
- Build dentro de `scripts/bundle-budget.json`: script principal 195.460 B → **195.608 B (+148 B**: os três motores em React na moldura e as 4 chaves do inglês) com o teto de 195.860 B a **196.010 B (402 B de folga)**; o que vem depois da primeira tela 236.792 B → **235.445 B (−1.347 B)**; `background` 59.300 B → **58.100 B** (necessidade 57.616 B, 484 B de folga); `reactVendor` 68.691 B sem mudança; a primeira tela (o principal mais a maior tela) 289.388 B → 289.557 B. Só os números foram mudados no arquivo; o texto da regra, intocado.
- Placar da migração: 5 arquivos à mão (era 15 no começo da onda), 633 linhas, 1 invólucro em `react-bridge/legacy/`, 31 textos fora do dicionário (26 à mão).

## 8. Os textos em português propostos (à espera da revisão do MJRP)

`ui.dialog.confirm` «Confirmar», `ui.dialog.cancel` «Cancelar», `ui.dialog.save` «Salvar», `ui.dialog.ok` «OK» (os botões das perguntas quando quem pergunta não dá o texto). Os avisos têm o texto de quem os chama (cada tela, no seu dicionário).

## 9. Para a 8c e a 8d

- **8c (a Folha):** `useSheetWindow`/`Sheet.js` seguem à mão; a Folha tem `z-index: 1000` e a pergunta (`app-modal`) `z-50`: no celular uma pergunta aberta de dentro de uma folha fica **por baixo** dela, e o Escape é ouvido primeiro pela folha. Se a 8c reescreve o motor, o roteiro do `shell` (`browser-proof.mjs`) já descreve esse fluxo nos dois lados. O `windowsHoldThePage` (agora `shell/`) lê `.sheet:not(.sheet--closing)`; o `pageScrollLock` fica.
- **8d (o fecho):** `SafeDOM`, `Icons.js` e `BaseView.js` saem com o último uso; `pageScrollLock` entra na lista de exceções do sensor final **com o motivo escrito**; `app.js` ainda escreve «Authentication issue» e «Connected to Spotify!» como literais (vão ao dicionário); o `design-system.md` ganhou as linhas dos motores novos e o `arch.md`/`behavior.md` os caminhos; `Blend`: os testes da Blend (`test/screens/blend/*`) mudaram o caminho do `vi.mock` do aviso (a branch `claude/f83-wave-7b-fix-scroll-and-weight` pode tocar as mesmas linhas: o conflito é só o caminho).
