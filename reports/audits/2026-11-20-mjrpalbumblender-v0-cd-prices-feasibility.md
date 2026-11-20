---
type: feasibility
subject: "Preço de CDs e links de compra no inventário: Amazon, Discogs e iMusic"
project: mjrpalbumblender-v0
feature: F75
written: "2026-11-20"
---
# Viabilidade — preço de CDs e onde comprar, no inventário

**Pedido do MJRP (2026-11-20 00:14):** uma função que busque o preço médio dos CDs (Amazon, Discogs e iMusic), para todo o inventário ou por álbum, com link de compra nos três, pensando em afiliação no futuro.

## Veredito

**Viável em parte.** Os links de compra dão para os três, já. O preço só o Discogs entrega hoje de forma aberta. A Amazon exige ser afiliado com vendas antes de liberar preços, e a iMusic não tem interface pública e recusa pedidos automáticos.

| Fonte | Link de compra | Preço lido pelo app | Afiliação |
|---|---|---|---|
| Discogs | Sim | **Sim**: menor preço e quantos à venda, sem login | Não achei programa público ativo |
| Amazon | Sim | **Não, por ora**: a interface de preços só abre para afiliado com vendas recentes | Sim (Associados) |
| iMusic | Sim | **Não**: sem interface pública; o site recusou o pedido automático | Existe por redes de afiliados em alguns países; no Brasil, não confirmado |

## Discogs

**Conferido por mim, com pedidos à API pública em 2026-11-20:**
- `GET https://api.discogs.com/marketplace/stats/{release_id}?curr_abbr=USD` respondeu sem login: `num_for_sale` e `lowest_price` com valor e moeda.
- `GET /releases/{id}` traz `lowest_price`, `num_for_sale`, os formatos e o endereço da página.
- `GET /database/search` e `GET /masters/{id}/versions?format=CD` responderam 200 sem login.
- `GET /marketplace/price_suggestions/{release_id}` exige login: «You must authenticate to access this resource.»
- O limite informado no cabeçalho da resposta foi de 25 pedidos por minuto sem login.

**O que isso significa:**
- O que se lê sem login é o **menor preço anunciado**, não o preço médio. O mais perto de um preço médio é a sugestão de preço por estado do disco, que exige um token do Discogs.
- O preço é por **edição** (release). Um álbum tem dezenas de edições em CD. Será preciso escolher a edição, ou ler várias e mostrar uma faixa de preço («de X a Y»).
- 211 álbuns a 25 pedidos por minuto, com dois ou três pedidos por álbum, levam de 20 a 30 minutos. Tem de ser uma leitura em fila, com progresso, guardada no item.
- **Não conferido:** os termos de uso da API (a página oficial recusou a leitura automática). Antes de construir é preciso ler as regras de uso comercial, de quanto tempo o dado pode ficar guardado e de atribuição.

**Pendência antiga que entra aqui:** a UAT-17 (o token do Discogs que ficou no histórico do git precisa ser trocado). Se a feature usar token, ele mora no servidor, nunca no repositório nem no navegador.

## Amazon

**Lido em fontes de terceiros, não na política da Amazon:**
- A interface antiga de produtos (PA-API) foi desligada em maio de 2026; a substituta é a Creators API.
- O acesso exige conta de Associado aceita e **dez vendas qualificadas nos últimos trinta dias**, por país.
- Quem mostra preço tem de seguir as regras de validade do dado e de aviso de data.

**O que isso significa:**
- Sem a conta de afiliado com vendas, não há preço da Amazon por via permitida. Ler a página da Amazon por conta própria fere os termos dela e não entra no desenho.
- O **link de compra** não depende disso: um link de busca na Amazon com artista, título e «CD» funciona hoje, e ganha a sua marca de afiliado quando você tiver uma.
- O caminho é em duas etapas: links agora; preços quando a conta de afiliado cumprir o requisito.

## iMusic

**Conferido por mim em 2026-11-20:**
- `imusic.br.com` existe e vende CDs para o Brasil.
- Um pedido automático à busca do site recebeu a resposta HTTP 418, sem conteúdo: o site recusa leitura por script.
- Não achei interface pública nem arquivo de produtos aberto.

**Lido em fontes de terceiros:**
- Há programa de afiliados da iMusic em redes de afiliação para alguns países (Reino Unido, Dinamarca, Suécia, Suíça). Para o Brasil não achei nada.

**O que isso significa:**
- Preço da iMusic, só com um acordo: as redes de afiliados costumam dar ao afiliado um arquivo de produtos com preço. Depende de você entrar no programa e de a loja brasileira estar nele.
- O link de compra (busca no site) funciona hoje.

## Proposta de fatias

1. **Links de compra nos três** em cada álbum do inventário: busca pronta com artista, título e «CD». Sem custo de terceiros, sem conta. A marca de afiliado entra depois, num lugar só.
2. **Preço do Discogs**: menor preço e quantidade à venda por álbum, lidos em fila, guardados no item com a data; ordenar o inventário por preço. Antes, ler os termos de uso.
3. **Preço da Amazon e da iMusic**: só depois das contas de afiliado. Fica registrado, não construído.

## Perguntas para o MJRP

1. O «preço médio» pode ser, no começo, o **menor preço do Discogs** e a faixa entre edições? Ou você quer a sugestão por estado (exige a sua conta do Discogs)?
2. Qual edição vale: qualquer CD do álbum, ou a edição que você escolher por álbum?
3. Em que moeda mostrar: dólar, real, ou a de cada loja?
4. Qual iMusic você usa: a brasileira (`imusic.br.com`)?

## Fontes

- API pública do Discogs, pedidos feitos em 2026-11-20 (`api.discogs.com`).
- https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi
- https://getsquirrel.co/blog/post/7-registering-for-the-amazon-product-advertising-api
- https://blog.freshstore.com/amazon-creators-api-pa-api-retirement/
- https://www.affiliateprogramdb.com/brands/discogs-affiliate-program/
- https://all-affiliates.com/programs/gb/imusic/
- https://linkpizza.com/app/affiliate-program/imusic.dk
- https://imusic.br.com/page/about
