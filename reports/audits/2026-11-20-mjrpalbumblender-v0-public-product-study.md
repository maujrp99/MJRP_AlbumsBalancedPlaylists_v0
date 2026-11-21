---
type: research
subject: "Viabilidade de transformar o Album Blender em produto público e monetizá-lo por afiliação, com autorização do BestEverAlbums e do MusicBrainz"
project: MJRP_AlbumsBalancedPlaylists_v0
written: "2026-11-20 10:18"
status: informativo, para o MJRP decidir
---
# Estudo de viabilidade · Album Blender como produto, monetizado por afiliação

**Para quem:** MJRP. **Pergunta do estudo:** é viável transformar o Album Blender num produto público (iPhone e Android), com a receita vindo de afiliações, as notas vindo do BestEverAlbums com autorização e o catálogo vindo do MusicBrainz com licença para uso comercial?

**Aviso:** a parte legal é um mapa do que considerar, não um parecer. Os números de receita são ilustrativos, com as premissas escritas; nenhum foi medido.

## Veredito

**Viável como produto. Como negócio, a afiliação sozinha não se paga no começo.**

| Dimensão | Viável? | Em uma frase |
|---|---|---|
| Dados: catálogo (MusicBrainz) | **Sim** | o núcleo do banco é de uso livre, inclusive comercial; a fundação pede apoio financeiro de quem usa comercialmente |
| Dados: notas (BestEverAlbums) | **Depende de um «sim» deles** | não há interface pública nem termos de uso de dados publicados; é uma conversa por e-mail, e é o item que decide o estudo |
| Monetização por afiliação | **Sim, com receita pequena por usuário** | cerca de 5% do preço de um CD; só vira receita relevante com dezenas de milhares de usuários ativos |
| Técnica | **Sim** | um app para as duas lojas, com as regras de hoje reaproveitadas |
| Legal | **Sim, se as duas autorizações vierem** | com elas, o risco de leitura automática sem permissão sai; sobram as regras dos programas de afiliados |

**O que precisa ser verdade para avançar (critérios de ir ou não ir):**
1. O BestEverAlbums autoriza, por escrito, o uso das notas num produto comercial. Sem isso, o produto perde a nota por faixa no dia um (plano B no Anexo E).
2. O preço deixa de vir do Discogs. Os termos dele não cabem num app público com links de afiliado.
3. Pelo menos dois programas de afiliados aceitam o app (a Amazon exige vendas para manter a conta e para liberar preços).
4. A exportação para o Spotify fica fora do lançamento público, ou restrita, e o Apple Music vira a base.
5. Você aceita que a afiliação paga as contas fixas, não o tempo de desenvolvimento, até haver escala.

## 1. O cenário estudado

- **Produto:** o Album Blender de hoje (séries de álbuns, ranking por faixa, playlists equilibradas, inventário de colecionador), como app público para iPhone e Android, com o site mantido.
- **Receita:** afiliação nos links «Where to buy» (lojas de CD) e, onde houver, na assinatura de serviço de música.
- **Notas:** BestEverAlbums, com autorização.
- **Catálogo:** MusicBrainz, com apoio comercial à fundação que o mantém.
- **Fora do cenário:** plano pago, anúncios, venda entre colecionadores (ficam no Anexo B como caminhos seguintes).

## 2. Viabilidade dos dados

### 2.1 MusicBrainz (catálogo): viável

- **Licença:** a maior parte do banco é publicada em CC0: pode ser baixada e usada de qualquer forma, inclusive comercial. As tabelas derivadas (notas e etiquetas dos usuários, a arte de capa) e o fluxo de atualização ao vivo são de uso não comercial.
- **Uso comercial:** a fundação MetaBrainz não cobra pelo acesso aos dados, mas pede que usuários comerciais a apoiem financeiramente, e vende licença para o fluxo ao vivo. Há uma página de cadastro de apoiadores. **Não achei a tabela de valores**: é preciso ver no site ou perguntar.
- **O que o produto usaria:** identificar álbum e edição (inclusive por código de barras lido com a câmera), os identificadores estáveis para casar álbum com as outras fontes, e os gêneros.
- **O que não vem dali:** capas (a arte de capa é de uso não comercial; as capas continuam vindo do Apple Music), preço, nota por faixa.
- **Ponto técnico:** a interface pública do MusicBrainz tem limite de pedidos; um produto com usuários usa uma cópia própria do banco, atualizada pelo fluxo ao vivo (o que a licença comercial cobre).
- **Pedido a fazer:** cadastro como apoiador comercial, dizendo o porte (produto novo, um desenvolvedor) e perguntando o nível adequado.

