---
type: architecture-audit
subject: "ADR-0023 · as telas do site em React e TypeScript, tela a tela, com os textos num dicionário por idioma (docs/decisions/0023-site-screens-in-react-screen-by-screen.md) e a proposta guiada por risco da F83 (design/proposals/f83-react-screens/architecture-proposal.md)"
project: MJRP_AlbumsBalancedPlaylists_v0
feature: F83
moment: decision
judged: "2026-11-21 10:21"
who_judged: separate-agent
verdict: can-go
p0: 0
p1: 10
p2: 3
hygiene_notes: 5
human_decisions: 4
status: open
supersedes: none
---

# Crítica de arquitetura — ADR-0023 e a proposta da F83 (as telas do site em React, com os idiomas) · 2026-11-21 10:21

> Momento: decisão (ADR em «Proposed» e proposta de troca de pilha, antes do aceite)
> Objeto: `docs/decisions/0023-site-screens-in-react-screen-by-screen.md`, `design/proposals/f83-react-screens/architecture-proposal.md` e, da lista *Files* da ADR, `docs/specs/features/F83-site-screens-in-react/` (spec, plan, tasks) · Critérios: as regras técnicas de `docs/wiki/harness/architecture-review.md` (IDs com nome), `engineering-canon`, `constitution.md` v2.0.0
> Quem julgou: agente separado — recebeu só a skill e os artefatos; não desenhou nada disto
> Conferido no código (só leitura): `public/js/router.js`, `app.js`, `stores/` (as 8), `utils/staleBuild.js`, `splash/gate.js`, `test/architecture/` (os 28 sensores e `support/`), `vite.config.js`, `vitest.config.js`, `eslint.config.mjs`, `firebase.json`, `firestore.rules`, `scripts/entryPage.mjs`, `scripts/deploy-site.sh`, `package.json`, `constitution.md`, `tech-stack.md`, ADR-0022, `MEMORY.md` (*Do Not Forget*), spec da F81; o rascunho da medição e o código dela noutra pasta de trabalho (`public/js/react/`, `public/js/i18n/`, `reports/evidence/F83/raw/gzip-*.txt`); o kit do CMS (`MJRPpersonal/src/admin-kit/`)
> Não conferido: `arch.md`, `data-model.md`, `info-arch.md`, `prd.md` e `VISION.md` (não lidos por inteiro); a análise das quatro opções (não relida); a documentação do Firebase Hosting (não relida: o que a proposta diz dela fica como ela diz); a suíte, o build e os tipos (não rodados, por instrução); `critique_subject_check.py` (não existe em `mjrp-scripts/` deste projeto)
> Auditoria anterior: nenhuma sobre este objeto
> Sensor de ADR: `adr_header_check.py` rodou primeiro; a ADR-0023 passa (4.295 caracteres, linha `Acceptance` presente). O que ele acusa é das ADR-0019 e ADR-0020, fora deste objeto
> Sem código de produto: as camadas e as dependências são as declaradas. O nome do arquivo é o que a ADR e a proposta já citam (`…-f83-architecture-critique.md`); nada foi commitado nem escrito no log, por instrução de quem chamou

## Veredito

**Pode ir ao MJRP para o aceite: nenhum P0.** Os seis vetos passam ou não se aplicam, a regra de dependência continua apontando para dentro e o React fica na borda com sensor. O aceite é dele (a rota da ADR é `MJRP`), nunca do crítico.

Há **10 P1**, em quatro temas, por ordem de custo de mudar depois:

1. **O idioma em produção** (achados 1, 2, 3): uma leitura que falha pode apagar a escolha guardada na conta; um palpite pelo país vira «escolha»; e a proposta não diz quando o português abre para quem usa, de modo que o site fica misturado em produção durante as ondas.
2. **Rede e volta atrás** (5, 7, 8): toda troca de tela passa a depender da rede, e uma queda de rede hoje seria lida como «versão nova»; voltar atrás por `git revert` só vale para a última onda; a tela difícil é medida depois de a moldura migrar.
3. **A convivência React e telas antigas** (4, 6): a ponte com as stores tem um caso de dado velho que o texto não fecha; as peças usadas por várias telas ficam com duas implementações.
4. **O que os sensores e os números não provam** (9, 10): cinco regras sem sensor que meça o que promete; o teto de peso não tem número.

Nenhum desses pede outra arquitetura: todos se fecham no texto da proposta e nas tarefas da onda 0. Recomendo fechar os temas 1 e 2 antes da primeira publicação com React, porque são os que quem usa sente.

