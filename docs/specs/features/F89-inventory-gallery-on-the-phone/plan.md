# Plan — Feature F89: A galeria de capas do inventário no celular · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
A galeria é uma segunda forma de desenhar os mesmos itens que a lista do celular desenha, na mesma tela (`InventoryView.renderPhone`), com as mesmas ações. Nada novo no computador. Três decisões, todas decididas pelo agente (revisáveis):

- **A visão que vale no celular é uma função pura** (`models/inventoryViewMode.js`): a escolhida, e a lista para quem nunca escolheu. O controlador passa a saber se a pessoa já escolheu (`viewChosen`); o padrão `grid` do computador não vale no celular.
- **A chave guardada é a do computador** (`mjrp_inventory_view_mode`, valores `grid` e `list`): a tela de Albums também divide a sua (`albumsViewMode`) entre as duas larguras. Quem escolheu a grade no computador a vê no celular.
- **A troca mora na folha «Filters and order»**, numa seção «View» com o ícone e o nome de cada visão (Gallery, List), como a tela de Albums põe a sua na folha de filtros; a barra do topo do inventário já tem quatro botões de 44 px.

O cartão (`InventoryPhoneTile`) tem a capa quadrada, o título e o artista, a linha do valor com a origem (`phoneValue`, o mesmo da lista), a situação (o mesmo botão que abre a folha de situação) e «⋯» (a mesma folha de ações do álbum, que traz «Open album», «Edit», o valor, «Where to buy» e «Remove»). Tocar na capa ou no título abre a janela do álbum, como na lista.

## Technical Design
- `public/js/models/inventoryViewMode.js` — `viewForPhone({ viewMode, viewChosen })`. (REQ-01)
- `public/js/controllers/InventoryController.js` — `viewChosen` (lido em `loadSettings`, ligado em `handleViewModeChange`). (REQ-01)
- `public/js/views/renderers/InventoryPhoneTile.js` — `phoneTile(item, value, money)`, `phoneGallery(items, known, shown)`; as mesmas peças da lista (`phoneValue`, `statusText`, `MORE_ICON`, a paginação). (REQ-02)
- `public/js/views/InventoryPhoneSheets.js` — `openFiltersSheet` ganha a seção «View». (REQ-01)
- `public/js/views/InventoryView.js` — escolhe lista ou galeria; `redrawCard`, `phoneRowAt` e o resto passam a achar os dois. (REQ-03)
- `public/css/mobile/inventory.css` — a grade e o cartão, dentro da consulta do celular. (REQ-01, REQ-02, REQ-04)

## Dependencies
F76 (a tela do celular), F75 (o cartão e o valor do inventário). Nenhuma biblioteca nova, nenhuma cor nem ícone novo.

## Documents Consulted
`docs/specs/features/F76-mobile-redesign/{spec,plan,tasks}.md`, `docs/specs/behavior.md`, `docs/specs/design-system.md`, `public/js/views/InventoryView.js`, `public/js/views/renderers/InventoryPhoneRow.js`, `InventoryGridRenderer.js`, `InventoryPhoneSheets.js`, `public/js/components/ui/AlbumPhoneCard.js`, `public/css/mobile/inventory.css`, `public/css/mobile/albums.css`.

Declarações:
- `docs/specs/constitution.md`, `docs/specs/arch.md`, `docs/specs/data-model.md`, `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nem entidade nova
- `docs/specs/behavior.md`, `docs/specs/info-arch.md` — atualizados no fecho
- `docs/specs/design-system.md` — atualizado só se o cartão pedir uma medida nova (§ Celular)

## Risks & Considerations
- Três cartões em 393 px deixam 109 a 115 px por cartão: o texto é de 12 px (o mínimo da F76) e o título é cortado em duas linhas; se o MJRP preferir 2 colunas, é um número só no CSS.
- Nada disto foi visto num iPhone de verdade (Safari, a barra que encolhe, o toque).
