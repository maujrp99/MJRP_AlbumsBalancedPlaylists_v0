---
type: study
subject: "Album Blender como produto público: app para iPhone e Android, monetização, e independência do Discogs e do BestEverAlbums"
project: MJRP_AlbumsBalancedPlaylists_v0
written: "2026-11-20 10:05"
status: informativo, para o MJRP decidir
---
# Album Blender como produto público · estudo para decisão

**Atualizado em 2026-11-20 10:15:** entraram as considerações das conversas de 2026-11-20 (regras das lojas, o caminho só com iPhone, o caminho só para uso pessoal, a cláusula de tráfego do Discogs em detalhe).

**Para quem:** MJRP. **Para quê:** decidir se o Album Blender evolui para um app público, nas lojas da Apple e do Google. Nada aqui foi construído nem priorizado.

**Aviso:** a parte legal é um mapa do que considerar, não um parecer. Antes de lançar um produto público que use dados de terceiros, vale uma consulta com advogado de propriedade intelectual e de direito digital.

## Resposta curta

1. **O que trava um app público hoje são os dados, não a tecnologia.** Spotify, Discogs e BestEverAlbums funcionam para uma pessoa e não para o público, cada um por um motivo.
2. **Com Android na conta, a pilha que eu sugiro muda:** um app só para as duas lojas (React Native com Expo, em TypeScript), com o núcleo de regras do app compartilhado entre o site, o app e o servidor.
3. **A monetização mais natural é a afiliação nos links de compra**, mais um plano pago para o colecionador. As duas pedem que o preço não venha do Discogs.
4. **Dá para não depender do Discogs no catálogo; no preço, só em parte.** O catálogo tem fontes abertas. O preço tem de vir de lojas que pagam afiliação (e por isso deixam mostrar) e dos próprios usuários.
5. **Dá para não raspar o BestEverAlbums no nível do álbum; no nível da faixa, quase ninguém tem o dado.** A saída sólida para a faixa é a nota da própria comunidade do app, que já existe como «meu ranking».

## 1. As travas de dados de um app público

| Fonte | Hoje (só você) | Num app público | Fonte da informação |
|---|---|---|---|
| Spotify | funciona | **Travado.** Em modo de desenvolvimento, até 5 usuários autorizados e conta Premium; o acesso ampliado só é pedido por organização registrada, e a imprensa cita o mínimo de 250 mil usuários ativos por mês | anúncios do Spotify de 2025 e 2026 (links no fim) |
| Apple Music | funciona | Funciona no iPhone (MusicKit nativo). No Android existe um SDK da Apple, que desenvolvedores relatam estar parado há anos e com falhas | página da Apple e fórum de desenvolvedores |
| Discogs (preço) | funciona, uso pessoal | **Não cabe:** o preço é dado restrito, de uso pessoal e não comercial, e os termos proíbem usar o conteúdo para levar tráfego a outras lojas | termos lidos em 2026-11-20 |
| BestEverAlbums | o servidor lê as páginas | **Pede autorização:** leitura automática de um site, em produto público e comercial | não há interface pública |
| IA (enriquecimento) | você paga | custo por usuário: pede limite por conta | — |

Consequência: um app público teria o **Apple Music como base** e o Spotify como «exportar por fora» (copiar a lista, abrir no Spotify) até haver escala para pedir o acesso ampliado.

## 2. Pilha de tecnologia, agora com Android

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

### Regras das lojas a cumprir (de memória, a conferir antes de começar)

- **Mínimo de funcionalidade (regra 4.2 da Apple):** um app que é só o site dentro de uma moldura costuma ser recusado. O revisor procura valor nativo de verdade (uso sem rede, avisos, integração com o aparelho, interface nativa).
- **Login com a Apple:** quem oferece login do Google no iPhone precisa oferecer também o da Apple.
- **Apagar a conta:** tem de ser possível de dentro do app.
- **Rótulo de privacidade** preenchido nas duas lojas, e política de privacidade publicada.

### Se o iPhone fosse a única plataforma

