---
format: proposal-batch@1
batch: 2026-11-23-1039-v0-cms-pending-decisions
title: Album Blender V0 · CMS — as decisões que esperam você
asked_at: 2026-11-23 10:39
question: O que você decide neste ponto?
effect: o agente do V0 aplica cada resposta na construção do CMS e do kit do painel; o que você não responder segue com a recomendação, revisável
---
### D-01 · O serviço de tradução entre os campos
Pergunta: A tradução de um campo para o outro, no Painel do Album Blender, usa qual serviço?
Contexto: Você pediu a peça de traduzir que os seus outros CMS já têm («Traduzir do inglês / do português», com traduzir de novo, descartar e aceitar). Lá ela usa o serviço da Claude, pago por uso (centavos por texto). No Album Blender falta uma rota no servidor, só para o administrador, e uma chave que só você cria no cofre do servidor; eu não leio nem digito a chave.
Base: forte — li a peça no kit e a ação de tradução do seu site pessoal
- a) O serviço da Claude, com uma chave sua no servidor (Recomendado)
- b) Sem tradução automática na primeira iteração; entra depois
- c) Outro serviço (diga qual)
→ respondida em 2026-11-23 10:49
  - a
→ aplicada em 2026-11-23 10:50: na spec e nas tarefas da F82 (REQ-13, TASK-16): a tradução usa o serviço da Claude, com a chave que só o MJRP cria no cofre do servidor; a rota entra quando o kit chegar

### D-02 · O conserto do filtro de links no seu site pessoal
Pergunta: Abro agora o conserto do filtro de links no seu site pessoal, numa sessão daquele projeto?
Contexto: O crítico da proposta do kit achou que o filtro de links do editor rico aceita um endereço malformado (uma barra seguida de uma barra invertida) que o navegador abre como site externo. Está no ar hoje no seu site pessoal. Só afeta textos que você mesmo publica, então o risco é baixo, mas é a primeira tarefa do plano do kit e o Album Blender herda o filtro.
Base: forte — o crítico rodou a função do kit com o endereço e ela o aceitou
- a) Sim, abra a sessão no projeto do site pessoal e conserte (Recomendado)
- b) Conserte só na cópia do kit que vai para o harness; o site pessoal recebe quando trocar para a cópia
- c) Não agora
→ respondida em 2026-11-23 10:49
  - (outra) O master agent está cuidando disso, se alinhe com ele pls
→ aplicada em 2026-11-23 10:50: alinhado com o agente mestre do harness: ele consertou o filtro no MJRPpersonal (commit c33a33a4, recusa a barra invertida e %5C; teste 11 de 11) e a tarefa TASK-01 do kit está marcada com essa evidência; o mesmo conserto vai ao núcleo do kit no harness (TASK-06)

### D-03 · A versão 2 do protótipo do Painel
Pergunta: Como você quer ver a versão 2 do protótipo, com o editor de texto rico?
Contexto: A versão 2 está pronta e conferida no navegador (computador e celular), com a versão 1 ao lado para comparar. A trava de permissões recusou atualizar o artefato no link antigo, e eu não contornei: o link ainda mostra a versão 1. Com a sua palavra eu publico no mesmo link, que continua privado.
Base: forte — o arquivo existe e foi conferido; a publicação foi recusada
- a) Publique no mesmo link do artefato (Recomendado)
- b) Mande o arquivo para eu abrir no computador, sem publicar
- c) Não preciso ver; siga a construção
→ respondida em 2026-11-23 10:53
  - a
→ aplicada em 2026-11-23 10:56: a versão 2 do protótipo está publicada no mesmo link do artefato, privado (https://claude.ai/artifact/BnhaJv6KQpaEUzdn7qHsBe); conferida no arquivo servido localmente a 1280 e 390; a página publicada não foi aberta num navegador

### D-04 · As suas três regras do Album Blender valem para a pasta do kit?
Pergunta: As três regras que você definiu para o código do Album Blender também valem para a cópia do kit dentro dele?
Contexto: As regras são: nenhuma função mais complexa que 10, interface só em inglês, e o histórico do navegador só pelo roteador. O kit de hoje fere as três (41 funções acima de 10, textos padrão em português, e ele mexe no histórico por conta própria). Segui com a opção recomendada, revisável: o kit passa a cumprir o histórico e o inglês, e fica isento só da complexidade, com uma lista das 41 funções que só pode encolher. Ganho: a primeira fatia leva dias, não semanas. Custo: as funções grandes de hoje continuam grandes até alguém as dividir.
Base: forte — o crítico mediu as três regras numa cópia do kit
- a) Misto: cumpre histórico e inglês; isento só da complexidade, com lista que só encolhe (Recomendado)
- b) O kit cumpre as três antes de chegar ao Album Blender
- c) A pasta do kit fica isenta das três
→ respondida em 2026-11-23 10:53
  - b
