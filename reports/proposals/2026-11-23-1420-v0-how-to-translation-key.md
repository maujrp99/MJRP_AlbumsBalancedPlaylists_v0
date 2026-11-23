# Como ligar a tradução do Painel: a chave da Claude no cofre do servidor

**Data:** 2026-11-23 · **Ramo:** `claude/f82-cms-translate-route` · **Tipo:** passo a passo (how-to) para o MJRP; o agente não roda nada daqui
**Feature:** o admin com o kit do CMS ([F82](../../docs/specs/features/F82-admin-with-the-cms-kit/spec.md)), REQ-13, TASK-16
**Decisão que isto cumpre:** a tradução usa a API da Claude, paga por uso, com uma chave que só você cria no cofre do servidor (lote de 2026-11-23, D-01: «a»). O agente não lê nem digita a chave.

## O que você ganha e o que paga

- **Ganha:** o «traduzir» do Painel passa a funcionar (quando a peça do Painel existir; hoje só a rota do servidor está pronta).
- **Paga:** o uso da API, por texto traduzido. Com o modelo padrão (`claude-haiku-5-5`) um texto do site custa uma fração de centavo de dólar; a rota aceita no máximo 120 traduções por hora por administrador e 4000 caracteres por texto.
- **Sem este passo:** nada quebra. O servidor sobe normalmente e a rota responde a falha `translation-not-configured`, que o Painel mostra pelo nome.

## Antes

1. Uma chave de API criada por você no console da Anthropic (https://console.anthropic.com → API Keys), numa conta com crédito. Recomendado: pôr um limite de gasto mensal no console.
2. `gcloud` logado na sua conta (`gcloud auth login`).
3. A ordem não importa: a chave pode ser ligada antes ou depois de publicar o servidor com a rota. A tradução só funciona com as duas coisas feitas.

## Os comandos

Em todos: projeto `mjrp-playlist-generator`, serviço `mjrp-proxy`, região `southamerica-east1`. Nenhum comando abaixo leva o valor da chave escrito: ela entra pela área de transferência, para não ficar no histórico do terminal.

**1. Criar o segredo (vazio) no cofre** — uma vez:

```bash
gcloud secrets create anthropic-api-key \
  --replication-policy automatic --project mjrp-playlist-generator
```

**2. Gravar a chave no segredo.** Copie a chave no console da Anthropic (Cmd+C) e rode, sem colar nada no terminal:

```bash
pbpaste | tr -d '\n' | gcloud secrets versions add anthropic-api-key \
  --data-file=- --project mjrp-playlist-generator
```

Depois copie qualquer outra coisa, para a chave sair da área de transferência.

**3. Deixar o servidor ler só esse segredo.** Primeiro veja qual é a conta de serviço do `mjrp-proxy`:

```bash
gcloud run services describe mjrp-proxy \
  --region southamerica-east1 --project mjrp-playlist-generator \
  --format 'value(spec.template.spec.serviceAccountName)'
```

Com o e-mail que ela imprimir no lugar de `<conta de serviço>`:

```bash
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member "serviceAccount:<conta de serviço>" \
  --role roles/secretmanager.secretAccessor --project mjrp-playlist-generator
```

**4. Ligar o segredo ao serviço como `ANTHROPIC_API_KEY`** (cria uma revisão nova em cerca de um minuto, sem publicar código; os outros segredos e variáveis do serviço ficam como estão):

```bash
gcloud run services update mjrp-proxy \
  --update-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest \
  --region southamerica-east1 --project mjrp-playlist-generator
```

## Conferir

```bash
gcloud run services describe mjrp-proxy \
  --region southamerica-east1 --project mjrp-playlist-generator \
  --format 'yaml(spec.template.spec.containers[0].env)'
```

A lista deve ter `ANTHROPIC_API_KEY` apontando para o segredo `anthropic-api-key` (o comando mostra o nome do segredo, nunca o valor). A prova de ponta a ponta é pelo Painel, com a sua conta: a rota só responde ao administrador, então não há teste com `curl` sem o seu login.

## Mudar depois

- **Trocar a chave:** repita o passo 2 (grava uma versão nova) e o passo 4 (`:latest` é resolvido quando a revisão sobe). Depois apague a chave antiga no console da Anthropic.
- **Desligar a tradução:** `gcloud run services update mjrp-proxy --remove-secrets ANTHROPIC_API_KEY --region southamerica-east1 --project mjrp-playlist-generator`. A rota volta a responder `translation-not-configured`.
- **Trocar o modelo** (opcional; padrão `claude-haiku-5-5`): `gcloud run services update mjrp-proxy --update-env-vars TRANSLATE_MODEL=<modelo> --region southamerica-east1 --project mjrp-playlist-generator`.
- **Mudar o limite por hora** (opcional; padrão 120): o mesmo comando com `TRANSLATE_CALLS_PER_HOUR=<número>`.

## O que mais falta para a tradução funcionar no Painel

1. Publicar o servidor com a rota (`npm run deploy:server`, depois de o ramo entrar na `main`).
2. O seu registro de administrador no banco: `cmsAdmins/{seu uid}` com `role: "super"`, criado por você no console do Firebase (ainda não existe; a rota responde `not-an-administrator` sem ele).
3. A peça «traduzir» no Painel, ligada a esta rota (espera o kit do CMS).
