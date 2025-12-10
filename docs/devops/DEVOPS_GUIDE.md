# MJRP DevOps Guide

**Last Updated**: 2025-12-10  
**Version**: 2.1.0

> [!NOTE]
> Este documento consolida toda a documentação de DevOps em um único arquivo organizado por seções.

---

## Índice

1. [Quick Start - Deploy em Produção](#1-quick-start---deploy-em-produção)
2. [Desenvolvimento Local](#2-desenvolvimento-local)
3. [Configuração de Portas](#3-configuração-de-portas)
4. [Production Readiness Checklist](#4-production-readiness-checklist)
5. [Segurança e Secrets](#5-segurança-e-secrets)
6. [Rotação de Secrets](#6-rotação-de-secrets)
7. [Rollback Procedures](#7-rollback-procedures)
8. [Troubleshooting](#8-troubleshooting)
9. [Known Issues Reference](#9-known-issues-reference)

---

## 1. Quick Start - Deploy em Produção

### Frontend (Firebase Hosting)

```bash
./scripts/deploy-prod.sh
```

Este script automaticamente:
- Executa `npm run build`
- Copia arquivos estáticos para `dist/`
- Faz `firebase deploy --only hosting`

### Backend (Cloud Run)

```bash
./scripts/deploy-backend.sh
```

Este script automaticamente:
- Copia `shared/` para o contexto do Docker
- Faz build e deploy via `gcloud run deploy`

---

## 2. Desenvolvimento Local

### Pré-requisitos

- Node.js 18.x e npm
- Python 3 (para servidor estático) ou `npx serve`
- Arquivo `server/.env` com `AI_API_KEY=...`

### Start (um comando)

```bash
./scripts/start-local.sh
```

O script:
- Instala dependências (`npm ci` em `server/`)
- Inicia backend em `localhost:3000`
- Inicia frontend em `localhost:8000`
- Salva logs em `.local_logs/`

### Stop

```bash
./scripts/stop-local.sh
```

### Verificações úteis

```bash
# Health check
curl -sS http://localhost:3000/_health | jq

# Teste de album
curl -sS -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"albumQuery":"Radiohead - OK Computer"}' | jq

# Tail logs
tail -f .local_logs/server.log
```

---

## 3. Configuração de Portas

> [!CAUTION]
> **Port 5173 é o default do Vite MAS NÃO É USADO neste projeto.**
> Sempre use as portas documentadas abaixo.

| Porta | Propósito | Configuração | Comando |
|-------|-----------|--------------|---------|
| **5000** | Dev Server (Vite) | `vite.config.js:30` | `npm run dev` |
| **5005** | Preview/E2E Tests | `test/e2e/helpers.js:6` | `npm run preview` |
| **3000** | Backend API | `server/index.js` | `cd server && node index.js` |
| **8000** | Static Server (dev) | `start-local.sh` | Python http.server |

### Verificação

```bash
# Verificar porta do dev server
grep -n "port:" vite.config.js
# Expected: "30:        port: 5000,"
```

---

## 4. Production Readiness Checklist

> [!IMPORTANT]
> Checklist baseado nos Issues #33 e #34 do DEBUG_LOG.md para evitar problemas recorrentes.

### 🔧 Frontend Deploy

#### Pre-Build
- [ ] `firebase.json` está com `"public": "dist"` (NÃO `"public"`)
- [ ] Nenhuma dependência está em `external` no `vite.config.js` (axios, etc.)
- [ ] Sem CDN scripts desnecessários no `index.html`

#### Build
- [ ] `npm run build` executa sem erros
- [ ] Build output está em `dist/` (não `public/`)
- [ ] `dist/assets/main-*.js` existe e tem tamanho > 100KB

#### Static Files
- [ ] `firebase-config.js` copiado para `dist/js/`
- [ ] `css/modals.css` copiado para `dist/css/`
- [ ] Outros assets copiados

> **Nota**: `./scripts/deploy-prod.sh` faz tudo isso automaticamente.

### 🖥️ Backend Deploy

#### Pre-Deploy
- [ ] `shared/` folder contém:
  - `normalize.js` ✅
  - `curation.js` ✅ (adicionado em 2025-12-10)
- [ ] `server/index.js` importa de `../shared/` (NÃO de `../public/`)
- [ ] Nenhum import de `../public/js/` no código do servidor

#### Container Structure
```
/usr/src/app/      → server code (index.js, lib/, etc.)
/usr/src/shared/   → shared modules (normalize.js, curation.js)
```

**NÃO deve ter**: `/usr/src/public/` (frontend é separado)

### ✅ Post-Deploy Validation

#### Frontend
- [ ] App carrega sem erros no console
- [ ] Sem erros de "Failed to resolve module specifier"
- [ ] Firebase Auth inicializa corretamente

#### Backend
- [ ] `/api/generate` (Load Albums) funciona
- [ ] `/api/playlists` (Generate Playlists) funciona - retorna 200
- [ ] Logs do Cloud Run sem erros 500

#### Smoke Tests
- [ ] Criar nova série
- [ ] Carregar álbuns via Load Albums
- [ ] Gerar playlists
- [ ] Navegar entre views (Home, Albums, Playlists, Inventory)

---

## 5. Segurança e Secrets

### Princípios

- ❌ **NUNCA** commitar API keys no repositório
- ✅ Use variáveis de ambiente
- ✅ O proxy server (`/server`) mantém secrets no backend

### Configuração

1. Copie `.env.example` para `server/.env`
2. Preencha `AI_API_KEY` e opcionalmente `AI_ENDPOINT`
3. Para deploy, configure secrets no Secret Manager do GCP

### Validação com AJV

O servidor usa `ajv` para validar respostas do AI provider:

```bash
cd server
npm install ajv
node index.js
```

Se vir respostas `422`, verifique logs para "Album validation failed".

### Endpoints úteis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/_health` | GET | Health check (`{ ok: true }`) |
| `/api/list-models` | GET | Lista modelos disponíveis |
| `/api/generate` | POST | Gera album (`{ albumQuery }`) |
| `/api/playlists` | POST | Gera playlists (`{ albums, options }`) |

---

## 6. Rotação de Secrets

### Passo a Passo (Console UI)

1. **Criar nova versão do segredo**
   - Console → Secret Manager → `AI_API_KEY` → "Add new version"
   - Cole a nova chave, salve

2. **Verificar permissões**
   - Cloud Run → `mjrp-proxy` → anotar Service Account
   - IAM → verificar `Secret Manager Secret Accessor`

3. **Criar nova revisão do Cloud Run**
   - Cloud Run → `mjrp-proxy` → "Edit & Deploy New Revision"
   - Variables & Secrets → Add secret → `AI_API_KEY` → Version = `Latest`
   - Environment variables: `ALLOWED_ORIGIN=https://mjrp-playlist-generator.web.app`
   - Deploy

4. **Verificação pós-deploy**
   ```bash
   # Cloud Run
   curl -i https://<cloud-run-url>/_health

   # Via Firebase Hosting
   curl -i https://mjrp-playlist-generator.web.app/api/generate \
     -H "Origin: https://mjrp-playlist-generator.web.app" \
     -H "Content-Type: application/json" \
     -d '{"albumQuery":"Led Zeppelin - Led Zeppelin I"}'
   ```

5. **Revogar chave antiga** no provedor (após confirmar nova funcionando)

6. **Limpeza** - Desabilitar versões antigas no Secret Manager

### Checklist antes de revogar

- [ ] Nova revisão do Cloud Run está `Ready`
- [ ] Logs sem erros 403/401
- [ ] Endpoint retorna 200 com CORS correto
- [ ] Smoke tests funcionais

---

## 7. Rollback Procedures

### Frontend (Firebase Hosting)

```bash
# Via CLI
firebase hosting:channel:deploy previous

# Via Console:
# Hosting → Release History → "Rollback to this version"
```

### Backend (Cloud Run)

```bash
# Listar revisões
gcloud run revisions list --service=mjrp-proxy --region=southamerica-east1

# Rollback para revisão específica
gcloud run services update-traffic mjrp-proxy \
  --to-revisions=mjrp-proxy-XXXXX=100 \
  --region=southamerica-east1

# Via Console:
# Cloud Run → mjrp-proxy → Revisions → Split traffic
```

---

## 8. Troubleshooting

### "I'm getting 404 on localhost:5173"

**Problema**: Porta errada.  
**Solução**: Use `http://localhost:5000`

### "npm run dev starts on random port"

**Problema**: Porta 5000 já em uso.  
**Solução**:
```bash
lsof -i :5000  # Encontrar processo
kill -9 <PID>  # Matar processo
```

### "503 from /api/generate"

**Problema**: `AI_API_KEY` não configurado.  
**Solução**: Configurar em `server/.env` ou variáveis de ambiente.

### "CORS error on API calls"

**Problema**: Origin não permitido.  
**Solução**: Verificar `ALLOWED_ORIGIN` no Cloud Run inclui o domínio correto.

### "Failed to resolve module specifier 'axios'"

**Problema**: `firebase.json` com `"public": "public"`.  
**Solução**: Mudar para `"public": "dist"` e rodar `./scripts/deploy-prod.sh`.

### "/api/playlists retorna 500"

**Problema**: Import de `../public/js/curation.js` no servidor.  
**Solução**: Usar `../shared/curation.js` e verificar que `shared/curation.js` existe.

---

## 9. Known Issues Reference

| Issue | Sintoma | Causa | Solução |
|-------|---------|-------|---------|
| #33 | `Failed to resolve module specifier "axios"` | `firebase.json` com `"public": "public"` | Mudar para `"public": "dist"` |
| #34 | `/api/playlists` retorna 500 | Import de `../public/js/curation.js` | Usar `../shared/curation.js` |

---

## Histórico de Atualizações

| Data | Alteração |
|------|-----------|
| 2025-12-10 | Documento consolidado a partir de 6 arquivos separados |
| 2025-12-10 | Adicionado Issue #33 e #34 ao checklist |
| 2025-12-09 | Atualizado firebase.json para usar dist/ |

---

**Owner**: DevOps Team  
**Arquivos Arquivados**: `docs/archive/devops/`
