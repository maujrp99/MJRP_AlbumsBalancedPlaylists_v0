# F70 — defeitos pequenos achados no caminho: prova (2026-11-19 22:15)

Código: `main` em `88adbc4`. Testes: 2155 passando em 177 arquivos; build ok. Site publicado (pacote `main-DDeTiHbR.js`).

| Issue | Onde foi provado | Resultado |
|---|---|---|
| UAT-208 visitante pede rota paga | produção, como visitante, busca de «Orbital» na Home | 12 álbuns de estúdio, 11 EPs, 29 singles; nenhum pedido a `/api/ai/…`; a linha de estado mostrou só «Scanning…» e «→ Orbital», nunca «confirming album types…» |
| UAT-63 capa sem substituto | app local com a conta do MJRP | um erro de carga simulado numa capa da tela de álbuns trocou a imagem pelo substituto, uma vez só (um segundo erro não muda nada); 5 capas na série, 23 no inventário e 144 nas playlists guardadas passam pelo mesmo desenho de capa |
| UAT-209 preço do inventário sem moeda | só por teste (`test/services/inventory/InventoryService.price.test.js`, com o repositório de verdade sobre o banco de mentira) | o defeito existia no código, mas nenhuma tela chama esse caminho hoje; a janela de edição manda preço e moeda juntos |
| UAT-210 falha das notas num álbum achado pela IA | só por teste (`test/api/generateRatingsOutcome.test.js`, com o cliente, o adaptador, o enriquecedor e o serviço de carga de verdade) | para `failed` o app já perguntava de novo: o defeito era teórico. O defeito real era o contrário: uma página sem nenhuma nota chegava com o endereço e o app marcava as notas como prontas; agora ele pergunta |

## Não visto

- Um visitante abrindo uma série com um álbum que o catálogo não tem (não deve haver pedido a `/api/generate`).
- A aparência do substituto de capa numa capa quebrada de verdade.
- UAT-209 e UAT-210 no navegador (a primeira não tem caminho de tela; a segunda pede uma busca paga com a fonte de notas fora do ar).

## Mudança de comportamento para o MJRP julgar

Quatro substitutos de capa diferentes (nota musical no inventário, «?» na pilha, disco na janela do álbum, gradiente na cascata) viraram um só: um quadro escuro com um disco.
