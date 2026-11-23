# The Album Blender: o board arrumado e uma sugestão de prioridade

Escrito em 2026-11-23, no ramo `wip/board-tidy-2026-11-23`, a pedido do MJRP: «ok, arrume as features do board e sugira a prioridade». É uma sugestão: o arquivo da prioridade (`docs/specs/priority.md`) não foi tocado. «Sessão» abaixo quer dizer uma sessão de trabalho de um agente, do começo ao merge; os números são estimativas minhas, não medidas.

## 1. A ordem que sugiro para tudo o que está aberto

1. **O painel de textos do CMS (F82).** Já está em construção e quase pronto. Custa 1 a 2 sessões depois que o kit chegar. Depende da versão oficial do kit do CMS, no harness.
2. **A página de entrada no celular (F96), com o deslize da caixa «Na caixa do The Album Blender».** É o que você está desenhando hoje. Custa 2 sessões. Depende de duas respostas suas: o título da parte que ensina e como marcar a troca de passo.
3. **A curadoria no computador (F95).** Vem junto da anterior, usa a mesma caixa. Custa menos de 1 sessão. Depende de você dizer se basta o selo e se quer data ou nota.
4. **As chaves de ligar e desligar funções no CMS (F93).** Destrava as receitas e a chave da medição. Custa 2 sessões. Depende do painel (item 1) e do seu sim ou não a uma regra de arquitetura proposta.
5. **As receitas de blend geridas no CMS (F92).** Você quer revisar com o orquestrador antes. Custa 3 a 4 sessões. Depende das chaves (item 4) e dessa revisão.
6. **As transições suaves entre as telas (F94).** O usuário sente. Custa 1 rodada de desenho e 1 a 2 sessões. Depende de você escolher uma forma no comparador.
7. **O site em mais de uma língua (F81).** Custa 2 a 3 sessões, e aqui estou inseguro (ver a seção 4). Depende das suas respostas ao mapa de textos.
8. **Exportar pelas playlists guardadas (F90) e o ambiente de prévia (F87).** Já estão no ar e em uso; falta só papel. Custa meia sessão cada. Não dependem de você.
9. **Fechar o papel das que já estão no ar** (o site em React, o menu novo, «Create» no menu, a galeria do inventário no celular e as outras da tabela). Custa 2 sessões no total. Parte delas espera um carimbo ou uma decisão sua.
10. **Paradas por decisão ou por algo seu:** o app de iPhone e Android (F78, em pausa por decisão sua), a medição de uso (F77, espera a chave do PostHog), o guardado do servidor (F52, espera uma decisão sua).

**Onde esta ordem difere da sua lista de hoje.** A sua lista, lida às 16:09, é: a página de entrada no celular (F96), a curadoria (F95), exportar pelas playlists guardadas (F90), as transições (F94), o ambiente de prévia (F87). Três diferenças:
- O painel de textos do CMS (F82), as chaves (F93) e as receitas (F92) **não estão na sua lista**, embora o painel esteja em construção. Se a ausência é de propósito, ignore os itens 1, 4 e 5.
- Exportar (F90) e o ambiente de prévia (F87) estão na sua lista, mas **já foram construídos e publicados**. Não precisam de vaga de construção; por isso os pus no fim.
- «Create» no menu (F91) saiu da sua lista na última reordenação. Também já está no ar.

Você pediu o comando de terminal para reordenar a lista por conta própria, porque o board do Control Center está se comportando mal, e o orquestrador o entregou. Este relatório não mexe na lista.

## 2. O estado de cada feature depois da arrumação

Classes: **1** pronta, só falta papel · **2** pronta, mas pede o seu olho ou uma decisão sua · **3** feita em parte, com trabalho de verdade pela frente · **4** parada ou superada.

