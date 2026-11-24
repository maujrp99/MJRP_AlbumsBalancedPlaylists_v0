# Como publicar as regras do banco para a Caixa do The Album Blender

**Data:** 2026-11-23 · **Ramo:** `feat/f95-crate-managed-in-the-panel` · **Tipo:** passo a passo (how-to) para o MJRP; o agente não roda nada daqui
**Features:** a Caixa gerida no Painel ([F82](../../docs/specs/features/F82-admin-with-the-cms-kit/spec.md), REQ-03 e TASK-04) e a curadoria da página de entrada ([F95](../../docs/specs/features/F95-album-blender-curation-on-the-entry-page/spec.md))
**Por que é você:** as regras do banco são suas e nenhum script as publica (constituição V.5). O agente escreveu as linhas no arquivo `firestore.rules` do ramo e as provou no emulador; publicar é um comando seu.

## O que a mudança libera, em palavras comuns

- **Um documento novo no banco, `published/crate`:** a Caixa do The Album Blender (os álbuns da página de entrada, em lado A e lado B, na ordem).
- **Quem grava:** só você, com a sua conta de verdade e o registro de administrador (`cmsAdmins`), como nos textos do Painel. Visitante, outra conta e login anônimo são recusados.
- **Quem lê:** todo mundo, sem login. A página de entrada lê a caixa para cada visitante. O documento só guarda o que a página mostra: nome do álbum, artista, ano, capa e link do Apple Music.
- **O que as regras conferem a cada gravação:** lado A de 6 a 10 álbuns e lado B de 4 a 10; cada álbum guardado como uma linha de texto só (nome, artista, ano, identificador, capa e link), de no máximo 1300 caracteres; nome e artista de 1 a 200 caracteres, sem `<` nem `>`; o ano com quatro dígitos; a capa como um caminho do servidor de imagens da Apple (nunca um endereço de outro servidor, nunca `..`, nunca `%` nem barra invertida); o link só de `https://music.apple.com/`; nenhum campo a mais no documento; a versão (`rev`) igual à anterior mais um; a versão do formato nunca desce; ninguém apaga pelo app.
- **O que as regras não conseguem dizer, e quem confere:** caracteres de controle ou invisíveis num nome e o mesmo álbum duas vezes. Isso o Painel confere antes de salvar e a página de entrada confere de novo ao ler, e escreve tudo como texto, nunca como marcação.
- **Nada mais muda:** as outras regras do arquivo ficam iguais, linha por linha.

## O que você ganha e o que paga

- **Ganha:** o «Salvar» da seção «Caixa» do Painel passa a publicar, e a página de entrada passa a mostrar a caixa que você salvou.
- **Paga:** nada em dinheiro. A página de entrada faz uma leitura do banco por visita (dentro da cota gratuita de hoje).
- **Sem este passo:** nada quebra. O Painel mostra a caixa e deixa mexer, mas ao salvar responde «Não salvou: o banco recusou: as regras ainda não aceitam esta gravação», e a página de entrada segue com os 15 álbuns fixos.

## Antes

1. O ramo da Caixa já juntado à `main` (o comando publica o arquivo `firestore.rules` da pasta em que você estiver: rode na `main`).
2. `firebase` logado na sua conta (`firebase login`).
3. O comando publica o arquivo de regras **inteiro**. Se as regras do Painel (textos e administradores, F82) ainda não foram publicadas, elas vão junto: é o mesmo arquivo.

## O comando

Na pasta do projeto, na `main`:

```bash
firebase deploy --only firestore:rules --project mjrp-playlist-generator
```

Leva alguns segundos e vale na hora. Não publica o site nem o servidor.

## Conferir

1. No console do Firebase (Firestore → Regras), a regra publicada tem a função `validCrate()` e a linha `(docId == 'crate' && validCrate())`.
2. No Painel (`/admin` → «Caixa»), com a sua conta: mude a ordem de dois álbuns, clique em «Salvar» e confirme. Deve aparecer «Salvo e no ar: a caixa da página de entrada.».
3. Abra a página de entrada no computador e no celular: a caixa mostra a nova ordem (a página abre com o conjunto fixo e troca em seguida).

## Voltar atrás

- **Voltar a caixa ao conjunto fixo:** apague o documento `published/crate` no console do Firebase. A página de entrada volta aos 15 álbuns do código na visita seguinte.
- **Voltar um salvar:** o estado anterior ao último salvar fica guardado na área de trabalho do Painel (`cmsWork`, que só você lê), não no documento público; refaça a ordem no Painel e salve de novo.
- **Tirar a regra:** publique de novo o `firestore.rules` de antes (o comando é o mesmo). O documento já gravado continua lá e continua lido; só deixa de aceitar gravação.

## A prova

`npm run test:rules` roda as regras do arquivo num emulador (58 casos): o administrador grava uma caixa válida (pela gravação do próprio Painel), e são recusados o visitante, a outra conta, o login anônimo, a versão errada, a caixa grande ou pequena demais, o campo a mais, a linha longa demais, a marcação num nome, a capa de outro servidor ou com `%`, e o link que não é do Apple Music. Os testes das outras regras seguem verdes.

## O que mais falta para a Caixa funcionar inteira

- **A busca de álbuns** («Adicionar um álbum») precisa do servidor publicado com a rota nova (`POST /api/admin/apple-albums`). Sem ele, ordenar, trocar de lado, tirar e salvar funcionam; só a busca responde que o Apple Music não respondeu.