## Vetos

| Veto | Resposta | Evidência (uma linha) |
|---|---|---|
| VT-01 banco compartilhado | passa | o único dado novo (`users/{uid}/preferences/site`) tem um escritor, o serviço de preferências (§ 6); `mjrp.lang` é escrito só pelo seletor |
| VT-02 cadeia síncrona sem timeout | passa | `/geo.json` 1,5 s, dicionário pt 3 s, preferência 3 s e 5 s, cada um com saída (§ 7). O arquivo de tela, que vem do próprio Hosting e não de uma API externa, não tem prazo: achado 5 |
| VT-03 mensageria sem DLQ | não se aplica | não há fila nem mensageria |
| VT-04 sem traces | não se aplica | a decisão não acrescenta salto entre processos: é navegador e arquivos estáticos |
| VT-05 mutação destrutiva de schema | passa | o documento novo e a regra nova são só acréscimo; a troca de arquivo de tela convive com abas antigas pelo conserto da F64 |
| VT-06 SDK de terceiro no domínio | passa | React só em `screens/`, `ui/`, `react-bridge/` com o sensor `reactStaysAtTheEdge`; `i18n/` é JavaScript puro; o Firestore fica atrás do repositório em `shared/data/` |

## Achados

| # | Regra | Sev | O achado, em uma linha | Dono |
|---|---|---|---|---|
| 1 | IV-08 Sem falha silenciosa | P1 | a leitura da preferência que falha vira «sem preferência», e aí o idioma do aparelho é gravado por cima da escolha da conta | mjrp-designing-architecture · corrigir agora |
| 2 | AD-04 Ciclo de vida do dado | P1 | o idioma deduzido do país não tem vida declarada: ou é pedido a cada visita, ou vira «escolha» e sobe para a conta | mjrp-designing-architecture · corrigir agora |
| 3 | AD-05 Escrutínio das consequências | P1 | a proposta não diz quando o português abre para quem usa: entre ondas o site fica misturado em produção, e sem seletor até a onda 2 | mjrp-designing-architecture · corrigir agora; a escolha é decisão do humano |
| 4 | AD-02 Contratos e fronteiras | P1 | a ponte por número de versão não diz onde o número mora; uma mudança entre o primeiro desenho e a inscrição deixa a tela com dado velho | mjrp-designing-architecture · corrigir agora |
| 5 | AD-03 SPOFs mapeados | P1 | toda troca de tela vira um pedido de rede sem prazo, e uma queda de rede é tratada como «versão nova» e recarrega o app | mjrp-designing-architecture · corrigir agora |
| 6 | IV-05 ETC e DRY | P1 | as peças usadas por várias telas (ícones: 59 arquivos) ficam com duas implementações da onda 1 ao fim; o ícone medido usa o que a proposta proíbe | mjrp-designing-architecture · corrigir agora |
| 7 | MA-03 Evolução e reversibilidade | P1 | «reverter o commit» só vale para a última onda, e não há sinal em produção de tela quebrada | mjrp-designing-architecture · corrigir agora |
| 8 | MA-03 Evolução e reversibilidade | P1 | a tela difícil é medida na onda 3, depois de a moldura (que está em toda tela) já ter migrado | mjrp-designing-architecture · corrigir agora; a ordem é decisão do humano (D-7) |
| 9 | GV-03 Guias são caros, sensores são baratos | P1 | cinco regras da proposta não têm sensor que meça o que o nome promete | mjrp-designing-architecture · corrigir agora |
| 10 | AD-01 Invariantes quantificados | P1 | o teto de peso não tem número, e o tempo até a primeira tela não tem meta, com três esperas novas antes do primeiro desenho | mjrp-designing-architecture · corrigir agora |
| 11 | IV-04 Padrões com endereço | P2 | a moldura em React (onda 2) não tem pasta no desenho, e o sensor da borda a recusaria | mjrp-designing-architecture · vigiar |
| 12 | AD-02 Contratos e fronteiras | P2 | pontas soltas no contrato da ponte: «o roteador não muda» e a tarefa que o muda; exceções de import; navegar de dentro de um efeito | mjrp-designing-architecture · vigiar |
| 13 | MA-03 Evolução e reversibilidade | P2 | a saída do teste do Hosting depende de uma decisão ainda aberta (D-5), e o teste de uma hora não exercita o caminho pelo IP | mjrp-designing-architecture · vigiar |