→ aplicada em 2026-11-23 10:54: registrado no log e levado à F332 do harness: o kit cumpre as três regras (complexidade até 10, inglês, histórico pelo roteador) antes de chegar ao Album Blender; o plano e o registro do kit estão sendo corrigidos

### D-05 · Desligar partes da barra do editor rico num campo
Pergunta: Um projeto pode desligar partes da barra de formatação num campo específico?
Contexto: A barra completa que você aprovou continua sendo o padrão do kit. A pergunta é se um campo curto (um aviso, por exemplo) pode esconder imagem, vídeo e livro, que não fazem sentido ali. Segui com «sim», revisável. Custo: uma opção a mais no kit.
Base: média — proposta do agente; você definiu a barra completa como padrão
- a) Sim, por campo, com a barra completa como padrão (Recomendado)
- b) Não: a barra é sempre a completa
→ respondida em 2026-11-23 10:53
  - (outra) Gostaria de um feature toggle para a opção de edição na tela no kit do CMS, viável? E faz sentido?
→ aplicada em 2026-11-23 10:54: a edição na própria tela atrás de uma chave do kit virou o REQ-15 da F82 (viável e faz sentido: o Painel sempre existe; a edição na tela entra depois, desligada até você ligar) e vai à F332; desligar blocos da barra por campo segue com a recomendação (sim)

### D-06 · Imagem, vídeo e «Livro do Jardim» nos textos do Album Blender
Pergunta: Os botões de imagem, vídeo e livro ficam na barra do editor nos textos do Album Blender?
Contexto: No Album Blender não há envio de imagem nem estante de livros, então no protótipo o botão de imagem aparece apagado e a estante vazia. Depende da D-05: se um campo pode desligar blocos, dá para escondê-los aqui.
Base: média — o protótipo mostra os três; a decisão é de produto
- a) Esconder os três nos textos do Album Blender (Recomendado)
- b) Manter vídeo; esconder imagem e livro
- c) Manter os três como no kit
→ respondida em 2026-11-23 11:14
  - a
→ aplicada em 2026-11-23 11:15: no REQ-12 da F82: a barra esconde imagem, vídeo e livro nos textos do Album Blender

### D-07 · Que formatação os textos do site aceitam
Pergunta: Os textos corridos do site aceitam só negrito, itálico e link, ou também subtítulo, citação, lista e caixa de destaque?
Contexto: A prévia «como fica no site» da versão 2 mostra uma proposta de aparência para subtítulo, citação, lista e caixa de destaque dentro das telas do Album Blender. Cada um deles precisa de um desenho na tela onde o texto aparece; negrito, itálico, sublinhado, link e quebra de linha funcionam em qualquer lugar.
Base: média — proposta de aparência do agente, ainda sem o seu olhar
- a) Todos os que a barra oferece, com a aparência da prévia (Recomendado)
- b) Só negrito, itálico, sublinhado, link e quebra de linha na primeira iteração
- c) Quero ver a prévia antes de decidir
→ respondida em 2026-11-23 11:14
  - a
→ aplicada em 2026-11-23 11:15: no REQ-12 da F82: os textos aceitam todos os formatos da barra, com a aparência da prévia do protótipo v2

### D-08 · Links para fora do site nos textos ricos
Pergunta: Um texto rico publicado pode ter link para fora do site?
Contexto: Os seus outros CMS permitem (endereços https e de e-mail). Segui com «sim», revisável, já com o conserto do filtro (D-02). Risco: se outra pessoa usasse a sua conta, um texto publicado poderia levar visitantes a um endereço ruim.
Base: forte — é o que o kit faz hoje
- a) Sim: https e e-mail, com o filtro consertado (Recomendado)
- b) Só links para dentro do site
→ respondida em 2026-11-23 11:14
  - a
→ aplicada em 2026-11-23 11:15: no REQ-12 da F82: links para fora permitidos, só https e e-mail, com o filtro consertado

### D-09 · Frases divididas em pedaços viram um texto só?
Pergunta: As frases que hoje são três pedaços (texto, link, texto) viram um texto corrido só, com o link dentro?
Contexto: Exemplo: «You're not signed in…» + «Sign in» + «to keep it…» são três chaves separadas no código. Com o editor rico elas podem virar um texto só, com o link dentro, mais fácil de editar e de traduzir. Custo: o link passa a ser escolhido no editor (uma página do site), e essas telas mudam para ler o texto rico.
Base: média — achado do protótipo; o custo é estimativa
- a) Sim, onde o link leva a uma página do site (Recomendado)
- b) Não: ficam em pedaços, como hoje
→ respondida em 2026-11-23 11:14
  - a
