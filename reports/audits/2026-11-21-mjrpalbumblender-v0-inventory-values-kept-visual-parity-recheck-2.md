---
type: ux-audit
subject: "Segunda reconferência pré-merge do ramo feat/f75-inventory-values-kept-in-the-database: as respostas aos cinco achados da primeira (a data sempre à vista, a data inteira no celular, os textos do menor preço, a leitura inválida e a gravação recusada, a atribuição na constituição)"
project: mjrpalbumblender-v0
features: [F75]
moment: delivery
date: "2026-11-21 23:55"
judged: "2026-11-21 23:55"
judged_commit: 2885efb
who_judged: separate-agent
verdict: fail
p0: 0
p1: 1
p2: 3
duration_s: 1800
status: open
---

# Segunda reconferência — os valores do inventário guardados no banco

**Veredito: não passa (`fail`), sem P0; 1 P1 e 3 P2.** Quatro das cinco respostas estão certas:
- a data se vê em todo valor guardado;
- no celular ela nunca se parte;
- uma leitura inválida não derruba o lote;
- uma gravação recusada é avisada, e o valor continua na tela durante a visita.

Os dados não regrediram. O que reprova é o cartão do computador a 1280 e 1440 com a moeda em reais. A data agora toma o espaço da linha, e o cartão diz «CD · Disc… · 18 Nov» nos dois tipos de leitura. O nome do Discogs fica cortado, e a sugestão não se distingue do menor preço sem passar o mouse. Num laptop com tela de toque isso não dá. O dono é brasileiro, então os reais são a moeda provável dele.

## Como foi feito
- **Quem julgou:** o mesmo agente juiz (Opus) da primeira passada. Ele não construiu o ramo.
- **Objeto:** `2885efb`, extraído com `git archive` para a pasta de rascunho. O controle foi a base `394c8e0`, como antes. Nada foi escrito no repositório.
- **Testes, pela fila:** a suíte inteira deu 4039 testes em 315 arquivos, verdes.
- **Os dados de novo:** o roteiro da primeira passada (`drive-re.mjs`) rodou contra `2885efb`, e todos os resultados se repetiram (`captures-2/results-re.json`):
  - «Read them now» leu 2 e gravou 2;
  - a guarda de seis horas valeu: 4 leituras na rodada e 0 no segundo aperto;
  - «Stop» gravou só o álbum já lido;
  - com o Discogs fora do ar, 0 escritas, e o valor guardado ficou;
  - o lote recusado foi gravado na rodada seguinte, sem pergunta nova ao Discogs;
  - a edição durante a rodada guardou os dois, o valor escrito e a leitura;
  - na troca de pessoa, 0 escritas e a tela vazia;
  - a aba antiga manteve o campo.
- **A costura** é a mesma da primeira passada (componentes, serviços e repositório reais; Firebase vazio; Firestore em memória; as chamadas de valor simuladas). Há dois modos novos: uma leitura com o id de edição inválido, e uma leitura de menor preço.
- **Navegadores:**
  - Chromium do Playwright 1.56.1 no Vite de desenvolvimento, a 1440, 1280, 1024 e 900 no computador e a 393 e 320 no celular;
  - WebKit 26.0 com o perfil iPhone 15 Pro sobre a costura compilada (`vite build`), a 393 e 320.
  - Zero pedidos para fora de 127.0.0.1. Os servidores foram fechados no fim.

## O que foi conferido
1. **A data no cartão, nos dois tipos** (`results2.json` → `cards`):
   - **A data em si:** «· 18 Nov» vem numa peça que não encolhe. Aparece em toda largura e moeda, nos dois tipos.
   - **O que encolhe** é o começo da linha:

     | Largura | Moeda | Largura do texto antes da data | Linha de sugestão | Linha de menor preço |
     |---|---|---|---|---|
     | 1440 e 1280 | USD | 87 px de 157 px | «CD · Discogs · 18 Nov» | «CD · Discogs … · 18 Nov» |
     | 1440 e 1280 | BRL | 61 a 69 px | «CD · Disc… · 18 Nov» | «CD · Disc… · 18 Nov» (a mesma) |
     | 1024 | USD e BRL | — | — | «lowest f…» |
     | 900 | — | — | — | inteira: «CD · Discogs · lowest for sale · 18 Nov» |

   - **A janela:** «Read on 18 Nov 2026, 11:05.», nos dois tipos.
   - **A faixa dos totais** diz «Discogs values are lowest asking prices for now.», o que salva o caso de hoje, em que todo valor é de menor preço. Não salva o caso misturado.
   - Capturas: `cards-strip.png`, `card-hejira-1280-*.png`, `card-*-900-*.png`.
