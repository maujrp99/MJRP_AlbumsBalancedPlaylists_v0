---
format: proposal-batch@1
batch: 2026-11-21-0845-v0-pending-decisions
title: Album Blender V0 · as decisões que esperam você
asked_at: 2026-11-21 08:45
question: O que você decide neste ponto?
effect: o agente do V0 aplica cada resposta — escreve a proposta de arquitetura da F81 e da F82, conserta ou fecha as issues, e segue o app
---
### D-01 · Onde mora o pacote do kit do CMS
Pergunta: O kit do CMS vira pacote agora, para o Album Blender usar. Onde esse pacote mora?
Contexto: A sua ADR-0011 do MJRPpersonal diz que o kit «vira pacote quando houver o segundo projeto» e proíbe construir copiando a pasta. O Album Blender (F82) é o segundo projeto. Hoje o kit é a pasta src/admin-kit/ do MJRPpersonal. A extração é trabalho do lado do MJRPpersonal ou do harness, não do V0. Minha opinião: repositório próprio, porque o kit é produto (React, com versão própria) e o harness distribui processo, não código de tela.
Base: média — relato do agente mestre e da orquestradora do MJRPpersonal; eu ainda não li o kit
- a) Num repositório próprio, como pacote com versão (Recomendado)
- b) Dentro do harness, distribuído aos projetos como o kernel
- c) Fica no MJRPpersonal por ora, e o V0 espera
→ respondida em 2026-11-21 09:04
  - b
→ aplicada em 2026-11-21 09:04: avisei o agente mestre do harness e a orquestradora do MJRPpersonal; o plano da F82 diz que o kit chega pelo harness e que o V0 não copia a pasta

### D-02 · A ordem entre o CMS (F82) e os idiomas (F81)
Pergunta: Qual das duas features eu começo primeiro?
Contexto: As duas estão em esboço na main, sem prioridade. Com o CMS antes, os textos e as traduções já nascem editáveis nele, no formato de par pt/en que o kit edita. Com os idiomas antes, o site fica bilíngue mais cedo, com os textos em arquivos, e o CMS os assume depois. O CMS depende da decisão D-01; os idiomas não dependem de nada.
Base: média — a dependência do kit é relato; o resto vem do código do V0
- a) O CMS primeiro, depois os idiomas (Recomendado)
- b) Os idiomas primeiro, com os textos em arquivos; o CMS depois
- c) As duas juntas, numa proposta de arquitetura só
→ respondida em 2026-11-21 09:04
  - (outra) Respondido no chat
→ aplicada em 2026-11-21 09:05: resposta dele: «Respondido no chat» — no chat ele aceitou a ordem React, idiomas junto com a migração, CMS depois («Bora !») e priorizou F81 > F83 > F82; os planos seguem essa ordem

### D-03 · Os idiomas do site e o padrão
Pergunta: Em quais idiomas o site passa a existir, e qual é o padrão para quem chega?
Contexto: Hoje o site existe só em inglês. Os sites do MJRPpersonal usam português como padrão e inglês, e a primeira visita escolhe pelo idioma do navegador. Nomes de álbuns, artistas e faixas não se traduzem: vêm dos catálogos.
Base: forte — o estado do site está no código; o do MJRPpersonal é relato da orquestradora
- a) Inglês (padrão) e português do Brasil, com a primeira visita pelo idioma do navegador (Recomendado)
- b) Português do Brasil (padrão) e inglês, como no MJRPpersonal
- c) Só inglês e português por ora, e o padrão eu decido depois de ver os dois
→ respondida em 2026-11-21 09:05
  - (outra) De acordo com a geo location primeiro e depois a selecao do user toma precedencia
→ aplicada em 2026-11-21 09:06: na spec da F81: primeira visita pelo país de acesso (Brasil → pt-BR, fora → inglês), a escolha da pessoa vale acima; sem saber o lugar, inglês (decidido pelo agente, revisável)

### D-04 · Os três P2 que ficaram na Home nova
Pergunta: O que faço com as três diferenças pequenas entre a Home construída e o protótipo?
Contexto: UAT-232: ao abrir «paste a list» a caixa ganha um contorno laranja de foco, e no celular fica uns 50 px mais alta (cada linha é um campo de 44 px, o tamanho de toque). UAT-233: os números das linhas coladas e o aviso de Undo no celular usam a fonte do sistema, porque o «1» da Syne parece «ı». UAT-234: no celular a ficha «Compendiums · 15» fica numa linha só e a fila de fichas uns 4 px mais baixa. Nenhuma atrapalha o uso.
Base: forte — medido pelo juiz independente, reports/audits/2026-11-21-F79-visual-parity-recheck-2.md
- a) Tirar o contorno laranja ao abrir (UAT-232) e deixar as outras duas como estão (Recomendado)
- b) Consertar as três, para bater com o protótipo
- c) Deixar as três como estão
→ respondida em 2026-11-21 09:08
  - a
→ aplicada em 2026-11-21 09:09: o contorno laranja da caixa de «paste a list» saiu (UAT-232, com teste); UAT-233 e UAT-234 ficam como estão, com a decisão escrita na linha

### D-05 · Ligar a medição de uso (PostHog)
Pergunta: Ligo a medição de uso do site agora?
Contexto: A F77 está em produção desligada, sem chave. Para ligar, você cria o projeto no PostHog (região UE, captura de IP desligada) e põe a chave VITE_POSTHOG_KEY no .env da pasta da main; eu publico de novo e confiro os eventos. A chave nunca passa por mim. Enquanto só você usa o site, a medição mostra só o seu uso.
Base: forte — o estado da F77 está no código e no script de publicação
- a) Deixar desligada até o site ter outros usuários (Recomendado)
- b) Ligar agora: eu crio o projeto e ponho a chave, você publica e confere
→ respondida em 2026-11-21 09:08
  - (outra) Deixar desligada e entrar no CMS uma feature toggle pra ligar assim que terminarmos a Migracao para o react e o buil do CMS
→ aplicada em 2026-11-21 09:09: a medição segue desligada; a chave de ligar no CMS virou o REQ-02 da F82, e a peça de chave é assunto do kit (F332 do harness)

### D-06 · O próximo passo do app (F78)
Pergunta: Como o app para iPhone e Android segue?
Contexto: O esqueleto roda no simulador e o núcleo passa nos 3343 casos, mas as telas do app são cruas: sem o fogo e o equalizador, fonte do sistema, sem capas. Nenhuma tela do app teve rodada de desenho. A fatia técnica seguinte (as séries gravadas por transação) espera um dia de uso normal do site.
Base: forte — reports/evidence/F78/2026-11-20-first-simulator-run.md
- a) Uma rodada de desenho das telas do app, no comparador, antes de mais código (Recomendado)
- b) Seguir pelas fatias técnicas e desenhar depois
- c) Pausar o app até o CMS e os idiomas saírem
→ respondida em 2026-11-21 09:09
  - a

### D-07 · As contas da Apple e do Expo
Pergunta: Quando você abre a conta de desenvolvedor da Apple e a conta do Expo?
Contexto: Sem elas o app não chega ao seu iPhone pelo TestFlight; no simulador ele já roda. A conta da Apple custa US$ 99 por ano; a do Expo tem plano gratuito. As duas são suas: eu não crio conta nem digito senha.
Base: média — o preço da Apple é o público; o momento é opinião
- a) Depois da rodada de desenho do app, quando houver o que testar no aparelho (Recomendado)
- b) Agora, para o TestFlight já ficar pronto
→ respondida em 2026-11-21 09:09
  - (outra) Tenho conta de dev da apple
