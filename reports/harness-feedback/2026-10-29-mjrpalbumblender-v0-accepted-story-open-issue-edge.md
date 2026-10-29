# Parecer do v0 para o harness: nenhum sensor cruza história aceita com issue de UAT aberta

Projeto: MJRP_AlbumsBalancedPlaylists_v0 (brownfield, rodada de correção do conform, 2026-10-29). Origem: o P0 da S-04 apontado pela juíza do conform.

## Fato

- A S-04 («ver todas as séries e os álbuns de cada uma») está `Accepted` por histórico, e as issues abertas UAT-24 (lista cortada em 20 séries) e UAT-06 («Load N more albums» sem efeito) a negam. O `requirements_graph_check.py` sai VERDE: ele não lê o corpo do nó nem cruza nó aceito com issue aberta, e `violates::` só existe em spec de feature Fix (regra `fix_nfr_import`, `requirements_graph_rules.json`). Não há campo `known_issues` nem aresta de contradição.
- Quem achou foi o juiz de requisitos, por leitura; um script não acharia.

## O que o v0 fez

Sem tirar o aceite histórico (regra do MJRP de 2026-10-18), cada história aceita com defeito aberto ganhou, no corpo, uma linha «Defeito aberto hoje» com o link `[[uat#^UAT-nn]]` (S-04, S-12, S-15, S-24, S-37, S-38). É convenção de texto, sem sensor.

## Proposta ao harness (decisão do harness)

Uma aresta `contradicted_by:: [[uat#^UAT-nn]]` no nó de requisito, e o sensor do grafo avisando quando a história está `Accepted` e a issue ligada está aberta; assim o aceite histórico continua valendo e a contradição aparece na tela do Control Center, sem depender de um juiz.
