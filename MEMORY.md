# MEMORY

## Now

**Where the Work Stopped.** (2026-11-20 02:57) **F75 e F76 estão em produção**, feitas na madrugada com o MJRP dormindo. Site da `993b317` (pacote `main-CEiz0KA2.js`), servidor na revisão `mjrp-proxy-00213-qpq` com `DISCOGS_TOKEN` vindo do secret `discogs-token` (a volta de antes da F75 é `mjrp-proxy-00209-prz`). **F75**: cartão v5.1, contagens como filtro, valor à mão, totais, quatro moedas, links de compra, ordem por valor, interruptor (`DISCOGS_VALUES=off`); a leitura na conta dele deu valor a 198 de 211 álbuns ($1,166.51 no que tem). O Discogs recusa a sugestão em três estados sem as configurações de vendedor: o valor mostrado é o menor preço à venda, dito na tela. **F76**: base do celular (barra de baixo, barra do topo, folhas, 44/12/16, ícone da tela de início) e cinco telas redesenhadas (Albums, janela do álbum e ranking, Playlists e gravadas, Home e Blend, Inventário), tudo só abaixo de 768 px; provado a 393x852 na conta dele e a 1280x800 sem nada do celular. Benchmark e sua conferência em `reports/audits/2026-11-20-…-mobile-ux-benchmark*.md`. Uma crítica de UX independente das telas novas estava rodando (`…-mobile-ux-recheck.md`). Nada foi enviado ao remoto.

**Pending on Agent.** F76: aplicar os achados da crítica independente; dobrar as notas `docs/specs/features/F76-mobile-redesign/screens/*.md` em `info-arch.md`, `behavior.md` e no manual; encolher o cabeçalho do inventário no celular (o aviso do Discogs empurra a lista). F75: a edição escolhida é a mais colecionada, não a mais vendida (5 álbuns «None for sale»). Passos retroativos de F71 a F76 (reconferência visual, `verified_by`).

**Pending on Human.** Usar o app no iPhone e julgar a F76 (o desenho foi decidido pelo agente, sem protótipo julgado: TASK-09). No celular, tocar «Read them now» no inventário (os valores do Discogs ficam só no navegador, por seis horas). Preencher as configurações de vendedor no Discogs para ter os três estados. Julgar: o valor do Discogs acima dos links da Amazon e da iMusic (cláusula de tráfego dos termos); a imagem de fundo da Home escondida no celular; F74 «Aisle of Plenty». Aceite e carimbos de F71 a F76; push.

**Do Not Forget.** O secret `discogs-token` nunca é lido nem impresso por agente. Preço do Discogs nunca vai ao Firestore. Regra do celular: tudo em `@media (max-width: 767px)` (teste `phoneStylesStayOnThePhone`), um CSS por tela em `public/css/mobile/`. O limite semanal do Fable estava em 82% às 02:30; as telas foram feitas em Opus 5.5 esforço high; o reset é do MJRP.

## Ways of Working