### 2.2 BestEverAlbums (notas): depende da autorização

- **O que se sabe:** o site não tem interface pública de dados. Hoje o servidor do Album Blender lê as páginas do site, para um usuário.
- **Os termos de uso do site** (o MJRP os trouxe em 2026-11-20; página `besteveralbums.com/terms`):
  - **Quem é o dono:** Amulet Solutions, com sede em Stamford, no Reino Unido. Os termos são regidos pelas leis do Reino Unido.
  - **Para que serve o conteúdo:** «for your general information and use only».
  - **Reprodução:** «Reproduction is prohibited other than in accordance with the copyright notice».
  - **Uso não autorizado:** «Unauthorised use of this website may give rise to a claim for damages and/or be a criminal offence.»
  - **Não há** cláusula que fale de leitura automática, nem de interface de dados, nem de uso comercial por terceiros: nada autoriza, e nada proíbe com essas palavras.
  - **Eles são afiliados da Amazon** (os termos citam a marca): monetizam do mesmo jeito que o estudo propõe para o Album Blender.
  - **Há uma página de contato** (`besteveralbums.com/contact`), melhor caminho que o endereço «webmaster».
- **O que isso muda na análise:**
  - **O uso pessoal de hoje** cabe com alguma folga em «general information and use», mas é leitura automática, que os termos não preveem. É zona cinzenta, não autorização.
  - **Mostrar as notas num app público é reprodução,** que os termos proíbem sem permissão. A autorização deixa de ser «recomendável» e passa a ser condição.
  - **O Reino Unido tem o direito sobre bases de dados** (manteve o da União Europeia depois da saída): protege quem investiu em montar a base contra a extração de parte substancial, e também contra a extração repetida e sistemática de partes pequenas. Ler as notas de cada álbum que cada usuário tem é exatamente extração repetida. É o risco legal mais concreto deste estudo. (Citado de memória; a conferir com advogado.)
  - **Concorrência:** um app com links de afiliado da Amazon, apoiado nas notas deles, disputa a mesma receita de afiliação. Isso pesa contra o «sim», e pesa a favor de oferecer divisão de receita ou tráfego de volta.
- **Por que eles diriam sim:** é um site de comunidade; o app leva atribuição e tráfego («ver no BestEverAlbums» em cada álbum, que já existe na folha de ações do celular); o uso é de leitura, com pouca carga se houver cópia guardada.
- **Por que diriam não:** o dado é o ativo deles; um app comercial em cima dele pode parecer concorrência; a carga no site.
- **O que pedir, nesta ordem de preferência:** (a) um arquivo ou interface com as notas por faixa e por álbum; (b) autorização por escrito para a leitura automática, com limite de pedidos combinado; (c) uma licença paga ou divisão de receita.
- **O que oferecer:** atribuição visível com link em toda nota, limite de pedidos, guarda local para não repetir pedidos, e, se fizer sentido, parte da receita de afiliação.
- **Três desfechos:**

| Resposta | Consequência |
|---|---|
| Sim | o produto lança com a nota por faixa, que é o que o diferencia |
| Sim, com condição (pagar, limitar, só atribuição) | viável; entra no custo |
| Não, ou silêncio | a leitura automática tem de parar antes do lançamento público; entra o plano B: popularidade por faixa e a média dos rankings dos próprios usuários (Anexo E) |

### 2.3 As outras fontes, neste cenário

- **Preço:** sai do Discogs e passa a vir das lojas afiliadas e dos usuários (Anexo C).
- **Spotify:** fora do lançamento público. Em modo de desenvolvimento são até 5 usuários autorizados; o acesso ampliado só é pedido por organização registrada, com a imprensa citando o mínimo de 250 mil usuários ativos por mês.
- **Apple Music:** a base. Nativo no iPhone; no Android há um SDK da Apple que desenvolvedores relatam estar parado.

