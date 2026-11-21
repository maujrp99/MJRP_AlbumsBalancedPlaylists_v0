<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# PRINCIPLES — as regras que regulam a ação no MJRP

> Princípio é **a regra que regula a ação e serve de base ao método**; visão é para onde se vai;
> contrato é o que varia por projeto.
>
> Um princípio entra aqui quando vale para **qualquer** projeto da MJRP, em qualquer stack. O que
> só vale para um projeto é regra dele — mora na `constitution.md` dele, como delta (Parte III).

---
## I · De engenharia — o que todo software da MJRP herda

Valem para qualquer stack. Um projeto não os reescreve: herda (Parte III) e acrescenta o que é
específico da linguagem ou do framework dele.

> **O cânone mora em [[engineering-canon]]**, página do kernel — *The Pragmatic Programmer*,
> *Clean Code*, *Clean Architecture* e *Refactoring* destilados, com o que é universal separado do que é opinião
> de stack. Cada princípio abaixo aponta para a seção que o fundamenta. Aqui fica a **regra e o
> teste**; lá, o porquê e o detalhe — carregado por quem vai desenhar, não por toda sessão.

1. **Todo código é componentizado e modularizado.** Escolha sempre o design pattern que leve a
   isso. *O teste:* se um arquivo faz duas coisas que mudam por motivos diferentes, virou dois.
   → [[engineering-canon]] § *Componentização* — inclui *Quando extrair* · § *Sinais e anti-padrões*

2. **Uma responsabilidade por módulo, e módulo pequeno.** Componente renderiza, repositório busca,
   serviço orquestra — nunca os três. **Previna God Files.** *O teste:* descreva o módulo numa
   frase sem usar "e"; se não der, ele é dois.
   → [[engineering-canon]] § *SRP e o Stepdown Rule*

3. **Dependências apontam para dentro.** Domínio não conhece framework; regra de negócio não
   conhece banco. Toda dependência externa fica atrás de uma interface que o projeto possui
   (`DP-14`); o padrão de cada caso — dado, integração, terceiro — é `DP-01`, `DP-12`, `DP-07`,
   em [[design-patterns]]. *O teste:* trocar a fonte de dados tem que ser **um arquivo**; se
   exigir mais que o adapter, a fronteira vazou.
   → [[engineering-canon]] § *Dependency Rule e DIP* · § *Camadas concêntricas* · [[design-patterns]]

4. **Composição sobre herança; padrão nomeado.** Comportamento se estende por composição. Cada
   padrão em uso (o catálogo, com ID `DP-nn`, está em [[design-patterns]]) é declarado com *onde*
   e *para quê*, para o próximo agente reconhecer em vez de reinventar. *O teste:* o padrão está
   escrito com endereço na `constitution.md`, citando o `DP-nn`, ou o próximo vai reinventar.
   → [[engineering-canon]] § *Padrões, com endereço* · [[design-patterns]]

5. **ETC e DRY.** Bom design é o que é **mais fácil de mudar**; e todo conhecimento tem uma
   representação única, inequívoca e autoritativa no sistema. *O teste:* a mesma regra escrita em
   dois lugares vai divergir — a única questão é quando.
   → [[engineering-canon]] § *ETC e DRY* · § *Fluxo de dados e estado* (estado em fonte única)

6. **O código expressa a intenção.** Nome revela propósito, função é pequena e faz uma coisa, um
   nível de abstração por função. Comentário não compensa código ruim. *O teste:* alguém lê a
   função e sabe o que ela faz **sem ler o corpo inteiro**.
   → [[engineering-canon]] § *Nomes e funções* · § *Regras de Kent Beck*

7. **Sem janela quebrada.** Código ruim, decisão ruim ou design ruim **se conserta na hora em que
   é descoberto** — entropia de software se espalha por negligência, não por acidente. E deixe o
   lugar mais limpo do que o encontrou. *O teste:* se a resposta for "depois", já é janela
   quebrada.
   → [[engineering-canon]] § *Entropia e a regra do escoteiro*

8. **Sem falha silenciosa.** Clique morto, erro engolido, estado que dessincroniza sem avisar são
   bugs, não detalhes. Erro se sinaliza pelo mecanismo da linguagem, nunca se ignora. *O teste:*
   se falhar, alguém **fica sabendo** — usuário, log ou sensor.
   → [[engineering-canon]] § *Tratamento de erro* — inclui o que aí é opinião de stack · § *Fluxo
   de dados e estado*

9. **O sistema é testável, e o teste vem junto.** Testes rodam todos, e são **F.I.R.S.T.** —
   rápidos, independentes, repetíveis, auto-verificáveis e escritos no tempo certo. *O teste:* dá
   para rodar a suíte inteira sem preparar nada à mão?
   → [[engineering-canon]] § *Testes e TDD*