### 1 · IV-08 Sem falha silenciosa · P1
- **Âncora:** proposta § 6 (segundo e terceiro tópicos) e § 7, linha «Ler a preferência da conta».
- **Evidência:** a § 7 diz que o erro é distinto de vazio; a § 6 diz o contrário: «o serviço trata a recusa como "sem preferência na conta"», e «se não tem, o do aparelho é gravado na conta», com «vale a última gravação». Juntas: aparelho B com `en` guardado, conta com `pt`; a leitura passa do prazo de 3 s ou é recusada; o serviço entende «não tem»; grava `en` na conta. A escolha feita no aparelho A some, sem aviso.
- **Critério:** também DD-02 Concorrência e conflitos: «a última gravação vale» com um escritor que grava sem ter lido.
- **Custo se ficar:** a regra do MJRP («a seleção do user toma precedência») quebra em rede lenta, em silêncio; só aparece como «o site mudou de idioma sozinho».
- **Check de aceite:** Uma leitura da preferência que falha (recusa, prazo, rede) deixa a conta intocada, e a gravação do idioma do aparelho na conta só acontece depois de uma leitura bem-sucedida que respondeu «não existe», com um teste que prova? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (é texto da § 6 e uma linha na § 7).

### 2 · AD-04 Ciclo de vida do dado · P1
- **Âncora:** proposta § 6 (linha «País de acesso: não é guardado … vale para uma decisão, na primeira visita») e § 5.3 (fluxograma e «A dica de país»).
- **Evidência:** o texto não diz se o idioma que saiu do país é guardado. Se não é, toda abertura sem escolha é uma «primeira visita»: um pedido a `/geo.json` e até 1,5 s de espera a cada vez, e o idioma muda quando a pessoa viaja. Se é guardado em `mjrp.lang`, fica igual a uma escolha e, ao entrar na conta, sobe para ela («o do aparelho é gravado na conta») e passa a valer acima do país. Mais um ponto do mesmo dado: todo visitante tem uma sessão de convidado no Firebase (`public/splash/gate.js`, cabeçalho); «com conta» precisa dizer que convidado não conta.
- **Custo se ficar:** quem constrói escolhe um dos dois sozinho; o segundo caminho prende um palpite como escolha, na conta, em todos os aparelhos.
- **Check de aceite:** A § 6 diz quanto tempo vive o idioma deduzido do país, onde fica, que ele nunca é gravado como escolha (nem no aparelho nem na conta) e que a sessão de convidado não é «conta»? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 3 · AD-05 Escrutínio das consequências · P1
- **Âncora:** proposta § 15 (ondas 0, 1 e 2), § 4.6 item 2 («Parar entre ondas deixa o site coerente»), R8, e a tabela de qualidade («Sem mudança para quem usa»).
- **Evidência:** cada onda vai sozinha para produção com a tela «nos dois idiomas»; a onda 1 entrega «a primeira tela inteira em português»; o seletor de idioma só chega na onda 2; o resto do site fica em inglês até a onda 7. Com a dica de país ligada, quem acessa do Brasil vê uma tela em português e todas as outras em inglês, por semanas, e nas ondas 0 e 1 sem como trocar. Se a migração parar (R1, o risco mais alto da própria proposta), fica assim para sempre. O R8 trata a tela meio traduzida; o site meio traduzido não aparece nos negativos, e não há chave que mantenha o português fechado até uma cobertura declarada.
- **Custo se ficar:** o produto vai a público (v6.0) misturando idiomas; consertar depois é desligar o português às pressas ou traduzir as telas antigas, que a proposta já sabe fazer (as mesmas 26 edições), fora da ordem.
- **Check de aceite:** A proposta diz qual é a chave única que abre o português para quem usa, qual cobertura a abre (que telas, a moldura, a página de entrada) e o que quem acessa do Brasil vê antes disso? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora; a escolha entre abrir aos poucos ou de uma vez é do MJRP (Decisões do humano, 2).

