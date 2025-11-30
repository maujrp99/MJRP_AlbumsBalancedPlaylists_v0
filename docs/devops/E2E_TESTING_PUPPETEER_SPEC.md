# 🚀 Especificação Técnica: Agente de Criação de Script Standalone com Puppeteer

**Última Atualização:** 2025-11-30T06:28:00-03:00  
**Status:** Especificação Aprovada  
**Tipo:** Contingência/Teste E2E Standalone

---

## 📋 Análise da Especificação

### ✅ Pontos Fortes

1. **Clareza de Objetivos**
   - Objetivo bem definido: criar um teste E2E standalone como contingência ao Agent Browser
   - Escopo limitado e focado: teste de login em SPA
   
2. **Especificações Técnicas Completas**
   - Todos os seletores CSS necessários estão definidos
   - URL de teste e critério de sucesso explícitos
   - Configuração técnica clara (headful mode, viewport específico)

3. **Estrutura de Entregáveis**
   - Lista clara dos 3 arquivos necessários
   - Cada arquivo tem propósito bem definido

4. **Metodologia Detalhada**
   - Sequência lógica de passos (wait → type → click → verify)
   - Uso de boas práticas (waitForSelector, waitForNavigation/waitForURL)
   - Tratamento de sucesso e falha contemplado

### ⚠️ Recomendações e Melhorias

1. **Credenciais de Teste**
   - ✅ Usa dados fictícios (`teste@exemplo.com`, `senha123`)
   - 💡 **Sugestão**: Considerar usar variáveis de ambiente para permitir teste com credenciais reais se necessário

2. **Tratamento de Erros**
   - ✅ Menciona log de exceções
   - 💡 **Sugestão**: 
     - Adicionar screenshot em caso de falha (`screenshot: failure.png`)
     - Adicionar timeout configurável para as operações
     - Capturar erro detalhado com stack trace

3. **Configuração do Puppeteer**
   - ✅ Configuração básica adequada
   - 💡 **Sugestões adicionais**:
     ```javascript
     {
       headless: false,
       defaultViewport: { width: 1280, height: 800 },
       slowMo: 100, // Facilita visualização durante debug
       args: ['--no-sandbox', '--disable-setuid-sandbox'] // Para ambientes CI
     }
     ```

4. **Verificação de Sucesso**
   - ✅ Usa `waitForNavigation()` ou `waitForURL()`
   - 💡 **Sugestão**: Especificar qual usar, recomendo `waitForURL()` por ser mais moderno e preciso:
     ```javascript
     await page.waitForURL('**/dashboard', { timeout: 5000 });
     ```

5. **Estrutura do Projeto**
   - 💡 **Sugestão**: Adicionar arquivo `.gitignore` para:
     - `node_modules/`
     - `*.png` (screenshots)
     - `.env` (se for usar variáveis de ambiente)

---

## 🎯 Especificação Técnica Refinada

### 1. Objetivo da Missão

Gerar um conjunto de arquivos de projeto Node.js/Puppeteer **totalmente autônomo** (Standalone) que implementa um teste de ponta a ponta (E2E) de login em uma Single Page Application (SPA), servindo como contingência robusta ao *Agent Browser* integrado.

### 2. Escopo e Requisitos Funcionais

O script deve simular o fluxo de login em uma SPA hospedada localmente.

**Configuração do Teste:**
- **URL de Teste:** `http://localhost:3000`
- **Seletor do Campo Email:** `#email-input`
- **Seletor do Campo Senha:** `#password-input`
- **Seletor do Botão de Login:** `#login-button`
- **URL de Sucesso Esperada:** Conter `/dashboard` após o login
- **Credenciais de Teste:** `teste@exemplo.com` / `senha123` (dados fictícios)

### 3. Requisitos Técnicos

| Componente | Especificação |
|------------|---------------|
| **Linguagem/Runtime** | Node.js (v16+) |
| **Biblioteca** | `puppeteer` (latest) |
| **Modo de Execução** | Headful (`headless: false`) para depuração |
| **Viewport** | 1280x800 pixels (desktop padrão) |
| **Timeouts** | 5000ms para navegação e seletores |

### 4. Metodologia e Passos de Execução

