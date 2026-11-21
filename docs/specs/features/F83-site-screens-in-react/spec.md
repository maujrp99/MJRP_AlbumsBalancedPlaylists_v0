---
status: In Progress
lane: standard
solution_type: feature
imports: ["[[S-65-keep-the-site-screens-on-one-framework]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F83: As telas do site em React, tela a tela
**Approved**: pendente

## Summary
**A feature:** As telas do site passam a ser feitas em React com TypeScript, sobre o Vite que já existe, uma tela por vez, com o site no ar. O que fica debaixo da tela (regras, serviços, stores, roteador, CSS) não muda.

**Por quê:** O produto vai a público; o kit do CMS é React e o app é React Native; hoje cada tela é DOM montado à mão.

**Como saber que funcionou:** Nenhuma tela muda de aparência nem de comportamento ao migrar; as pastas `views/` e `components/` chegam a zero arquivos; tela nova nasce em React.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «Sobre a tech diferente do album blender, como ele vai virar um produto, acha que está na hora de usar um framework mais moderno? React, vue ou o next?» e, depois da análise (`reports/audits/2026-11-21-mjrpalbumblender-v0-frontend-framework-analysis.md`): «Ok transforme a opiniao em fato checado e sim vamos com react, qual a vantagem de fazer a migracao e internacionalizacao juntas? O cms nao deveria surgir depois?». No mesmo dia: «vamos nos concentrar na migracao pra react + internacionalizacao e no CMS».

Hoje 99 arquivos de tela e de componente (17.277 linhas) montam o DOM à mão: cada tela nova reescreve o desenho, o redesenho e os eventos; não há tipos; o kit do CMS (React) entraria como corpo estranho.

O desenho, os riscos e as opções estão em `design/proposals/f83-react-screens/architecture-proposal.md`; a decisão, na ADR-0023 (Proposed).

## Requirements
- [REQ-01] Uma tela em React abre e fecha pelo mesmo roteador e no mesmo lugar da página que as telas feitas à mão: os guardas de saída, o aviso de versão nova, a barra do celular e a medição de uso continuam valendo; ao sair, a tela não ouve mais nada; um erro ao desenhar mostra o mesmo painel de erro. · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]
- [REQ-02] Uma tela migrada mostra e faz o mesmo que a antiga: com os mesmos dados, o mesmo HTML dentro de `#app` a 1280 e a 393 nos estados conferidos; os testes da tela antiga, levados para a nova, afirmam o mesmo. · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]
- [REQ-03] Tela nova ou redesenhada nasce em React; nenhum arquivo novo entra em `views/` nem em `components/`; ao migrar, a tela antiga e os testes dela saem no mesmo passo (uma tela, uma versão); a quantidade de arquivos feitos à mão e de pontes para pedaços antigos só diminui. · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]
- [REQ-04] O que fica debaixo da tela não muda e não conhece o React: regras, serviços, stores, repositórios, o núcleo partilhado e o roteador; a tela em React chega aos dados só pelo serviço ou pelo controlador. · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]
- [REQ-05] A camada do celular e o design system passam para as telas em React sem mudança visual: as mesmas folhas de estilo e classes, a mesma linha dos 767 px, a mesma Folha; nenhum segundo sistema de estilos. · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]
- [REQ-06] As regras de arquitetura do projeto valem para o código novo: os sensores leem `.ts` e `.tsx`, a verificação de tipos é um portão, nenhuma função nova passa de complexidade 10. · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]
- [REQ-07] O que o navegador baixa tem teto: o script principal não cresce, o React fica num arquivo à parte baixado uma vez, e cada tela é carregada só quando aberta; a publicação recusa um build acima do teto. · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]
- [REQ-08] Cada tela migrada sai com todos os textos vindos do dicionário, em inglês e em português do Brasil, pelo contrato da F81 (`design/proposals/f83-react-screens/architecture-proposal.md` § 5.2). · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]
- [REQ-09] Todas as telas do site migram, na ordem das ondas da proposta (§ 15); no fim, as pontes, o `SafeDOM` e a base das telas antigas são apagados. · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]
- [REQ-10] Publicar e voltar atrás continuam pelo mesmo caminho (`npm run deploy:site`, a versão anterior do Hosting); uma aba aberta numa versão antiga continua se recuperando sozinha ao pedir uma tela que mudou de arquivo; sem rede, ir a uma tela ainda não baixada diz «sem rede» e deixa tentar de novo, sem recarregar o app. · from [[S-65-keep-the-site-screens-on-one-framework|S-65]]

## Observable States
Nenhum novo: a migração não muda o que a tela mostra. Cada onda confere os estados que `docs/specs/info-arch.md` já registra para a tela dela.

## Prototype Parity (if the feature touches a screen)
- Prototype: nenhum novo. A referência de cada tela é a própria tela de hoje (e, onde existe, o protótipo aprovado em `info-arch.md`: a Home da F79).
- Transversal layer touched: componentes compartilhados (portados para `public/js/ui/`), moldura (barra, rodapé, moldura do celular), responsividade (a camada do celular da F76). Tokens e fontes não mudam.
- Design-system cuts or swaps: nenhum. Trocar o `sortablejs` pelo `@dnd-kit`, se a onda 3 o pedir, é decisão registrada antes (proposta § 4.5).

## Success Criteria
- Em cada onda: o MJRP usa a tela com a conta dele antes de a onda fechar; HTML de `#app` igual ao da tela antiga nos estados conferidos, a 1280 e a 393; 0 asserções mudadas de sentido; 0 ouvintes depois de entrar e sair cinco vezes; reconferência visual sem P0.
- No fim: 0 arquivos em `public/js/views` e `public/js/components`; 0 pontes; 0 textos visíveis fora do dicionário; a suíte, o lint, os tipos e o build verdes.
- O peso baixado dentro do teto da proposta (§ 11), com os números da medição.

## Out of Scope
- O Next.js e o Vue (análise de 2026-11-21).
- Reescrever regras, serviços, stores e o núcleo partilhado; passar o JavaScript existente para TypeScript.
- A página de entrada (F80): não migra para React; é traduzida no build, pela F81.
- Os textos em si, a escolha do idioma e o país de acesso: são da F81, sobre o contrato da proposta.
- A página do CMS (`/admin`): é da F82.
- O app (F78), em pausa.
- Mudar o desenho de qualquer tela.

## Open Questions
- O ritmo: esforço dedicado em ondas até o fim, ou só quando a tela for mexida — decisão do MJRP (proposta, D-1). Pendente.
- As emendas da constituição (React e TypeScript no site; a regra «a interface fala inglês») — decisão do MJRP (D-2). Pendente.
- A ordem das telas (D-7). Pendente.
- Quando o português abre para quem usa (D-8): até lá uma chave o mantém fechado em produção. Pendente; é da F81, mas decide o que cada onda publica.
- Arrastar e soltar com o React: manter o `sortablejs` atrás de uma ponte ou trocar pelo `@dnd-kit` — sai da medição da onda 2.
- A ponte com as stores e o ícone sem HTML cru são desenho, ainda não medidos: provados na onda 0.
- Os números da medição (peso do React e das telas, tempo do build e da suíte): a medir; a medição ainda não foi entregue.