| Feature | Classe | O que fechei hoje | O que falta |
|---|---|---|---|
| As telas mantêm o campo em uso (F73) | 1 | **Fechada** (`Done`): a reconferência visual que faltava existe desde 2026-11-21; cada requisito com a sua prova | nada de agente |
| Preços de CD e onde comprar (F75) | 2 | **Fechada** (`Done`): as três tarefas dos valores guardados no banco marcadas com prova; a trava de estado a levou a `Done` | as doze decisões «revisáveis» do plano são suas |
| Exportar pelas playlists guardadas (F90) | 1 | as sete tarefas e o documento marcados com prova; nota na spec | escrever duas seções da spec; depois `Done` |
| Ambiente de prévia (F87) | 1 | quatro tarefas marcadas com prova; nota na spec | provar que a prévia não grava preço do Discogs; a sua confirmação numa linha de proposta da arquitetura |
| «Create» no menu, com o sinal de mais (F91) | 1 | só a nota na spec; **a trava recusou marcar as tarefas** (fora da sua lista) | o passo de documentos da via rápida |
| As telas do site em React (F83) | 2 | nada | as caixas de fecho esperam o seu carimbo no registro de arquitetura da migração (ADR-0023); depois é papel |
| O menu do topo novo (F88) | 1 | nada (não está na sua lista; a mesma trava recusaria) | marcar a tarefa da publicação conjunta, já feita em 2026-11-21 |
| A galeria do inventário no celular (F89) | 2 | nada | confirmar a dispensa de protótipo; depois é papel |
| «Start» no menu e o logotipo levando à página de entrada (F85) | 1 | nota: o item hoje se chama «Create» | a prova no site construído e o passo de documentos da via rápida |
| O sensor visual (F84) | 3 | nada | uma tarefa (o sensor geral sem o aviso antigo, a suíte) e os documentos |
| A página do design system do site (F86) | 3 | nada | terminar a conferência da página contra o site |
| O painel de textos do CMS (F82) | 3 | nada (em construção por outra sessão) | o painel e mais de dez tarefas; espera o kit |
| As chaves no CMS (F93) | 3 | nada | a parte do alicerce está feita; o resto espera o painel |
| As receitas no CMS (F92) | 3 | nada | quase tudo; espera as chaves e a revisão com você |
| O site em mais de uma língua (F81) | 3 | nada | ver a seção 4 |
| Filtros, busca e paginação dos álbuns (F51) | 3 | nota: as telas viraram React | pôr o protótipo no repositório; uma issue que outra feature consertou trava o fecho |
| Um seletor de álbuns e um classificador (F57) | 2 | nota: as telas viraram React | uma issue sua segue aberta: criar e editar com a mesma lógica |
| Fechar o que está aberto em segurança (F59) | 2 | nada | as chaves do Spotify guardadas no navegador: decisão sua |
| Um caminho testado até a produção (F64) | 2 | nada | a automação do GitHub só roda depois de um envio seu |
| Falha do Spotify aparece como falha (F69) | 1 | nada | uma prova que só vem quando o Spotify falhar em produção; o resto passa na trava |
| O inventário com todos os álbuns das séries (F71) | 2 | nota: as telas viraram React | o seu julgamento e os documentos |
| As notas chegam às faixas certas (F74) | 2 | nada | a sua resposta sobre «Aisle of Plenty» e os documentos |
| A geração de álbuns no servidor (F52) | 2 | nada | a decisão sobre o guardado do servidor e uma prova em produção |
| A medição de uso (F77) | 2 | nada | a chave do PostHog |
| O app de iPhone e Android (F78) | 4 | nada | em pausa por decisão sua de 2026-11-21 |
| A página de entrada no celular (F96) | 3 | spec, plano e tarefas reescritos com a sua escolha; via rápida | construir; duas respostas suas |
| A curadoria «Na caixa do The Album Blender» (F95) | 3 | spec, plano e tarefas com o que é só dela; via rápida | construir; as suas respostas |
| As transições suaves (F94) | 3 | nada | a rodada de desenho |

**Fechadas hoje: duas** (F73 e F75). Linhas marcadas com prova: 18 (15 tarefas e 3 caixas), em quatro features (F73, F75, F87, F90).

## 3. A via de cada uma, para você dizer o que «tudo em fast lane» alcança

Li «tudo em fast lane» como: a página de entrada no celular (F96) e a curadoria (F95). Só essas duas mudaram de via. Seguem na **via padrão**, abertas: a medição de uso (F77), o app (F78), as línguas (F81), o painel do CMS (F82), o site em React (F83), a página do design system (F86), o ambiente de prévia (F87), o menu do topo (F88), a galeria do inventário no celular (F89), exportar pelas playlists guardadas (F90), as receitas (F92), as chaves (F93) e as transições (F94). Se «tudo» inclui alguma delas, diga quais.

## 4. O que não consegui conferir

- **Nenhum teste foi rodado** (a fila da máquina estava reservada). Toda marca de hoje se apoia em arquivo que existe na `main`, em relatório de juiz separado e em entrada do log.
- **As línguas (F81).** Os dicionários de inglês e português existem no código e a página de entrada abre em português, mas as tarefas dizem que quase nada foi feito. Não sei quanto da feature a migração para React já entregou.
- **A issue de «criar e editar com a mesma lógica» (F57).** Pode ter sido resolvida pela reescrita em React; não conferi.
- **O menu do topo (F88), a galeria (F89), o sensor visual (F84), a página do design system (F86) e «Start» no menu (F85):** classifiquei pelas tarefas e pelo log, sem abrir o código.
- **Efeito colateral das marcas.** A trava de estado do commit passou sozinha a «em andamento» as features cujas tarefas marquei: a página de entrada no celular (F96), a curadoria (F95), exportar (F90) e o ambiente de prévia (F87).
- **A sua lista mudou duas vezes enquanto eu trabalhava.** O ramo partiu da lista anterior; a de agora foi só lida.
- **O «ok» sobre o visitante sem conta** (o «Criar» da barra de baixo abrir o app) foi gravado como aceito, com a ressalva de que veio numa mensagem sobre outro assunto.