### 4 · AD-02 Contratos e fronteiras · P1
- **Âncora:** proposta § 4.3 («A ponte com as stores, e o risco R4»); `plan.md` (linha de `useStore.ts`); `tasks.md` TASK-04.
- **Evidência:** «cada aviso da store soma um ao número» não diz onde o número mora. Se mora na ponte e só conta enquanto a tela ouve, uma mudança feita entre o primeiro desenho e a inscrição não é contada, e o React, ao conferir depois de se inscrever, vê o mesmo número. Há como isso acontecer: cinco stores avisam na hora (`albums.js:120`, `playlists.js:128`, `albumSeries.js:120`, `inventory.js:88`, `UserStore.js:63`) e um pedaço antigo montado pela ponte `legacy/` num efeito de layout pode chamar um controlador que escreve nelas antes de a tela ouvir. Se o número mora na store, alguém ouve para sempre, e o teste «zero ouvintes» precisa dizer isso. Segundo caso: as stores mudam listas por dentro; a regra (b) só cita `useMemo`, mas um filho que recebe a mesma lista por propriedade sob `React.memo` também não redesenha. Terceiro: o React redesenha depois do aviso, não dentro dele; código que escreve na store e lê o DOM em seguida acha o desenho antigo (o R2 cita, a regra não). E a medição não usou esta ponte: a tela medida ouviu um controlador com `useReducer` e `useEffect` (`SavedPlaylistsScreen.tsx`), então «R4 reduzido» é desenho, não medida.
- **Custo se ficar:** tela com dado velho que só aparece em certa ordem de carga; é o tipo de defeito que os testes levados não pegam, porque montam com a store já pronta.
- **Check de aceite:** O contrato de `useStore` diz onde mora o número de versão e há um teste, nas três formas de store, em que a store muda entre o primeiro desenho e a inscrição e a tela mostra o valor novo? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (o contrato na § 4.3 e o caso no teste da TASK-04).

### 5 · AD-03 SPOFs mapeados · P1
- **Âncora:** proposta § 7 (primeira linha), § 5.1 e R16; `public/js/utils/staleBuild.js:17-31`; `public/js/router.js:204-210`; `public/js/app.js:125-170`.
- **Evidência:** hoje uma rota só é carregada sob demanda (`/saved-playlists`); as outras estão no script principal e abrem sem rede. Depois da migração, cada primeira ida a uma tela é um pedido de rede com o prazo «do navegador», isto é, nenhum. `isMissingBuildFile` reconhece qualquer falha de `import()`, não só arquivo de publicação antiga: uma queda de rede recarrega o app (o que estava só na memória se perde) e, dentro de 60 s, mostra «The app was updated…», que não é verdade. Enquanto o arquivo não chega, o roteador já destruiu a tela anterior e o desenho dela fica na página sem responder. A § 7 e o R16 só tratam a publicação antiga.
- **Custo se ficar:** no celular com rede ruim, o site passa a travar ou recarregar ao trocar de tela, coisa que hoje não faz; cresce a cada onda.
- **Check de aceite:** Com a rede cortada, ir a uma tela ainda não baixada mostra um estado próprio («sem rede», com tentar de novo), não recarrega o app e não diz «versão nova», e há um prazo com número para o arquivo de tela, com teste? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (entra na onda 0, antes do canário).

