---
id: CM-0057
item: content-audit
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0057 · content-audit@1 → content-audit@2

## Por que

A auditoria do conform do `pedroso-incorp` (2026-10-18) achou dois furos no `content_audit_check`: (1) o arquivo de juiz do `visual-sensor` não podia ancorar em `visual/visual.config.mjs`, que é onde o conteúdo do sensor mora — o contrato o declara em `sensors.visual.config`, mas o check só lia o `path` do catálogo e o que as cláusulas leem; o juiz teve de mudar as âncoras para o contrato. (2) Uma âncora de juiz continua passando quando o trecho ainda está na linha, mesmo que o arquivo tenha mudado depois da leitura do juiz (a linha `[ok] prd.md:88` passou, embora o fato tivesse mudado em outro arquivo no commit `730db0e`).

Nasceu de: o feedback do `pedroso-incorp` (pontos 3 e 5 da auditoria de 2026-10-18), registrado no `harness-kaizen`.

## O que muda

- **O arquivo que o contrato declara para o item é arquivo do item.** Numa cláusula `contract_key` do item, o arquivo ou a pasta que o contrato guarda sob a chave (`config`, `path`, `file` ou `dir`, se existe no projeto) entra entre os arquivos onde uma âncora vale. Hoje: `sensors.visual.config` para o `visual-sensor`.
- **Âncora que envelhece avisa.** Quando as **linhas ancoradas** de um arquivo mudaram num commit (`git log -L a,z:<arquivo>`, que acompanha as linhas pela história; não o último commit do arquivo, que no `MEMORY.md` e no `docs/log.md` muda a cada sessão) **depois** do `judged:` do arquivo do juiz, o `content_audit_check` imprime `[aviso] anchor_aging: …` e sai 0. É aviso, não lacuna: um commit depois do juiz é muitas vezes a correção do próprio P0 dele, e a cura é a releitura (o juiz relê o arquivo e atualiza o `judged:`), não um conform bloqueado. `--json` traz os avisos em `warnings`; `--quiet` não os imprime.
- **O que não muda:** a cláusula `script` do item é a mesma da v1, e um relatório que passava continua passando.

## O que o filho faz

1. Rode `python3 mjrp-scripts/content_audit_check.py .`. Se sair 0, só registre a nota: acrescente `CM-0057` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.
2. Se imprimiu `[aviso] anchor_aging`, peça ao juiz da skill citada que releia o arquivo apontado e atualize o `judged:` do arquivo dele (e as âncoras que a mudança invalidou). O aviso não impede registrar a nota, mas é a auditoria dizendo que o veredito é anterior ao arquivo.
3. Se havia âncora trocada do arquivo declarado no contrato para outro (como o juiz do `visual-sensor` fez), ela pode voltar ao arquivo onde o conteúdo mora.

## Como se confere

`conformance_check.py . --check-note CM-0057` sai 0 (o mesmo check da v1 mais a leitura do arquivo declarado no contrato).

## Quando não se aplica

Perfil `meta` (o harness se julga pelo próprio Learn gate).
