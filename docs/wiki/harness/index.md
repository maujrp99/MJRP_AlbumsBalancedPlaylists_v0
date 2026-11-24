---
title: Kernel do MJRP Harness
summary: as 31 páginas do harness que este projeto carrega — o que os campos do VISION, a memória, o perfil e os sensores significam
---

## Definition

Cópia carimbada (versão **2026-11-24**, fonte `ea9bb8495`) das páginas do MJRP Harness que governam como uma instância funciona. **Não se edita aqui**: edite no harness e rode `new_project.py --refresh-kernel`. O doctor (I5) avisa quando o carimbo envelhece.

As páginas vêm achatadas nesta pasta; os grupos abaixo são os temas da fonte (no harness, `docs/wiki/kernel/<tema>/`).

### ways-of-working · como trabalhamos — o PDLC em loops, a descoberta, o SDD, git, decisões, o kaizen

| Página | O que responde |
|---|---|
| [adr-practice](adr-practice.md) | quando uma decisão vira ADR, o que a ADR pode e não pode mudar depois, e o gate Proposed → Accepted |
| [spec-kit](spec-kit.md) | as três camadas com o mesmo nome (Spec Kit do GitHub, SpecKit do MJRP, uso real por projeto), a lista única de 9 artefatos e onde cada um mora no grafo de requisitos, o que foi fundido de propósito, e as duas extensões do MJRP — PRD com o mapa dos requisitos (do BMAD) e uat.md |
| [loop-engineering-concept](loop-engineering-concept.md) | o loop como o que roda sem você — os 4 níveis, a matemática dos erros compostos, loop fixo × criador, e por que o gargalo é o verificador, não o modelo |
| [harness-kaizen](harness-kaizen.md) | onde o harness falhou e o que se aprendeu com isso — o erro e a correção no mesmo lugar |
| [git-governance](git-governance.md) | como se commita, ramifica, integra e marca versão num projeto do harness — tipos e formato do commit, os commits de cada etapa do Delivery, o ramo por feature, a integração (a sessão integradora, os trens, o juiz por lote e o portão do pre-merge-commit) e suas condições, tags, brownfield, e o que os hooks exigem |
| [product-discovery](product-discovery.md) | o processo da etapa Enquadrar da Discovery do MJRP — Rapid (cinco passos essenciais, iterativo com o LLM) e Full (o Rapid mais técnicas que o PM marca no início), os quatro riscos transformados em teste, a decisão matar · iterar · avançar e onde cada saída mora no grafo do projeto |
| [pdlc-loops](pdlc-loops.md) | o ciclo de vida do produto no MJRP como uma fundação e cinco loops — Intake com duas vias (padrão e rápida), Discovery (o que construir), Design (a tela e a descrição dela, com o portão Pronto para construir como saída), Delivery em SDD com executor, juiz e integrador (construir certo), Release (Homologação, Aceito e Deploy) e Learn (deu certo?) —, cada um com critério de saída, verificador e regras de parada; o humano na intenção, no aceite do que há para ele ver, decidir ou de segurança e no risco de negócio |
| [conformance-notes](conformance-notes.md) | como a skill dona de um item do catálogo canônico executa uma nota de migração (CM-NNNN) de um filho — o check do catálogo é o juiz, o conteúdo do projeto é editado no lugar, o que é do humano é perguntado e quem registra é o modo conform da bootstrap |

### skills · o sistema de skills e de agentes — arquétipos, papéis, o que um agente é

| Página | O que responde |
|---|---|
| [agents-agentic-concepts](agents-agentic-concepts.md) | o que o campo chama de agente, os padrões agênticos, os cinco tipos de sistema, a taxonomia skills/MCP/RAG/memória — e onde as fontes discordam |

### architecture · estrutura do harness — camadas, memória, perfis, sensores, hooks, grafos

