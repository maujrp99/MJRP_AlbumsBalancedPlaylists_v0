# A via rápida, como funcionou no Album Blender em 20/11

Escrito em 2026-11-21 11:47, a pedido do MJRP: «a agilidade do seu trabalho de ontem deve ser o modelo para o fast lane do harness … conte pra ele seu processo, liste o seu processo aqui» e «ok esse é o resumo do fast lane, coloque no md pls». É insumo para a feature 350 da versão 2.0 do harness; já foi enviado ao agente mestre.

## O processo, em seis passos

1. **Uma conversa só com o MJRP.** O orquestrador coordena e só ele mexe na `main`.
2. **Pedido novo vira feature em esboço na `main`, na hora.** Spec, plano, tarefas e a história no documento do produto, num commit.
3. **O que ele não responde, o agente decide** e marca como «decidido pelo agente — revisável». Não para para perguntar.
4. **Um agente interno por feature constrói**, num espaço de trabalho próprio, com um pedido completo: teste primeiro, prova no navegador, evidência e documentação no mesmo ramo.
5. **Outro agente, que não construiu, confere a tela** contra o que o MJRP aprovou. O que for importante volta ao construtor e passa de novo.
6. **O orquestrador junta, roda todos os testes e o build, publica com a palavra dele e confere em produção**, dizendo o que não foi visto.

Quando a feature tem tela nova, antes do passo 4 há uma rodada de desenho: protótipos no comparador, e ele escolhe com uma frase.

## O que isso entregou

A Home nova (feature 79) e a página de entrada (feature 80) foram do protótipo aprovado à produção em cerca de 12 horas, com a conferência visual independente. Os ajustes pedidos de manhã saíram no mesmo dia.

## O que deixou o trabalho lento em 21/11

- **A fila da máquina:** vazia na noite de 20/11; com 16 a 17 trabalhos em 21/11, quase todos do harness. Uma publicação pedida por ele esperou uma hora e saiu sem rodar.
- **Uma sessão por feature:** cada uma repassa o trabalho ao orquestrador e espera a mesma fila; várias rodavam a conferência geral do projeto por conta própria.
- **Nomes de ramo:** a trava recusou três ramos sem número de feature; cada recusa custou uma ida e volta.
- **A `main` fechada para features até o push**, regra que chegou com a atualização do harness; o Harness Remote não carregava e o push foi pelo terminal.
- **Erro do orquestrador:** demorou a pedir a conferência visual de uma mudança pequena.

## O que o MJRP valorizou

Uma conversa só, pouca cerimônia, a tela em produção rápido, e a conferência independente mesmo assim.
