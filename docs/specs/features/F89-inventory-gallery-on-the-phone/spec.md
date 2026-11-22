---
status: In Progress
lane: standard
solution_type: feature
imports: ["[[S-71-see-the-inventory-as-a-gallery-on-the-phone]]"]
planned_for: "[[ROADMAP#^REL-40]]"
---
# Feature F89: A galeria de capas do inventário no celular
**Approved**: pendente. O MJRP pediu em 2026-11-21 («1. Acrescenta»); o desenho segue o cartão do inventário do computador e o cartão de Albums no celular, sem protótipo julgado antes (decidido pelo agente, revisável: o MJRP julga no iPhone, como na F76).

## Summary
**A feature:** O inventário no celular ganha a galeria de capas, além da lista, com a troca entre as duas.

**Por quê:** No computador o inventário tem a grade de capas e a lista; no celular (F76, REQ-11) só existe a lista, e o MJRP quer reconhecer os discos pela capa.

**Como saber que funcionou:** No iPhone, o MJRP abre o inventário, troca para a galeria, vê as capas em grade com título, artista, situação e valor, abre um álbum, muda a situação e acha onde comprar, e volta à lista; a escolha fica guardada.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «no inventory não tem a view de galeria? só de lista?»; à pergunta «Galeria no inventário do celular: sim ou não?»: «1. Acrescenta». Issue: UAT-274. Nasce como feature própria porque a F76 (a dona do inventário do celular) já está em «Pronto para UAT», e reabri-la é do MJRP.

## Requirements
«Celular» aqui é a tela de até 899 px de largura (a linha que a F88 moveu de 767 px).

- [REQ-01] No celular, o inventário tem também a galeria de capas, além da lista: as capas numa grade com as mesmas colunas, vãos e tamanho de capa da grade de Albums em toda largura do celular (2 por linha, 3 de 640 px até 899 px), com o mesmo ícone de troca entre galeria e lista que o computador e a tela de Albums têm no celular, e a escolha guardada. · fixes S-71
- [REQ-02] Cada cartão da galeria mostra o que a linha da lista mostra e cabe num cartão: a capa, o título e o artista, o formato e a marca Owned ou Wishlist, a linha do valor com a origem e as médias; e dá as mesmas ações da lista: abrir a janela do álbum, mudar a situação, «Where to buy», com alvos de pelo menos 44 px. · fixes S-71
- [REQ-03] Filtros, busca, ordem, contagens, o aviso dos valores («N albums are waiting for a value» / «Read them now») e «Update values» valem igual nas duas visões; quem nunca escolheu vê a lista. · fixes S-71
- [REQ-04] A tela de 900 px para cima não muda (ela já tem a grade e a lista). · fixes S-71

## Observable States
Em `docs/specs/info-arch.md` § Estados no celular: [[info-arch#^inventory-phone-gallery-default]], [[info-arch#^inventory-phone-gallery-switch-open]], [[info-arch#^inventory-phone-gallery-no-cover]]. As regras, em `docs/specs/behavior.md` [[behavior#^phone-inventory-gallery]].

## Success Criteria
- **REQ-01** · a galeria tem as colunas e os vãos de Albums (medido a 320, 360, 375, 393, 430, 600, 640, 768, 820 e 899 px: 2 colunas até 639 px, 3 dali; vão de 12 e 20 px); a troca está na folha «Filters and order», com o ícone e o nome de cada visão, e a escolha volta ao reabrir a tela.
- **REQ-02** · cada cartão tem a capa, o título (até duas linhas, cortado se longo), o artista, a linha do valor, as duas médias, a situação e «⋯», e os dois botões têm 44 px; um álbum sem capa mostra o mesmo substituto da lista.
- **REQ-03** · os testes da tela provam as duas visões com a mesma busca, o mesmo filtro e a mesma ordem; o aviso dos valores e o botão «Update values» são os mesmos.
- **REQ-04** · `test/architecture/phoneStylesStayOnThePhone.test.js` passa; nenhuma regra nova fora da consulta de mídia.
- A prova no navegador está em `reports/evidence/F76/inventory-gallery-phone/` (WebKit, iPhone 14, iPhone SE e 820 px). Um iPhone de verdade não foi usado.

## Out of Scope
Mudar o inventário do computador; uma capa maior com o nome da série; arrastar para reordenar.

## Open Questions
- A troca fica na folha «Filters and order», como na tela de Albums; se o MJRP a quiser num botão sempre à vista na barra, a barra perde largura da busca.
- Decidido: a galeria segue a grade de Albums (2 colunas a 393 px, 3 de 640 px), como foi prometido («igual à da tela de Albums»); as colunas, os vãos e o tamanho de capa vêm das mesmas variáveis (`--phone-cover-*`).