A minha primeira resposta, antes de o Android entrar: **Swift com SwiftUI e MusicKit nativo**. O desenho da F76 (barra de baixo, folhas, linhas compactas) é o vocabulário nativo do SwiftUI, a integração com o Apple Music é a melhor possível, e o caminho fica aberto para widget, Atalhos e Siri. Continua sendo a melhor escolha se o Android sair do plano ou ficar para muito depois. A parte que vale nos dois casos: as regras do app num lugar só (núcleo compartilhado ou servidor), para o site e o app não terem duas cópias.

### Se o app fosse só para você

O que já existe é quase o app:
- **Hoje:** o site da F76 adicionado à tela de início do iPhone abre em tela cheia, com ícone e nome.
- **Um degrau acima:** o site dentro de um Capacitor, distribuído pelo TestFlight interno, sem passar pela revisão pública da loja. Não exige resolver Spotify, Discogs nem BestEverAlbums, porque o uso continua pessoal.

## 3. Monetização do produto como ele é hoje

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

## 4. Independência do Discogs: um agregador de preços próprio

### A cláusula de tráfego do Discogs, em detalhe

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

## 5. O que considerar em termos legais

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

## 6. Agregador de rankings próprio, sem raspar o BestEverAlbums

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

## 7. Ordem que eu seguiria, se a decisão for avançar

1. **Conversas, antes de código:** pedir autorização ao BestEverAlbums; abrir contas de afiliado (Amazon, eBay); consulta jurídica sobre o modelo.
2. **Tirar a dependência do preço do Discogs:** catálogo por MusicBrainz e pelos arquivos abertos do Discogs; preço por afiliados e pelos usuários. O interruptor do Discogs já existe para desligar.
3. **Núcleo compartilhado:** mover receitas e ranking para `shared/`, com o site usando primeiro.
4. **Agregador de notas:** Wikidata como segunda fonte de álbum; a média da comunidade como fonte de faixa, quando houver usuários.
5. **App (Expo) em fatias:** Albums e janela do álbum; ranking; playlists com Apple Music; inventário com leitura de código de barras.
6. **Contas públicas:** login com a Apple, apagar conta, limites por usuário, política de privacidade.
7. **Monetização:** afiliação desde o primeiro dia; plano pago quando houver uso.

## O que não foi verificado

- Regras de exibição de preço do eBay e da Amazon; termos do Mercado Livre, do Deezer, do Last.fm, do Rate Your Music e do Album of the Year.
- A cobertura real de notas de álbuns no Wikidata.
- Se os arquivos mensais do Discogs trazem código de barras de cada edição (creio que sim; não abri um arquivo).
- Valores das taxas das lojas de apps e dos programas de desenvolvedor.
- Os casos Feist e Ryanair e a diretiva europeia, citados de memória.
- Nada disto é parecer jurídico.

## Fontes

- Spotify, critérios do acesso ampliado (2025): https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access
- Spotify, modos de cota: https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- Spotify, acesso de desenvolvedor (fev. 2026): https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
- TechCrunch sobre a mudança do Spotify (2026): https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/
- Apple, MusicKit: https://developer.apple.com/musickit
- Fórum da Apple, SDK de Android parado: https://developer.apple.com/forums/thread/734577
- Fórum da Apple, regra 4.2: https://developer.apple.com/forums/thread/806726
- MusicBrainz, sobre e licença: https://musicbrainz.org/doc/About
- Internet Archive sobre os arquivos abertos do Discogs: https://blog.archive.org/2020/12/06/discogs-thank-you-a-commercial-community-site-with-bulk-data-access/
- eBay, começar um app de compra: https://developer.ebay.com/develop/get-started/get-started-on-a-buying-application
- eBay, Marketplace Insights (restrito): https://www.developer.ebay.com/api-docs/buy/marketplace-insights/overview.html
- hiQ contra LinkedIn: https://en.wikipedia.com/wiki/HiQ_Labs_v._LinkedIn
- Morgan Lewis sobre raspagem de dados: https://www.morganlewis.com/de/blogs/sourcingatmorganlewis/2022/04/data-scraping-deemed-legal-in-certain-circumstances
- Termos da API do Discogs, lidos em 2026-11-20: `reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md`