## 3. Viabilidade da monetização por afiliação

### 3.1 Os programas

| Programa | O que paga | Janela | Observações |
|---|---|---|---|
| **Amazon Associados** | música em mídia física: **5%** (tabela dos EUA; Reino Unido 5,5%) | não confirmei a janela atual | paga sobre o carrinho todo, não só o CD; a conta precisa gerar vendas para ser mantida e para liberar a interface de preços (de memória); a taxa do Brasil não foi achada |
| **eBay Partner Network** | percentual da venda, por categoria e região, com teto por transação | 24 h para compra direta; 10 dias para leilão ganho | a taxa de música não foi achada; é a melhor fonte de usados e raridades |
| **Mercado Livre (afiliados)** | por categoria; guias citam até 16% em algumas | não achei | **não aceita link para página de busca**: o link tem de ser de um anúncio; a taxa de música não foi achada; números de guias de terceiros |
| **Apple (parceiros de desempenho), Apple Music** | pagamento único por assinatura nova, valor não publicado | 30 dias | a Apple aceita um número limitado de parceiros, que tragam volume |
| **Redes de afiliados (lojas como a iMusic)** | varia por loja | varia | entregam arquivo de produtos com preço, feito para ser mostrado |

**Dois achados que mudam o desenho de hoje:**
- Os links de «Where to buy» hoje são **buscas** (artista, título, «CD»). O Mercado Livre não paga por link de busca, e a comissão em geral depende de o clique virar compra em pouco tempo. Para render, o link precisa levar ao **produto**, o que pede identificar a edição (o código de barras do MusicBrainz serve para isso).
- A janela curta (24 horas no eBay) favorece quem clica já decidido a comprar. O inventário («Not Owned», «Wishlist») é exatamente esse momento.

### 3.2 Quanto renderia (ilustrativo)

Premissas, todas suposições a validar: CD a US$ 12 em média; comissão de 5% (US$ 0,60 por CD); a cada mês, 30% dos usuários ativos tocam num link de compra; 5% desses compram; 1,5 item por compra.

| Usuários ativos por mês | Compras por mês | Receita de afiliação por mês |
|---|---|---|
| 1.000 | 15 | cerca de US$ 14 |
| 10.000 | 150 | cerca de US$ 135 |
| 100.000 | 1.500 | cerca de US$ 1.350 |

Conta: usuários × 30% × 5% × 1,5 × US$ 0,60. O que pode puxar para cima: a Amazon paga sobre o carrinho inteiro; vinil e caixas custam mais que US$ 12; colecionador compra mais que a média. O que pode puxar para baixo: a taxa de conversão de 5% é otimista para clique em link de busca.

**Leitura honesta:** a afiliação é receita real e sem atrito (o usuário não paga nada, as lojas de apps não cobram comissão sobre venda de produto físico), mas é pequena por usuário. Ela cobre as contas fixas com poucos milhares de usuários e não paga desenvolvimento antes de dezenas de milhares.

### 3.3 Custos a cobrir

| Custo | Valor | Fonte |
|---|---|---|
| Programa de desenvolvedor da Apple | cerca de US$ 99 por ano | de memória |
| Conta de desenvolvedor do Google | cerca de US$ 25, uma vez | de memória |
| Apoio comercial ao MusicBrainz | não achei a tabela | perguntar |
| BestEverAlbums | zero a negociar | depende da resposta |
| Servidor, banco e IA | cresce com o uso; o gasto de hoje, para um usuário, não foi medido neste estudo | medir antes de decidir |
| Consulta jurídica | pontual | — |

A IA é o custo variável que mais preocupa: cada enriquecimento custa, e a afiliação rende centavos por usuário. Um produto público pede limite de uso de IA por conta, ou a IA só no plano pago (Anexo B).

## 4. Viabilidade técnica