| Página | O que responde |
|---|---|
| [base-concept](base-concept.md) | a cadeia propósito → visão → objetivo → roadmap — o que cada elo responde, com que horizonte, e por que a ordem entre eles não é estilo |
| [memory-architecture](memory-architecture.md) | onde cada coisa que persiste mora e quando entra na janela — a arquitetura da ADR-0008, o que as referências fazem, e de onde veio a escolha |
| [context-vs-memory](context-vs-memory.md) | a fronteira entre os tokens que estão na janela agora e o que persiste fora dela — e por que a memória existe para não perder e retomar o contexto |
| [project-profiles](project-profiles.md) | os três perfis que o harness atende — e a distinção que o README apagava, entre PERFIL (o que o projeto entrega) e CAMINHO DE ADOÇÃO (por que porta ele entra) |
| [doctor](doctor.md) | o que o doctor mede, o que ele deliberadamente não mede, e por que uma checagem só nasce depois de um incidente |
| [harness-concept](harness-concept.md) | o que o campo chama de harness — cinco fontes, onde elas convergem, onde discordam, e a posição que o MJRP adota |
| [harness-elements](harness-elements.md) | os harness elements — os sete elementos de um sistema agêntico, na ordem do diagrama do PDLC (os loops no núcleo), o domínio de cada um, e onde o MJRP está |
| [engineering-canon](engineering-canon.md) | os quatro livros que fundamentam a Parte I do PRINCIPLES — destilados, com o que é universal separado do que é opinião de stack |
| [graph-engineering-concept](graph-engineering-concept.md) | o fluxo do agente como grafo — os três padrões, a comparação loop × graph × swarm, e a pergunta única que escolhe entre eles |
| [hooks-concept](hooks-concept.md) | hook como evento + script — a camada de determinismo dentro de um sistema probabilístico, e a regra que decide o que vai para hook e o que fica no prompt |
| [knowledge-graph-concept](knowledge-graph-concept.md) | o que é um knowledge graph, o que é ontologia e como ela difere de taxonomia e vocabulário controlado; tripla, RDF × grafo de propriedades, schema × instância, e validação por formas |
| [linked-notes-concept](linked-notes-concept.md) | o modelo de notas atômicas e densamente ligadas que o Obsidian popularizou — de onde vem, os nomes que ele tem, os mecanismos (wikilink, backlink, embed, block ID, MOC) e como o harness o usa como a leitura humana do grafo |
| [architecture-review](architecture-review.md) | as regras com ID estável que a crítica de arquitetura cita — governança, anatomia da ADR, macroarquitetura, dados, comunicação, resiliência, invariantes com teste binário, vetos imediatos e sensores — destiladas do Handbook MJRP de Architecture Review (v0) |
| [design-patterns](design-patterns.md) | os 29 padrões que o agente consulta ao planejar, refatorar e gerar código — cada um com ID estável DP-nn, o problema, o sinal mínimo para entrar, quando NÃO usar, a forma funcional e a OO, o teste S/N, o sensor e o endereço no harness; destilado do guia v1 do MJRP |

### roadmap · intenção e escopo — a visão, os resultados, épicos e releases no grafo de requisitos

| Página | O que responde |
|---|---|
| [vision-document](vision-document.md) | o que entra num documento de visão, o que não entra, e o teste que separa os dois |
| [requirements-graph](requirements-graph.md) | como requisitos e artefatos do PDLC viram nós com ID estável e arestas tipadas, legíveis no Obsidian e por script; a cardinalidade feature × requisito; como a release agrupa requisitos e épicos; a aresta contributes_to entre roadmaps, o estado Cancelled e a identidade de ID no repositório |

### design · o cânone de design e os padrões de saída visual — telas, planilhas, paletas

| Página | O que responde |
|---|---|
| [design-canon](design-canon.md) | as fontes elevadas que fundamentam UX, UI, conteúdo explicativo e copy de site no MJRP — organizadas em dez disciplinas com regras de ID estável que as skills citam em vez de recitar |
| [spreadsheet-standard](spreadsheet-standard.md) |  |
| [palette-library](palette-library.md) | as paletas curadas com a identidade visual pessoal do MJRP (Light + Dark) — fonte única para qualquer skill que gere output visual (infográficos, dossiês, decks, site pessoal) |
| [sketch-vs-prototype](sketch-vs-prototype.md) |  |
| [design-round](design-round.md) |  |

### raiz do kernel

| Página | O que responde |
|---|---|
| [terms](terms.md) | o glossário do MJRP — todo o vocabulário, agrupado por função no harness e alfabético dentro de cada grupo |