### 6 · IV-05 ETC e DRY · P1
- **Âncora:** proposta § 4.2 regra 3 («Uma tela, uma versão»), § 4.4 (só a Folha tem «uma lógica só»), § 15 onda 1 («entrega as primeiras peças de `ui/`: ícone, janela, Folha, barra de filtros»), § 8 (`dangerouslySetInnerHTML` com lista vazia).
- **Evidência:** as peças da onda 1 são usadas por telas de outras ondas: `Icons.js` é importado por 59 arquivos, `BaseModal` por 10, `ui/Sheet` por 8, `Toast.js` por 20. O arquivo antigo não pode sair «no mesmo commit»; a tela nova não pode importá-lo (regra 2) e a antiga não pode importar o novo. Sobram duas implementações da mesma peça até a última tela que a usa migrar. A proposta resolve isso só para a Folha. E o ícone da medição, que deu o HTML idêntico, é feito com `dangerouslySetInnerHTML` (`react/vanilla.tsx`, `Icon`), que a § 8 proíbe sem exceção: o porte do ícone ainda não tem caminho provado.
- **Custo se ficar:** todo conserto visual numa peça partilhada é feito duas vezes por semanas, ou diverge; se a migração parar, para sempre. `handMadeScreensOnlyShrink` não acusa.
- **Check de aceite:** Para cada peça usada por telas de ondas diferentes, a proposta diz qual é a fonte única (o motor antigo embrulhado, ou os dados partilhados) e até que onda as duas formas convivem, e o ícone tem um caminho sem `dangerouslySetInnerHTML` com o HTML idêntico provado? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 7 · MA-03 Evolução e reversibilidade · P1
- **Âncora:** proposta § 4.2 regra 3, R2 («custo de desfazer: baixo por tela (reverter o commit)»), § 5.1 (barreira de erro), spec REQ-10; `scripts/deploy-site.sh:184-190`.
- **Evidência:** reverter o commit de uma onda só é barato enquanto nada veio depois. A onda seguinte usa as peças de `ui/`, as chaves do dicionário e as listas que só encolhem daquela; um defeito achado duas ondas depois não se desfaz por `git revert`, e a versão anterior do Hosting leva junto tudo o que foi publicado depois. O caminho real passa a ser consertar à frente, e a proposta não o diz. Também falta como se fica sabendo: a barreira de erro mostra o painel a quem usa, mas nada conta esse erro; a prova de HTML igual é feita sem login, com dados postos na memória, e o sensor da F84 ainda não mostra tela com dados.
- **Custo se ficar:** a resposta à pergunta 2 da § 16 é «sim, é pouco»: a primeira regressão descoberta tarde vira trabalho de urgência sem caminho escrito.
- **Check de aceite:** A proposta diz o caminho para um defeito achado N ondas depois (consertar à frente, e quando a versão anterior do Hosting ainda serve), e o erro de desenho de uma tela em React é contado pela porta de medição de uso que já existe? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 8 · MA-03 Evolução e reversibilidade · P1
- **Âncora:** proposta § 15 (ondas 2 e 3), § 4.6 item 3 (ponto de revisão), R1 («custo de desfazer: alto, cresce a cada tela»), R5 (aberto), D-7.
- **Evidência:** a premissa que derruba a conta (arrastar e soltar, o custo de uma tela difícil) só é medida na onda 3. Antes dela migram duas telas e a moldura inteira: barra do topo, rodapé, moldura do celular, login e avisos, que estão em todas as telas. O ponto em que o MJRP pode «desacelerar ou parar» chega quando parar já custa mais. O rascunho da medição pede o contrário: «a próxima medição que reduz a incerteza é migrar uma tela difícil».
- **Critério:** a nota de higiene AD-10 Premissa mais arriscada aponta para este achado.
- **Custo se ficar:** se a onda 3 mostrar custo três vezes maior, a escolha é entre seguir a qualquer preço ou ficar com a moldura em React e as telas antigas: o pior meio-termo do R1.
- **Check de aceite:** A medição da tela difícil (arrastar e soltar sob React) acontece antes de a moldura migrar, como experimento ou como onda, e o ponto de revisão do MJRP vem logo depois dela? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora; a ordem é do MJRP (Decisões do humano, 3).

### 9 · GV-03 Guias são caros, sensores são baratos · P1
- **Âncora:** proposta § 11 (as duas tabelas de sensores), § 4.1 (dobra do TypeScript), § 4.3 (regras a e b), § 4.6, § 9.2.
- **Evidência:** (a) `noTextOutsideTheDictionary`: em `.tsx` vê texto solto em JSX e quatro atributos, não um texto que chega por variável, ternário, objeto ou aviso; no JavaScript antigo é a contagem de um script que o próprio rascunho chama de heurística («leia 985 como entre 900 e 1.100»); e não conta serviços nem modelos («a medir»). «0 textos fora do dicionário» não se prova com ele. (b) `handMadeScreensOnlyShrink` conta arquivos, não linhas: um arquivo antigo pode crescer, e «tela redesenhada nasce em React» não tem sensor; há desenho fora das duas pastas contadas (`services/DialogService.js`, `services/AuthService.js`, `utils/pageScrollLock.js`). (c) As regras «auditar os `set` da store» e «nada derivado de lista em memória» não têm sensor. (d) «Um teste de zero ouvintes por tela»: nada exige que o teste exista em cada pasta de `screens/`, e não há leitura única de quantos ouvem (cada store guarda os seus; `router.afterNavigate` nem devolve como parar de ouvir, `router.js:345`). (e) «Nada de conversão de tipo espalhada»: sem sensor, e a medição já usou uma (`as unknown as Controller`).
- **Custo se ficar:** o critério de fim da migração («0 textos», «0 arquivos») é declarado cumprido sem prova; é a resposta à pergunta 5 da § 16.
- **Check de aceite:** Cada regra das §§ 4.1, 4.3, 4.6, 5.2 e 9.2 aparece na § 11 com um sensor cujo método mede o que o nome promete, ou está escrita como «não verificada por sensor», com o motivo? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (é a tabela da § 11).

