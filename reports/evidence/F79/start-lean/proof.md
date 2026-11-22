# F79 · Start enxuta no celular (UAT-281) — prova no site construído

**Como:** `vite build` do ramo e de `main` (c333385), cada um servido por `vite preview`; Chrome headless por DevTools. Firebase bloqueado (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`); a conta é um stand-in de teste escrito no navegador; a busca de artista é um exemplo (capas fictícias); nenhuma senha digitada. O aviso laranja «Authentication issue» nas capturas sem conta vem desse bloqueio, não da tela.

**Celular, 393 × 852 e 375 × 667, com e sem conta** (`phone-facts.json` guarda as medidas de cada estado): primeira visita, digitando, resultados, álbuns escolhidos, colar lista, não encontrado, «What is a series?» aberta. Medido em todos: título 26 px; sem rolagem lateral (`scrollWidth` = largura); passos escondidos; barra só com álbuns escolhidos; aviso de visitante só com álbuns escolhidos (sem conta); sob o campo só «or paste a list» / «Search an artist instead» e nada em «não encontrado»; campo «An artist»; nenhum alvo visível abaixo de 44 px (o único menor é o × do aviso de Firebase bloqueado, que é um toast).

**Computador, 1280 × 800** (`desktop-1280-main-vs-lean.png`, main à esquerda, ramo à direita): primeira visita, resultados, escolhidos, colar, não encontrado. Diferença de pixels contra `main`: só a fila de barras do topo (animada) e, em duas capturas, o aviso de Firebase bloqueado que aparece em tempos diferentes; a tela Start é idêntica.

**Arquivos:** `phone-393-states-a.png`, `phone-states-b.png`, `desktop-1280-main-vs-lean.png`, `phone-facts.json`.

**Não provado:** iPhone de verdade (Safari, teclado, áreas seguras); catálogo real; arrastar a folha de baixo.