10. **Nenhum código sem spec aprovada.** *(Invariante — o irmão do II.4.)* Specify → Plan → Tasks
    → Implement, sem pular etapa; feature não está pronta até o dono confirmar. Aparecia em cinco
    das sete constituições dos projetos como princípio; o harness tratava como processo. É
    princípio. *O teste:* existe `spec.md` que passou na sua checagem para o que está sendo
    implementado — aprovada pelo humano onde o contrato liga `gates:`; o padrão é aprovar o «Pronto para construir» (os
    requisitos Ready). É binário, não tem nível.

11. **Assuma a responsabilidade.** Erro que acontece se assume com honestidade, e no lugar da
    desculpa vem a opção acionável. *O teste:* a frase começa com o que aconteceu, não com o
    porquê não foi culpa de ninguém.
    → [[engineering-canon]] § *The Cat Ate My Source Code*

12. **Tela que muda é tela que se compara com a referência visual aprovada — nunca por relato do
    agente.** Toda entrega que cria ou altera uma tela roda num navegador real (MCP Playwright,
    `@playwright/mcp` — a conexão padrão do harness, ver [[tools-catalog]]) e é **comparada com a
    referência visual aprovada dela** antes de ser dada como pronta. Referência visual aprovada é
    qualquer ferramenta que dê o visual de uma tela aprovada: o protótipo em HTML, o arquivo do
    Figma ou a exportação dele, outra ferramenta de design. Vale para qualquer projeto que declara
    UI no contrato (`--ui`), e é o último passo do `tasks.md` da feature. Não substitui o 9 (teste
    automatizado F.I.R.S.T.) — cobre o que ele não alcança: como a tela renderiza de verdade e se
    ela é a tela que se aprovou. *O teste:* existe, datada da mesma entrega e cobrindo a tela que
    mudou, a comparação com a referência — o sensor de paridade visual do projeto e os pares lado a
    lado olhados nas larguras e paletas do projeto; screenshot ou snapshot de DOM sozinho, ou os
    critérios do spec conferidos um a um, não contam. Sem isso, a tarefa não está pronta, mesmo com
    o código certo. *Emenda do MJRP, registrada em 2026-10-12 16:32 — antes, o teste aceitava "screenshot, snapshot
    de DOM ou assert do Playwright", e a UI da 1.0 do Control Center chegou ao UAT longe do protótipo
    com tudo verde ([[harness-kaizen]] 2026-10-11 12:09).*

13. **Tela que se especifica é tela que se viu antes.** Spec de feature que cria ou altera tela não
    avança pro Plan sem um protótipo visual aprovado pelo humano — registrado no `info-arch.md`
    § *Protótipos aprovados*, uma entrada por versão, com `shows::` listando os estados que ele
    mostra. *O como* (19/09): o protótipo sai da **ferramenta de prototipagem
    declarada no contrato** (`tools.prototyping`, receita na `mjrp-designing-ui`), passa pela
    **`mjrp-critiquing-ux-ui`** contra o [[design-canon]] (nenhum P0 aberto) e só então chega ao dono;
    HTML/React cru da própria AI Platform é último recurso, declarado no registro. Não substitui o 12
    (verificação Playwright pós-implementação) — cobre a ponta oposta: decidir a tela **antes** de
    especificar, não confirmar que ela renderiza depois de pronta; o mesmo cânone julga as duas
    pontas. *O teste:* todo estado de tela para o qual aponta um requisito Ready aparece no
    `shows::` de um protótipo visto e aprovado pelo dono, datado, com o veredito do juiz (o sensor
    do grafo confere) — sem isso, a feature não avança mesmo com REQs certos; e todo commit que traz versão nova
    do protótipo traz o `info-arch.md` e os wireframes de todas as telas (hook `commit-msg`, doctor W14).

14. **Segredo nunca no código.** Chave de API, token, senha e credencial vêm do ambiente — variável
    de ambiente, `.env` fora do versionamento, secret manager ou as propriedades do script — e
    nunca são escritos no código nem na documentação. Credencial guardada no cliente só com o
    padrão BYOK aprovado na `constitution.md` do projeto. Segredo encontrado no código existente
    se aponta na hora, e o padrão não se copia. *O teste:* o repositório inteiro pode ficar
    público amanhã sem que nenhuma credencial precise ser trocada.

---

## II · Do harness — como o entorno decide

Estes regulam **como o entorno decide** — o método, não o código. O objeto que eles governam é o
harness, e são quatro condições que fazem algo ser um:

> **T1 · Loop de execução** — opera como uma variação do clássico ciclo OODA (Observar,
> Orientar, Decidir, Agir) ou do padrão ReAct (Reason + Act), rodando de forma estritamente
> controlada pela infraestrutura do harness (*pensar → agir → observar → ajustar*).
> **T2 · Interface de ferramenta** — o agente consegue **chamar** o mundo, não só descrevê-lo.
> **T3 · Gestão ativa de contexto** — o que entra e o que sai da janela é decidido, não acumulado.
> **T4 · Mecanismo que não dependa do modelo cooperar (determinístico)** — ***pedido não é regra***.
>
> Faltando qualquer uma, o que existe é um prompt sofisticado, não um harness. **A régua não
> envelhece; a nota do MJRP contra ela sim** — essa mora em [[harness-concept]], com data.