→ aplicada em 2026-11-23 11:15: no REQ-12 da F82: as frases em pedaços viram um texto só onde o link leva a uma página do site

### D-10 · O tamanho dos botões da barra no celular
Pergunta: Os botões da barra do editor sobem de 34 para 44 pixels no celular?
Contexto: A barra do kit usa 34 pixels; o padrão de toque do Album Blender é 44. Subir no kit muda a barra em todos os seus CMS; subir só na pele do Album Blender mantém os outros como estão.
Base: forte — medido no kit e no sistema de design do Album Blender
- a) 44 pixels no celular, só na pele do Album Blender (Recomendado)
- b) 44 pixels no kit, para todos os CMS
- c) Fica em 34, como no kit
→ respondida em 2026-11-23 11:14
  - a
→ aplicada em 2026-11-23 11:15: no REQ-12 da F82: 44 px no celular, só na pele do Album Blender; o kit segue em 34

### D-11 · A pausa no kit do seu site pessoal durante a mudança
Pergunta: Posso pausar por um dia as mudanças no kit do seu site pessoal, no dia em que ele passar a usar a cópia do harness?
Contexto: No dia da troca, uma mudança feita no kit antigo depois da cópia se perderia. Segui com «sim», revisável. Custo: um dia sem mudanças no kit lá.
Base: forte — é a ordem da mudança na proposta
- a) Sim, um dia (Recomendado)
- b) Não: a troca do site pessoal fica para depois; por enquanto só o Album Blender usa a cópia
→ respondida em 2026-11-23 11:14
  - (outra) Eu gerencio essa pausa, só me avisar que eu pauso o uso
→ aplicada em 2026-11-23 11:15: registrado: você gerencia a pausa; eu aviso antes do dia da troca do site pessoal para a cópia do kit e você pausa o uso

### D-12 · Papéis no painel: quando, e qual primeiro
Pergunta: Quando entram os papéis (você como superadministrador, criando e atribuindo papéis), e qual é o primeiro?
Contexto: Você pediu os papéis em 2026-11-22. Segui com «depois das chaves de ligar e desligar, começando por um papel de editor de textos», revisável. Pode pedir uma feature própria no harness, que só você abre. Custo: uma rodada de desenho com você e regras do banco em cada projeto.
Base: média — o pedido é seu; a ordem é proposta do agente
- a) Depois das chaves; primeiro o «editor de textos» (Recomendado)
- b) Antes das chaves
- c) Só quando houver uma segunda pessoa para usar
→ respondida em 2026-11-23 11:16
  - a
→ aplicada em 2026-11-23 11:16: registrado na F82 (REQ-05) e levado à F332: os papéis entram depois das chaves de ligar e desligar, começando pelo editor de textos

### D-13 · O Discogs na hora de publicar o servidor novo
Pergunta: Em que ordem publicamos, para os valores do Discogs não sumirem?
Contexto: O servidor novo lê a chave do Discogs no CMS, e ela nasce desligada. Se o servidor sair antes de você publicar as regras do banco e criar o registro da chave, os valores do Discogs somem do Inventário até lá. As duas ações são suas, no console do Firebase; eu preparo o passo a passo.
Base: forte — o juiz independente conferiu os três estados
- a) Primeiro você publica as regras e cria o registro com a chave ligada (eu mando o passo a passo); depois eu publico o servidor (Recomendado)
- b) Publique o servidor já; o Discogs fica desligado até eu fazer a minha parte
→ respondida em 2026-11-23 11:16
  - b
→ aplicada em 2026-11-23 11:21: o servidor está publicado da main 4080f73 (revisão mjrp-proxy-00216-cxd, 5233 testes e 31 das regras passaram); o Discogs fica desligado até você publicar as regras do banco e criar o registro da chave; o passo a passo vai no chat

### D-14 · A revisão das Receitas do Blend
Pergunta: Quando revisamos juntos as Receitas do Blend do Painel?
Contexto: Você aprovou o Painel para uma primeira iteração e disse que precisa rever as Receitas comigo. Elas entram por último na ordem de construção (depois dos textos e das chaves), então dá tempo de rever antes de construir.
Base: forte — é a ordem das fatias
- a) Antes de eu construir as Receitas, numa rodada de protótipo só delas (Recomendado)
- b) Construa como está no protótipo e revisamos em cima do que ficou pronto
→ respondida em 2026-11-23 11:16
  - b
→ aplicada em 2026-11-23 11:16: registrado: as Receitas do Blend são construídas como estão no protótipo e a revisão acontece em cima do que ficar pronto
