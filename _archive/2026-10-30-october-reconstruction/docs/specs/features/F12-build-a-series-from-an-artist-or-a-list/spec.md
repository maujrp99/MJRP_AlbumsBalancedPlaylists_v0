---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-02-find-an-artists-albums-and-pick-the-ones-to-mix]]", "[[S-03-paste-a-list-of-albums-to-build-a-series]]"]
planned_for: "[[ROADMAP#^REL-04]]"
---
<!-- docs/specs/features/F12-build-a-series-from-an-artist-or-a-list/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F12: Montar uma série procurando um artista ou colando uma lista de álbuns
**Approved**: not a gate

## Summary
**A feature:** na tela inicial, a pessoa procura um artista, vê a discografia do mais novo ao mais antigo, filtra por tipo (estúdio, EP, single, ao vivo) e escolhe os álbuns; ou cola uma lista com um «Artista - Álbum» por linha e vê os álbuns achados.

**Por quê:** a pessoa quer montar a série sem digitar o título de cada álbum, ou de uma vez, com a lista que já tem.

**Como saber que funcionou:** procurar um artista lista a discografia com os filtros por tipo; colar três linhas «Artista - Álbum» mostra o aviso «Processed 3 albums.» e os álbuns na área de montagem.

## Problem Statement
Digitar o título de cada álbum para montar uma série é lento; a pessoa precisa escolher a partir da discografia de um artista (S-02) ou colar a lista que já tem (S-03). Proveniência: Sprint 14 do ROADMAP legado («V3 Design System: Split-Panel Staging Area & Search») e Sprint 17.75 (classificação por tipo); commits cd4dc21 (2025-12-27) e 4c62a82 (2025-12-28). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa procura um artista, vê a discografia do mais novo ao mais antigo, filtra por tipo (estúdio, EP, single, ao vivo) e escolhe os álbuns; «Studio» começa ligado e o app entende apelidos de artista como «led zep». · from [[S-02-find-an-artists-albums-and-pick-the-ones-to-mix|S-02]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 4c62a82 (2025-12-28) — ver reports/evidence/F12/evidence.md
- [REQ-02] A pessoa cola uma lista com um «Artista - Álbum» por linha e vê os álbuns achados; a borda da caixa fica verde quando o formato está certo e laranja quando não, linhas sem «-» são ignoradas e o resultado vem num aviso «Processed N albums.». · from [[S-03-paste-a-list-of-albums-to-build-a-series|S-03]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit cd4dc21 (2025-12-27) — ver reports/evidence/F12/evidence.md

## Observable States
- S-02 · [[behavior#^home-scan-loading]] · [[behavior#^home-scan-found]] · [[behavior#^home-scan-not-found]] · [[behavior#^home-scan-failed]] · [[behavior#^home-discography-type-filters]] · [[behavior#^home-discography-filter-empty]] · [[behavior#^home-album-added-to-stack]] · [[behavior#^home-stack-empty]] · [[behavior#^home-stack-filled]]
- S-03 · [[behavior#^home-bulk-format-hint]] · [[behavior#^home-bulk-processed]] · [[behavior#^home-bulk-nothing-found]] · [[behavior#^home-bulk-failed]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-02 (REQ-01): «Studio» começa ligado; escolher um álbum o põe no conjunto, que se reordena arrastando; o app classifica cada álbum pelo tipo (álbum, EP, single, ao vivo, coletânea) e entende apelidos de artista como «led zep».
- Para S-03 (REQ-02): a borda da caixa fica verde quando o formato está certo e laranja quando não; linhas sem «-» são ignoradas; o resultado vem num aviso «Processed N albums.».

## Out of Scope
- Criar a série com os álbuns escolhidos (F01).
- Montar a série a partir da discografia por rota própria, de gênero ou vibe e de faixas soltas (itens que o v0 ainda não faz).
- A caixa de texto vazia, que falha hoje, está na lista de conserto do inventário do V1 e não nesta feature.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
