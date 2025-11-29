# Runbook: Rotação do segredo `AI_API_KEY`

Objetivo: fornecer passos claros e reproduzíveis para rotacionar a chave de API usada pelo proxy (`AI_API_KEY`), validar a implantação e executar rollback se necessário.

Resumo rápido
- Criar nova versão do segredo no Secret Manager
- Atualizar Cloud Run (Edit & Deploy) para usar a versão `latest` do segredo e garantir `ALLOWED_ORIGIN` está correto
- Validar endpoints (Cloud Run e Firebase Hosting)
- Revogar a chave antiga no provedor e desabilitar versões antigas do Secret Manager

Passo a passo (Console UI — recomendado quando `gcloud` não está disponível)

1) Criar nova versão do segredo
- Console → Security → Secret Manager → selecionar `AI_API_KEY` → `Add new version`
- `Enter secret value` → cole a nova chave (não faça paste em chat ou VCS)
- Salvar. Anote o número da versão criada.

2) Conferir permissões da Service Account
- Console → Cloud Run → selecionar `mjrp-proxy` → anote `Service account` usado pela revisão
- Console → IAM & Admin → localizar essa service account
- Verificar que exista o papel `Secret Manager Secret Accessor` (`roles/secretmanager.secretAccessor`). Caso não exista, adicionar.

3) Criar nova revisão do Cloud Run com o segredo
- Console → Cloud Run → `mjrp-proxy` → `Edit & Deploy New Revision`
- Aba `Variables & Secrets` (ou `Environment variables & secrets`):
  - Em `Secrets` → `Add secret` → Source = Secret Manager → Secret = `AI_API_KEY` → Version = `Latest` → Mount as = Environment variable `AI_API_KEY`
  - Em `Environment variables` adicionar/atualizar: `ALLOWED_ORIGIN=https://mjrp-playlist-generator.web.app` (ou múltiplos, separados por vírgula)
- Deploy.

4) Verificações pós-deploy (UI + local)
- Console → Cloud Run → confirmar nova revisão `Ready` e com tráfego
- Console → Logging → Logs Explorer: filtrar por `resource.type=cloud_run_revision` e `resource.labels.service_name="mjrp-proxy"` para checar erros

Comandos de verificação local (terminal)
- Health check (Cloud Run):
```bash
curl -i https://<cloud-run-url>/_health
```
- Teste via Firebase Hosting (verifica rewrite + CORS):
```bash
curl -i https://mjrp-playlist-generator.web.app/api/generate \
  -H "Origin: https://mjrp-playlist-generator.web.app" \
  -H "Content-Type: application/json" \
  -d '{"albumQuery":"Led Zeppelin - Led Zeppelin I"}'
```
- Verifique:
  - HTTP 200 e corpo JSON esperado
  - `Access-Control-Allow-Origin: https://mjrp-playlist-generator.web.app`

5) Revogar chave antiga no provedor
- No painel do provedor da chave (Google Cloud API Keys, OpenAI, etc.) localizar e desativar/revogar a chave antiga.
- Só faça a revogação após confirmar que a nova chave está funcionando na runtime.

6) Limpeza no Secret Manager (opcional/por política)
- Console → Secret Manager → `AI_API_KEY` → `Versions` → desabilitar (`Disable`) versões antigas que não serão mais usadas.

Rollback (se necessário)
- Cloud Run mantém revisões. Para reverter para a revisão anterior:
  - Console → Cloud Run → `mjrp-proxy` → `Revisions` → selecionar a revisão anterior → `Split traffic` ou `Migrate traffic` (ou usar `Edit & Deploy` e escolher a imagem/revision desejada).
- Se a nova revisão falhar por problemas de credenciais, reverta tráfego para a revisão anterior e inspecione logs para diagnosticar.

Checklist de verificação rápida (antes de revogar chave antiga)
- [ ] Nova revisão do Cloud Run está `Ready`
- [ ] Logs da nova revisão não mostram erros de autenticação 403/401
- [ ] Endpoint via Hosting retorna 200 e `Access-Control-Allow-Origin` correto
- [ ] Smoke-tests funcionais confirmados manualmente ou via script

Notas operacionais
- Nunca registre ou exponha valores de segredos em logs ou variáveis de ambiente que sejam enviadas a sistemas de terceiros.
- Prefira usar `Latest` nas atualizações de revisão para simplificar rotação; controle e auditoria são mantidos em Secret Manager por versão.
- Para deploys automáticos com GitHub Actions, considere usar OIDC para autenticar no Google Cloud sem chaves de serviço de longa duração.

Se quiser, eu posso: (A) criar uma issue no GitHub com este runbook formatado; (B) commitar este arquivo (já fiz isso); (C) adicionar um pequeno script `scripts/check-secret-rotation.sh` para validar automaticamente (requer `gcloud`). Diga a opção desejada.
