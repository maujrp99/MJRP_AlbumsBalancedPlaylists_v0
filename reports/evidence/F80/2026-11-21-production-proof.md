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
