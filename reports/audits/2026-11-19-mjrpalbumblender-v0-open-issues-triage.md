# Triagem das issues abertas contra o código de hoje — 2026-11-19 21:03

Leitura do código da `main` em `1d29ca1` (F58 em produção), sem navegador e sem rodar testes. Cada veredito vem da leitura do código e do log do projeto. Feita por um auxiliar em passagem só de leitura; o integrador conferiu o tráfego da rota `/api/playlists` no registro do Cloud Run.

## Vereditos

| Issue | Veredito | Por quê, em uma linha | O que falta |
|---|---|---|---|
| UAT-31 gestão de estado das lojas | não acontece mais | nenhuma tela zera a prateleira; a carga tem um dono (F45, F46, F56) | aceite |
| UAT-62 autocomplete | não acontece mais | entregue de outro jeito: busca por artista com um seletor (F57) e colar lista (F63) | aceite |
| UAT-73 filtro de tipo na Home | não acontece mais | os filtros existem, num seletor só (F57) | aceite |
| UAT-84 documento de fluxo de dados incompleto | não acontece mais | o arquivo não existe mais; o fluxo está no `arch.md` e no manual | aceite |
| UAT-152 salvar ranking sem permissão; ordenação | não acontece mais | salva com o usuário real; regra do banco restrita ao dono (F59); ordenação ligada | aceite |
| UAT-22 duas receitas de imagem e Node 18 | não acontece mais | uma receita só, `node:24-slim` (F64, ADR-0020) | aceite |
| UAT-29 tasks fechadas sem rodadas | não acontece mais | as features F01 a F18 foram arquivadas; nenhuma task fechada sem `rounds::` hoje | aceite |
| UAT-75 selo «PENDING» com nota existente | não acontece mais (confiança média) | o selo «PENDING» não existe mais | um olhar num cartão no navegador |
| UAT-101 lista de séries vazia na primeira carga | não acontece mais (por leitura) | as opções são refeitas a cada desenho | uma carga a frio no navegador |
| UAT-143 filtro «Studio» com singles de eletrônica | não acontece mais no código | um classificador só, com contagem de faixas e lista da IA (F57) | julgamento do MJRP com artistas reais |
| UAT-181 busca de álbum por IA | não acontece mais no código | o 402 do provedor sai como falha sem repetição (F52) | ver em produção os álbuns que dependem da IA |
| UAT-30 clique no álbum dá «Album Not Found» | em parte | o cartão abre uma janela; a mensagem só sobrevive na tela de ranking por endereço | junto com a UAT-10 |
| UAT-61 exportação perde faixas | em parte | a parte silenciosa foi consertada (F62: faixas não achadas são relatadas); o casamento em si nunca foi rodado | uma exportação real |
| UAT-20 a verificação de código não bloqueia | em parte | a CI roda os testes (com os testes de arquitetura); o lint e a busca de segredos ainda não | F64/F65 |
| UAT-202 automação que nunca rodou | em parte | os roteiros de publicação recusam `main` suja e teste falhando; a CI do GitHub nunca rodou | um push do MJRP |
| UAT-18 lojas que chamam banco | em parte | sobra uma: a loja de enriquecimento do Spotify | F69 |
| UAT-19 telas pulam a camada de serviço | em parte | sobram seis arquivos de blend e playlists que importam `app.js`; dois deles são código morto | F65 e uma fatia própria |
| UAT-23 falha de leitura vira resposta vazia | em parte | notas e lista da IA consertadas (F52); o caminho de `/api/generate` ainda engole falhas em quatro pontos | uma quinta fatia da F52 |
| UAT-193 adicionar e editar com lógicas separadas | séries: não acontece mais (F57); playlists: um caminho só, por leitura | uma tela, um controlador, um serviço; o modo é uma marca | julgamento do MJRP |
| UAT-21 testes de curadoria apontam para arquivo que não existe | ainda acontece | três testes do servidor importam um caminho que não existe | F65 |
| UAT-203 código morto, estilos sem definição, roteiros que não rodam | ainda acontece | cerca de 4.800 linhas em módulos que nada importa, mais scripts e páginas fora da build | F65 |
| UAT-10 telas de ranking só por endereço | ainda acontece | nenhuma ligação leva a elas, e não se sustentam sozinhas | decisão: aposentar ou religar |
| UAT-11 tela de migração | ainda acontece | botão nunca desenhado; migra chaves que nenhuma versão atual grava | decisão: remover |
| UAT-28 chaves do Spotify no navegador | ainda acontece | token de acesso e de renovação no `localStorage`; apagados ao sair (F59) | decisão do MJRP |
| UAT-17 token em scripts do repositório | ainda acontece | dois scripts, os dois sem uso | o MJRP troca o token; os scripts saem na F65 |
| UAT-63 capa que falha ou pisca | não dá para dizer sem navegador | o cartão não tem substituto quando a capa falha | conserto pequeno |

## Código morto hoje (base da F65)

- **Módulos de `public/js` que nada importa:** cerca de 4.800 linhas, entre eles oito algoritmos antigos, `cache/albumCache.js`, `repositories/SharedAlbumRepository.js`, `components/Autocomplete.js`, `services/PlaylistPersistenceService.js`, `views/playlists/PlaylistsDragDrop.js`, geradores de SVG e vários componentes soltos.
- **Só alcançáveis por rota sem ligação:** a tela de migração (`SaveAllView`, `MigrationUtility`, `AlbumRepository`, o código «Data Sync» do menu) e as duas telas de ranking.
- **Servidor:** a rota `POST /api/playlists` e o `shared/curation.js` (517 linhas), que nenhum cliente chama; no registro do Cloud Run dos últimos 30 dias há um pedido só, um teste do integrador em 2026-11-19. Onze scripts em `server/scripts/`, testes do servidor que nunca rodam, três configurações de lint.
- **`scripts/` e raiz:** treze geradores de dados sem uso (2.616 linhas; dois com o token do Discogs), e arquivos soltos na raiz.
- **Páginas em `public/` fora da build:** depuração, protótipos e `legacy/`.
- **Testes de coisas mortas ou que não rodam:** os de `test/e2e` (seletores que não existem mais), `tests/`, `test/scripts`.

## `package.json`

- Usados e não declarados: `espree` e `postcss` (testes de arquitetura).
- Declarados e usados só por scripts mortos: `jsonwebtoken` e `dotenv` na raiz; sete pacotes de desenvolvimento no servidor.

## Links quebrados na documentação

222 links de Markdown para arquivos que não existem; 204 estão em material arquivado ou importado (`docs/archive`, planos antigos das features F21 a F44). A documentação viva tem cerca de dez.

## Não feito nesta triagem

ESLint não foi rodado (sem dependências instaladas nessa pasta); o doctor não foi rodado; nada foi visto num navegador.

## Conferido no navegador pelo integrador (2026-11-19 21:56)

App local com a conta do MJRP, tela de álbuns com todas as séries, carga a frio da página.

| Issue | O que foi visto |
|---|---|
| UAT-101 lista de séries vazia na primeira carga | a lista tinha 48 opções («All Series» mais as 47 séries) 1,1 s depois de a página abrir |
| UAT-75 selo «PENDING» com nota existente | nenhum «PENDING» na tela com 165 cartões; os selos são «BESTEVERALBUMS», «SPOTIFY» e «MY RANKING» |