Viável, com trabalho conhecido. O detalhe está no Anexo A; em resumo:
- **Um app para as duas lojas:** React Native com Expo, em TypeScript. As regras de hoje (receitas, ranking, identidade de álbum e de faixa) são JavaScript e viram um núcleo compartilhado entre site, app e servidor.
- **O que é novo de verdade:** identificar a edição por código de barras (MusicBrainz); os links de afiliado por produto; a cópia própria do catálogo; login com a Apple e «apagar a minha conta»; limites por usuário.
- **O que já existe e ajuda:** o desenho do celular (F76), o servidor com respostas tipadas e fontes trocáveis, o interruptor que desliga o Discogs sem publicar código, o módulo único dos links de compra (`models/buyLinks.js`), onde a marca de afiliado entra.

## 5. Viabilidade legal, neste cenário

Com as duas autorizações, o risco maior (ler um site sem permissão num produto comercial) deixa de existir. O que sobra:
- **Regras dos programas de afiliados:** aviso de afiliação visível; regras de como mostrar preço e por quanto tempo guardá-lo; não usar a marca da loja além do permitido.
- **Discogs:** desligar o preço dele antes de qualquer link de afiliado ir a público (a cláusula de tráfego, no Anexo C).
- **Autorizações por escrito:** a do BestEverAlbums precisa dizer uso comercial, em app, com que limite e com que atribuição. E-mail serve como registro; um termo simples é melhor.
- **Dados pessoais (LGPD):** política de privacidade, apagar conta, e o que os usuários informam (coleção, quanto pagaram) tratado como dado pessoal.
- **Consumidor:** preço mostrado com fonte e data, sem prometer preço final.

O mapa completo, com as quatro camadas (direito autoral, bases de dados na Europa, termos de uso, regras de programa), está no Anexo D.

## 6. Riscos

| Risco | Chance | Efeito | Como reduzir |
|---|---|---|---|
| O BestEverAlbums não autoriza | não sei | alto: perde a nota por faixa | perguntar antes de qualquer código; plano B pronto |
| Afiliação rende menos que o custo de IA e servidor | média | médio | limite de IA por conta; medir o gasto de hoje |
| Conta de afiliado recusada ou encerrada por falta de vendas | média no começo | médio | começar por mais de um programa; links por produto |
| Recusa na loja da Apple (app fino demais) | baixa com app nativo | alto | interface nativa, leitura de código de barras, uso sem rede |
| Spotify fora do produto frustra quem usa Spotify | alta | médio | dizer isso com clareza; exportar por fora (copiar a lista) |
| Um programa muda as regras ou a taxa | alta, com o tempo | médio | não depender de um só |

## 7. Próximos passos baratos, antes de decidir

Nenhum deles é código, e todos respondem a uma incerteza do estudo:
1. **E-mail ao BestEverAlbums** pedindo autorização (posso redigir; o envio é seu).
2. **Cadastro de apoiador comercial no MusicBrainz**, perguntando o nível para um produto novo.
3. **Abrir conta** na Amazon Associados e no eBay Partner Network, e ler as taxas de música e as regras de exibição de preço.
4. **Medir o gasto de hoje** com servidor, banco e IA, para ter o custo por usuário.
5. **Consulta jurídica curta** com este estudo na mão.

Com as respostas de 1 a 4, a decisão de ir ou não ir fica objetiva.

## Anexos

### Anexo A — Pilha de tecnologia e regras das lojas

**O que mudou em relação à resposta anterior:** com iPhone só, eu iria de SwiftUI. Com Android e público, dois apps nativos separados dobram o trabalho de quem é uma pessoa com agentes.

| Opção | A favor | Contra |
|---|---|---|
| **React Native + Expo (TypeScript)** — recomendada | um código para as duas lojas; interface nativa de verdade (passa na regra de «mínimo de funcionalidade» da Apple); o app de hoje é JavaScript, então as regras (receitas, ranking, identidade de álbum e de faixa) viram um pacote compartilhado, sem reescrever em outra língua; Firebase tem suporte maduro | a interface é reescrita (o site não é React); Apple Music pede módulo nativo em cada plataforma |
| Flutter | um código, interface muito consistente | outra língua (Dart): as regras teriam de ser portadas ou ir todas para o servidor |
| SwiftUI + Kotlin (dois nativos) | o melhor de cada plataforma | dois apps para manter |
| Capacitor (o site dentro de um app) | o mais rápido: a F76 já deixou o site bom no celular | risco de recusa na Apple por ser «o site numa moldura»; serve como degrau de teste, não como produto |

