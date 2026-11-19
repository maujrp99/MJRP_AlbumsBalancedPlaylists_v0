---
id: S-53
aliases: [S-53]
type: requirement
format: story
status: Prioritized
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-40]]"
---
# S-53 · Como quem cura playlists a partir de álbuns, quero que toda tela me mostre o álbum que eu pedi, rápido e do mesmo jeito, para que eu confie no que vejo e não espere por coisas que o app já tem.

## pt-BR

Hoje (regressão no navegador de 2026-11-19, `reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md`): uma série pode mostrar um álbum diferente do pedido, sem aviso («Core» virou «Shangri-La Dee Da»); o blend leva de 8 a 18 segundos para álbuns que a tela anterior já tinha; a tela de playlists guardadas leva 20 segundos; salvar a edição de uma série recarrega todas; a busca por artista classifica de um jeito na Home e de outro na edição da série. A tela de álbuns já carrega por um serviço dono da carga (v4.0); as outras telas não.
Origem: decisão do MJRP de 2026-11-19 («vamos com sua nova arquitetura proposta, mas vamos criar um versao v5.0»); issues UAT-181, UAT-184, UAT-185, UAT-186, UAT-189, UAT-191 e UAT-193 do `docs/specs/uat.md`; a análise em `reports/audits/2026-11-19-mjrpalbumblender-v0-load-architecture-analysis.md`. Os consertos são das features F49, F52 e F55 a F58; a F68 revê o conjunto das regras de identidade de álbum (pedido do MJRP de 2026-11-19, UAT-205).

## en

**As someone who curates playlists from albums, I want every screen to show me the album I asked for, fast and in the same way, so that I trust what I see and do not wait for things the app already has.**

Origin: the MJRP's decision of 2026-11-19 to adopt the proposed architecture as release v5.0; issues UAT-181, UAT-184, UAT-185, UAT-186, UAT-189, UAT-191 and UAT-193 in `docs/specs/uat.md`; the analysis in `reports/audits/2026-11-19-mjrpalbumblender-v0-load-architecture-analysis.md`. The fixes belong to features F49, F52 and F55 to F58; F68 reviews the album identity rules as a whole (the MJRP's request of 2026-11-19, UAT-205).