### 10 · AD-01 Invariantes quantificados · P1
- **Âncora:** proposta § 11 («O teto de peso»), tabela de qualidade (linha «Peso baixado»), § 5.3, § 7, R17; spec REQ-07.
- **Evidência:** `react-vendor` «a medir + 5%», dicionário pt «a medir»: sem número não é teto (pergunta 6 da § 16). O número do React já existe na prova da medição (`raw/gzip-after.txt`: 221.716 B, 68.922 B comprimidos), 53% acima dos 45 KB da análise sobre a qual o MJRP decidiu. «O script principal não passa do valor de hoje» nasce apertado: a onda 0 soma a ponte, o `i18n/` e o dicionário em inglês e só tira uma tela de 66 linhas. A base (301.051 B) foi medida sem as chaves do `.env`, não é o site publicado. Não há meta de tempo até a primeira tela, e a proposta põe três esperas antes do primeiro desenho: `/geo.json` (1,5 s), o dicionário pt (3 s), a preferência da conta (3 s). O redesenho com listas grandes (R17) também não tem número.
- **Custo se ficar:** o REQ-07 («a publicação recusa um build acima do teto») não tem o que recusar; a primeira abertura pode ficar segundos mais lenta sem que nada acuse.
- **Check de aceite:** Cada linha do teto tem um número em bytes medido no build publicado, e há uma meta com número para o tempo até a primeira tela no pior caso (país não sabido, dicionário pt lento), dizendo se o site espera ou desenha em inglês e troca? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (os números de bytes já estão na prova da medição).

### 11 · IV-04 Padrões com endereço · P2
- **Âncora:** proposta § 4.1 (as quatro pastas), § 4.2 («uma raiz do React por tela»), § 11 (`reactStaysAtTheEdge`), § 9.3; `tasks.md` TASK-12 e TASK-13.
- **Evidência:** a moldura não é tela (`screens/` é «uma pasta por tela»), não cabe em `ui/` (que não conhece store, e a barra e o login leem a `userStore`) e é montada fora de `#app` pelo `app.js`. Só a TASK-13 diz «uma raiz por contêiner»; o desenho não lhe dá pasta, e o sensor da borda recusaria qualquer outra. Da onda 2 em diante o React está no caminho de abrir o site, e a frase da § 9.3 («pedido em segundo plano depois que a primeira tela aparece») deixa de valer.
- **Custo se ficar:** baixo: decide-se na onda 2, mas o sensor da onda 0 já nasce com a lista errada.
- **Check de aceite:** A § 4.1 dá pasta e regra de import para a moldura, e a § 9.3 diz quando o `react-vendor` é carregado a partir da onda 2? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · vigiar.

### 12 · AD-02 Contratos e fronteiras · P2
- **Âncora:** proposta § 4.2 (opção A e regra 2), § 5.1, § 11; ADR-0023 § Decision; `tasks.md` TASK-04; `public/js/router.js:232-250`.
- **Evidência:** (a) a proposta e a ADR dizem que o roteador não muda; a TASK-04 tira o painel de erro do roteador «para uma função que os dois usam», e o painel é uma string de HTML com `onclick` embutido, que o React só mostra reescrevendo. (b) «Nada fora de `screens/` importa `screens/`» precisa da exceção do `app.js`, que carrega a tela. (c) A regra «a tela nova não importa a antiga» não é o que foi medido: a tela da medição importa seis pedaços antigos direto; para valer, `legacy/` ganha um invólucro por pedaço, e «181 linhas pagas uma vez» fica curto. (d) Uma tela que navega de dentro de um efeito faz o roteador desmontar a raiz do React no meio do desenho; o caso não está no fluxo.
- **Custo se ficar:** baixo; aparece como retrabalho na onda 0.
- **Check de aceite:** A proposta lista o que muda no roteador, as exceções de import dos sensores novos e o que a função de navegar faz quando é chamada de dentro de um efeito? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · vigiar.

