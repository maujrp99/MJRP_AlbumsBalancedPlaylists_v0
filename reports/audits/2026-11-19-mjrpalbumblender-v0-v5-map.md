---
type: backlog-map
subject: "Mapa da v5.0: cada achado dos relatórios anteriores e de 2026-11-19, por tema, com a feature que o resolve"
project: mjrpalbumblender-v0
written: "2026-11-19 15:05"
who_wrote: o agente implementador, a partir do cruzamento feito por um agente separado
asked_by: MJRP
---

# Mapa da v5.0: cada achado, a feature que o resolve

## Como ler

- **De onde vem:** as 153 linhas do cruzamento (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`), mais as issues abertas no `uat.md` que ele não listou.
- **Agrupado por tema**, na ordem em que o agente propõe atacar. A ordem é do MJRP.
- **Coluna «Origem»:** os códigos das linhas nos relatórios anteriores (TD = levantamento de dívida; CR e OP = as duas críticas; A a M = apêndices), para achar o texto original.
- **Coluna «Estado»:** a issue do `uat.md`, quando há; «sem issue própria» quer dizer que o item está coberto pela issue-guarda-chuva da feature ou só por este mapa.
- **Limite:** a tradução e a atribuição de cada item a uma feature são do agente e não foram julgadas por ninguém. Os itens vindos dos relatórios não foram reconferidos um a um em 2026-11-19, salvo onde o relatório do cruzamento diz.

## Resumo

| Tema | Itens em aberto | Features |
|---|---|---|
| 1. Segurança | 11 | F59 |
| 2. Perda de dado | 10 | F60 |
| 3. Carga e identidade do álbum | 33 | F49, F52, F55, F56, F58, F61 |
| 4. Blend, playlists e exportação | 16 | F62 |
| 5. Home, busca e navegação | 20 | F54, F57, F63 |
| 6. Publicação e automação | 9 | F64 |
| 7. Inventário | 5 | F54, F63 |
| 8. Limpeza | 13 | F65 |
| Consertado na v4.0 | 33 | F45 a F48, F50, F51, F53 |
| Não vale mais | 3 | — |
| **Total** | **153** | |

## Features da v5.0 e quantos itens cada uma resolve

| Feature | Nome | Itens |
|---|---|---|
| F59 | Fechar o que está aberto | 11 |
| F60 | Nada do que foi salvo se perde | 10 |
| F64 | Um caminho só, testado, para produção | 9 |
| F52 | O servidor diz a verdade: erros, raspador, cache | 12 |
| F55 | Os álbuns pedidos, ou um aviso | 12 |
| F56 | Blend e edição pelo serviço de carga | 8 |
| F61 | Playlists guardadas em poucos segundos | 1 |
| F57 | Uma peça só para escolher álbuns | 5 |
| F58 | Limite de complexidade e regras como teste | 2 |
| F49 | Carregar mais álbuns | 1 |
| F62 | Blend e exportação fazem o que dizem | 16 |
| F63 | Home e navegação que respondem | 16 |
| F65 | Tirar o que nada usa | 13 |
| F54 | Fecho da v4.0 (v4.0) | 5 |

## 1. Segurança

| # | Item | Feature | Estado | Origem |
|---|---|---|---|---|
| 1.1 | O repositório não publica as regras do banco | F59 | sem issue própria | F44 |
| 1.2 | `rawStage` pode derrubar o processo do servidor | F59 | sem issue própria | G A-20 |
| 1.3 | Chave de IA no endereço; token da Apple entregue a quem não manda origem; o servidor busca endereços dados pelo modelo | F59 | sem issue própria | G A-19b, G-N14, G A-21 |
| 1.4 | Conferência de `state` do Spotify desligada; verificador gerado com `Math.random` | F59 | sem issue própria | A-16b, D40, E1, E2 |
| 1.5 | Texto inserido como HTML sem tratamento | F59 | sem issue própria | A-09d, A-09e, A-16c, C18, D23, E23d, AB-N08 |
| 1.6 | O build de produção publica os mapas do código-fonte | F59 | sem issue própria | HIJ-N7 |
| 1.7 | Regras do banco abertas | F59 | UAT-15 | B-37, E17, F22, F42, G FS-a, J09, CD-N4 |
| 1.8 | Servidor público, rotas de depuração, IA paga aberta a qualquer um | F59 | UAT-16 | G A-06, A-06b, A-06c, A-07, A-07b, A-23, A-24b, G-N7, J08, AB-N07, EF-N6, HIJ-N1, E14 |
| 1.9 | Token do Discogs em dois scripts | F59 | UAT-17 | H06, K-1 |
| 1.10 | Tokens do Spotify no navegador, mantidos depois de sair | F59 | UAT-28 | E30 and UAT-28 |
| 1.11 | CSP fraca; Tailwind de uma CDN em tempo de execução | F59 | UAT-25 | A-16a, I01, I02 |

## 2. Perda de dado

| # | Item | Feature | Estado | Origem |
|---|---|---|---|---|
| 2.1 | Salvar a edição de um lote apaga antes de gravar (UAT-196) | F60 | issue aberta em 2026-11-19 | D1, F12 |
| 2.2 | Todo salvamento de playlist regrava a série a partir da memória | F60 | sem issue própria | D11 |
| 2.3 | Um salvamento pode cair em outra série (UAT-197) | F60 | issue aberta em 2026-11-19 | D13 |
| 2.4 | Salvar pode rodar duas vezes; o estado do botão fica velho (UAT-197) | F60 | issue aberta em 2026-11-19 | CD-N7, D14 |
| 2.5 | Sem aviso de alteração não salva (UAT-197) | F60 | issue aberta em 2026-11-19 | D16 |
| 2.6 | Apagar uma série deixa as playlists órfãs (UAT-197) | F60 | issue aberta em 2026-11-19 | D46, F14 |
| 2.7 | Ao sair da conta, o inventário fica na tela e é copiado para a conta anônima seguinte (UAT-198) | F60 | issue aberta em 2026-11-19 | F7, E19b, EF-N2 |
| 2.8 | Lotes de mesmo nome se fundem; contexto perdido pelo rodapé; `%` no nome; lote sem nome; apagar sem confirmação | F60 | sem issue própria | D2, D3, D35, CD-N1, CD-N3, CD-N8, J06, D12, D47 |
| 2.9 | Playlists geradas somem ao recarregar | F60 | UAT-05 | D7, UAT-05 |
| 2.10 | Dados de visitante não migram ao entrar | F60 | UAT-12 | B-25, E19, F17, H22, L H-11, L H-12 |

## 3. Carga e identidade do álbum

| # | Item | Feature | Estado | Origem |
|---|---|---|---|---|
| 3.1 | «Load N more albums» não faz nada | F49 | UAT-06 | B-34 |
| 3.2 | A medição de base foi feita com o Spotify desligado; a meta de 20 s não tem base | F52 | sem issue própria | CR P2 measure |
| 3.3 | Álbum com endereço de notas e zero notas casadas fica como «pronto» | F52 | sem issue própria | G-N2 |
| 3.4 | Spotify: token vencido, 401 e 429 viram «sem dado» | F52 | sem issue própria | E3, E5, E6, E7 |
| 3.5 | Limite de 100 kB no corpo do pedido, e o app manda objetos de faixa inteiros | F52 | sem issue própria | G H-12 |
| 3.6 | Lista de álbuns por IA: 200 e vazio em qualquer erro, sem prazo | F52 | sem issue própria | B-22, G A-24, G R11-a |
| 3.7 | Raspador e mapeamento: títulos perdidos, notas em texto, linhas com zero votos, notas que colidem | F52 | sem issue própria | G B-03, B-04, B-05, B-09, A-12, 3.3.5, G-N3, G-N13 |
| 3.8 | Sem cache, sem intervalo, 30 s por pedido, sem tratar 429 | F52 | sem issue própria | G B-10, 8.5-d, T-sp |
| 3.9 | A etapa de Spotify do servidor sempre falha (importação que falta) | F52 | sem issue própria | E12, G A-01, EF-N7 |
| 3.10 | A rota de notas exige a chave de IA que não usa; `/generate` sem tratamento de erro | F52 | sem issue própria | G A-10, R5-a |
| 3.11 | O servidor responde 200 e vazio quando o raspador falha | F52 | UAT-23 | CR P0-1, OP P2-4, G 8.5-a, 8.5-b, G-N11 |
| 3.12 | O teto de 4 notas por vez não é o teto do servidor; a crítica pedia começar em 2 e medir | F52 | contradição com a análise | CR-08 (CR P1-4, §15.8) |
| 3.13 | O raspador aceita o álbum errado ou perde o certo | F52 (regra de identidade: F55) | sem issue própria | G B-01, B-02, B-06, B-07, 8.5-c, A-13, G-N4, G-N5 |
| 3.14 | Cinco definições de «mesmo álbum» e cinco funções de normalizar chave | F55 | sem issue própria | TD-R1, C34 |
| 3.15 | Álbum posto numa série por título aproximado | F55 | sem issue própria | TD-R9 |
| 3.16 | Adicionar e remover álbum usam regras diferentes; o plano B do remover testa um texto que nunca aparece | F55 | sem issue própria | TD-R10, B-27 |
| 3.17 | A loja da Apple é tirada do segundo pedaço do idioma do navegador (`zh-Hans-CN` dá `hans`) | F55 | sem issue própria | E25d |
| 3.18 | A capa local cai no primeiro resultado da busca | F55 | sem issue própria | B-50 |
| 3.19 | Identificador que não é da Apple tratado como se fosse | F55 | sem issue própria | C16, D44 |
| 3.20 | Três normalizações de título que discordam | F55 | sem issue própria | G A-18a, A-18b, A-18c, N-04, N-05, C17, G-N12, E29 |
| 3.21 | Segunda fonte por IA: álbum inventado, origem perdida, raspagem em dobro, corte nunca detectado | F55 | sem issue própria | G A-29, N-02, N-03, A-28, A-03, A-08, A-09, A-11, A-22, H-08, A-19a, A-19c |
| 3.22 | «Não bate» não é separado de «não achei» | F55 | UAT-184 | OP P1-4c |
| 3.23 | O catálogo nunca usa a loja da conta (a ADR-0019 dizia que sim; corrigida) | F55 | contradição com a análise | E25c |
| 3.24 | A grade inteira é redesenhada a cada aviso da loja | F56 | sem issue própria | TD-H6b |
| 3.25 | Quem monta playlist precisa receber só álbuns prontos | F56 | sem issue própria | CR-05 (CR P1-2, §15.10) |
| 3.26 | «Refetch» e a injeção de álbuns buscam notas fora da fila, sem limite | F56 | sem issue própria | B-29, B-30, OP P0-3 item 6 |
| 3.27 | Fila do Spotify em segundo plano: outra chave de cache, pula pedidos em forma de objeto, só começa depois de um login novo | F56 | sem issue própria | E8, E27, E31, E33 |
| 3.28 | «Enrich Data» na janela do álbum não fica gravado | F56 | sem issue própria | J04 |
| 3.29 | Blend e edição de playlists carregam com laço próprio, por texto, caindo na IA paga a qualquer erro da Apple | F56 | UAT-189 | TD §5.1-15, E42, OP P1-4b |
| 3.30 | Editar uma série recarrega mais do que mudou | F56 | UAT-191 | CR P0-3b, B-55 |
| 3.31 | Duas listas para «quais álbuns uma série tem»: a prateleira ainda tem outros escritores | F56 | contradição com a análise | CR-04 (CR P1-1, OP P0-1) |
| 3.32 | Faltam regras de arquitetura como teste: uma função de chave só, ninguém escreve na prateleira fora do serviço, só o adaptador chama a rota de notas | F58 | sem issue própria | OP-05 (CR P1-8, OP P1-5) |
| 3.33 | O histórico lê as playlists de cada série uma depois da outra; a análise mandava a tela para o serviço de carga | F61 | contradição com a análise | D24 |

## 4. Blend, playlists e exportação

| # | Item | Feature | Estado | Origem |
|---|---|---|---|---|
| 4.1 | Possível corrida ao carregar o MusicKit; `isAuthorized` nunca é zerado | F62 | sem issue própria | E25a, E25b |
| 4.2 | «My Own Ranking» cai calado para a ordem de aclamação (UAT-200) | F62 | issue aberta em 2026-11-19 | CD-N6, C8 |
| 4.3 | «Blend your Albums» nunca fica desabilitado | F62 | sem issue própria | J02 |
| 4.4 | «By Artist then By Rank» não agrupa por artista (UAT-200) | F62 | issue aberta em 2026-11-19 | C6 |
| 4.5 | Defeitos dos algoritmos: desempate, embaralhar, número dos volumes, álbuns curtos, durações que faltam, sem teto, padrão escondido de 60 ou 48 minutos | F62 | sem issue própria | C5, C7, C12, C13, C14, C15, C29, C30, D28 |
| 4.6 | O painel de reconfigurar esquece a configuração (UAT-200) | F62 | issue aberta em 2026-11-19 | C10, CD-N2, D29 |
| 4.7 | Origem e «Your Rank» somem das faixas geradas | F62 | sem issue própria | C26, D17, D30 |
| 4.8 | Data em UTC nos nomes padrão | F62 | sem issue própria | C11, D25, B-44 |
| 4.9 | Exportar para o Spotify recusa token vencido, embora haja como renovar (UAT-200) | F62 | issue aberta em 2026-11-19 | D6 |
| 4.10 | Exportar para a Apple falha calado; o segundo clique exporta duas vezes (UAT-200) | F62 | issue aberta em 2026-11-19 | D20, EF-N4 |
| 4.11 | Discovery Mode não tem efeito | F62 | UAT-08 | C3 |
| 4.12 | Desfazer e refazer sem botão | F62 | UAT-02 | D8 |
| 4.13 | Título de playlist editado não é salvo; sem botão de apagar | F62 | UAT-03, UAT-04 | D18 |
| 4.14 | «Open in Spotify» morto no modo separado | F62 | UAT-09 | D37, E23a |
| 4.15 | «Editing: ...», «Batch Name» em dobro, caminho errado | F62 | UAT-190 | D4, D34, A-27 |
| 4.16 | Exportação e casamento de faixas: aceita o primeiro resultado, sem nova tentativa no 429, playlists vazias, ids guardados não reaproveitados | F62 (regra de identidade: F55) | sem issue própria | D5, D21, D38, D39, D41, D42, E23b, E23c, E23e, E23f, E25f, CD-N11, E9, E10, E11, E36 |

## 5. Home, busca e navegação

| # | Item | Feature | Estado | Origem |
|---|---|---|---|---|
| 5.1 | Versão e título da aba discordavam (título consertado na F54; o resto da UAT-192 na F63) | F54 e F63 | UAT-192 | A-20, I04 |
| 5.2 | O arquivo de busca de 8 MiB carrega quando o app abre | F57 | sem issue própria | I24 |
| 5.3 | Nenhum teste do funil de classificação | F57 | sem issue própria | B-19, B-58, L no-test (album-search) |
| 5.4 | Títulos em alfabeto não latino caem num grupo só; variantes nunca aparecem | F57 | sem issue própria | B-09, B-10 |
| 5.5 | Álbuns em «sem categoria» não podem ser removidos | F57 | sem issue própria | B-28 |
| 5.6 | Classificador: duas listas de «eletrônico», palavras por trecho, campos que a Apple pode não mandar | F57 | UAT-185 | B-13, B-14, B-15, B-17, B-21 |
| 5.7 | A imagem de capa reserva não existe | F63 | sem issue própria | I21 |
| 5.8 | Colar em lote quebra em todo hífen; uma linha ruim aborta o resto (UAT-201) | F63 | issue aberta em 2026-11-19 | B-05, B-06 |
| 5.9 | Ordenar só ordena os grupos; títulos iguais dividem posição; selo «OWNED» de saída; regra escondida para álbuns de «expansão» | F63 | sem issue própria | B-33, B-41, B-45, H26 |
| 5.10 | Rotas de redirecionamento pulam a montagem: a Home fica morta depois da volta do Spotify (UAT-201) | F63 | issue aberta em 2026-11-19 | A-01 |
| 5.11 | Botão voltar preso depois de criar uma série (UAT-201) | F63 | issue aberta em 2026-11-19 | AB-N04, A-22 |
| 5.12 | Destaque do menu velho; itens «Soon» navegam; «Playlists» do rodapé e do menu vão a lugares diferentes | F63 | sem issue própria | A-02, A-06, A-07, A-25, A-26 |
| 5.13 | Ícones que faltam, alertas nativos, estado só por cor, botões só com ícone, ícone da aba vazio (este último consertado na F54) | F63 | sem issue própria | A-15, B-02, B-03, B-04, B-26, A-33, H17, I05 |
| 5.14 | Esc fecha um diálogo e a ação fica pendurada | F63 | sem issue própria | H23 |
| 5.15 | `toast.warn` não existe | F63 | UAT-26 | AB-N06 |
| 5.16 | Telas de ranking só por endereço, misturando faixas | F63 | UAT-10 | A-13 |
| 5.17 | O menu da conta só abre com o mouse em cima | F63 | UAT-13 | A-19 |
| 5.18 | «Create Series» do histórico vazio não faz nada | F63 | UAT-27 | A-10a, D10 |
| 5.19 | `/blend?seriesId=` ignorado: a série de origem não vem escolhida | F63 | UAT-192 (and UAT-07) | A-08, C9 |
| 5.20 | Tela de migração inalcançável; `/save-all` carrega um segundo Firebase de uma CDN | F63 (UAT-11) e F58 (UAT-14) | UAT-11, UAT-14 | A-05, F16, EF-N3, CD-N5, HIJ-N4, A-12a |

## 6. Publicação e automação

| # | Item | Feature | Estado | Origem |
|---|---|---|---|---|
| 6.1 | Segredos do Spotify do servidor ausentes da publicação | F64 | sem issue própria | E13, H13, G H-13 |
| 6.2 | O build automático não tem a chave do Spotify; a variável faltava no `.env.example` (esta parte consertada na F50) | F64 | sem issue própria | EF-N1, E46 |
| 6.3 | A publicação automática sairia sem imagens e sem dados | F64 | sem issue própria | I22, HIJ-N8 |
| 6.4 | A automação do GitHub nunca rodou um job | F64 | sem issue própria | H43, H44, L H-14, KLM-N3, HIJ-N3 |
| 6.5 | O CORS do servidor recusa o app em outros endereços | F64 | sem issue própria | G-N6 |
| 6.6 | Queda calada para uma configuração de Firebase de mentira | F64 | sem issue própria | A-29, E16, H19 |
| 6.7 | `firebase-config.js` ignorado e versionado ao mesmo tempo | F64 | sem issue própria | E15, H07, G-N10 |
| 6.8 | Duas receitas de imagem do servidor; Node 18 | F64 | UAT-22 | G A-15, H51, HIJ-N2, G-N9 |
| 6.9 | A verificação de código nunca reprova o build | F64 | UAT-20 | H40 |

## 7. Inventário

| # | Item | Feature | Estado | Origem |
|---|---|---|---|---|
| 7.1 | Depois de consertar o apagar, readicionar o álbum diz «já está no inventário» por até 7 dias | F54 | sem issue própria | F2 |
| 7.2 | A tela de inventário visitada continua desenhando por cima das outras | F54 | sem issue própria | A-11a, AB-N02 |
| 7.3 | Duração da faixa lida na unidade errada | F54 (v4.0) | UAT-188 | B-46 |
| 7.4 | Apagar do inventário chama um método que não existe | F54 (v4.0) | UAT-01 | F1, AB-N01 |
| 7.5 | Lê o inventário inteiro duas vezes a cada adição; ordenação sem efeito; nasce «Not Owned»; erros não mostrados; dois avisos; filtros que faltam | F63 | sem issue própria | F3, F4, F5, F6, F8, F19, F20, F21, F23 to F27, F29, F30, F41 |

## 8. Limpeza

| # | Item | Feature | Estado | Origem |
|---|---|---|---|---|
| 8.1 | Observador de visibilidade que só dispara uma vez | F65 | sem issue própria | TD-H7, M16 |
| 8.2 | Validade do cache decidida em cinco lugares; funções de versão e limpeza mortas; chaves que nunca são gravadas | F65 | sem issue própria | TD-R3, R7, F13, F34 |
| 8.3 | Janela de 7 dias do cache antigo no navegador | F65 | sem issue própria | TD-M5 |
| 8.4 | Texto do manual diferente do código (levantamento de dívida, §1.1) | F65 | sem issue própria | TD-M7, M8, M12, M13, M14 and the other manual rows |
| 8.5 | Motor de curadoria do servidor e `/api/playlists`: ninguém chama | F65 | sem issue própria | G R6 to R15, A-30b, A-31, R6-pl, G-N8, C32 |
| 8.6 | Testes que não conferem nada; dublê global órfão | F65 | sem issue própria | L H-9, H-10, H-13, H52 |
| 8.7 | Partes ainda sem nenhum teste | F65 | sem issue própria | L no-test (SeriesGridRenderer, cascade algorithm, real repositories, loaders, `api/client.js`) |
| 8.8 | Os roteiros de navegador estão velhos e não rodam | F65 | sem issue própria | M E-1 to E-13, H32 to H36, H45 |
| 8.9 | CSS: classes sem definição, `@apply` descartado, regras duplicadas, sem cabeçalho de cache | F65 | sem issue própria | I06 to I11, I14, I16, I17, I18, I28, I29, I30 |
| 8.10 | Ouvintes que vazam, importações circulares, globais e logs de depuração, dois `AuthService`, tipos de data misturados | F65 | sem issue própria | A-03, A-04, A-17, A-18, A-31, E18, E21, E26, B-56, F9, F38, HIJ-N5, HIJ-N6 |
| 8.11 | Código e arquivos mortos (cerca de 130 itens dos relatórios) | F65 | sem issue própria | A-09c, A-09f, A-14a to A-14h, A-23, B-01, B-16, B-18, B-24, B-32, B-43, B-47, B-48, B-51, AB-N09, C1, C2, C4, C19, C21, C24, C25, C27, C28, C31, D9, D19, D26, D27, D45, D50, CD-N9, CD-N10, E11c, E20, E24, E25e, E34, E35, E40, E44, F10, F18, F31, F32, F35, F40, G A-02, A-04, A-05, A-17, MK-b, H09, H18, H20, H21, H27 to H31, H39, H50, I12, I13, I15, I19, I20, I26, I27, J 1 to 10, J01, J03, J12, J13 |
| 8.12 | Manual e documentos diferentes do código (cerca de 120 itens; 22 arquivos do manual corrigidos em 2026-11-19) | F65 | sem issue própria | A-34, B-59, C35, D51, E §6, F §11, G MAN, H10 to H12, H15, H16, H46 to H49, J10, J11 |
| 8.13 | Testes do servidor e testes órfãos apontam para arquivos que não existem ou nunca rodam | F65 | UAT-21 | H04, H05, H37, H38, C22, G A-16, G A-30, G 10.4-b, 10.5 |

## Consertado na v4.0

| # | Item | Issue e feature | Origem |
|---|---|---|---|
| V4.1 | Fila única e sequencial, sem prazo | UAT-172 · F45 | TD-H1, M3, M4 |
| V4.2 | Um booleano só para carregando, filtrado e vazio | UAT-173 · F45, F46 | TD-H2, R12 |
| V4.3 | «Pronta» significava pelo menos um álbum | UAT-173 · F45 | TD-H3, R5 |
| V4.4 | Álbum que falha não deixava sinal | UAT-174 · F45 | TD-H4, M17 |
| V4.5 | Ordem de carga diferente da ordem de exibição | F45 | TD-H5, R11 |
| V4.6 | Inscrições que se acumulavam a cada visita | F46 | TD-H6a, B-31, OP P2-1 |
| V4.7 | O cache entregava o objeto vivo | F45, F48 | TD-H8, F33 |
| V4.8 | A carga antiga escrevia no contexto novo | F45 | TD-H9, M1, M2, KLM-N2 |
| V4.9 | Três cópias da divisão «Artista - Título» | F45, F46 | TD-R2 |
| V4.10 | «Clear Cache» limpava o lugar errado e a sessão do Spotify | UAT-177 · F48 | TD-R4, M10, AB-N05, A-24, F36 |
| V4.11 | O cache de ranking nunca funcionava | UAT-176 · F48 | TD-R6, M9, B-38, F11 |
| V4.12 | Lista de séries cortada em 20 | UAT-24 · F47 | TD-R8, M18, B-23, F37 |
| V4.13 | Toda carga regravava cada álbum na coleção compartilhada, com o ranking | UAT-176 · F48 | TD-R14, B-40, F39 |
| V4.14 | Segunda fonte: nova tentativa que nunca rodava, resultado nunca guardado | UAT-175 · F48 | TD-R15, M6, G CL-a, G-N1, KLM-N1 |
| V4.15 | O `appleMusicId` escolhido era guardado e ignorado | F45 | TD §5.1-13, B-11 |
| V4.16 | «Refetch» gravava numa chave diferente da que a carga lê | F48 | TD-M15 |
| V4.17 | Barra de progresso terminava sem começar | F45 | TD-M11 |
| V4.18 | O que é guardado, quando e com que chave | F45, F48 | CR P0-2, OP P0-2, CR P1-3 |
| V4.19 | Sessão reaproveitada com a lista de pedidos já mudada | F45 | CR P0-3, OP P1-3, OP P0-3 item 5 |
| V4.20 | Comportamentos sem dono na proposta | F45 to F48 | CR P1-5, OP P0-3 |
| V4.21 | Cancelar não consegue abortar de verdade (o resultado antigo é descartado) | F45 | CR P1-6, OP question 5 |
| V4.22 | Filtros mentiam com séries pendentes | F51 | CR P1-9, OP P1-2 |
| V4.23 | Álbum publicado era alterado no lugar | F45, F46 | OP P1-1, CR question 4 |
| V4.24 | A nova tentativa da segunda fonte contradizia a proposta | F48 | OP P1-4a |
| V4.25 | Uma leitura só para todos os rankings, em vez de uma por álbum | F46 | CR P2 ranking |
| V4.26 | O campo de busca perdia o foco a cada tecla | UAT-179 · F51, F46 | B-35, A-10d, D36 |
| V4.27 | A janela de ranking abria na ordem do disco | UAT-187 · F46 | B-36 |
| V4.28 | Ranking salvo com um id de usuário e lido com outro | F46 | B-39 |
| V4.29 | Escape em dobro mostrava `&amp;` | UAT-180 · F46 | B-53 |
| V4.30 | Quatro formatos de pedido de álbum | F46 | B-12 |
| V4.31 | A tela de histórico desenhava por cima da seguinte | F46 | AB-N03, A-10e |
| V4.32 | Suíte de testes vermelha; roteiros de navegador contados como unidade | UAT-149 · F53 | H01 (root), H02, H03, L H-1 to H-8c, M E-5 |
| V4.33 | Sem teste do controlador e do cache de álbuns | F45, F46 | L no-test (SeriesController, cache) |

## Não vale mais

| # | Item e motivo | Origem |
|---|---|---|
| N.1 | A F45 dependia de partes da F46 e da F48 — a divisão em fatias foi refeita antes do código (`arch.md` §15.4 e §17) | CR P1-7, OP P0-4 |
| N.2 | O aviso do Spotify só era mandado ao desconectar — consertado pela F50 em 2026-11-19 (UAT-182) | E22 |
| N.3 | Seis riscos que as notas verificadas concluíram que não acontecem ou não causam dano — não reconferido em 2026-11-19 | A-11b, A-30, B-54, E43, G MK-a, G GAP-a |

## Issues abertas no `uat.md` que o cruzamento não listou

| Issue | O que é | Feature |
|---|---|---|
| UAT-18, UAT-19 | Lojas de estado que chamam banco, API e login; controladores e telas que pulam a camada de serviço | F58 |
| UAT-29 | Tasks antigas fechadas sem número de rodadas | F65 |
| UAT-07 | Abrir o menu de mistura a partir de uma série | F63 |
| UAT-181 | Segunda fonte de álbuns respondia 402 (sintoma resolvido pela cobrança) | F52 |
| UAT-184 a UAT-195 | Achados da regressão de 2026-11-19 | F54, F55, F56, F57, F58, F61, F62, F63 (cada uma no seu `fixes:`) |
| UAT-30, UAT-31, UAT-61, UAT-62, UAT-63, UAT-73, UAT-75, UAT-84, UAT-101, UAT-143, UAT-152 | Issues legadas de 2025-11 a 2026-01 | **sem feature: não foram relidas; precisam de triagem** (várias podem já estar resolvidas pela v4.0) |
