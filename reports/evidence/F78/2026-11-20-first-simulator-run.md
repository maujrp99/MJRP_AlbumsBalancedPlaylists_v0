# F78 — o app no simulador do iPhone pela primeira vez

**Data:** 2026-11-20, 16:26 a 17:40 (Brasília) · **Ramo:** `feat/f78-first-simulator-run` · **Quem rodou:** agente, nesta máquina

## Resumo

O app (`app/`) roda no simulador do iPhone, em modo de demonstração. O autoteste do núcleo, rodado
dentro do app, no motor Hermes do próprio app, com o JavaScript empacotado pelo Metro, deu
**3343 de 3343 iguais**, nenhum id fora do formato v4, nenhum repetido. O gerador de ids é o do
expo-crypto (o Hermes não tem `crypto` global; o único gerador ligado é o do app).

Não provado aqui: o Firebase de verdade e o entrar com Apple e Google, um iPhone de verdade, o
Android, o desempenho (ver o fim).

## O que rodou, com as versões

| Peça | Versão |
|---|---|
| Xcode | 27.2 (27B52), SDK do simulador iOS 27.2 |
| Simulador | «iPhone 17 Pro», runtime iOS 26.5 (23F77). O runtime 27.2 ainda baixava; não foi esperado |
| Node, npm | 26.11.1, 11.20.0 |
| Expo, React Native | SDK 58 (`expo` 58.0.26), React Native 0.88.1, Nova Arquitetura, Hermes |
| expo-crypto | 58.0.8 (o módulo nativo `ExpoCrypto` no `Podfile.lock`; `CryptoModule` registrado no `ExpoModulesProvider.swift` gerado) |
| CocoaPods | 1.17.0, instalado por Homebrew (com o Ruby 4.0.10 de que ele depende) |
| Watchman | não instalado: o Metro rodou sem ele |

Build: `Debug`, para o simulador, sem assinatura (`CODE_SIGNING_ALLOWED=NO`), com o `xcodebuild` no
projeto gerado: `BUILD SUCCEEDED` em 5 min 36 s (frio). 109 pods. Nenhum erro; 705 avisos de
compilação, todos dos pods (não lidos um a um).

## O autoteste: a contagem e a evidência em texto

Aberto pelo argumento de lançamento `-demoRoute "/diagnostics?run=1"` (ver «Contornos», 5), que
roda o autoteste sem toque. A tela mostra o resultado (captura `05-self-test-result.png`) e escreve
duas linhas no console, que chegam ao log do simulador e ao terminal do Metro. Cópia fiel em
`2026-11-20-first-simulator-run/selftest-log.txt`; as duas linhas da última execução (processo 17166):

```
[golden-self-test] 3343 of 3343 match; passed: true; different: 0; missing: 0; extra: 0; ids made: 24943; not v4: 0; repeated: 0; 81138 ms
[golden-self-test] engine: Hermes; crypto global: undefined; id sample: 2a887498-42c9-445f-9451-38b63ae73ac3; v4: true
```

Lidas assim: os 3343 casos do corpo dourado (todas as receitas, as estratégias de ranking, os
modelos e as duas regras de identidade) deram, no Hermes do app, a mesma linha que o Node gravou na
referência (`reference/cases.tsv`, pelo sha256 de cada linha); nenhum caso diferente, faltando ou a
mais. As regras fizeram 24943 ids, todos v4, nenhum repetido. O motor é o Hermes (tem o
`HermesInternal`); não há `crypto` global; logo o id vem da única fonte ligada, o `randomUUID` do
expo-crypto (`app/src/platform/wiring.ts`).

Rodou quatro vezes (79 a 84 s), sempre 3343 de 3343. Uma linha intermediária diz `v4: false`: veio de um
recarregamento a quente enquanto o padrão de v4 da linha nova tinha um erro de digitação (o quarto
grupo com 5 caracteres); o id da linha é um v4 válido. Corrigido o padrão e relançado o app, `v4: true`.

**Nenhum caso diferente: não há o que listar.**

## As capturas (`2026-11-20-first-simulator-run/`)

| Arquivo | O que mostra | O que se vê |
|---|---|---|
| `01-sign-in.png` | Entrar, no primeiro lançamento | Os dois botões laranja, a nota «Demo mode». Área segura certa em cima; a barra de cima baixa, o título à esquerda |
| `02-albums.png` | Albums, depois de entrar | «3 series · newest first», três séries com contagem; capas no lugar-reserva (♪): as séries de exemplo não têm capa, de propósito (`demoSeed.ts`). A barra de abas acima do indicador de início, Albums em laranja |
| `03-blend-not-in-the-app-yet.png` | A aba Blend (as quatro usam o mesmo componente) | «Not in the app yet» e a frase; Blend em laranja na barra |
| `04-self-test-running.png` | O autoteste rodando | O botão apagado com «Running…»; a folha (sheet) sobre Albums |
| `05-self-test-result.png` | O autoteste pronto | «3343 of 3343 match», ids, diferenças, 81138 ms |
| `06-final-albums.png` | O estado em que o simulador ficou | Albums, aberto por `-demoSignIn apple`, com o app instalado pelo `npm run app:ios:demo` |
| `90-openurl-asks-to-open.png` | `xcrun simctl openurl` com `albumblender://…` | O iOS pergunta «Abrir com "Album Blender"?»: sem toque, ninguém responde (ver «Contornos», 5) |
| `91-first-launch-warning-toast.png` | O primeiro lançamento, antes do conserto | O aviso amarelo do modo de desenvolvimento cobrindo a barra de abas («Open debugger to view warnings») |
| `92-self-test-sheet-before-fix.png` | O autoteste antes do conserto | Uma faixa vazia de ~59 pt acima de «Self-test» |