### 13 · MA-03 Evolução e reversibilidade · P2
- **Âncora:** proposta § 5.3 («Se o teste da opção A falhar»), R9, D-5, § 16 (pergunta 4).
- **Evidência:** a saída escrita usa o idioma do navegador (opção C), que é a resposta b) de uma decisão ainda aberta (D-5). Se o MJRP responder a) «inglês, sempre» e o teste falhar, nenhum brasileiro abre em português na primeira visita, e o texto não diz isso. O teste de uma hora num canal de prévia, feito de um lugar só, exercita o país pelo cookie de substituição, não pelo IP. O risco de cache em si é pequeno: a raiz e o `/geo.json` saem com `no-cache`.
- **Custo se ficar:** baixo e reversível; é uma página e um arquivo.
- **Check de aceite:** A saída do teste está escrita para as duas respostas da D-5, e a tarefa do teste diz como o caminho pelo IP é exercitado (ou que não é)? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · vigiar.

Não se aplica: MA-04 FinOps e economia unitária (nenhum custo variável novo; a § 10 diz por quê); DD-01 Transacionalidade entre limites (nenhuma operação escreve em dois armazenamentos como uma só); DD-03 Volume e particionamento (um documento por conta); CM-01 Semântica de entrega e idempotência e RS-01 Contrapressão (sem fila); CM-02 Latência em cascata (sem chamadas encadeadas novas); RS-02 Retries (as retentativas são «uma, na próxima abertura»); RS-03 Comportamento de caches (o cache novo é o do navegador para o `react-vendor`, por nome com hash).

## O que está bom, manter

- **A tela em React como mais uma «view» do roteador da casa.** Conferido: `renderView` aceita qualquer objeto com `render`, `mount` e `destroy`, e a ponte da medição tem 47 linhas com `flushSync`. Guardas de saída, F64, F67 e a moldura do celular ficam no mesmo lugar.
- **Nada abaixo da tela muda, e o React não desce**, com sensor próprio (`reactStaysAtTheEdge`) e os de camada ensinados antes da primeira tela. É o que mantém a troca reversível por tela.
- **Os sensores primeiro (onda 0).** O risco R3 é real e está bem contado: 26 dos 28 sensores não leem `.ts` nem `.tsx` (conferido), e `listJs` só lista `.js`.
- **O dicionário em JavaScript puro, sem HTML nos valores**, servindo às telas antigas e às novas, com `rulesDoNotSpeak` e `dictionariesAgree`.
- **Nenhuma biblioteca de estado, de rotas, de estilos ou de componentes agora**, cada recusa com o motivo e o gatilho que a reabre.
- **O app sem prefixo de idioma no endereço**: o retorno do Spotify, as rotas da F85 e os links guardados ficam intactos.
- **A franqueza sobre o que não foi medido** (§ 16 e as marcas «prévia» e «a medir»): os números citados batem com a prova da medição (+177 B no script principal; 68.922 B do React).
- **A ADR curta, com a rota de aceite certa** (MJRP: muda a constituição que ele ratificou) e sem aplicar nada antes: `constitution.md` e `tech-stack.md` seguem como estavam.

## Análise estrutural

| Componente | Camada (declarada) | Observação / achado |
|---|---|---|
| `screens/` | Frameworks & Drivers (tela) | chama controlador, serviço e store; nunca repositório. Passa |
| `ui/` | Frameworks & Drivers (peças) | não conhece store nem serviço; peças partilhadas duplicadas: achado 6 |
| `react-bridge/` | Adaptador entre o roteador, as stores e o React | contrato de `useStore`: achado 4; pontas soltas: achado 12; `legacy/` é temporário, com lista |
| A moldura (onda 2) | sem pasta declarada | achado 11 |
| `i18n/` | Adaptador de apresentação, JavaScript puro | as regras não o importam (sensor); quando o português abre: achado 3 |
| Serviço e repositório de preferências | Casos de uso e Adaptador (`shared/data/`) | falha de leitura: achado 1; vida do dado: achado 2 |
| Controladores, stores, serviços, modelos, `shared/` | como hoje | não mudam |
| Roteador | Adaptador de navegação | muda pouco (o painel): achado 12; carga de tela pela rede: achado 5 |
| Firebase Hosting (páginas por idioma, `/geo.json`) | Frameworks & Drivers | achado 13 |

Direção das dependências: nada aponta para fora. As bordas novas (tela → ponte → React; ponte → roteador e stores; `legacy/` → componentes antigos) não fecham ciclo, desde que o `app.js` seja a exceção escrita de quem importa `screens/` (achado 12).

Tecnologias (só as escolhidas pelo objeto):