2. **O celular:** «Discogs · 18 Nov», com espaço não separável. A data fica numa linha só em todas as linhas, a 393 e 320, no Chromium e no WebKit compilado, sem rolagem lateral (`phone-wk-393.png`, `phone-wk-320.png`).
3. **Os textos novos, tal como aparecem** (a seção de achados traz a correção de cada um):
   - **Janela, menor preço:** «The lowest price this CD was for sale at on Discogs when it was read. It is an asking price, not what the disc usually sells for.» Está correto, mas é pesado: «for sale at on Discogs».
   - **`title` do cartão de menor preço:** «Lowest price this CD edition was for sale at on Discogs when it was read. Read on 18 Nov 2026, 11:05.» Diz duas vezes quando foi lido.
   - **Aviso da rodada:** «Values read for 2 of 2 albums. 2 readings could not be saved to your inventory: they show in this browser for now.» «Readings» é palavra de dentro do código: a tela diz «values». «For now» não diz quanto tempo (seis horas) nem o que fazer.
   - **Aviso de um álbum:** «The value was read but could not be saved to your inventory. It shows in this browser for now.» Tem o mesmo vago «for now».
4. **A leitura inválida e a gravação recusada:**
   - **Uma leitura inválida no lote:** o «In the Land of Grey and Pink» foi pulado e o «Selling England by the Pound» foi gravado. O aviso diz «1 reading could not be saved…», e o valor pulado continua na tela (`run-invalid.png`).
   - **A gravação recusada:** na rodada, 0 escritas e «2 readings could not be saved…». Num álbum só, «The value was read but could not be saved…». Nos dois casos o banco fica como estava e o valor novo continua na tela (`run-refused.png`, `single-refused.png`).
5. **A constituição VI.1 e o REQ-16** batem com a tela:
   - o link «Discogs» no cartão e o aviso da faixa no computador;
   - a janela;
   - «Data provided by Discogs.» no topo do celular, e na folha.
   - **Exceção:** o link «Discogs» do cartão aparece como «Disc…» em reais a 1280 e 1440 (P1-1).

## Achados
- **P1-1 · Em reais, a 1280 e 1440, o cartão diz «CD · Disc… · 18 Nov» para a sugestão e para o menor preço.**
  - **O problema:** a peça da data (`shrink-0`) tira espaço do começo da linha. O nome da fonte (a atribuição no cartão) fica cortado, e o tipo da leitura some. Em dólares, o menor preço vira «CD · Discogs … · 18 Nov». Só a 900 o texto cabe inteiro.
  - **A faixa dos totais** não distingue os cartões quando há dos dois tipos: por exemplo, depois que a pessoa preenche as configurações de vendedor e antes de reler tudo, ou depois de uma rodada parada.
  - **Âncora:** `public/js/views/renderers/InventoryCardValue.js:108`.
  - **Evidência:** `cards-strip.png`; `results2.json` → `cards.1280-BRL`, `cards.1440-BRL`.
  - **A mudança:** a origem em duas linhas («CD · Discogs · 18 Nov» e, embaixo, «lowest for sale»), ou o tipo num marcador curto que nunca encolhe («lowest»). Mede-se em reais a 1280.
- **P2-1 · Os textos do menor preço, pesados e repetidos.**
  - **Âncora:** `public/js/components/InventoryValueSection.js:102`; `public/js/models/inventoryValue.js:333`.
  - **A mudança:**
    - janela: «The lowest price this CD was listed at on Discogs when it was read. It is an asking price, not what the disc usually sells for.»
    - `title`: «Lowest asking price for this CD edition on Discogs, read on 18 Nov 2026, 11:05.»
- **P2-2 · Os avisos de valor não gravado dizem «readings» e «for now».**
  - **Âncora:** `public/js/models/inventoryValueRun.js:216`; `public/js/controllers/InventoryValues.js:288`.
  - **A mudança:**
    - rodada: «2 values could not be saved to your inventory. This browser keeps them for six hours; Update values tries to save them again.»
    - um álbum: «The value was read but not saved to your inventory. This browser keeps it for six hours; Update values tries to save it again.»
  - Isso é verdade no código: `readingsToKeep` grava, no começo de «Update values», o que só o navegador tem.
- **P2-3 · A folha «⋯» do celular chama o menor preço de média** (de antes do ramo; agora o valor fica dias na tela).
  - **O problema:** para um valor de menor preço à venda (Hejira, ≈ $12.93), a folha diz «Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition.»
  - **Âncora:** `public/js/views/InventoryPhoneSheets.js:80`, igual na base `394c8e0`.
  - **Evidência:** `phone-wk-393-sheet.png`; `results2.json` → `phoneWk393.sheet`.
  - **A mudança:** usar `DISCOGS_LOWEST_TITLE` quando `value.basis` é o menor preço, como faz o cartão.

## Não visto
- **Uma conta, o Firestore e o Discogs de verdade:** a leitura inválida foi provocada pelo dublê (um id de edição que não é número), não por uma resposta real.
- **Um iPhone de verdade e um laptop com tela de toque:** o argumento do «sem passar o mouse» vem de ler o código, não de um aparelho.
- **O app pelo próprio `app.html`.**
