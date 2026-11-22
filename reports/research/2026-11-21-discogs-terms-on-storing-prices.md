---
type: research
---
# Os termos do Discogs sobre guardar os preços no banco do app

> Pesquisa · 2026-11-21 · ramo `wip/discogs-terms-research` · pedido do orquestrador: o MJRP quer os valores do inventário guardados no banco do app, com o botão servindo para atualizá-los; antes de mudar a regra da constituição (artigo VI, item 1), o que dizem os termos publicados. Não sou advogado; isto é leitura de texto, não parecer.

**O que pude ler.** Nada em primeira mão: a página dos termos da API, a documentação para desenvolvedores (`discogs.com/developers`) e a dos termos de serviço responderam **403** a uma leitura comum; não contornei. Tudo abaixo é **de segunda mão**: trechos que a ferramenta de busca devolveu da página oficial («API Terms of Use», atualizada em 27 de maio de 2025) e citações em projetos de terceiros no GitHub. O registro do repositório (`reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md`, § «Termos de uso da API do Discogs») diz que o agente anterior leu a página oficial em 2026-11-20; não pude conferir.

## Respostas

**1. As seis horas.** Texto citado por projetos de terceiros (não visto no trecho oficial): «You may not display in any format or to any audience the Content if it is more than six (6) hours older than the information on Our online properties» e «You may not cache or store the Content longer than is necessary to provide a service to Your application's users». São **duas regras**: as seis horas são de **frescor ao mostrar**, não um prazo de guarda; a guarda é «o necessário para servir quem usa o app», sem número. Valem para todo o «Content» da API, não só preço. Um projeto diz que valem para o dado do marketplace; outro discute se valem «offline». Sem resposta do Discogs.

**2. Dado restrito.** Do trecho oficial (via busca): o conteúdo inclui «CC0 Data» e «Restricted Data»; a «Marketplace Data» é restrita e cobre estoque, pedidos, taxas e «pricing suggestions». As estatísticas da edição (menor preço, quantidade à venda) são dado do marketplace pela documentação, mas nenhum trecho lido as nomeia como restritas: provável, não confirmado. Para o dado restrito: licença «limited, personal, non-sublicensable, non-transferable, non-exclusive, revocable»; proibido usá-lo «for any commercial purposes», passá-lo a terceiros, e usá-lo com plataforma de publicidade de terceiros «unless expressly authorized in writing by Us». Sobre guardar, só a regra geral do item 1.

**3. Guardar no banco, por pessoa, só para ela.**
- **Hoje (um usuário, uso pessoal):** **incerto.** Não li proibição de guardar em banco; li «não mais que o necessário» e «não mostrar mais velho que seis horas». Guardar meses e mostrar como atual fere a segunda; guardar com a data e mostrar «lido em…» ainda mostra um valor velho, o que a regra parece proibir.
- **Depois (produto, outros usuários, talvez pago):** **parece proibido sem autorização escrita.** Licença pessoal, sem uso comercial nem terceiros; e cobrar acesso a app que usa a API pede «express written permission». O token único do servidor lendo para outras pessoas agrava.

**4. Atribuição** (trecho oficial via busca): «You must display the following notice directly next to any data You use from the Discogs API: "Data provided by Discogs."», com link para a página do discogs.com que tem o dado. O registro de 2026-11-20 acrescenta a frase de não afiliação, à vista; não conferi.

**5. Contato.** Os termos pedem «express written permission» / «authorized in writing» para os casos acima. O e-mail `api@discogs.com` aparece numa especificação de terceiros, não na página oficial; o registro de 2026-11-20 diz que os termos mandam perguntar pela central de ajuda (`support.discogs.com`).

## Opções para o MJRP

| | Ganha | Paga / risco |
|---|---|---|
| **(a)** Guardar a leitura com a data; o botão atualiza | Valores sempre na tela, sem esperar | Bate de frente com as seis horas (mostra valor velho) e com «não mais que o necessário». Risco baixo hoje (uma pessoa), alto como produto |
| **(b)** Guardar só o valor que a pessoa adota como estimativa dela | O número passa a ser dela, não do Discogs; o registro de 2026-11-20 já dizia que o valor escrito à mão «não tem restrição» | Um clique a mais por álbum; zona cinza se a adoção for em massa e automática (vira cópia do dado com outro nome) |
| **(c)** Só no navegador, relido sozinho ao abrir a tela | Cabe no texto lido; sem clique | 211 álbuns relidos levam minutos e gastam o limite de pedidos; a primeira abertura do dia fica vazia até ler |
| **(d)** Ler a página ele mesmo e/ou perguntar ao Discogs | Tira a dúvida na fonte; a resposta escrita vale para o produto | Tempo; a resposta pode demorar ou ser «não» |

**O que o texto lido sustenta melhor:** **(c)** para o valor do Discogs, com **(b)** ao lado para quem quer um número guardado. (a) é a única que o texto parece contrariar diretamente. Antes de virar produto, **(d)** é necessária em qualquer caso.

**O que o MJRP deve ler ele mesmo, no navegador:** a página «API Terms of Use» (`https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use`) — a definição de «Restricted Data» / «Marketplace Data» (confirmar se as estatísticas de edição entram), a licença do dado restrito e a lista de proibições com as frases «six (6) hours» e «longer than is necessary». Se continuar ambíguo, perguntar por escrito ao suporte da API se guardar a leitura datada, só para o próprio dono da coleção, é permitido.

## Fontes (todas de segunda mão)
- Trechos da página oficial devolvidos pela busca: https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use
- Citação da cláusula das seis horas: https://github.com/johnzastrow/myvinyl/issues/18 ; https://github.com/WOIII-me/Discogs-MCP/pull/69 ; https://github.com/asuteau/sillon/issues/43
- Atribuição: https://github.com/andreisudarikov19/vinyl-art-apple-tv/issues/112
- Contato: especificação de terceiros em https://apis.io/providers/discogs/
- Registro anterior no repositório: `reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md`; `docs/specs/features/F75-cd-prices-and-where-to-buy/plan.md` (§ «Termos de uso…»)
