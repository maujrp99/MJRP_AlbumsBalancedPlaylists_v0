<!-- kernel do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# Esboço vs. protótipo — desenhar para descobrir

> Kernel · página conceitual · criada 2026-09-21 19:00 · atualizada 2026-10-09 · fonte: Buxton, *Sketching User Experiences* (2007)

## Definition

Um **esboço** (sketch) e um **protótipo** são objetos diferentes, mesmo quando parecem iguais na
tela. O esboço é rápido, barato, abundante e **sugere** — existe para explorar e provocar reação.
O protótipo é mais refinado, mais caro, mais raro e **confirma** — existe para testar uma
decisão já tomada. Buxton resume: primeiro *get the right design* (esboços, muitos), depois *get
the design right* (protótipo, um). O que os separa não é o acabamento: é o **status** no
processo — o que já existe por trás (estrutura decidida? critério de julgamento?) e o que se
pode fazer com o resultado (referenciar num spec? levar a um gate?).

## No MJRP

- **Discovery · Explorar** (`mjrp-designing-ui`, [[pdlc-loops]] §3) produz esboços e protótipos *para o humano reagir*:
  fidelidade livre e crescente; cada versão já vem com a descrição da tela (`info-arch.md`, wireframes de todas as
  telas — o `commit-msg` recusa sem eles), mas sem passada da `mjrp-critiquing-ux`.
  O humano detalha requisito olhando. O resultado fica em `design/inception/`.
- **Discovery · Desenhar**, o passo do protótipo (`mjrp-designing-ui`), produz o protótipo *julgado* §I.13: com
  `info-arch.md` consolidado, passado pela `mjrp-critiquing-ux` e aprovado pelo humano, referenciado pelo `spec.md`.
- O protótipo do Explorar que ficou bom **não é descartado**: é o ponto de partida do protótipo do Desenhar — ou,
  se o humano julgar que basta, dispensa esse passo — não o sistema visual: a identidade que o protótipo usa vai para o
  `design-system.md` antes do «Pronto para construir». Na **via rápida**, o protótipo é opcional e vem depois da execução (só se o MJRP pedir): o protótipo rápido sobre o design system que
  já existe passa pela critic, o humano o aprova, e ele vira o estado julgado. Buxton chama o esboço de descartável; aqui a
  decisão de descartar é do humano, não da fase.
- A regra de status: enquanto não há passada da critic sem P0 nem aprovação do humano registrada em § *Protótipos
  aprovados*, o protótipo é **insumo**, não estado julgado, e não vai ao `spec.md`.

## Por que importa

O lifecycle nasceu com o segundo objeto só (o protótipo julgado) e assumia "definir → renderizar". Para
um humano visual, descobrir é "ver → reagir → definir". Sem o primeiro objeto, "quero um
protótipo" ou virava tela sem enquadramento, ou esbarrava em processo que exigia documento
antes de existir tela. Caso: `harness-kaizen.md` 2026-09-21.

Fontes que convergem: Knapp, *Sprint* (sketch → decide → prototype → test); Cagan, *Inspired*
(protótipo como artefato primário de discovery — "prototype to learn").

## Do protótipo ao produto — o mapeamento reverso

O processo de construção de produto do MJRP Harness é **visual primeiro**: a partir da ideia e do
propósito, chega-se rapidamente a uma representação visual, que o responsável pelo produto avalia
antes de qualquer especificação. O Explorar cobre essa ida — ver antes de definir. O
**mapeamento reverso** cobre a volta: aprovado o protótipo, tudo o que está nele é mapeado para que
**nada do que existe nele se perca no caminho até o build**.

**O protótipo é baseline, não molde.** Ele não engessa o produto final — o produto pode e vai
ficar diferente. Ele serve de lista do que não pode ser esquecido. Por isso cada item do
mapeamento registra **o que faz para o usuário** (a função), mais do que a forma que tem, e
termina num de quatro estados:

- **pendente** — mapeado, ainda sem destino no spec;
- **coberto** — está no produto como estava;
- **evoluído** — está no produto, de outro jeito;
- **cortado** — saiu de propósito, com o motivo escrito.

Só é falha o item que **sumiu sem decisão**. A conferência no build pergunta "foi coberto?",
nunca "ficou igual?".

**O mapa é vivo.** Ele mora no `info-arch.md` (seção *Inventário do protótipo*) e evolui com o
produto — é o mapa do produto, não a fotografia da v1 do protótipo. Versão nova do protótipo
acrescenta ou muda itens; não recomeça o inventário.

**Depois do inventário, as lacunas.** O protótipo aprovado valida sensação, densidade e mecânica —
não completude. A mesma passada confere o que *deveria* existir e não existe ([[design-canon]]
IN-09, IN-10). Uma coisa não substitui a outra: o inventário guarda o que existe; as lacunas acham
o que falta.

## History

- **2026-10-09 20:55** · Revisão geral de 2026-10-09: no Explorar cada versão já vem com o `info-arch.md` e os wireframes (o `commit-msg` recusa sem eles); o protótipo do Explorar que basta dispensa o Desenhar, mas não o `design-system.md` (a lacuna do Control Center); a regra de status passa a ser a crítica sem P0 e a aprovação registrada.
- **2026-10-07 20:29** · Onda E do PDLC em loops (`design/proposals/pdlc-loops-migration-plan.md`): a numeração antiga de fases deu lugar às estações e ao contrato de [[pdlc-loops]] §11.
- **2026-10-02 19:04** · **A volta: o mapeamento reverso.** Parecer vindo do brainstorming do YouTube Control Center,
  com o intuito esclarecido pelo titular: nada do que existe no protótipo aprovado se perde até o build,
  e o protótipo é baseline, não molde. Inventário como seção do `info-arch.md` (decisão dele, contra
  arquivo próprio); destino por item — pendente, coberto, evoluído, cortado com motivo; W11 no doctor.
  Sem fase nova: modo de entrada da 2a na `mjrp-designing-information-architecture`.

## Related

[[design-canon]] · [[harness-kaizen]] · `mjrp-designing-ui` · `mjrp-critiquing-ux`
