# MJRP_AlbumsBalancedPlaylists_v0

<!-- Conform, pacote A, 2026-10-28 12:00. Cada campo cita a documentação do v0; nada aqui foi redigido do zero.
     Abreviações das fontes: Prod_Vision = docs/MJRP_Album_Blender_Prod_Vision.md · README = README.md ·
     CONSTITUIÇÃO = docs/CONSTITUTION.md · ROADMAP legado = docs/ROADMAP.md. Número depois do arquivo = linha.
     Campo marcado «a perguntar ao MJRP (P-NN)» é do MJRP: a pergunta está no relatório do pacote A. -->

## Propósito (WHY)

Resgatar a apreciação profunda da música numa era de consumo superficial.
<!-- fonte: Prod_Vision:11 («rescue the deep appreciation of music in an era of superficial consumption»); README:6 («restore the depth of music appreciation»). -->

## Visão (WHERE)

a perguntar ao MJRP (P-01)

## Objetivo (WHAT)

Entregar a quem ouve música uma plataforma de curadoria que funciona como uma camada de inteligência acima dos serviços de streaming: ela mistura dados brutos (álbuns, aclamação da crítica e popularidade) em experiências de audição coerentes, equilibradas e personalizadas. Por dentro, toda curadoria nasce numa série (o conjunto de álbuns, de um artista, de um gênero ou de faixas soltas que a pessoa escolhe misturar), passa pelo Menu de Mistura e termina numa playlist. O v0 está em produção como aplicação web de página única em JavaScript puro, com Vite no front-end, servidor Node em Cloud Run, Firestore para guardar os dados e integrações com Spotify e Apple Music. A meta de curto prazo, segundo o roadmap legado, é estabilidade e qualidade do que já está em produção (testes ponta a ponta, auditoria de desempenho, limpeza da documentação) e, na sequência, ampliar a mistura com contexto entre séries e ferramentas de descoberta.
<!-- fontes: README:3,6,61 · Prod_Vision:13-15,23-36 (o modelo de séries prevê álbum, artista, gênero e faixas; no v0 em produção as rotas de artista, gênero e faixas aparecem como «em breve» — inventário do V1, §1.9) · CONSTITUIÇÃO:13,46-55 · ROADMAP legado:13-16,285-289. -->

## Como (HOW)

A estratégia, como a documentação a declara: não competir com os serviços de streaming, e sim ser a camada de inteligência acima deles (o Spotify e o Apple Music tocam; o Album Blender cura); dar ao usuário soberania para escapar das bolhas dos algoritmos, com ferramentas para curar, organizar e sequenciar a música com precisão; manter o álbum como núcleo e atender um público mais amplo aceitando artista, gênero e faixas soltas como pontos de entrada; e apoiar as recomendações em fontes cruzadas: avaliação da crítica (BestEverAlbums e Album of The Year), popularidade no Spotify e, como planejado, inteligência artificial. O plano está no [ROADMAP.md](ROADMAP.md).
<!-- fontes: Prod_Vision:13 (camada de inteligência), :14 (soberania do usuário), :21 (núcleo em álbuns, outras entidades como entrada), :44-50 (fontes de dados). -->

## Vibe

Premium, dinâmica e polida: paletas escolhidas a dedo, microanimações e design responsivo; a interface deve parecer «viva», sem clique morto nem falha silenciosa. Na prática, o guia de estilo descreve painéis de vidro, o tema «tech» nos botões, o laranja da marca como cor de destaque e uma cor fixa por fonte de ranking (laranja para a crítica, verde para a popularidade no Spotify, azul para o ranking do próprio usuário). Nome da paleta: a perguntar ao MJRP (P-02).
<!-- fontes: CONSTITUIÇÃO:6-8 · docs/manual/31_UI_Style_Guide.md (seções «Button System» e «Color Tokens»; «Data Source Color Coding»). -->

## Design DNA

Referência visual: o próprio v0 em produção (https://mjrp-playlist-generator.web.app, README:67), os estilos em `public/css/` e o guia de estilo `docs/manual/31_UI_Style_Guide.md`. Ainda não há protótipo aprovado nem design system registrado (`design/wireframes/` está vazio em 2026-10-28).
