# F83 onda 4: o placar de pixels da tela Start, com os controles

Roteiro: `browser-proof.mjs`, uma antiga (a árvore antes da onda, `c343830`, porta 5020) contra a nova (porta 5021), a 1280 (mouse) e a 393 (toque), com cliques, teclas e toques de verdade; o catálogo e a gravação da série pelas costuras do sensor visual (nada pedido ao Apple Music, nada gravado); **o Firebase Auth e o Firestore foram bloqueados** (pedidos a `identitytoolkit`, `securetoken`, `firestore.googleapis` e `firebaseinstallations` abortados antes de a página carregar, nas duas árvores): nenhuma conta anônima foi criada em produção, e a página é um visitante. Em cada passo se compara o `#app` e a folha (HTML normalizado, os blocos `hidden` só pelos atributos), onde está o foco e a captura de tela.

| Corrida | Conferências | O HTML e o foco | Capturas com diferença |
|---|---|---|---|
| nova contra antiga, sem transições | 172 (142 passaram) | **todos iguais** | 30 |
| nova contra antiga, com transições | 172 (141 passaram) | **todos iguais** | 31 |
| **controle:** antiga contra antiga, sem transições | 172 (154 passaram) | todos iguais | 18 |
| **controle:** antiga contra antiga, com transições | 172 (163 passaram) | todos iguais | 9 (uma de 233.642 pixels: a busca com o equalizador em movimento) |

O que as diferenças são:

1. **De 24.045 a 26.874 pixels em 3 passos por tamanho** (a digitação com teclas de verdade, o filtro, «outra série»): a faixa do topo à direita, `x 806–1266, y 16–78` (computador) e `x 16–376, y 56–133` (celular), é a moldura, não o `#app`. **Aparece igual na antiga contra a antiga** (24.045, 26.650, 26.874): ruído da moldura, que a onda 3 já tinha achado.
2. **Pequenas: 2 a 60 pixels, a maior diferença por canal 19 de 255** (computador: cantos arredondados e bordas de letra dos cartões de capa, `y 194–395`; celular: uma letra, `x 35–46, y 93–104`). Na antiga contra a antiga, sem transições, o ruído é de 3 a 7 pixels; na nova contra a antiga vai até 60. **Não foi explicado por inteiro**: o HTML e as classes saem iguais (o teste de unidade compara letra a letra) e a causa mais provável é a composição do texto e das bordas, mas isto é uma conjectura. Uma causa achada e corrigida na onda: a dica e a linha do visitante escritas em vários nós de texto davam 136 pixels de diferença na linha da dica; escritas em um nó só, como na antiga, deram 0 (o Chromium compõe as pontas diferente).
3. **Uma diferença de propósito**, afirmada no próprio roteiro: depois de fechar a folha do celular com um Undo ainda valendo, a antiga mostrava 0 faixas de Undo e a nova mostra 1.

O tempo até o palco aparecer (servidor de desenvolvimento, três cargas cada): antiga 426, 454, 470 ms; nova 445, 464, 463 ms.
