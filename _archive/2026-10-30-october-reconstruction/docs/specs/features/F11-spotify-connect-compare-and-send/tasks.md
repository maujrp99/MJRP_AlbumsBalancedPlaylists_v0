<!-- docs/specs/features/F11-spotify-connect-compare-and-send/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F11: Conectar o Spotify, comparar a nota da crítica com a popularidade e enviar as playlists · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Conexão com a conta do Spotify por OAuth e botão de conectar e desconectar — commit `4ac955d` (2025-12-19) · implements:: REQ-01 · model:: opus
- [x] TASK-02 Enriquecimento automático com a popularidade e correspondência aproximada de faixas, e janela de envio ao Spotify — commit `6013d87` (2025-12-19) · implements:: REQ-02 · model:: opus
- [x] TASK-03 Componentes de ranking com várias fontes: comparação lado a lado da nota da crítica e da popularidade, e abas por fonte — commit `b9530f1` (2025-12-19) · implements:: REQ-03 · model:: opus
- [x] TASK-04 Correção da geração de playlists que ignorava a popularidade do Spotify e do indicador de carregamento do envio — commit `2336104` (2025-12-20) · implements:: REQ-02 · model:: sonnet

## Verification
- [x] TASK-05 Prova da entrega: em produção desde 2025-12-19 pelos commits `4ac955d`, `6013d87`, `b9530f1`, `2336104`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F11/evidence.md` · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