## O que estava errado, e o que foi consertado

Consertado (barato e claramente defeito):

1. **Aviso no lançamento** (`91-…`): o Expo Router 58 declara obsoleto `unstable_settings.initialRouteName`. Trocado por `anchor: 'albums'`; o roteador então pediu `backBehavior="initialRoute"` nas abas (o voltar do Android vai para Albums). Os dois avisos sumiram.
2. **A barra do autoteste com a faixa vazia** (`92-…`): o `TopBar` somava a área segura de cima também dentro da folha, que no iOS já começa abaixo da barra de estado. `TopBar` ganhou `inSheet`; o autoteste usa no iOS (`05-…`).
3. **Outro aviso do modo de desenvolvimento** cobrindo a barra de abas ao trocar de aba: «Sending `onAnimatedValueUpdate` with no listeners registered», do próprio React Native, não do app. Silenciado só ele (`LogBox.ignoreLogs`, em `app/src/app/_layout.tsx`, com o motivo); o LogBox não existe no build de produção.

Visto e não consertado (fica listado):

- **Contraste:** texto branco sobre o laranja dos botões principais fica perto de 3:1 — passa só para texto grande e em negrito, que é o caso (17 px, 700), sem folga. É decisão do `design-system.md`, não deste trabalho.
- **«Sign in with Apple»** é um botão laranja do app. A Apple pede o botão dela (o `AppleAuthenticationButton` / o do pacote) na revisão da loja. A rodada de desenho (TASK-18) decide.
- **Ícones das abas** são caracteres Unicode (⌂ ◫ ◎ ≡ ▤), finos e de tamanhos diferentes; esperado: o conjunto de ícones é da TASK-18.
- **Fonte:** a do sistema (SF Pro), não a Syne do site; esperado até a TASK-18.
- **O autoteste trava a tela por ~81 s** no build `Debug` (é síncrono, de propósito, com «Running…» pintado antes). Num build de produção será menos (bytecode Hermes, sem o modo de desenvolvimento); não medido. Se continuar longo no iPhone, quebrar em partes.
- **Capas:** nenhuma imagem de capa foi vista carregando, porque as séries de exemplo não têm capa.

## Os contornos, cada um com o motivo

1. **`xcode-select` aponta para as Command Line Tools**, não para o Xcode (o pedido dizia o contrário). Mudar isso pede `sudo` e é configuração do sistema: não foi feito. Cada comando usa `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`, que vale só para aquele processo; `scripts/app-ios-demo.sh` faz isso sozinho quando precisa. Consequência: a ferramenta de controle do simulador do Claude Code recusou anexar (exige o `xcode-select` no Xcode); ninguém tocou na tela — tudo por argumentos de lançamento e capturas do `simctl`. Para o MJRP, se quiser: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
2. **Os pacotes nativos do Firebase, do Google e da Apple ficam fora do build de demonstração**, sem arquivo de credencial falso. O mesmo interruptor do JavaScript, `EXPO_PUBLIC_DATA_MODE` (`firebase` = o build com Firebase; qualquer outro valor = demonstração), decide também o nativo, em três lugares: `app/app.config.js` tira os config plugins (sem `FirebaseApp.configure()` no AppDelegate, sem `GoogleService-Info.plist`, sem o URL scheme do Google) e o direito do Sign in with Apple (pede time pago); `app/react-native.config.js` desliga o autolink da metade React Native dos cinco pacotes; e, porque o Google Sign-In traz também um adaptador Expo (`ExpoAdapterGoogleSignIn`, que puxava os pods GoogleSignIn, AppAuth, GTMAppAuth), que o autolink do Expo não lê do `react-native.config.js`, o `app.config.js` põe a lista no `use_expo_modules!({ exclude: [...] })` do Podfile gerado. A lista mora num lugar só, `app/nativeBuild.js`. Conferido: nenhum pod Firebase, Google ou da Apple; o `ExpoModulesProvider.swift` só registra o `CryptoModule`. O JavaScript desses pacotes continua no pacote do Metro (o `require` preguiçoso do `composition.ts` só roda no modo Firebase), e o `firebaseStore.ts` continua o único arquivo que importa o Firestore nativo.
3. **`npx expo run:ios` ficou parado** mais de 3 minutos em `xcrun devicectl --version` (procura aparelhos físicos) antes de construir qualquer coisa. Trocado pelo que ele faria, só para o simulador: `xcodebuild` no `.xcworkspace` gerado, `simctl install`, `simctl launch`, e o Metro à parte (`npx expo start`). É o que `npm run app:ios:demo` faz.
4. **CocoaPods recusa terminal sem UTF-8:** `LANG=en_US.UTF-8` e `LC_ALL=en_US.UTF-8` no processo (o script põe).
5. **Os links `albumblender://…` pelo `simctl openurl` param numa pergunta do iOS** («Abrir com…», `90-…`) que só um toque responde. Para rodar sem toque: argumentos de lançamento, que o iOS guarda nas preferências do app e o `Settings` do React Native lê — `-demoSignIn apple` (entra com a conta falsa) e `-demoRoute /blend` (abre a rota). Só no modo de demonstração (`app/src/demo/demoLaunch.tsx`, com teste). Ficaram também, para quem toca ou para o Maestro: `albumblender://sign-in?as=apple` (só demonstração) e `albumblender://diagnostics?run=1` (roda o autoteste ao abrir). As rotas das abas já tinham link pelo Expo Router (`albumblender://blend`).
6. **O alvo mínimo** gerado é iOS 16.4; o SDK 27.2 constrói para o simulador 26.5 sem ajuste. O temido desencontro entre SDK e simulador não aconteceu.
7. **O `expo start` reescreve o `app/tsconfig.json`** (tira `expo-env.d.ts` do `include` e reformata). Revertido a cada vez; não entra no commit. Fica para decidir se o `include` deve mudar.

