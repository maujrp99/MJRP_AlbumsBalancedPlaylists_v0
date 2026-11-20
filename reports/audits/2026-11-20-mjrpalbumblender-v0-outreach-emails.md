---
type: draft
subject: "Rascunhos de e-mail: pedido de autorização ao BestEverAlbums e pedido de apoio comercial ao MusicBrainz"
project: MJRP_AlbumsBalancedPlaylists_v0
written: "2026-11-20 12:05"
status: rascunho — o envio é do MJRP
related: reports/audits/2026-11-20-mjrpalbumblender-v0-public-product-study.md
---
# Rascunhos de e-mail · BestEverAlbums e MusicBrainz

**Para quem:** MJRP. São rascunhos: nada foi enviado. Os e-mails estão em inglês, porque os dois destinatários escrevem em inglês.

**Antes de enviar, confira:**
- Os trechos entre colchetes `[...]`: são escolhas suas (nome que assina, endereço, o que você aceita oferecer).
- O e-mail ao BestEverAlbums diz a verdade sobre o que o app faz hoje: lê páginas do site, para um usuário. Se preferir não dizer isso no primeiro contato, é decisão sua; eu recomendo dizer, porque pedir autorização escondendo o uso atual estraga a conversa se eles notarem depois.
- Não prometa datas de lançamento: o estudo ainda é para decidir.

## 1. BestEverAlbums — pedido de autorização

**Para:** a Amulet Solutions, dona do site (Stamford, Reino Unido), pela página de contato `besteveralbums.com/contact`. Os termos de uso (`besteveralbums.com/terms`) dizem que o conteúdo é «for your general information and use only» e que a reprodução é proibida sem permissão: por isso o pedido é de permissão por escrito, e o e-mail diz isso.

**Assunto:** Permission request: using BestEverAlbums track ratings in a small music app (with attribution)

```text
Hello,

My name is [Mauricio Pedroso]. I am a long-time user of BestEverAlbums and an
album collector, and I am writing to ask for your permission before taking a
personal project any further.

I built a small web app called The Album Blender. It lets a person group
albums into series, rank the tracks of each album, and build balanced
playlists from the best tracks of each album. Your track ratings are what
makes the "most acclaimed tracks" playlists possible: I have not found track
level ratings of this quality anywhere else.

I have read your terms of use. I understand the content is for general
information and use, and that reproduction needs your permission, so nothing
below would go public without it.

To be transparent about where things stand today: the app is used by one
person, me. For the albums in my own series, my server reads the album's
chart page on your site to get the track ratings. It asks slowly, one page at
a time, keeps what it read so it does not ask again, and every album in the
app links back to its page on BestEverAlbums. I realise I should have asked
first, and I am asking now.

I am considering turning the app into a public product (iPhone and Android).
Its income would come from affiliate links to stores that sell the CDs, not
from selling data. I am aware BestEverAlbums also works with Amazon's
affiliate programme, and I do not want to compete with you on the back of
your own data: I would rather send people to your site and, if it makes
sense to you, share that income. I would not do that with your data without your written
permission, so I would like to ask:

1. Would you allow The Album Blender to use BestEverAlbums track and album
   ratings in a public app, with visible attribution and a link to the
   album's page on your site wherever a rating is shown?

2. If so, which way of getting the data would you prefer?
   a) a data file or an API, if one exists or could exist;
   b) reading the public pages automatically, at a request rate you set;
   c) any other arrangement you suggest.

What I can commit to:
- "Ratings from BestEverAlbums" with a link, next to every rating.
- A request rate and a caching policy that you define.
- No redistribution of your data to third parties, and no bulk copy of
  your charts: only the ratings of albums a user has in the app.
- Removing your data from the app at any time if you ask.
- A share of the affiliate income, or a paid licence, if that is how you
  prefer to work. [confirm you want to offer this]

If the answer is no, I will respect it and remove the automated reading
before any public release. If you would rather discuss it on a call, I am
glad to.

Thank you for building and maintaining BestEverAlbums. It is the reason this
project exists.

Best regards,
[Mauricio Pedroso]
[e-mail] · [city, country]
[link to the app, if you want them to see it]
```

**Notas para você:**
- O ponto 1 pede o que o estudo chama de «autorização por escrito para uso comercial». Um «sim» por e-mail já serve de registro; guarde a resposta.
- A oferta de parte da receita passou a constar no texto, porque eles também são afiliados da Amazon e o app disputaria a mesma receita. Continua sendo decisão sua: tire a frase se não quiser oferecer.
- Se não houver resposta em duas ou três semanas, um segundo e-mail curto; depois disso, tratar como «não» e seguir o plano B do estudo (Anexo E).

## 2. MusicBrainz (MetaBrainz Foundation) — apoio comercial

**Para:** a fundação MetaBrainz, pelo cadastro de apoiadores do site (`metabrainz.org/supporters`) ou pelo contato indicado ali. Se o cadastro for um formulário, o texto abaixo serve para o campo de descrição.

**Assunto:** Commercial use of MusicBrainz data in a new music app: which supporter tier fits?

```text
Hello,

My name is [Mauricio Pedroso]. I am an independent developer working on a
music app called The Album Blender, and I would like to use MusicBrainz data
the right way from the start.

What the app does: a person groups albums into series, ranks the tracks of
each album, builds playlists from them, and keeps an inventory of the CDs
they own. I am evaluating a public release (iPhone and Android) whose income
would come from affiliate links to stores.

What I would use MusicBrainz for:
- identifying albums and their editions (release groups and releases),
  including lookup by barcode;
- stable identifiers (MBIDs) to match the same album across other sources;
- genres and basic release data (year, label, country, format).

What I understand, please correct me if I am wrong:
- the core data is CC0 and may be used commercially;
- the derived data (ratings, tags) and the Cover Art Archive are licensed for
  non-commercial use, so I do not plan to use them;
- commercial users are asked to support MetaBrainz financially, and the Live
  Data Feed for commercial use requires signing up.

My questions:
1. For a product at this stage (one developer, no revenue yet, a public
   launch being evaluated), which supporter tier is appropriate, and what
   does it cost?
2. Is the Live Data Feed the right way to keep my own copy of the data up to
   date, or do you recommend the web service API at this scale? What rate
   limits apply to a supporter?
3. Is there anything in how I describe my use that would need a different
   licence?

I would rather start as a small supporter now and grow the contribution with
the product than use the data without giving back.

Thank you for MusicBrainz.

Best regards,
[Mauricio Pedroso]
[e-mail] · [city, country]
```

**Notas para você:**
- Este pedido é de baixo risco: o núcleo dos dados já é de uso livre. A pergunta é quanto e como apoiar.
- A resposta dá um número que falta no estudo (o custo do apoio comercial).

## Depois de enviar

- Guardar as respostas (são o registro das autorizações).
- Avisar aqui, para eu atualizar o estudo com o que vier: o desfecho do BestEverAlbums decide o item 1 dos critérios de ir ou não ir.
