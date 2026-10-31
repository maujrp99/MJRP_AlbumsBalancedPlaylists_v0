---
id: CM-0087
item: purpose
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0087 · purpose@2 → purpose@3

## Por que

A página `vision-document.md` do kernel, fonte do padrão do `purpose`, tinha a coluna *Tamanho* com «1 frase» para o Propósito e para a Visão. O limite veio com o modelo que o agente escreveu, não de uma decisão do MJRP. A página passa a dizer o critério único dos quatro campos: concisos e claros, do tamanho que a ideia precisar.

Nasceu de: a ordem do MJRP de 2026-10-29, na sessão orquestradora do cascade: «não tem essa constraint de uma frase e uma sentença, isso é bem ruim e limitante. Ser conciso e claro é importante, mas regra especifica de uma frase nao» e «isso serve para tudo, proposito, visao, objetivo, como» (UAT-408, F126). A rota é a nota de migração, não o aval `Catalog-editorial:` dele: o conteúdo do padrão mudou, não só a redação. Acompanha a `CM-0086` (`vision@3`).

## O que muda

- só a fonte do padrão: a tabela do template em `docs/wiki/kernel/roadmap/vision-document.md` deixa de dizer «1 frase» e ganhou uma linha na `## History`.
- **o `check` do item não muda**: é o mesmo da v2 (existe `VISION.md` ou `Core/PROJECT_CONTEXT.md`). Um filho que passa na v2 passa na v3.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0087` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*. Se o Propósito ou a Visão dele foram cortados a uma frase só por causa da regra antiga, nada é exigido: reescrever é escolha do MJRP.

## Como se confere

`conformance_check.py . --check-note CM-0087` sai 0 e `--gaps` não lista `purpose`.

## Quando não se aplica

Nos perfis `code-app` e `meta`.
