# Album Blender · adotar um framework no site? React, Vue ou Next

Escrito em 2026-11-21 08:47 pelo agente do V0, a pedido do MJRP: «como ele vai virar um produto, acha que está na hora de usar um framework mais moderno? React, vue ou o next? Quer fazer uma analise de comparacao de ganhos e perdas pra adocao de cada um?». É uma análise para decidir; não é uma proposta de arquitetura nem uma ADR, e nada foi mudado no código.

## A resposta curta

Sim, está na hora, mas não de reescrever. Minha recomendação é **React com o Vite que já existe, em TypeScript, adotado tela a tela**, e não o Next nem o Vue. O motivo principal não é moda: duas decisões suas já puseram React no produto (o kit do CMS é React; o app é React Native), e a parte do site que um framework substitui é justamente a que hoje é feita à mão.

## O que o site é hoje (medido no código, 2026-11-21)

| Parte | Arquivos | Linhas | Um framework substitui? |
|---|---|---|---|
| Telas e componentes (`views`, `components`, `controllers`) | 105 | 19.461 | **Sim**: é DOM montado à mão (60 arquivos usam o `SafeDOM`; 26 ainda tocam `innerHTML`) |
| Estado da tela (`stores`) | 8 | 1.088 | Em parte |
| Regras, serviços, algoritmos, utilitários (`models`, `services`, `algorithms`, `utils`) | 126 | 14.668 | **Não**: não dependem de tela |
| Núcleo partilhado com o app (`shared/`) | 15 | 2.981 | **Não**: já roda no site e no app |
| Estilos | — | 6.768 | Não (ficam) |
| Roteador próprio | 1 | 311 | Sim |

- Testes: 279 arquivos, 3.722 testes. Cerca de 74 arquivos testam telas, componentes e controladores e seriam reescritos junto com eles; os outros (regras, serviços, arquitetura, núcleo) ficam.
- Dependências de produção: quatro (`firebase`, `axios`, `sortablejs`, `posthog-js`). O script principal publicado tem 1,1 MB sem compressão, quase todo do Firebase.
- Hospedagem: Firebase Hosting (arquivos estáticos) mais um servidor Node no Cloud Run. O site é um app de uma página só, atrás de login; a única página pública é a de entrada (F80), que já é HTML estático lido sem script.

Leitura: pouco mais da metade do código da tela é trabalho que um framework faz sozinho (desenhar, redesenhar quando o estado muda, rotas). A outra metade já está separada da tela, e isso é o que torna a troca possível sem reescrever o produto.

## O que dói hoje sem framework

- Cada tela nova (a Home da F79, o inventário, o celular da F76) reescreve à mão a mesma coisa: montar o DOM, redesenhar quando algo muda, ligar e desligar eventos.
- Não há tipos na tela: um campo renomeado só aparece como erro no navegador.
- O kit do CMS (F82) é React: sem React no site, o CMS vira uma ilha estranha ao resto.
- Os idiomas (F81) tocam todo texto de toda tela; com componentes, a troca é mecânica; com DOM à mão, é caçar `textContent` em 105 arquivos.
- O app (F78) é React Native: hoje site e app só partilham regras. Com React no site, passam a partilhar também o jeito de pensar a tela e parte dos «hooks» de estado.

## As quatro opções

### A. Ficar como está (JavaScript puro)

- **Ganha:** custo zero agora; nenhuma dependência nova; o que funciona continua funcionando.
- **Perde:** cada feature de tela continua mais cara; o CMS entra como corpo estranho; F81 fica mais trabalhosa; quem um dia entrar no projeto não conhece o «framework da casa».
- **Quando faria sentido:** se o site fosse ser substituído pelo app. Não é o plano: o estudo de produto manteve o site.

### B. React, com o Vite atual, tela a tela (recomendada)

- **Ganha:** a mesma biblioteca do kit do CMS e do app; TypeScript nas telas (a constituição v2 já permite); a migração é incremental, uma tela por vez, com o site no ar o tempo todo; a hospedagem, o servidor, o Firestore e o login não mudam; a página `/admin` do CMS já seria a primeira tela em React, de graça.
- **Perde:** duas formas de fazer tela convivendo durante a migração (meses, não dias); cerca de 74 arquivos de teste de tela reescritos aos poucos; React e react-dom somam por volta de 45 KB comprimidos ao que o navegador baixa; decisões novas a tomar (rotas, estado, formulário) que hoje o código da casa resolve.
- **Risco principal:** a migração parar no meio e o site ficar com dois estilos para sempre. Reduz-se com uma regra simples: tela nova ou redesenhada nasce em React; tela antiga só migra quando for mexida.

### C. Vue, com o Vite atual

- **Ganha:** tecnicamente equivalente ao React para este site; curva de aprendizado um pouco mais suave; encaixa bem no Vite; também migra tela a tela.
- **Perde:** nenhuma ponte com o que você já decidiu: o kit do CMS teria de ser reescrito ou embutido como ilha React de qualquer jeito, e o app continuaria em React Native. Seriam três formas de fazer tela no mesmo produto (Vue, React, React Native).
- **Quando faria sentido:** num produto sem o kit e sem o app. Não é este.

