# F79 e F80 em produção — conferência (2026-11-21 08:01)

Publicado pelo `scripts/deploy-site.sh`, da `main` em `14e4f9c`, depois da palavra do MJRP («Bom dia pode publicar!»). Script principal no ar: `/assets/main-D712PA9d.js`. O servidor não mudou (`mjrp-proxy-00214-4z4`).

## O que foi visto em https://mjrp-playlist-generator.web.app
- `/` responde 200 com a página de entrada («The Album Blender — for people who listen to whole albums»), `cache-control: no-cache`, com as capas fictícias («Fictional albums · original art»); nenhuma imagem do servidor da Apple é pedida (o endereço só aparece na política de segurança da página).
- `/home`, `/albums`, `/inventory`, `/blend`, `/app.html` e `/home?signin` respondem 200 com o app.
- No navegador com a conta do MJRP aberta, largura de celular (507 px): `/` leva direto a `/home`, a Home nova («Pick the albums. We blend the playlists.»), sem rolagem lateral; `/?entry` mostra a página de entrada, sem rolagem lateral e sem erro no console.

## O que não foi visto
- A raiz como visitante de verdade num navegador (só pela resposta do servidor): o navegador de teste já tinha a conta aberta.
- Criar uma série pela Home nova em produção.
- iPhone de verdade, Safari, o 3D do caixote no computador em produção.

## Voltar
Console do Firebase > Hosting > histórico de versões > «Rollback» para a versão anterior (o build da `5c95f18`).

## Capas reais em produção (2026-11-21 08:10)

Palavras do MJRP: «vamos com as capas da Apple pq por enqto só eu uso». Publicado da `main` em `e79ac58` (script principal `/assets/main-NTQyvnTw.js`; 3722 testes passaram no script de publicação), com `VITE_SPLASH_COVERS=real` no `.env` da pasta da `main` desta máquina (o arquivo que o script de publicação lê; não está no repositório).

Visto em `https://mjrp-playlist-generator.web.app/?entry`, a 393 px, com a conta dele aberta:
- a página traz as 14 capas reais; as 6 mostradas inteiras no celular carregaram do servidor de imagens da Apple (`is1-ssl.mzstatic.com`); a marca «Fictional albums» saiu;
- UAT-231: a página mede 393 px de largura (sem rolagem lateral); o crédito mais longo («In the Aeroplane Over the Sea · Neutral Milk Hotel — Listen on Apple Music») termina em 377 px.

Não visto: a captura da tela rolada (a ferramenta recusou a rolagem depois da troca de largura), o computador com o 3D, iPhone de verdade, Safari.

## «Start» no menu, a caixa em diagonal e a capa da banana em produção (2026-11-21 12:17)

Publicado da `main` em `6909689` (script principal `/assets/main-CXGMhC4B.js`; 3748 testes passaram no script de publicação), pela fila própria do Album Blender, com a palavra do MJRP («publica»; «já podemos publicar pra prod com o achado?»).

Visto em https://mjrp-playlist-generator.web.app:
- a raiz, `/start`, `/home`, `/home?signin`, `/albums`, `/inventory` e `/app.html` respondem 200; a raiz serve a página de entrada, com 15 capas reais e «The Velvet Underground & Nico»; os botões dela apontam para `/start` e `/start?signin`;
- com a conta dele aberta, a 1002 px: `/` leva a `/start`, a Home; o menu e o rodapé dizem «Start»; o logotipo aponta para `/?entry`;
- `/?entry`: a página de entrada com o 3D ligado, a capa da banana na frente, sem rolagem lateral e sem erro no console;
- o conserto do contorno laranja da lista colada (UAT-232) está no CSS servido.

Não visto: o computador em tela larga (o painel do navegador tem 1002 px), cada posição da rolagem em produção, iPhone de verdade, Safari, criar uma série.

A publicação falhou quatro vezes antes desta, sem publicar nada: uma hora na fila sem rodar; o limite de trabalhadores da fila quebrando o executor de testes; dois erros de lint num script do levantamento de textos; e um teste de tempo do inventário que estoura em baixa prioridade (passou em prioridade normal).
