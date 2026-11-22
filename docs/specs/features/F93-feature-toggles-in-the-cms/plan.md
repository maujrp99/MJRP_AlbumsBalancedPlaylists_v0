# Plan — Feature F93: Chaves para ligar e desligar features em produção, pelo CMS · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Em esboço: **uma proposta de arquitetura vem antes de qualquer construção** (`mjrp-designing-architecture`, com a crítica separada).

O que é sabido (conferido no código em 2026-11-22): o Discogs já tem um interruptor no servidor, `server/lib/valueSources/valueSwitch.js` (`discogsSwitch`): ligado só com o token do Discogs e sem `DISCOGS_VALUES=off`, lido do ambiente a cada pedido, com `DISCOGS_VALUES_FOR` para pessoas nomeadas; o app lê o estado em `GET /api/value-sources` (`public/js/api/valueApi.js`) e, desligado, não mostra valor, botão nem aviso do Discogs. O código do Discogs no app está espalhado: `models/inventoryValue.js`, `buyLinks.js`, `controllers/InventoryValues.js`, `components/InventoryValueSection.js`, `Footer.js`, as telas do inventário e `services/albums/clearAlbumCaches.js`. Ou seja: o «sem rastro na tela» já existe para o Discogs, mas o «sem carregar código» não.

O que precisa ser desenhado: de onde o app e o servidor leem as chaves guardadas no CMS (e o que acontece se o CMS cair: valor de reserva); a porta única de chaves; como uma feature vira um módulo carregado sob demanda, para que desligada não entre no pacote da tela; e como o Discogs é separado do resto do inventário.

## Technical Design
A escrever depois da proposta aprovada.

## Dependencies
F82 (o CMS; bloqueia; a peça de chave nasce no kit, F332 do harness), F75 (o Discogs e o interruptor de hoje), F83 (React no site: carga sob demanda por tela).

## Documents Consulted
`server/lib/valueSources/valueSwitch.js`, `public/js/api/valueApi.js`, `docs/specs/features/F75-*`, `F82-*`, `docs/specs/arch.md`.

## Risks & Considerations
- Dois interruptores do Discogs (a variável e a chave do CMS) podem discordar; a proposta decide qual vale.
- Separar o Discogs do inventário mexe em muitos arquivos de uma tela que já muda na migração para React (F83).
- O NFR-03 é proposta do agente; sem a aceitação do MJRP não vira regra para as outras features.
