---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-23-connect-my-spotify-account]]", "[[S-24-send-the-playlists-to-spotify-merged-or-separate]]", "[[S-26-compare-the-critics-rating-with-spotify-popularity]]"]
planned_for: "[[ROADMAP#^REL-03]]"
---
<!-- docs/specs/features/F11-spotify-connect-compare-and-send/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F11: Conectar o Spotify, comparar a nota da crítica com a popularidade e enviar as playlists
**Approved**: not a gate

## Summary
**A feature:** a pessoa conecta a conta do Spotify, vê lado a lado a nota da crítica e a popularidade no Spotify de cada faixa e envia as playlists para o Spotify, como uma só playlist privada ou uma para cada uma.

**Por quê:** a pessoa quer escolher a mistura sabendo onde as duas fontes discordam e ouvi-la no Spotify.

**Como saber que funcionou:** com o Spotify conectado, a tabela de faixas mostra a popularidade ao lado da nota da crítica e o envio mostra quantas faixas foram achadas e a taxa de acerto.

## Problem Statement
Conectar o Spotify (S-23) é o que dá ao app a popularidade das faixas (S-26) e o destino de exportação (S-24); as três histórias formam um só ciclo de uso da integração. Proveniência: Sprint 11 do ROADMAP legado («Spotify OAuth Integration», «Spotify Data Enrichment», «Export to Spotify», «Multi-Source Ranking UI»); commits b9530f1, 4ac955d, 6013d87 (2025-12-19) e 2336104 (2025-12-20). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa conecta a conta do Spotify e a desconecta quando quiser; o botão mostra «Connect» ou «Connected <nome> ✕», o navegador pergunta antes de desconectar e a conexão fica guardada no navegador. · from [[S-23-connect-my-spotify-account|S-23]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 4ac955d (2025-12-19) — ver reports/evidence/F11/evidence.md
- [REQ-02] A pessoa envia as playlists para o Spotify como uma só playlist privada ou como uma playlist para cada uma; a janela mostra o progresso, quantas faixas foram achadas, a taxa de acerto e até 10 faixas não achadas. · from [[S-24-send-the-playlists-to-spotify-merged-or-separate|S-24]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 6013d87 (2025-12-19), 2336104 (2025-12-20) — ver reports/evidence/F11/evidence.md
- [REQ-03] A pessoa vê lado a lado, para cada faixa, a nota da crítica e a popularidade no Spotify; com o Spotify conectado o app busca a popularidade em segundo plano, o botão «Enrich Data» faz o mesmo para um álbum e, sem conexão, o app diz «Connect to Spotify first…». · from [[S-26-compare-the-critics-rating-with-spotify-popularity|S-26]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit b9530f1 (2025-12-19) — ver reports/evidence/F11/evidence.md

## Observable States
- S-23 · [[behavior#^spotify-connect-button]] · [[behavior#^spotify-connect-result]] · [[behavior#^local-preferences-and-tokens]]
- S-24 · [[behavior#^spotify-export-steps]] · [[behavior#^spotify-export-merge-or-separate]] · [[behavior#^spotify-export-success]] · [[behavior#^spotify-export-error]]
- S-26 · [[behavior#^album-detail-modal]] · [[behavior#^album-enrich-spotify]] · [[behavior#^spotify-background-enrichment]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-23 (REQ-01): o botão mostra «Connect» ou «Connected <nome> ✕»; ao desconectar o navegador pergunta antes; a conexão fica guardada no navegador.
- Para S-24 (REQ-02): a janela mostra o progresso, quantas faixas foram achadas, a taxa de acerto e até 10 faixas não achadas.
- Para S-26 (REQ-03): com o Spotify conectado, o app busca a popularidade em segundo plano; o botão «Enrich Data» faz o mesmo para um álbum; sem conexão, o app diz «Connect to Spotify first…».

## Out of Scope
- O botão «Open in Spotify» do modo separado: não faz nada hoje, tratado em outra frente do conform.
- Enviar para o Apple Music (F10).
- Misturar por popularidade: a receita «Top N» por popularidade é F08.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
