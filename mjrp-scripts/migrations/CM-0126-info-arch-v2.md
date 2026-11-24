---
id: CM-0126
item: info-arch
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0126 · info-arch@1 → info-arch@2

## Por que

O cânone de design ganhou a disciplina da arquitetura da informação (IA-01 a IA-05, de Rosenfeld, Morville e Arango) na F200, e a referência da `mjrp-designing-ui` passou a pedi-la; o modelo do `info-arch.md` ainda não tinha onde escrevê-la. Um projeto filho com dois sites mostrou como fica: o esquema de cada nó, os rótulos, a busca, as partes por site e uma página de leitura gerada do arquivo (F214, S-222).

## O que muda

- No Sitemap, a tabela «O esquema de cada nó»: um esquema de organização por nível (exato, ambíguo ou a estrutura).
- A seção «Rótulos»: um conceito, um rótulo, em cada idioma, onde aparece e a palavra que substituiu.
- A seção «Busca», quando o produto tem busca: onde se abre, o que entra no índice, como aparece o resultado e o que a tela diz sem resultado.
- Um produto com mais de um site ou app organiza o arquivo em partes («Como este documento está organizado»).
- A página de leitura sai do arquivo pelo gerador da skill (`build_info_arch_page.py`), nunca à mão.
- A checagem do item não muda: muda o que o dono escreve.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o modelo novo pela skill.
2. Na próxima rodada de desenho, a `mjrp-designing-ui` escreve o esquema de cada nó, os rótulos e, se houver busca, a busca; e gera a página de leitura.
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0126` e acrescenta `CM-0126` a `conformance.applied`.

## Como se confere

`conformance_check.py . --gaps` não lista `info-arch`; o `info-arch.md` tem a tabela do esquema e a seção de rótulos.

## Quando não se aplica

Num projeto sem tela: só registra a nota.
