---
id: CM-0086
item: vision
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0086 · vision@2 → vision@3

## Por que

O modelo `templates/vision.md` da `mjrp-coaching-pm` mandava escrever o Propósito e a Visão em «uma frase», e o roteiro do juiz cobrava essa frase. O limite veio com o modelo que o agente escreveu, não de uma decisão do MJRP, e cortava a visão que ele mesmo escreveu. O modelo passa a pedir os quatro campos (Propósito, Visão, Objetivo e Como) concisos e claros, do tamanho que a ideia precisar, e o juiz deixa de cobrar a frase.

Nasceu de: a ordem do MJRP de 2026-10-29, na sessão orquestradora do cascade: «não tem essa constraint de uma frase e uma sentença, isso é bem ruim e limitante. Ser conciso e claro é importante, mas regra especifica de uma frase nao» e «isso serve para tudo, proposito, visao, objetivo, como» (UAT-408, F126). A rota é a nota de migração, não o aval `Catalog-editorial:` dele: o conteúdo do padrão mudou, não só a redação.

## O que muda

- só a fonte do padrão: o `templates/vision.md` perde o «Uma frase» do Propósito e da Visão e pede «concisa e clara, do tamanho que a ideia pedir»; o guia `reference/vision-guide.md` e o roteiro `reference/judging-top-artifacts.md` dizem o mesmo; as páginas do kernel `vision-document` e `base-concept` trocam o teste «cabe em uma frase» por «é concisa e clara, lida em voz alta, sem paráfrase».
- **o `check` do item não muda**: é o mesmo da v2 (as seções `## Propósito` e `## Objetivo`). Um filho que passa na v2 passa na v3.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0086` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*. Se os campos do `VISION.md` dele foram cortados a uma frase só por causa da regra antiga, nada é exigido: reescrever é escolha do MJRP, no tamanho que a ideia pedir.

## Como se confere

`conformance_check.py . --check-note CM-0086` sai 0 e `--gaps` não lista `vision`.

## Quando não se aplica

Nos perfis `content` e `meta`.
