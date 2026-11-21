---
type: evidence
feature: F66
subject: "F66: o token antigo do Discogs não vale mais e nenhum arquivo do repositório traz um token"
written: "2026-11-20 17:38"
who: integrador (agente)
---
# F66 — o token do Discogs fora do repositório · 2026-11-20 17:38

| O que o spec pede | Como está | Prova |
|---|---|---|
| O token antigo deixa de valer | apagado pelo MJRP no site do Discogs em 2026-11-20 | palavra dele, duas vezes: em 2026-11-20 01:2x («posso deletar o token», «e gerar de novo», «sim, gerei o novo antes de copiar») e em 2026-11-20 17:38 («resolvemos ontem a questao do token da discogs, apaguei o antigo e colocamos no novo»). **Não conferido pelo agente:** testar o token antigo exigiria lê-lo do histórico do git, e o agente não lê nem usa token |
| Nenhum arquivo do repositório traz um token | os dois scripts que o traziam (`scripts/generate-dataset.js`, `scripts/fetch-missing-artists.js`) saíram do repositório na F65 (commit `f9d1abd`, 2026-11-19) | `git ls-files` não lista nenhum dos dois; `test/security/noSecretsInRepo.test.js` passa (11 testes, rodado em 2026-11-20 17:38) e é portão da suíte |
| O script, sem a variável, para e diz o que falta | **não se aplica mais:** os scripts foram retirados, não reescritos | o app em produção nunca os usou; o arquivo de álbuns da busca já está pronto em `public/assets/data/` |
| O token novo fica fora do repositório | no Secret Manager, secret `discogs-token`, criado pelo MJRP; o servidor o recebe como `DISCOGS_TOKEN` (F75) | `gcloud run services describe` lista `DISCOGS_TOKEN` na revisão em produção; o valor nunca foi lido por agente |

**O que fica:** o token antigo continua escrito no histórico do git (commits anteriores à `f9d1abd`). Está morto, se foi mesmo apagado no Discogs; reescrever o histórico não foi pedido nem feito.
