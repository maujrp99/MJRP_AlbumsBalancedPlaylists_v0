---
type: architecture-audit
status: open
subject: "Crítica da proposta da F52 («O servidor diz a verdade»), antes do código"
project: mjrpalbumblender-v0
judged: "2026-11-19 16:18"
who_judged: agente separado, só de leitura, com teto de 5 minutos (11 leituras)
verdict: "não pode ir ainda"
spot_checked: "o implementador conferiu no código os dois achados que bloqueiam (P0): os dois conferem"
---

# Crítica da proposta da F52

**Veredito: não pode ir ainda.** Dois achados bloqueiam a primeira fatia; os dois se corrigem no texto da proposta, sem mudar a direção do desenho. A decisão de não começar por um guardado no servidor foi considerada correta para um usuário.

| # | Gravidade | O que a proposta dizia | O que o código mostra | Menor mudança |
|---|---|---|---|---|
| 1 | P0 | A falha das notas é engolida no serviço de notas | É engolida **dentro do raspador**: `getRankingForAlbum` nunca lança, devolve `{ error }` (`server/lib/scrapers/besteveralbums.js:506-508`), e vários `catch` vazios viram «álbum sem página». Trocar só o serviço carimbaria `not_found` em falhas | A fatia 1 inclui o raspador propagar erro de rede; `null` só quando a fonte respondeu e nada bateu |
| 2 | P0 | Erro do provedor de IA vira 5xx | Hoje 402, 429 e 400 do provedor chegam como 4xx e não são repetidos; o app repete todo 5xx até duas vezes (`public/js/api/client.js`). Virar 5xx faria cobrança e cota gerarem três chamadas pagas por álbum | Tabela fechada provedor → resposta: o que não adianta repetir sai com status que a aba antiga não repete; o app novo decide por `retryable` |
| 3 | P1 | «O app aceita o formato antigo e o novo» | O formato novo com dado é igual ao antigo na falha (`{ data }`): o app não distingue | `outcome` sempre presente; 200 sem `outcome` é servidor antigo e vale a regra de hoje |
| 4 | P1 | Confiar 7 dias no «não tem» | Registros já guardados (`empty` que foi falha, `done` que é o álbum vizinho) ficariam congelados | Trocar a versão do registro na fatia do raspador; começar com 24 horas para «sem página» |
| 5 | P1 | O raspador aceita quando um título contém o outro | É mais frouxo: aceita a página se o cabeçalho tem «by artista», busca só pelo artista, aceita sem artista, aceita por título **ou** artista. São cinco pontos de aceite | A regra de identidade vale nos cinco; teste do caso «álbum ausente, artista presente» |
| 6 | P1 | (não mencionado) | O app espera 20 s por fonte; o raspador usa 30 s **por requisição** e encadeia várias; o app desiste e o servidor segue raspando | Orçamento total por álbum no servidor menor que o prazo do app, com prazo curto por requisição |
| 7 | P1 | «Um módulo só monta as respostas» | Já há quatro lugares que montam erro, com formatos diferentes; `routes/ai.js` devolve a mensagem do provedor, que pode conter o endereço com a chave | Todos passam pelo módulo novo; linhas 4xx na tabela; 401 e 429 pausam a fila do app em vez de marcar tudo como falha |
| 8 | P1 | (não mencionado) | Fatos já gravados na série como «sem dado» não têm conserto; página com zero notas hoje conta como «tem», e o contrato muda isso sem aviso | Fatos anteriores à fatia do raspador viram «desconhecido»; declarar a mudança |
| 9 | P2 | «O servidor controla o ritmo» | Fila e memória são por instância; com escala a zero e várias instâncias a promessa não vale | Dizer «por instância»; fixar uma instância como pré-condição |
| 10 | P2 | Memória curta por instância; Spotify dentro desta feature | Peça sem número declarado; Spotify é do lado do app | Cortar a memória curta até medir; Spotify como item próprio |

O texto integral da crítica está na conversa da sessão de 2026-11-19; esta tabela resume cada achado com a evidência citada por ela.
