---
format: proposal-batch@1
batch: 2026-11-21-1335-v0-conform-questions
title: Album Blender · as perguntas da adequação ao harness
asked_at: 2026-11-21 13:35
question: O que você decide neste ponto?
effect: o agente do V0 conclui a adequação ao harness seguindo cada resposta
---
### D-01 · O texto que abre o documento do produto
Pergunta: O texto que abre o documento do produto (o PRD, seção «O que é») serve como está?
Contexto: Escrevi um rascunho de abertura a partir da visão, dos épicos e das telas, sem conferir com o código: «O Album Blender é uma aplicação web que mistura álbuns, aclamação da crítica e popularidade em playlists equilibradas, para quem ainda ouve música álbum por álbum. A ordem do produto é montar, misturar, ouvir: montar uma série de álbuns, escolher a receita de mistura, rever as playlists geradas e exportar para o Spotify ou o Apple Music, no celular e no computador.»
Base: média — lido da documentação; não conferido com o código
- a) Serve como está; o agente o põe no topo do prd.md (Recomendado)
- b) Quero ajustar; você diz o que mudar

### D-02 · Oito relatórios sem tipo na lista do harness
Pergunta: O que fazer com oito relatórios antigos cujo tipo não existe na lista do harness?
Contexto: São a regressão no navegador, o cruzamento com o plano da v5, a triagem de issues, a varredura das fontes das notas, o mapa da v5, os e-mails de contato, a atualização do kernel e a limpeza de worktrees. A regra diz que tipo novo nasce no harness, não no projeto.
Base: forte — a regra e a lista de tipos foram lidas
- a) Pedir ao harness um ou dois tipos novos (por exemplo «análise» e «rascunho») e usar quando existirem (Recomendado)
- b) Enquadrar cada um no tipo mais próximo, mesmo que descreva mal
- c) Deixar sem tipo e aceitar o aviso

### D-03 · Nomes dos pareceres para o harness
Pergunta: Os quatro pareceres para o harness (pasta reports/harness-feedback/) devem ganhar o nome do projeto no nome do arquivo?
Contexto: Hoje o nome não traz o projeto, e a regra de nomes de relatório pede. Se o harness já triou esses pareceres pelo nome atual, renomear pode quebrar a triagem.
Base: média — não verifiquei se o harness já os triou
- a) Não renomear agora; o orquestrador confirma com o harness antes (Recomendado)
- b) Renomear os quatro já

### D-04 · Quem aceita a decisão do Node 24
Pergunta: Posso acrescentar ao cabeçalho da decisão sobre o Node 24 (ADR-0020) a linha «Acceptance: MJRP»?
Contexto: A decisão já está aceita, e o próprio texto diz que foi você, em 2026-11-19. Falta só a linha que o harness passou a exigir. O agente não edita decisão aceita sem a sua palavra, e o texto da decisão não seria tocado.
Base: forte — o texto da decisão diz quem decidiu
- a) Sim, só essa linha no cabeçalho (Recomendado)
- b) Não; prefiro abrir uma exceção à regra para essa decisão

### D-05 · Três issues do aceite com campo copiado
Pergunta: Corrijo o campo «OK do humano» de três issues de aceite do dia 2026-11-20 (UAT-224, UAT-225 e UAT-226)?
Contexto: Nelas o campo diz «histórico anterior ao harness» e aponta para a UAT-171, copiado dessa issue. Anterior ao harness elas não são, e a âncora não é delas.
Base: forte — comparei as linhas no uat.md
- a) Tirar a frase, pôr a âncora própria de cada uma e deixar o OK vazio até haver a reconferência independente ou os testes verdes (Recomendado)
- b) Deixar como está

### D-06 · A estratégia de entrega do site e do servidor
Pergunta: A estratégia de entrega que o agente escreveu no arch.md está certa?
Contexto: Em resumo: só a main vai a produção; o site e o servidor saem por dois scripts, da sua máquina; não há prévia automática; para voltar atrás, o histórico do Firebase Hosting e a revisão anterior do Cloud Run. O que o repositório não mostra está escrito «não verificado».
Base: média — lido dos scripts, do CI e do firebase.json; não verifiquei se existe canal de prévia ou projeto de teste separado
- a) Confirmo, depois de ler a tabela no arch.md; a linha de status passa a «confirmada» (Recomendado)
- b) Ajusto; você diz o quê (principalmente: existe canal de prévia ou projeto de teste?)

### D-07 · A cor do V0 no Control Center
Pergunta: Qual é a cor do Album Blender V0 no Control Center?
Contexto: É a cor do projeto na tela do portfólio, escolhida num par da biblioteca de paletas do harness. Sem escolha, só aparece um aviso, que nunca vira erro.
Base: forte — a regra e a biblioteca foram lidas
- a) O agente de design propõe dois pares da biblioteca e você escolhe um (Recomendado)
- b) Deixar sem cor por ora

### D-08 · O site vai trocar de paleta?
Pergunta: O site do Album Blender vai poder trocar de paleta (temas)?
Contexto: O documento do design system precisa declarar isso, e as especificações de identidade (conceito, paleta, tipografia, ritmo, superfície) dependem da resposta. O site atual tem uma só.
Base: média — o site atual foi visto; o plano futuro é seu
- a) Não troca: uma identidade só (Recomendado)
- b) Troca; você diz quais paletas
- c) Decidir quando o design system do site, como artefato (F86), entrar