**Desenho sugerido:**
- **Núcleo compartilhado** (`shared/`, que já existe com a identidade de álbum e de faixa): as receitas, o ranking, o valor do inventário. Usado pelo site, pelo app e pelo servidor. É a peça que evita três cópias da mesma regra.
- **App:** Expo, com módulos nativos só onde precisa (Apple Music, login com a Apple).
- **Dados e conta:** Firebase, como hoje. Login com a Apple passa a ser obrigatório no iPhone (a loja exige quando há login do Google), e «apagar a minha conta» de dentro do app também.
- **Servidor:** o Cloud Run de hoje, com limite por usuário e as chaves de terceiros.

**Custos fixos de entrada** (de memória, a confirmar): programa de desenvolvedor da Apple, cerca de US$ 99 por ano; conta de desenvolvedor do Google, taxa única de cerca de US$ 25; as lojas ficam com 15% a 30% de compras digitais feitas dentro do app.

#### Regras das lojas a cumprir (de memória, a conferir antes de começar)

- **Mínimo de funcionalidade (regra 4.2 da Apple):** um app que é só o site dentro de uma moldura costuma ser recusado. O revisor procura valor nativo de verdade (uso sem rede, avisos, integração com o aparelho, interface nativa).
- **Login com a Apple:** quem oferece login do Google no iPhone precisa oferecer também o da Apple.
- **Apagar a conta:** tem de ser possível de dentro do app.
- **Rótulo de privacidade** preenchido nas duas lojas, e política de privacidade publicada.

#### Se o iPhone fosse a única plataforma

A minha primeira resposta, antes de o Android entrar: **Swift com SwiftUI e MusicKit nativo**. O desenho da F76 (barra de baixo, folhas, linhas compactas) é o vocabulário nativo do SwiftUI, a integração com o Apple Music é a melhor possível, e o caminho fica aberto para widget, Atalhos e Siri. Continua sendo a melhor escolha se o Android sair do plano ou ficar para muito depois. A parte que vale nos dois casos: as regras do app num lugar só (núcleo compartilhado ou servidor), para o site e o app não terem duas cópias.

#### Se o app fosse só para você

O que já existe é quase o app:
- **Hoje:** o site da F76 adicionado à tela de início do iPhone abre em tela cheia, com ícone e nome.
- **Um degrau acima:** o site dentro de um Capacitor, distribuído pelo TestFlight interno, sem passar pela revisão pública da loja. Não exige resolver Spotify, Discogs nem BestEverAlbums, porque o uso continua pessoal.

### Anexo B — Outras formas de monetização, fora da afiliação

| Forma | Como funcionaria | O que pede | Observação |
|---|---|---|---|
| **Afiliação nos links de compra** | «Where to buy» já existe; cada link leva a marca de afiliado (Amazon, eBay, lojas em redes de afiliados) | contas de afiliado; aviso de afiliação visível ao usuário | é venda de produto físico fora do app: as lojas de apps não cobram comissão. **Incompatível com o preço do Discogs ao lado** |
| **Plano pago do colecionador** | grátis até N séries e N itens; pago: inventário sem limite, valor da coleção ao longo do tempo, relatório da coleção (para seguro, por exemplo), mais fontes de nota | compra dentro do app (a loja fica com 15% a 30%) | o valor está no inventário e no ranking, que hoje são o que só este app faz |
| **Compra única** | paga uma vez, destrava tudo | idem | simples, sem receita recorrente; a IA e o servidor têm custo recorrente |
| **Exportações e IA como crédito** | pacote de enriquecimentos por IA ou de exportações | idem | alinha o preço com o que custa para você |
| **Lojas de discos parceiras** | loja paga para aparecer em «Where to buy» ou envia o catálogo com preço | acordos comerciais, um a um | resolve preço e receita de uma vez; trabalho de relacionamento |
| **Troca e venda entre colecionadores** | taxa por negócio fechado | pagamentos, disputas, moderação, regras de consumo | é a ideia da rede de colecionadores; é outro produto em tamanho e em risco |
| **Apoio voluntário** | «pague um café» | quase nada | honesto para começar; receita pequena |

