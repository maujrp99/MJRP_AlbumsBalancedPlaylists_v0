# Análise de Metodologia para Sprint 6 (Authentication)

**Data**: 2025-12-10
**Status**: Draft
**Escopo**: Sprint 6 (Google/Apple Auth + User Persistence)

---

## 1. Contexto & Desafio

O Sprint 6 introduz Autenticação (OAuth 2.0 com Google e Apple) e Persistência de Dados de Usuário Firestore. Diferente dos sprints anteriores focados em lógica local e UI, este sprint envolve:

1.  **Integrações Externas**: Dependência de provedores de identidade (IdP) reais ou mockados.
2.  **Segurança**: Manipulação de tokens e sessões.
3.  **Estado Assíncrono**: O fluxo de login é inerentemente assíncrono e redirecionado.

A questão é: **Qual metodologia (TDD, BDD, Spec-Driven) é mais viável e benéfica para implementar a v2.2.0?**

---

## 2. Análise Comparativa

### A. TDD (Test-Driven Development) Clássico

*Foco: Escrever teste de unidade/integração antes do código.*

**Prós:**
*   **Design de Código:** Força desacoplamento. Útil para a `UserStore` e lógica de persistência.
*   **Feedback Rápido:** Testes unitários rodando no Vitest (in-memory) são rápidos.
*   **Segurança:** Garante que edge cases (ex: token inválido, erro de rede) sejam tratados.

**Contras no Sprint 6:**
*   **Integração Difícil:** Testar o "clique no botão de login do Google" via TDD requer mocks complexos do SDK do Firebase Auth.
*   **Falso Positivo:** Mocks excessivos podem mascarar mudanças nas APIs reais.

**Viabilidade:** Alta para *User Data Persistence* e gestão de estado. Baixa para *fluxos de UI de Auth*.

### B. BDD (Behavior-Driven Development)

*Foco: Gherkin/Cucumber. "Dado que estou na tela de login, Quando clico em Google..."*

**Prós:**
*   **Documentação Viva:** Alinha com o desejo de documentação forte do projeto.
*   **Linguagem Ubíqua:** Aproxima requisitos técnicos de requisitos de negócio.

**Contras no Sprint 6:**
*   **Overhead Tecnológico:** Requer configurar Cucumber/Jest-Cucumber sobre o Puppeteer/Vitest atual.
*   **Manutenção:** Steps definitions tendem a ficar obsoletos em projetos com ritmo rápido.
*   **Autenticação E2E:** Login real com Google/Apple em CI/CD é notoriamente difícil (bloqueio de bots, 2FA).

**Viabilidade:** Média-Baixa. O custo de setup e manutenção para um sprint curto (1 semana) pode não compensar.

### C. Spec-Driven Development (Github Spec Kit Style)

*Foco: Design detalhado (Markdown) antes do código. "Escrever a spec, revisar, codar".*

**Prós:**
*   **Alinhamento Total:** O projeto já usa documentação pesada (`ARCHITECTURE.md`, `ROADMAP.md`).
*   **Claridade Antes da Execução:** Define exatamente *o que* testar manuamente ou automatizar.
*   **Sem Overhead de Tooling:** É processo, não biblioteca.

**Contras no Sprint 6:**
*   **Não Automatizado:** A spec não falha o build se o código divergir (depende de disciplina humana).

**Viabilidade:** Muito Alta. Combina com o fluxo atual de "Implementation Plan".

---

## 3. Desafios Técnicos de Auth em Testes

Para aplicar qualquer metodologia automatizada (TDD/BDD), precisamos resolver:

1.  **Mocking do Firebase Auth:**
    *   Não podemos depender da UI real do Google/Apple nos testes automatizados.
    *   *Solução:* Usar `firebase-auth-emulator` localmente ou mockar o método `signInWithPopup`.

2.  **Puppeteer E2E:**
    *   O Puppeteer não consegue interagir facilmente com popups de terceiros (Google Auth) que têm proteções anti-bot.
    *   *Abordagem:* Em testes E2E, injetar um estado "logado" programaticamente em vez de clicar no botão de login.

---

## 4. Recomendação: Abordagem Híbrida "Spec-First TDD"

Para o Sprint 6, recomendamos uma abordagem pragmática que extrai o melhor dos três mundos sem overhead excessivo:

### 1. Spec-Driven Design (Fase de Planejamento)
Em vez de pular para o código, escreveremos um **Technical Spec** (similar ao Spec Kit) detalhando:
*   Fluxo de Dados (Auth Provider -> App -> Firestore)
*   Modelo de Dados (`/users/{uid}`)
*   Estados da UI (Guest, Authenticating, Authenticated, Error)

### 2. TDD para Lógica de Negócio (Fase de Execução)
Usar TDD rigoroso (Vitest) para:
*   `UserStore`: Testar transições de estado (login, logout, hydrate).
*   `AuthService`: Testar tratamento de erros e formatação de dados.
*   *Ferramenta*: Vitest com `vi.mock` do Firebase SDK.

### 3. "Behavior-Like" E2E Tests (Fase de Verificação)
Não usar Cucumber, mas escrever testes Puppeteer focados em comportamento:
*   *Cenário 1*: Usuário já logado vê sua foto e playlists.
*   *Cenário 2*: Persistência funciona após refresh.
*   *Mock Strategy*: Usar uma flag de teste para simular Auth bem-sucedido sem bater no Google.

---

## 5. Próximos Passos Propostos

1.  Criar `docs/specs/SPRINT6_AUTH_SPEC.md` com o design técnico.
2.  Configurar mocks do Firebase Auth no setup do Vitest.
3.  Implementar `UserStore` usando TDD.
4.  Implementar UI.

Esta abordagem garante qualidade (TDD) e clareza (Spec) sem paralisar o desenvolvimento com setup de ferramentas complexas (BDD puro).