#### 4.1 Configuração de Dependências

**Arquivo:** `package.json`

```json
{
  "name": "puppeteer-spa-login-test",
  "version": "1.0.0",
  "description": "Teste E2E standalone para login em SPA",
  "main": "test_login_spa.js",
  "scripts": {
    "test": "node test_login_spa.js"
  },
  "dependencies": {
    "puppeteer": "^21.0.0"
  }
}
```

#### 4.2 Script Principal

**Arquivo:** `test_login_spa.js`

**Lógica Sequencial:**

1. **Lançamento do Puppeteer**
   ```javascript
   const browser = await puppeteer.launch({
     headless: false,
     defaultViewport: { width: 1280, height: 800 },
     slowMo: 100 // Opcional: para visualizar melhor
   });
   ```

2. **Navegação e Espera**
   - Navegar para `http://localhost:3000`
   - Aguardar carregamento completo da página

3. **Interação com Formulário**
   - `await page.waitForSelector('#email-input', { timeout: 5000 })`
   - `await page.type('#email-input', 'teste@exemplo.com')`
   - `await page.waitForSelector('#password-input', { timeout: 5000 })`
   - `await page.type('#password-input', 'senha123')`

4. **Submissão e Verificação**
   - `await page.click('#login-button')`
   - **Verificação usando `waitForURL()`:**
     ```javascript
     await page.waitForURL('**/dashboard', { timeout: 5000 });
     ```

5. **Tratamento de Resultado**
   - **Sucesso:**
     - Log: "✅ Login bem-sucedido!"
     - Screenshot: `success.png`
     - Fechar navegador
   - **Falha:**
     - Log: "❌ Erro no teste de login: [detalhes]"
     - Screenshot: `failure.png`
     - Stack trace completo
     - Fechar navegador

#### 4.3 Documentação

**Arquivo:** `README.md`

**Conteúdo:**

```markdown
# Teste E2E - Login SPA com Puppeteer

## 🎯 Objetivo
Teste standalone para validar fluxo de login na SPA.

## 📋 Pré-requisitos
- Node.js v16+
- SPA rodando em http://localhost:3000

## 🚀 Instalação
\`\`\`bash
npm install
\`\`\`

## ▶️ Execução
\`\`\`bash
node test_login_spa.js
# ou
npm test
\`\`\`

## ✅ Critério de Sucesso
URL contém `/dashboard` após login

## 📸 Artefatos
- `success.png` - Screenshot em caso de sucesso
- `failure.png` - Screenshot em caso de falha
\`\`\`

---

## 📦 Entregáveis (Artefatos de Saída)

1. ✅ **`package.json`** - Configuração de dependências
2. ✅ **`test_login_spa.js`** - Script principal do teste E2E
3. ✅ **`README.md`** - Instruções de setup e execução
4. 💡 **`.gitignore`** (opcional mas recomendado) - Ignorar `node_modules/` e screenshots

---

## 🔗 Integração com Projeto MJRP

### Localização Recomendada
```
MJRP_AlbumsBalancedPlaylists_v0/
├── tests/
│   └── e2e/
│       └── puppeteer-standalone/
│           ├── package.json
│           ├── test_login_spa.js
│           ├── README.md
│           └── .gitignore
```

### Relação com Arquitetura Existente
- **Complementa:** Testes existentes em `/test` e `/tests`
- **Contingência:** Alternativa ao Agent Browser para validação de fluxos críticos
- **Isolamento:** Totalmente standalone, sem dependências do projeto principal

---

## 🚨 Próximos Passos

1. [ ] Revisar e aprovar especificação
2. [ ] Criar estrutura de diretórios (`tests/e2e/puppeteer-standalone/`)
3. [ ] Gerar os 3 arquivos principais
4. [ ] Executar teste inicial
5. [ ] Documentar resultados no [DEBUG_LOG.md](DEBUG_LOG.md)
6. [ ] Atualizar índice de testes se necessário

---

## 📚 Referências

- [Puppeteer Documentation](https://pptr.dev/)
- [Documentação DevOps Local](./LOCAL_RUN.md)
- [Debug Log do Projeto](../DEBUG_LOG.md)
- [Arquitetura do Projeto](../ARCHITECTURE.md)