O que eu **não** faria: anúncios (estragam um app de apaixonados e rendem pouco em nicho) e venda de dados de usuários (LGPD e confiança).

### Anexo C — O Discogs: a cláusula de tráfego e o agregador de preços próprio

#### A cláusula de tráfego do Discogs, em detalhe

Os termos da API proíbem, entre os usos comerciais, usar a API ou o conteúdo dela «com a intenção de levar tráfego a sites ou serviços que não são do Discogs».

**Por que toca no desenho de hoje (F75):**
- O app usa um dado do Discogs, o preço, para estimar o valor de um CD.
- No mesmo cartão e na mesma janela, logo abaixo, ficam os links «Where to buy»: Discogs, Amazon e iMusic.
- Quem vê o preço do Discogs e clica em Amazon ou iMusic está sendo levado a outra loja a partir de um dado do Discogs.
- Com afiliação, o app passaria a ganhar com esse tráfego: aí o uso é comercial sem dúvida.

**O que pesa a favor hoje:** só o MJRP usa o app, sem fim comercial e sem afiliação; o link do Discogs vem primeiro e o preço leva à página do Discogs; a cláusula fala em intenção.

**Riscos práticos:** o pior caso é o Discogs revogar o token; o app segue funcionando com o interruptor desligado (`DISCOGS_VALUES=off`). Os termos também dão como exemplo de violação usar a API para contornar o marketplace deles, o que pesa sobre a ideia de venda e troca entre colecionadores com base nesses preços.

**Opções:**
1. Deixar como está enquanto o uso for pessoal e sem afiliação (recomendação de agora).
2. Separar na tela: o preço do Discogs leva só ao Discogs; Amazon e iMusic ficam longe dele.
3. Antes de ligar afiliação ou abrir ao público: pedir autorização por escrito ao Discogs, ou trocar a fonte de preço (o resto desta seção).

**Separar duas coisas que o Discogs entrega junto:**

**a) O catálogo** (qual é o álbum, quais edições existem, código de barras). **Dá para ser independente:**
- **MusicBrainz:** a maior parte do banco é CC0 (uso livre, inclusive comercial); o fluxo de atualização ao vivo e algumas tabelas derivadas são de uso não comercial, com licença comercial vendida pela fundação.
- **Os arquivos mensais do Discogs:** o catálogo (lançamentos, masters, artistas, selos) é publicado em CC0. Não trazem preço. Ou seja: dá para usar o catálogo do Discogs **sem a API e sem os termos dela**.
- **Código de barras:** o usuário lê o código do CD com a câmera, e isso identifica a edição exata. É a função que faltava para «escolher a edição».

**b) O preço.** Não existe fonte aberta. As opções, da mais sólida para a mais frágil:

| Fonte de preço | O que entrega | Condição |
|---|---|---|
| **eBay (interface de busca de anúncios)** | preço pedido de anúncios ativos, mundo todo | ser membro da rede de afiliados do eBay; seguir as regras de exibição deles (não conferidas aqui) |
| eBay (preços de venda fechada) | o que o disco realmente vendeu, 90 dias | acesso restrito, concedido caso a caso pelo eBay |
| **Amazon** | preço de novo | conta de afiliado com vendas recentes |
| **Redes de afiliados** (lojas como a iMusic em alguns países) | arquivo de produtos com preço, feito para ser mostrado | entrar no programa de cada loja |
| Mercado Livre | anúncios no Brasil | tem interface pública e programa de afiliados; termos não conferidos |
| **Os próprios usuários** | «quanto paguei», «quanto vale o meu» | é dado seu, do produto; cresce com a base |
| Lojas parceiras | catálogo com preço | acordo direto |
| Raspar sites de lojas | qualquer preço | **o caminho de maior risco**: ver a seção 5 |