### D. Next.js

- **Ganha:** a mesma stack dos sites do MJRPpersonal, então o login, as rotas por idioma (next-intl), a publicação sem deploy e o admin de lá servem quase como estão; páginas públicas renderizadas no servidor, boas para buscadores e assistentes de IA; uma stack só no seu portfólio.
- **Perde:** é uma reescrita, não uma migração: o Next dita rotas, build e servidor, então não dá para trocar tela a tela dentro do app atual; a hospedagem muda (o Firebase Hosting estático não roda o Next: seria Vercel, Firebase App Hosting ou o Cloud Run servindo o Next); o que o Next tem de melhor (renderizar no servidor) serve pouco a um app que vive atrás de login e fala direto com o Firestore, o Apple Music e o Spotify no navegador; os 3.722 testes e os scripts de publicação teriam de ser refeitos em boa parte.
- **Quando faria sentido:** se o produto público ganhar muitas páginas abertas (catálogo, rankings públicos, páginas de álbum indexáveis). Hoje há uma, e ela já é estática.

## Lado a lado

| | A. Como está | B. React + Vite | C. Vue + Vite | D. Next |
|---|---|---|---|---|
| Encaixe com o kit do CMS (React) | fraco | **direto** | fraco | direto |
| Encaixe com o app (React Native) | só o núcleo | **núcleo e modelo de tela** | só o núcleo | núcleo e modelo de tela |
| Migração com o site no ar | — | **tela a tela** | tela a tela | reescrita |
| Muda a hospedagem | não | **não** | não | sim |
| Idiomas (F81) | à mão | biblioteca pronta | biblioteca pronta | o mesmo do MJRPpersonal |
| Páginas públicas para buscadores | a de entrada, estática | a de entrada, estática | a de entrada, estática | **todas, no servidor** |
| Esforço (opinião, não medido) | nenhum | médio, diluído | médio, diluído | alto, de uma vez |
| Risco de parar no meio | — | dois estilos convivendo | dois estilos convivendo | site novo que não chega |

## O que eu faria, em ordem

1. **A F82 (CMS) como porta de entrada:** a página `/admin` nasce em React e TypeScript, com o plugin de React do Vite só nessa entrada. É trabalho que a F82 já exige, e prova a convivência sem tocar nas telas atuais.
2. **A regra de convivência**, numa ADR: tela nova ou redesenhada nasce em React; tela antiga migra quando for mexida; regras e serviços ficam onde estão (já não dependem de tela).
3. **A F81 (idiomas)** com um dicionário que serve aos dois estilos, para não depender da migração.
4. **Medir depois de duas telas migradas:** linhas, testes, peso baixado, tempo de construção. Com o número na mão, decidir se a migração acelera ou segue no ritmo das features.
5. **O Next fica como porta aberta:** se o produto público pedir muitas páginas abertas, as telas em React migram para o Next com muito menos custo do que as de hoje.

## O que eu não sei, ou não medi

- O esforço de cada opção é opinião: não migrei nenhuma tela para medir.
- Não li o kit do CMS; que ele é React puro e não depende do Next é relato do agente mestre e da orquestradora do MJRPpersonal.
- O peso do React (≈ 45 KB comprimidos) é o número público da biblioteca, não medido neste build.
- Não avaliei Svelte, Solid nem outros: você perguntou por React, Vue e Next, e nenhum dos outros tem a ponte com o kit e com o app.
- A constituição v2 e a ADR-0022 tratam do app; adotar React no site pede uma ADR própria, com a sua aceitação.

## Conferido depois (2026-11-21 08:53)

**O kit do CMS é React puro, sem o Next — conferido lendo a pasta** `/Users/maujrp/mjrp/projects/MJRPpersonal/src/admin-kit/` (32 arquivos TypeScript, 4.946 linhas, 526 de CSS):
- os únicos pacotes importados são `react` (16 arquivos), `clsx`, `@dnd-kit/core`, `@dnd-kit/sortable` e `@dnd-kit/utilities`; nenhum `next/…`, nenhum `process.env`, nenhum `server-only`;
- nenhum import com `@/` para fora da pasta; a lista permitida é guardada pelo sensor `KIT_ALLOWED` em `scripts/merge_gate.mjs`;
- as cinco menções a «next» são comentários do lint dizendo que o kit não importa o Next (ADR-0011); 18 arquivos trazem a diretiva `use client`, que fora do Next é só um texto sem efeito;
- o MJRPpersonal roda `react` 19.2.3 e `next` 16.1.6; o app do V0 usa `react` 19.3.0.

**Decisão do MJRP (2026-11-21): «sim vamos com react».** Registrada como a feature F83, em esboço. O esforço, o peso baixado e a convivência com o roteador estão sendo medidos numa tela real, num ramo de experimento; os números entram aqui quando a medição terminar.
