---
type: constitution-amendment-proposal
feature: F78
status: proposta
written: "2026-11-20"
decides: MJRP
---
# Emenda à constituição para o app (F78) — proposta

> **Para o MJRP ler e aceitar, mudar ou recusar.** A constituição só muda com a aprovação dele (Governance: «Changes to this constitution require User approval»). Este documento não muda nada: `docs/specs/constitution.md` fica como está até ele dizer qual texto entra.
> **Em 2026-11-20 13:45** ele seguiu a recomendação da proposta na decisão 6: emendar só para `app/`. Isso escolhe, em princípio, a redação (a) abaixo. O texto ainda é dele para ler.
> **Vai junto com:** o ADR-0022, em «Proposed» (`docs/decisions/0022-app-in-react-native-over-a-shared-core.md`). Um não se aceita sem o outro.

## 1. O que a constituição diz hoje

Os artigos estão em inglês, como foram ratificados (v1.0.0, 2025-12-10):

- **Art. II:** «We favor simplicity and standard web technologies over complex framework lock-in where possible.» e «**Tech Stack**: Vanilla Javascript (ES Modules), Vite, CSS Variables (Tailwind only if requested).»
- **Art. IV:** «**E2E Tests** (Puppeteer) for critical user flows, avoiding fragile external dependencies where possible.»
- **Art. V:** «**Deployment**: Zero-downtime deployments via CI/CD.»

E o que se apoia neles:

- Na própria constituição, em «O que é da stack deste projeto»: «**Tipagem:** JavaScript puro em ES Modules, sem TypeScript (Art. II, *Tech Stack*).»
- Em `docs/specs/tech-stack.md`, «Decidido não usar»: «Framework de UI (React, Vue e semelhantes)», com a nota de que o Art. II «é preferência, não proibição».

## 2. O que o app precisa e eles não deixam

| Artigo | O que o app precisa | Por quê |
|---|---|---|
| II | **React Native e Expo** em `app/`: um framework de interface, com o seu empacotador (Metro) além do Vite | as telas do app são nativas; o Vite não faz app de loja. O «where possible» abre a porta, mas o «Tech Stack» lista só Vanilla JS e Vite |
| II | **TypeScript: não precisa.** | a proposta (§ 4.4) prefere TypeScript em `app/`, mas diz que é compromisso, e que JavaScript em tudo cumpre a constituição e perde só a checagem de tipos das telas novas. O núcleo, `shared/`, já é JavaScript com JSDoc |
| IV | ponta a ponta do app com **Maestro**, não Puppeteer | o Puppeteer dirige um navegador; não dirige um app. O roteiro do Maestro é o que roda o autoteste do núcleo no simulador e no emulador (proposta, § 11) |
| V | o app sai do Mac do MJRP (ou do serviço de build do Expo) e passa pela **revisão da loja**: não há «zero-downtime via CI/CD» | uma versão do app não se desfaz; quem instalou fica com ela. A proteção passa a ser a versão mínima do app e a compatibilidade para trás (proposta, § 6.2) |

## 3. Redação (a) — a exceção mínima, só para `app/` (a escolhida em princípio)

Acrescentar, no fim do Art. II:

> - **Mobile app exception (`app/`)**: The mobile app in `app/` may use React Native and Expo, with their tooling (Metro, native build tools) and small native modules in Swift or Kotlin where the platform requires them. It is written in JavaScript (ES Modules) with JSDoc types, like `shared/`. The site in `public/` keeps the stack above. Product rules live in `shared/` and never in `app/` or `public/`. (ADR-0022)

No fim do Art. IV, em **Testing**:

> - **Mobile E2E** (Maestro) for the app's critical flows, run on the iOS simulator and the Android emulator before each app release.

No fim do Art. V:

> - **Mobile releases**: The app is released through the app stores and cannot be rolled back. Every change to `/api` and to Firestore documents stays backward compatible, and the server states the minimum app version.

E, em «O que é da stack deste projeto», a linha da tipagem passa a: «JavaScript puro em ES Modules, sem TypeScript, no site, no núcleo e no app (Art. II)».

**Custa:** um segundo empacotador e uma segunda forma de teste de ponta a ponta no repositório; nenhuma checagem de tipos nas telas do app. **Não custa:** nada no site, nada no servidor, nenhuma regra nova para quem mexe em `public/`. Versão: **1.1.0** (acréscimo; nenhum artigo perde sentido).

## 4. Redação (b) — uma mudança mais larga

Trocar a linha **Tech Stack** do Art. II por:

> - **Tech Stack**: JavaScript (ES Modules) or TypeScript. The site uses Vite and CSS Variables (Tailwind by ADR-0021); the mobile app uses React Native with Expo. A UI framework may be adopted in any part of the product by an ADR.

Trocar a linha **E2E Tests** do Art. IV por «E2E Tests for critical user flows, with the tool that fits each target (Puppeteer or Playwright for the site, Maestro for the app)», e a **Deployment** do Art. V por «Zero-downtime deployments via CI/CD for the site and the server; store releases for the app, with backward-compatible `/api` and documents.»

**Custa:** TypeScript passa a ser permitido em todo o repositório: duas convenções no mesmo lugar, e a regra «sem TypeScript» deixa de proteger o site; um framework de interface no site passa a precisar só de um ADR, não de emenda. **Ganha:** checagem de tipos nas telas do app desde o começo; nenhuma emenda nova se, um dia, o site também mudar. Versão: **2.0.0** (muda o sentido de um artigo).

## 5. A recomendação

A (a). É a menor exceção que deixa o app ser construído, e não toca o site. TypeScript não é preciso para nada que a proposta pede; se fizer falta nas telas do app, ele entra depois por outra emenda, só para `app/`, com o motivo medido.