**Como funcionaria:** o servidor guarda, por edição (código de barras), as leituras de cada fonte com data e origem; o app mostra uma faixa («de R$ 40 a R$ 90, 12 anúncios») em vez de um número só, sempre com a fonte e a data, e o link de cada loja com a marca de afiliado. O preço deixa de ser «o valor do Discogs» e vira «o que as lojas pedem hoje», que é também o que rende afiliação.

**O que se perde:** a sugestão por estado do disco (Mint, Near Mint, VG+) é um dado que só o Discogs calcula, das vendas dele. Um agregador próprio só chega perto disso com preços de venda fechada (eBay restrito) ou com muitos usuários informando o que pagaram.

### Anexo D — O mapa legal, em quatro camadas

Quatro camadas diferentes, que costumam ser confundidas:

1. **Direito autoral.** Um preço, uma nota e uma posição num ranking são fatos, e fato não tem dono (nos EUA, caso Feist, 1991). O que pode ter proteção é a **seleção e a organização** de uma base (uma lista «os 500 melhores» é uma escolha editorial; copiar a lista inteira é diferente de citar uma posição). No Brasil, a lei de direitos autorais protege bases de dados pela seleção e organização, não os dados em si.
2. **Direito sobre bases de dados (Europa).** A União Europeia tem um direito próprio de quem investiu em montar a base, mesmo sem originalidade. Extrair parte substancial de uma base europeia pode ferir isso. Importa se o app for oferecido na Europa ou usar sites europeus.
3. **Contrato: os termos de uso.** É onde mora o risco real. Quem usa uma API aceita os termos dela; quem raspa um site pode estar quebrando os termos do site. Nos EUA, raspar dado público não é crime de invasão (caso hiQ contra LinkedIn), mas a mesma decisão deixou de pé a quebra de contrato, e o caso terminou com ordem contra quem raspava. Na Europa, o caso Ryanair contra PR Aviation (2015) confirmou que os termos podem proibir a raspagem mesmo de base sem proteção autoral. (Feist, a diretiva europeia e Ryanair estão aqui de memória, não conferidos hoje.)
4. **Regras de cada programa.** Afiliados e APIs têm regras de exibição: por quanto tempo o preço pode ficar guardado, que aviso tem de aparecer, se pode ficar ao lado de concorrente. O Discogs é o exemplo que já conhecemos: 6 horas, aviso obrigatório, sem tráfego para outras lojas.

**Outros pontos a considerar:**
- **Consumidor:** preço mostrado com data e fonte, sem prometer que é o preço final. Aviso claro de que o link é de afiliado.
- **Marcas:** usar o nome de uma loja para dizer de onde vem o dado é uso informativo; usar o logotipo pede o guia de marca de cada uma.
- **Dados pessoais (LGPD):** o que os usuários informam (coleção, quanto pagaram) é dado pessoal; agregado e sem identificação, pode alimentar o preço da comunidade, com isso dito na política de privacidade.
- **Concorrência desleal:** montar um produto comercial em cima do trabalho de um site, sem autorização e desviando o público dele, é o argumento que um site raspado usaria no Brasil.

**Regra prática:** preferir, nesta ordem, dado aberto (CC0), dado de programa que quer ser mostrado (afiliados), dado dos próprios usuários, acordo direto. Raspar fica por último e só com autorização.

### Anexo E — Rankings sem o BestEverAlbums (o plano B)

**No nível do álbum, há fontes legítimas:**

| Fonte | O que dá | Condição |
|---|---|---|
| Wikidata e Wikipedia | notas de críticos por álbum (a tabela de avaliações dos artigos) | Wikidata é CC0; o texto da Wikipedia é CC BY-SA (pede atribuição). A cobertura no Wikidata não foi medida |
| MusicBrainz | identificação e gêneros; notas dos usuários | as notas estão nas tabelas de uso não comercial |
| Deezer, Last.fm, Apple Music | popularidade, paradas | termos de cada API; uso comercial costuma pedir autorização |
| Listas de críticos (Rolling Stone, NME, Pitchfork) | posição do álbum em listas | citar posições é citar fatos; reproduzir a lista inteira esbarra na proteção da seleção |
| Rate Your Music, Album of the Year | as melhores notas de comunidade | sem API pública; não conferi os termos; tratar como «só com acordo» |