| Tecnologia | Detalhe ou núcleo? | Custo de trocar | Vazou? (achado) |
|---|---|---|---|
| React 19.3.0 e react-dom | detalhe, na borda | alto depois de quatro ou cinco telas (nomeado no R1); uma versão só com o app (R12, nomeado) | não |
| TypeScript 6 (só no código novo) | detalhe | baixo | não; a fronteira com o JavaScript antigo fica frouxa, sem sensor (achado 9, item e) |
| `@vitejs/plugin-react` | detalhe do build | baixo | não |
| Reescritas de i18n do Firebase Hosting | detalhe | baixo; a saída está escrita, com a ressalva do achado 13 | não |

## Recomendações

1. **Corrigir agora, antes da primeira publicação com React (o que quem usa sente):** o idioma em produção (1, 2, 3) e a rede ao trocar de tela (5).
2. **Corrigir agora, no texto da proposta e nas tarefas da onda 0:** o contrato da ponte com as stores (4); as peças partilhadas e o ícone (6); o caminho de volta atrás e o sinal em produção (7); a tela difícil antes da moldura (8); a tabela de sensores (9); os números do teto e do tempo (10).
3. **Vigiar:** a pasta da moldura (11), as pontas do contrato da ponte (12), a saída do teste do Hosting (13).
4. **Adiar:** nada.

## Higiene da decisão

- **AD-06 Premissas verdadeiras:** dois números não bateram nesta árvore: «as 15 chamadas `toLocale…`» são 14 em `public/js` (fora `vendor/`), e os «294 arquivos» de teste são 280 `*.test.js` em `test/`. O peso do React aparece como «a medir» e, ao lado, como «prévia do arquivo bruto: 68,9 KB comprimidos»: o número é medido e está na prova (bruto 221.716 B, comprimido 68.922 B). O resto conferido bate (99 arquivos, 26 de 28 sensores, `playlists.js:85`, a Folha com 173 linhas, o inventário com 693, o caminho que falta em `firestore.rules`, o que o kit do CMS importa e escreve). Quem age: o designer.
- **AD-07 Evidência bem aplicada:** «provada na prévia» vale para a `ReactView`. O que a medição provou (HTML idêntico, zero ouvintes) foi com outra ponte: sem `useStore` (ouvindo um controlador), com o ícone por `dangerouslySetInnerHTML`, com a tela importando os pedaços antigos e o roteador direto, e com `pt-BR` num dicionário só por tela. Os achados 4, 6 e 12 levam a severidade. Quem age: o designer.
- **AD-10 Premissa mais arriscada:** está nomeada (R1, R5), mas o teste dela não é cedo nem barato: vem na onda 3. O achado 8 leva a severidade. Quem age: o designer; a ordem é do MJRP.
- **AD-13 Arquivos impactados:** a lista *Files* da ADR-0023 não traz o que a proposta muda em `firebase.json`, `firestore.rules`, `scripts/entryPage.mjs`, `scripts/deploy-site.sh`, `public/splash/gate.js`, `public/js/router.js` e `app.js`, `docs/specs/data-model.md` (o documento novo de preferências), `docs/specs/design-system.md` e `.github/workflows/ci.yml`. Quem age: `mjrp-recording-decisions`.
- **AD-14 Restrições respeitadas:** a ADR-0023 diz que «mantém» a ADR-0022 e se apoia no `overrides` dela, mas a ADR-0022 ainda está em «Proposed» (aceita em conversa «pra essa iteração»); a proposta diz isso, a ADR não. E a *Tipagem* da constituição pede que o passo do site para TypeScript mostre «o caminho de build funcionando»: a mostra está num rascunho ainda não entregue. Quem age: o designer, e o MJRP ao aceitar.

## Decisões do humano

- **1. O aceite da ADR-0023** (com as emendas da constituição, D-2 da proposta): aceitar agora, com os P1 como compromisso que ele conhece · aceitar depois de os temas 1 e 2 serem fechados no texto · devolver.
- **2. Quando o português abre para quem usa** (achado 3): só quando a cobertura declarada estiver pronta (a moldura, a página de entrada e as telas) · aos poucos, tela a tela, sabendo que o site fica misturado para quem acessa do Brasil · traduzir primeiro as telas antigas com `t()` e abrir de uma vez.
- **3. A ordem das ondas** (achado 8, soma uma opção à D-7): medir a tela difícil antes de a moldura migrar · manter a ordem da § 15, aceitando que o ponto de revisão chega com a moldura já em React.
- **4. A D-5 junto com o teste do Hosting** (achado 13): se a resposta for «inglês, sempre» e o teste falhar, a primeira visita do Brasil abre em inglês; ele decide sabendo disso.