8. **O `expo prebuild` do SDK 58 apaga `ios/` por padrão** (`clean: !args['--no-clean']` no `@expo/cli`), e com a pasta vão os pods e o cache do build: a segunda execução do script refez tudo, e uma terceira falhou no meio do apagar (`ENOTEMPTY` em `ios/build/Build/Products`). O script passa `--no-clean` quando o projeto já é de demonstração (a marca `app/ios/.album-blender-build`) e `--clean` só quando falta ou é de outro build. Na mesma conferência saiu um erro de bash do script (`«$DEVICE»`: os bytes do `»` colados ao nome da variável), corrigido para `${DEVICE}`.

**O `npm run app:ios:demo`, até onde foi conferido.** Primeira execução (17:09 a 17:16): gerou `app/ios`, instalou os pods, construiu, instalou e abriu o app no simulador; depois de abrir, parou no erro de bash do `«$DEVICE»` (corrigido) e levou o Metro junto. Segunda: parou no `ENOTEMPTY` do item 8 (corrigido com `--no-clean`). Terceira, do zero: gerou e instalou os pods e foi parada no meio da compilação, por regra nova do orquestrador da máquina (carga 190 em 15 núcleos, a compilação nativa como maior consumidora: um trabalho pesado por vez, pela fila `machine_load.py`, compilação com menos paralelismo e prioridade baixa). O script passou a compilar com `nice -n 10` e `-jobs 4` (`APP_IOS_BUILD_JOBS` muda). **Não conferido de ponta a ponta:** o caminho `--no-clean` e o script inteiro depois dos dois consertos, numa execução só; o app que ficou no simulador é o da primeira execução, e `app/ios/` ficou gerado com a compilação pela metade (a próxima execução continua dela).

**`app/ios/` não é commitado** (geração nativa contínua, como o Expo recomenda para projeto gerenciado com config plugins): já estava no `app/.gitignore` (`/ios`, `/android`), e com ele o `ios/build` e os `Pods`. O `app.config.js` e o `react-native.config.js` são a fonte; `npx expo prebuild --platform ios` refaz a pasta.

## O que se instalou nesta máquina

- `brew install cocoapods` → CocoaPods 1.17.0 e as dependências do Homebrew (Ruby 4.0.10, openssl@4 e o que mais a fórmula pediu). Sem `sudo`.
- Nada mais: Watchman não foi preciso; nenhuma configuração do sistema mudou; o `xcode-select` ficou como estava.
- Caches criados pelo uso: os do CocoaPods (`~/Library/Caches/CocoaPods`) e o estado do simulador «iPhone 17 Pro».

## O que o simulador ainda não prova

- **O Firebase e o entrar de verdade:** a store do React Native Firebase, o Firebase Auth, Sign in with Apple, Google Sign-In — pedem a conta de desenvolvedor da Apple, o app iOS registrado no Firebase e o seu `GoogleService-Info.plist`, e o id de cliente do Google. O build com Firebase (`EXPO_PUBLIC_DATA_MODE=firebase`) nem foi gerado. Nenhum agente entrou no projeto Firebase de produção.
- **Um iPhone de verdade** (TASK-28, TASK-09, TASK-12): assinatura, aparelho, Apple Music.
- **O Android:** não há Android SDK nesta máquina; o `bundle:android` só prova o empacotamento.
- **O desempenho:** os 81 s são de um build `Debug` num simulador num Mac; nada diz do iPhone 15 Pro nem de um Android de entrada (S5).
- **O build de produção (`Release`)** com o bytecode Hermes embutido não foi construído nem rodado aqui; o S1 da linha de comando já tinha rodado o bytecode no Hermes de mesa.
- **A medição (PostHog)** e a guarda local («Saved earlier», «No connection») — esta ainda nem existe no app.