**No nível da faixa, o problema é outro:** quase ninguém publica nota por faixa. É o que o BestEverAlbums tem de único. As alternativas:
- **Popularidade por faixa** (Spotify, Deezer, Last.fm): existe, mas mede escuta, não aclamação. O app já usa a do Spotify.
- **A nota da própria comunidade do app:** o «meu ranking» já existe. Com usuários, a média dos rankings vira a fonte de aclamação por faixa do produto, que ninguém pode tirar e que melhora com o uso. É o ativo mais valioso que um produto público construiria.
- **Parceria com o BestEverAlbums:** pedir autorização ou licença. Um site de comunidade pode aceitar em troca de atribuição e tráfego. É a primeira coisa a tentar, porque resolve o dia um.

**Como funcionaria o agregador:** cada fonte vira uma «fonte de nota» no servidor (o molde das fontes de ranking que o app já tem), com a nota normalizada para a mesma escala e a origem guardada; a tela mostra de quais fontes a nota saiu. A receita «por aclamação» passa a usar a nota agregada, e a fonte do BEA vira uma entre várias, removível sem quebrar o produto.

## O que não foi verificado

- A leitura dos termos do BestEverAlbums acima é do agente, não de advogado; o que o «copyright notice» deles diz não foi lido.
- Os valores do apoio comercial ao MusicBrainz.
- Taxas de música do eBay, do Mercado Livre e da Amazon no Brasil; a janela de atribuição atual da Amazon; o valor pago pela Apple por assinatura.
- A regra de que a conta da Amazon precisa de vendas para ser mantida e para liberar preços está aqui de memória.
- Todas as premissas da conta de receita (30%, 5%, 1,5, US$ 12).
- O gasto atual com servidor, banco e IA.
- Valores das taxas das lojas de apps; os casos Feist e Ryanair e a diretiva europeia, citados de memória.
- Nada disto é parecer jurídico.

## Fontes

- MusicBrainz, sobre e licença: https://musicbrainz.org/doc/About
- MetaBrainz, apoiadores: https://metabrainz.org/supporters
- BestEverAlbums, termos de uso (trazidos pelo MJRP): https://www.besteveralbums.com/terms
- BestEverAlbums, política de privacidade: https://besteveralbums.com/privacy
- Amazon Associates, tabela de comissões (EUA): https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ
- Amazon Associates, tabela do Reino Unido: https://affiliate-program.amazon.co.uk/help/node/topic/GRXPHT8U84RAYDXZ
- eBay Partner Network, tabela global: https://ebaypartnernetwork.ebay.com/our-program/rate-card
- eBay, começar um app de compra: https://developer.ebay.com/develop/get-started/get-started-on-a-buying-application
- eBay, Marketplace Insights (restrito): https://www.developer.ebay.com/api-docs/buy/marketplace-insights/overview.html
- Mercado Livre, afiliados e criadores: https://mercadolivre.com.br/l/afiliados-home
- Hostinger, guia de comissões do Mercado Livre: https://www.hostinger.com/br/tutoriais/?p=50009
- Apple, parceiros de desempenho, comissões: https://performance-partners.apple.com/commissions-payments
- Spotify, critérios do acesso ampliado (2025): https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access
- Spotify, modos de cota: https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- Spotify, acesso de desenvolvedor (fev. 2026): https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
- TechCrunch sobre a mudança do Spotify (2026): https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/
- Apple, MusicKit: https://developer.apple.com/musickit
- Fórum da Apple, SDK de Android parado: https://developer.apple.com/forums/thread/734577
- Fórum da Apple, regra 4.2: https://developer.apple.com/forums/thread/806726
- Internet Archive sobre os arquivos abertos do Discogs: https://blog.archive.org/2020/12/06/discogs-thank-you-a-commercial-community-site-with-bulk-data-access/
- hiQ contra LinkedIn: https://en.wikipedia.com/wiki/HiQ_Labs_v._LinkedIn
- Morgan Lewis sobre raspagem de dados: https://www.morganlewis.com/de/blogs/sourcingatmorganlewis/2022/04/data-scraping-deemed-legal-in-certain-circumstances
- Termos da API do Discogs, lidos em 2026-11-20: `reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md`
