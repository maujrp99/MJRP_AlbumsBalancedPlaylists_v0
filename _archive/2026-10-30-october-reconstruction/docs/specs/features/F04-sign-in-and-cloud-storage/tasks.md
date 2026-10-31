<!-- docs/specs/features/F04-sign-in-and-cloud-storage/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F04: Entrar com a conta Google ou Apple e ter séries, playlists e coleção guardadas na nuvem · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Persistência por conta: repositórios sobre o BaseRepository, stores de álbuns, séries e playlists lendo e gravando no Firestore sob o uid — commit `b85f473` (2025-12-03) · implements:: REQ-02 · model:: opus
- [x] TASK-02 Repositórios por conta no Firestore (BaseRepository e um por fonte, sob o uid), cache e utilitário de migração; depois, a entrada automática como convidado e o aviso quando falha — commits `6eb6682` (2025-11-28) e `edc38ee` (2025-12-21) · implements:: REQ-02 · model:: sonnet
- [x] TASK-03 Entrada com Google e Apple, janela de entrada, menu da conta, sair, estabilização do login e a tentativa de migração do convidado para a conta, que não funciona de ponta a ponta ([[uat#^UAT-12]]) — commit `18fbfc4` (2025-12-11) · implements:: REQ-01 · model:: opus

## Verification
- [x] TASK-04 Prova da entrega: em produção desde 2025-11-28 pelos commits `6eb6682`, `b85f473`, `edc38ee`, `18fbfc4`; os testes existentes de cada REQ estão no `verified_by` da spec (não executados nesta sessão; a migração do convidado não está provada, [[uat#^UAT-12]]) e a evidência fica em `reports/evidence/F04/evidence.md` · implements:: REQ-01, REQ-02 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
