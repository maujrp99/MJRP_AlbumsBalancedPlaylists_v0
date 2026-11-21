---
status: In Progress
lane: standard
solution_type: feature
imports: ["[[S-63-use-the-album-blender-in-my-language]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F81: O site em mais de um idioma
**Approved**: pendente

## Summary
**A feature:** O site passa a existir em inglês e em português do Brasil. Os textos saem do código e vão para um dicionário por idioma; a pessoa vê o site no idioma do lugar de onde acessa e pode trocá-lo, e a troca dela vale dali em diante.

**Por quê:** Hoje o site só existe em inglês, e todo texto mora dentro do código; o produto vai a público (v6.0) e o dono é brasileiro. O levantamento (`design/copy/album-blender-copy.md`) achou 1106 textos distintos em 1437 pontos do código; sem tirá-los do código não há como ter um segundo idioma nem um CMS que os edite (F82).

**Como saber que funcionou:** Abrindo o site de uma conexão do Brasil pela primeira vez, tudo aparece em português; de outro país, em inglês; trocando o idioma, a tela inteira troca, e o site abre no idioma escolhido nas visitas seguintes, mesmo vindo do outro país. O mesmo busca-textos que fez o mapa (`scripts/i18n/scan-copy.cjs`) não acha mais texto solto no código.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «As próximas features agora serao de internacionalizar o site e criar um admin como temos nos sites do MJRP personal, utilizando o CMS-kit nosso.» Hoje: só inglês; cada texto escrito dentro do código (DOM montado à mão em `public/js`, a página de entrada em `public/splash.html`, `public/index.html`); 23 pontos mostram na tela a mensagem crua de um erro (`error.message`, em inglês, às vezes de terceiros); nomes de playlist gerados («Greatest Hits», «Deep Cuts Vol. 1») são gravados já em inglês.

## Requirements
- [REQ-01] Todo texto de interface do mapa (`design/copy/album-blender-copy.md`) vem de um dicionário por idioma (inglês e português do Brasil), não do código; o código só guarda o identificador · fixes S-63
- [REQ-02] Na primeira visita, o idioma vem do país de onde a pessoa acessa, sem pedir a localização ao navegador: Brasil → português do Brasil; qualquer outro país, ou país desconhecido → inglês · fixes S-63
- [REQ-03] Quando a pessoa escolhe um idioma, a escolha vale acima do país, em toda visita seguinte: guardada no aparelho e, com conta aberta, na conta (a conta vale em outro aparelho) · fixes S-63
- [REQ-04] Há um seletor de idioma à vista em todas as telas, na página de entrada e no celular, que mostra o idioma de agora e troca a tela inteira sem recarregar o trabalho em curso (série montada, playlists não salvas) · fixes S-63
- [REQ-05] Um conceito tem um rótulo só, em todas as telas e nos dois idiomas (cânone IA-02): as divergências de hoje listadas no relatório (`reports/audits/2026-11-21-mjrpalbumblender-v0-f81-copy-survey.md`) ficam resolvidas antes da migração, na decisão do MJRP · fixes S-63
- [REQ-06] Nomes de álbuns, artistas e faixas, e as marcas (The Album Blender, Spotify, Apple Music, Discogs, BestEverAlbums), nunca são traduzidos · fixes S-63
- [REQ-07] Texto montado de pedaços (contagens, plurais, «Added 13 albums. Undo», datas, horas, moedas) segue o idioma da tela: o plural, a ordem das palavras, o formato da data e o da moeda · fixes S-63
- [REQ-08] Uma falha nunca mostra a mensagem crua de um erro: mostra o texto do idioma da tela para aquele caso (os 23 pontos que hoje repassam `error.message`; o servidor responde só um código) · fixes S-63
- [REQ-09] A página de entrada e `index.html` (título, descrição, `lang`) aparecem no idioma escolhido ou do país já na primeira pintura e lidos sem script · fixes S-63

## Observable States
- **Seletor de idioma:** mostra «EN» ou «PT» (e o nome por extenso para o leitor de tela); aberto, lista os dois; trocar muda o texto de todos os itens visíveis e o `lang` da página; o foco volta ao seletor.
- **Primeira visita, por país:** sem escolha guardada → Brasil: português; outro país: inglês; o servidor não sabe o país: inglês. A página não pisca em outro idioma antes de pintar.
- **Escolha lembrada:** com escolha no aparelho → vale, mesmo vindo de outro país; com conta aberta e escolha na conta → a da conta vale em outro aparelho; a escolha mais recente vence quando aparelho e conta divergem.
- **Dicionário carregando / texto que falta:** enquanto o dicionário carrega a tela mostra o idioma anterior ou inglês, nunca o identificador; se faltar a chave no português, mostra o inglês e registra a falta; o identificador cru nunca aparece.
- **Falha:** cada falha mostra seu texto no idioma da tela (REQ-08).

## Success Criteria
- Do Brasil e de fora, a primeira visita abre no idioma certo; a escolha da pessoa sobrevive a recarregar e vence o país.
- Em cada idioma, as telas Start, Séries, Ranking, Blend, Playlists, Inventário, a página de entrada e os menus não têm texto no outro idioma, a 1280 e a 393 px.
- `node scripts/i18n/scan-copy.cjs` sobre o código migrado acha 0 textos fora do dicionário (a lista de exceções é o «Fora deste mapa»).
- O juiz da reconferência visual troca o idioma na tela (PRINCIPLES.md; plano da F84).

## Out of Scope
- Outros idiomas além de inglês e português do Brasil.
- O app (F78, em pausa) e a edição dos textos pelo CMS (F82; esta feature deixa o dicionário no formato `{pt, en}` que ele vai editar).
- Traduzir o que vem dos catálogos (álbuns, artistas, faixas) e o conteúdo já gravado pelas pessoas (nomes de séries, de lotes, de playlists).
- Mudar o que um texto diz: a revisão do mapa muda palavras, não tira nem põe item de tela.

## Decided by the owner
- **Como o idioma é escolhido** (MJRP, 2026-11-21 09:05, Control Center, lote `reports/proposals/2026-11-21-0845-v0-pending-decisions.md`, D-03): «De acordo com a geo location primeiro e depois a selecao do user toma precedencia».
- Como foi lido pelo agente: na primeira visita o idioma vem do lugar de onde a pessoa acessa (Brasil → português do Brasil; outro lugar → inglês); quando a pessoa escolhe um idioma, a escolha dela vale dali em diante, acima do lugar. Os idiomas são inglês e português do Brasil.
- O que ele não disse, decidido pelo agente — revisável: sem saber o lugar, o site abre em inglês (é o idioma de hoje); a escolha da pessoa fica guardada no aparelho e, com conta, na conta.
- A conferir na proposta: de onde vem o lugar (o país que o Firebase Hosting ou o servidor informa, sem pedir a localização ao navegador) e o que os buscadores veem.

## Open Questions
Cada uma virou pergunta numerada em «Decisões do MJRP» no relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-f81-copy-survey.md`; o que segue é o resumo:
- De onde vêm os textos: arquivos no repositório (dicionário), ou o CMS (F82). **Chega com a proposta de arquitetura da F83**, que define o contrato do dicionário.
- A página de entrada (F80) entra nesta feature (recomendação do agente: sim, é o primeiro texto que um visitante lê) e o app (F78) fica fora.
- O vocabulário do produto (Blend, Series, Compendiums, Deep Cuts, Greatest Hits…) e as divergências de rótulo (IA-02): perguntas D-01 a D-10 do relatório.
- Os nomes de playlist gerados e os prompts de IA do servidor (hoje em português e inglês, fixos) mudam de idioma ou não.
- Como o MJRPpersonal internacionalizou os sites dele (`messages/pt.json`/`en.json`, par `{pt, en}`): reaproveita-se o formato, não a biblioteca.
