---
id: S-76
aliases: [S-76]
type: requirement
format: story
status: Backlog
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-41]]"
---
# S-76 · Como quem usa o app, quero que a passagem de uma tela para outra seja suave, para que o app não dê solavancos ao eu navegar.

## pt-BR

Origem: o MJRP, em 2026-11-22: «agora que vi no menu aquela barra laranja que aparece no topo, nao deveria aparecer mesmo e as transicoes precisam ser mais suaves, creio que é pq nao finalizou a migracao ainda, certo?» À pergunta do orquestrador «Transições mais suaves entre telas: registro para logo depois da migração (recomendo)?», o MJRP respondeu: «3. Sim».
A passagem entre telas (os itens do menu, da home para o app e de volta, a abertura e o fechamento de janelas e de folhas do celular) hoje é abrupta; ele quer mais suave. Vem logo depois de a migração para React (F83) chegar à produção, porque com todas as telas em React um só mecanismo serve o app inteiro. Como fazer, quanto tempo dura e se a home entra não está decidido: começa por uma rodada de desenho. A F94 registra o pedido. A barra laranja do topo é uma pergunta aberta à parte (spec da F94).
Relacionada: [[S-70-move-from-the-home-to-the-app-without-a-jolt]] (a passagem da home para o app).

## en

**As someone using the app, I want the move from one screen to another to be smooth, so that the app does not jolt when I navigate.**

Origin: the MJRP's words of 2026-11-22 (above), and his «3. Sim» to the orchestrator's proposal to register it right after the React migration. How, how long, and whether the home joins are not decided; a design round comes first.
