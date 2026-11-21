---
format: proposal-batch@1
batch: 2026-11-21-1258-v0-react-and-languages
title: Album Blender · o site em React e em dois idiomas
asked_at: 2026-11-21 12:58
question: O que você decide neste ponto?
effect: o agente do V0 começa a migração das telas para o React, com os idiomas, seguindo cada resposta
---
### D-01 · O ritmo da migração para o React
Pergunta: Em que ritmo as telas do site passam para o React?
Contexto: Com todas em sequência, o site fica poucas semanas com dois jeitos de fazer tela, e sai menos função nova nesse tempo. Só quando uma tela for mexida não para nada, mas o site pode ficar anos pela metade. A parada depois de duas telas medidas existe nas duas primeiras opções.
Base: média — uma tela fácil foi medida de verdade; as difíceis, não
- a) Todas em sequência, com uma parada para você rever depois de duas telas medidas (Recomendado)
- b) Só quando uma tela for mexida por outro motivo
- c) Em sequência só até a parada; o resto você decide lá
→ respondida em 2026-11-21 13:11
  - a
→ aplicada em 2026-11-21 13:11: registrada nas specs da F83 e da F81; a migração segue esta resposta

### D-02 · Mudar as regras do projeto para o React e os dois idiomas
Pergunta: Você aceita mudar as regras do projeto (a constituição) para o site usar React e falar dois idiomas?
Contexto: Hoje as regras proíbem um framework de tela no site e dizem que a interface fala inglês. As duas mudanças juntas custam uma leitura só, maior; separadas, o português fica fora da regra até a segunda. O texto da mudança está na proposta (design/proposals/f83-react-screens/architecture-proposal.md) e no registro da decisão (docs/decisions/0023-…).
Base: forte — as regras e o registro estão escritos
- a) Sim, as duas mudanças juntas (Recomendado)
- b) Só a do React agora; a dos idiomas depois
- c) Ainda não
→ respondida em 2026-11-21 13:11
  - a
→ aplicada em 2026-11-21 13:11: registrada nas specs da F83 e da F81; a migração segue esta resposta

### D-03 · O endereço das páginas e o idioma
Pergunta: O endereço das páginas muda conforme o idioma?
Contexto: Só na home (/en/ e /pt/), o Google acha o site em português e nenhum link guardado quebra. Em tudo (/pt/albums), um link já diz o idioma, mas mexe na volta do Spotify e em todo link guardado. Em nada, o Google vê quase sempre só o inglês.
Base: média — a documentação do Firebase Hosting foi lida; nada foi testado em produção
- a) Só na home; dentro do app, o mesmo endereço nos dois idiomas (Recomendado)
- b) Em tudo
- c) Em nada
→ respondida em 2026-11-21 13:11
  - a
→ aplicada em 2026-11-21 13:11: registrada nas specs da F83 e da F81; a migração segue esta resposta

### D-04 · Onde fica o idioma escolhido por quem tem conta
Pergunta: Onde fica guardado o idioma que a pessoa escolheu, quando ela tem conta?
Contexto: No aparelho e também na conta, a escolha acompanha a pessoa em todo aparelho, e custa uma publicação sua de uma regra de acesso ao banco. Só no aparelho não custa nada, mas cada navegador pergunta de novo.
Base: forte — as regras do banco estão no repositório
- a) No aparelho desde já, e na conta quando você publicar a regra nova (Recomendado)
- b) Só no aparelho
- c) Na conta, numa pasta do banco que já é permitida, feita para outra coisa
→ respondida em 2026-11-21 13:11
  - a
→ aplicada em 2026-11-21 13:11: registrada nas specs da F83 e da F81; a migração segue esta resposta

### D-05 · O idioma quando o site não sabe o país
Pergunta: Quando o site não consegue saber o país de quem acessa, que idioma ele abre?
Contexto: Você decidiu: o país primeiro, depois a escolha da pessoa. Isto só vale quando o país não é sabido. Com inglês sempre, se a leitura do país falhar, nenhum brasileiro abre em português na primeira visita.
Base: média — a leitura do país pelo Firebase não foi testada em produção
- a) O idioma do navegador da pessoa (Recomendado)
- b) Inglês, sempre
→ respondida em 2026-11-21 13:11
  - a
→ aplicada em 2026-11-21 13:11: registrada nas specs da F83 e da F81; a migração segue esta resposta

### D-06 · A home em português
Pergunta: A home sai em português junto com o resto do site?
Contexto: Junto, quem não tem conta e o Google já veem português, e há mais uma página para conferir. Depois, a entrega é menor e a porta do site fica em inglês por mais tempo.
Base: forte
- a) Sim, desde a primeira publicação dos idiomas (Recomendado)
- b) Depois, numa segunda etapa
→ respondida em 2026-11-21 13:11
  - a
→ aplicada em 2026-11-21 13:11: registrada nas specs da F83 e da F81; a migração segue esta resposta

### D-07 · A ordem das telas
Pergunta: Em que ordem as telas passam para o React?
Contexto: Começando pela base e pela tela difícil (a edição das playlists, com arrastar), o custo real aparece cedo, quando parar ainda é barato; a primeira tela que se vê só muda no meio. Com o menu antes, o seletor de idioma chega antes. Com o Start primeiro, mexe-se numa tela recém-entregue antes de as peças estarem prontas.
Base: média — a tela difícil não foi medida
- a) Base, playlists guardadas, edição das playlists (a parada), menu e barra, Start, séries e álbuns, inventário, Blend (Recomendado)
- b) O menu e a barra antes da tela difícil
- c) O Start primeiro
→ respondida em 2026-11-21 13:11
  - a
→ aplicada em 2026-11-21 13:11: registrada nas specs da F83 e da F81; a migração segue esta resposta

### D-08 · Quando o português abre para quem usa o site
Pergunta: Quando o português abre para quem usa o site?
Contexto: De uma vez, com tudo pronto, o site nunca mistura idiomas, e o português demora mais; até lá só você o vê, para revisar. Aos poucos, aparece cedo, mas quem acessa do Brasil vê umas telas em português e outras em inglês. Traduzindo as telas antigas sem trocar de tecnologia, abre mais cedo e inteiro, passando duas vezes por cada tela.
Base: média — a medição mostrou que tirar os textos custa o mesmo com ou sem React
- a) De uma vez, com tudo pronto; até lá só você vê o português (Recomendado)
- b) Aos poucos, tela a tela
- c) Antes do fim: as telas antigas ganham os textos traduzidos sem trocar de tecnologia
→ respondida em 2026-11-21 13:11
  - a
→ aplicada em 2026-11-21 13:11: registrada nas specs da F83 e da F81; a migração segue esta resposta
