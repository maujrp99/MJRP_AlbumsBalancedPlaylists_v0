# MEMORY

## Now

**Where the Work Stopped.** (2026-11-19 12:43) A v4.0 do v0 tem três consertos na `main` local (sem push): a F45 (a tela de álbuns carrega por um serviço dono da carga: os 80 álbuns em 8,5 s, antes minutos), a F47 (a lista traz as 45 séries, antes 20) e a F51 (filtros que leem a série, busca que deixa digitar, paginação por série nas duas formas, de 10 a 100). As três estão `In Progress`, com spec, plan e tasks preenchidos e a evidência em `reports/evidence/`; as issues UAT-172, UAT-24 e UAT-179 estão `fixed`, à espera do OK do MJRP. O desenho está em `docs/specs/arch.md`, seção «Carga da tela de álbuns — proposta» (a seção 17 diz o que foi construído). O manual (`docs/manual/`) foi atualizado nas áreas tocadas.

**Pending on Agent.** (2026-11-19 12:43) F46 (o que resta: ranking pelo modal refletir na tela, «tentar de novo» conferido no navegador, aviso de pedidos não conferidos), F48 (nova tentativa do servidor que nunca roda, «Clear Cache» que não limpa, `stores/albums.js` ainda com Firestore, cache do ranking), F49 («Load more»), F50 (um endereço local), UAT-180 (o «&» gravado como `&amp;`), a busca da Home. Depois: remover da coleção (UAT-01), migração de visitante (UAT-12), colagem em lote, playlists que somem ao recarregar (UAT-05); os laços de carga do `/blend` e do modo edição; a fatia do servidor (raspador sem cache, «sem nota» × «falhou»), que só se prova publicando. ADR da carga não escrita. `behavior.md` ainda descreve a carga e os filtros antigos. Resto do manual (servidor, mistura, playlists, integrações, testes) a rever junto de cada conserto.

**Pending on Human.** (2026-11-19 12:43) Olhar a tela de álbuns e dar o OK (ou pedir ajuste) nas UAT-172, UAT-24 e UAT-179. Push dos commits locais. A conta do Google AI: `POST /api/generate` em produção responde 402. Decisão 1 da proposta (a carga parou de regravar cada álbum na coleção `albums`; o agente seguiu a própria recomendação). O protótipo da paginação (`design/inception/albums-paging-v1.html`) está fora do git: a trava do espelho pede `info-arch.md` e wireframes, que o v0 não tem. Conectar o Spotify no app local quando a F50 pedir. As perguntas do conform seguem no relatório de auditoria.

**Do Not Forget.** O MJRP quer correções de arquitetura, não remendos, e quer ser avisado antes de cada uma; o manual é revisto a cada conserto; críticas independentes têm teto de 5 minutos; as skills ajudam e não limitam; dúvida de harness vai ao agente mestre do harness. A prova no navegador roda contra o servidor e o Firestore de produção, com o login dele (app local na porta 5010; a 5000 é do AirPlay). Conserto em `server/` só se prova publicando. As válvulas são do MJRP (`--no-verify`, `Human-accepted:`, push e as outras): nunca do agente.

## Ways of Working