1. **O nível de processo é escolha; o processo escolhido é invariante.** O harness não impõe a
   mesma quantidade de método a todo projeto — *quanto* rodar se decide no contrato
   (`process_level:`), antes da sessão, nunca em runtime. Mas o que o contrato declarou sai do
   campo da escolha: o harness verifica o cumprimento **por mecanismo, não por confiança**
   ([[harness-concept|T4]] — *pedido não é regra*). *O teste:* complete *"esse projeto é pequeno,
   então pode ficar assim"*. Se faz sentido, é escolha de nível e mora no contrato; se soa
   absurdo, é invariante. **E o que o contrato declarou passa para o lado do invariante.**

2. **Guides são caros, sensores são baratos.** Guide inferencial custa token e atenção a cada
   sessão; sensor computacional custa milissegundos e zero token quando passa. Por isso calibrar
   processo e ligar sensor **não é tradeoff**: custo cai e qualidade sobe juntos.

3. **O agente não é o juiz.** Quem julga é um mecanismo que devolve 0 ou 1. Auto-relato de parte
   interessada não é verificação.

4. **Nenhum loop começa sem critério de saída declarado e verificável.** Não está claro? Pare e
    defina com o dono, com opções. No modo *AI Collab* (assistido por IA, human-in-the-loop) o
    humano pode ser o critério; no *Autonomous* tem que ser um comando com exit code — loop sem
    critério não é autonomia, é entrega às cegas.

5. **Toda falha de agente é bug do harness até prova em contrário.** Antes de culpar o modelo,
   procure o guia ausente, a ferramenta que faltou, o contexto que não chegou.

6. **Escale pelo diagnóstico, não pela categoria.** Falha por *falta de informação* pede mais
   contexto — documento, referência, exemplo. Falha por *comportamento errado* pede mais regra —
   spec, hook, gate. São eixos diferentes; escalar o errado só encarece.

7. **Dogfooding.** O harness obedece às próprias regras: mantém a memória, o contrato e os
   sensores que manda todo projeto manter. O primeiro projeto sob o harness é o harness.

8. **Documentos são o cérebro compartilhado.** Todo agente lê a mesma fonte da verdade antes de
   agir — no Git, nunca num chat. 

9. **Uma fonte da verdade por capacidade.** Sem skill duplicada, sem ambiguidade skill × workflow
    para o mesmo trabalho, sem dois arquivos dizendo a mesma coisa.

10. **O humano não pode ser o gargalo — o processo é um loop.** Enquanto houver um único humano no
    loop, decidir é leve: o agente leva pouco para ler (candidatas prontas, uma decisão de cada vez,
    o essencial), a decisão tomada é revisável, e o retrabalho é aceito como custo do loop — avançar
    e corrigir na volta seguinte vale mais do que parar esperando leitura longa. Cada fase do ciclo é
    uma volta, não um portão definitivo. *Direção do MJRP, 2026-10-07 14:38; rever quando houver mais humanos ou
    agentes definidos no loop.*

---

## III · Como um projeto herda isto

A `constitution.md` de um projeto **não reescreve** nada deste arquivo. Ela faz três coisas, e só:

1. **Declara a herança** — *"Este projeto segue o `PRINCIPLES.md` do MJRP Harness, versão X."*
2. **Acrescenta o que é dele** — os padrões proibidos da stack (*"sem `any`"*, *"Composition API
   only"*), o limite de tamanho que a linguagem pede, a referência de comportamento (*"quando
   ambíguo, o V0 é a spec"*).
3. **Não diz tecnologia nem quem-faz-o-quê** — isso é campo do contrato de instância
   (`tech_stack:` a tecnologia do produto, `stack:` a atribuição de papel, `models:` o roteamento
   de modelo, `tools:` as ferramentas), não texto de constituição.

Uma constituição de 142 linhas cabe em 30. E as duas cópias que os projetos mantêm hoje — a de
`docs/specs/` e a de `.specify/memory/`, onde o SpecKit a espera — passam a ser **uma escrita e
uma gerada**, nunca duas escritas: em dois dos cinco projetos elas já divergiram.

> **O que sobe e o que não sobe.** Sobe para cá o que é verdade em Apps Script, Vue e Next.js
> igualmente. *Vanilla-first*, *Pinia-only*, *300 linhas*, *sem `any`* são opiniões de stack —
> ficam na constituição do projeto. Subi-las seria transformar este arquivo no que as sete
> constituições são hoje.
