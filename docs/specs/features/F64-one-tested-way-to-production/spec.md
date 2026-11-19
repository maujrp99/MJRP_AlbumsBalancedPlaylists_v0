---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-202", "UAT-20", "UAT-22"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F64: Um caminho só, testado, para produção
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Publicar o site ou o servidor passa por um caminho só e escrito, que roda os testes antes e sai completo (chave do Spotify, imagens, variáveis do servidor); a automação do GitHub passa a rodar ou é retirada.

**Por quê:** A partir da v5.0 cada feature vai para produção sozinha; hoje a publicação é feita à mão, numa cópia limpa, porque o script do projeto pede uma chave que não existe na máquina.

**Como saber que funcionou:** Um comando publica o site depois de os testes passarem; a mesma coisa para o servidor.

## Problem Statement
Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`, seção B) e o tema 6 do mapa da v5.0 (`reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md`).

Em 2026-11-19 foram feitas seis publicações do site e uma do servidor, todas à mão, porque os scripts do projeto não serviam: o `scripts/deploy-prod.sh` exigia uma chave de conta de serviço que não existe na máquina (o Firebase CLI e o gcloud estão logados como o MJRP); os dois scripts construíam da pasta de trabalho, e não de uma cópia limpa da `main`; nenhum rodava os testes; o `scripts/deploy-backend.sh` limpava com `rm -rf` dentro do repositório. Além disso havia duas receitas para a imagem do servidor (`cloudbuild.yaml` e `gcloud run deploy --source`), e a automação do GitHub tinha jobs de publicação que dependiam de segredos que o repositório não tem.

violates:: [[constitution#V]]

## Requirements
- [REQ-01] Um comando publica o site a partir da `main` commitada: recusa se a `main` tem mudança não commitada, roda os testes e para se um falha, confere o que construiu antes de enviar (script principal, Client ID do Spotify, nenhum mapa de código, arquivos completos), publica, confere a produção e mostra como voltar atrás. · fixes UAT-202
  verified_by:: `reports/evidence/F64-one-tested-way-to-production/F64-site-dry-run-2026-11-19.txt` (tudo menos publicar); a publicação real e a conferência da produção esperam o sim do MJRP (TASK-08)
- [REQ-02] Um comando publica o servidor a partir da `main` commitada, com as mesmas recusas e os mesmos testes: monta o contexto da imagem, confere-o subindo o servidor localmente sem segredo e sem rota paga, mostra a revisão que serve antes de publicar, publica, confere a produção e mostra o comando de volta com o nome dessa revisão. · fixes UAT-202, UAT-22
  verified_by:: `reports/evidence/F64-one-tested-way-to-production/F64-server-dry-run-2026-11-19.txt` (tudo menos publicar); a publicação real espera o sim do MJRP (TASK-08)
- [REQ-03] Os dois comandos têm um modo de ensaio que faz tudo menos publicar e conferir a produção, e não deixam nada dentro do repositório: trabalham numa pasta temporária do sistema, removida no fim. · fixes UAT-202
  verified_by:: as duas evidências acima (saída 0, pasta temporária removida ao fim)
- [REQ-04] Existe uma receita só para a imagem do servidor, a que a produção usa; a troca do Node 18 (fora de suporte) por uma linha em suporte espera o sim do MJRP. · fixes UAT-22
  verified_by:: o servidor sobe no Node 26 com as dependências do lockfile (TASK-07; a evidência do servidor mostra a subida, feita com o `Dockerfile` da `main`, ainda no Node 18); a imagem com Node 26 só é construída na publicação real (TASK-08) A imagem publicada segue em Node 18 até a decisão.
- [REQ-05] A automação do GitHub roda os testes unitários em todo push e pull request e não publica nada. · fixes UAT-202, UAT-20
  verified_by:: não verificado: o arquivo `.github/workflows/ci.yml` não rodou no GitHub (TASK-09)
- [REQ-06] O repositório descreve um caminho só de publicação: os scripts antigos e a segunda receita saíram, os comandos estão no `package.json`, e o manual diz o que precisa existir na máquina e como voltar atrás. · fixes UAT-202
  verified_by:: `docs/manual/00_Deployment_and_Setup.md` (seções 1 e 2); `scripts/deploy-prod.sh`, `scripts/deploy-backend.sh` e `cloudbuild.yaml` não existem mais no ramo

## Observable States
N/A: a feature não importa nenhum requisito e não tem tela (conserto das issues UAT-202, UAT-20 e UAT-22).

## Success Criteria
- `npm run deploy:site:dry-run` e `npm run deploy:server:dry-run` terminam com saída 0 a partir de qualquer cópia do repositório. Visto em 2026-11-19, na `main` em `e54c80e`, 493 testes.
- Com mudança não commitada num arquivo versionado da `main`, os dois recusam antes de qualquer outro passo. Visto num repositório descartável.
- Depois de uma publicação real do site, o `index.html` no ar nomeia o script recém-construído; do servidor, a revisão nova recebe 100% do tráfego, `/api/musickit-status` responde 200 e `/api/debug/files` responde 404. A ver na primeira publicação com os scripts.
- Não existe segundo caminho: nenhum outro script, arquivo de build ou job publica.

## Out of Scope
- UAT-20, a parte que não é da automação: o lint não reprova nada porque hoje tem 81 erros, em `public/js/**` e `server/**`; não há regra de importação nem busca de segredos. A automação deixou de fingir (o passo com `|| true` saiu); fazer o lint reprovar pede consertar o código primeiro. A issue segue aberta nessa parte.
- Itens do tema 6 do mapa que pedem mexer em `server/**` ou `public/js/**`: 6.1 (segredos do Spotify do servidor ausentes da publicação: o serviço não tem nenhuma variável do Spotify, e o script não define variáveis), 6.5 (CORS), 6.6 (queda calada para uma configuração de Firebase de mentira) e 6.7 (`firebase-config.js` ignorado e versionado ao mesmo tempo; o script do site exige que ele exista na `main`).
- Publicar `firestore.rules`: nenhum dos dois scripts o faz.
- `docs/specs/arch.md` e `docs/specs/tech-stack.md` foram atualizados pelo integrador em 2026-11-19 (commit `17f9b5e`).
- Os testes próprios do servidor (`cd server && npm test`) não entram no portão: parte deles consulta um site externo de verdade.

## Open Questions
- ~~O Node do servidor continua em 18, que está fora de suporte. Passar para uma linha em suporte (26, a que roda os testes, ou 24)?~~ Respondida pelo MJRP em 2026-11-19: **24** (ADR-0020). Antes: o integrador reverteu a troca feita pelo executor, porque ela mudaria o que produção roda sem o sim dele.
