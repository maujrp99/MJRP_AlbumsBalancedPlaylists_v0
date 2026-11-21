# Plan — Feature F81: O site em mais de um idioma · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Esboço, com o que as duas conversas de 2026-11-21 08:12 trouxeram (relato dos outros agentes, a conferir):
- O harness não impõe biblioteca de idiomas. Valem o cânone IA-02 (um conceito, um rótulo só em todas as telas e idiomas), o documento de copy por idioma e as skills `mjrp-generating-copy-deck` e `mjrp-generating-copy-doc`; na reconferência o juiz troca o idioma na tela.
- O MJRPpersonal usa pt (padrão) e en: os textos da interface em `messages/pt.json` e `messages/en.json`, o conteúdo editável como par `{pt, en}` por campo, a primeira visita pelo idioma do navegador, e a regra de mostrar o campo no idioma da página quando preenchido, senão no idioma em que foi escrito. Lá isso é feito com o next-intl, que não serve ao V0.
- Caminho recomendado por eles para o V0: um dicionário por idioma e o conteúdo no mesmo formato de par `{pt, en}`, para o CMS (F82) editar sem adaptação; prefixo de caminho (`/en/...`).
- A conferir antes de decidir: se o Firebase Hosting serve `/en/*` como o app (as regras de reescrita, que a F80 acabou de mudar) e o que o prefixo faz com a leitura por buscadores.
Nenhum código de produto antes da proposta aprovada.

## Technical Design
A escrever depois da proposta.

## Dependencies
A declarar.

## Documents Consulted
Ainda não lidos pelo agente do V0; apontados em 2026-11-21 08:12 pelo orquestrador do MJRPpersonal e pelo agente mestre do harness (o que segue é o relato deles, a conferir na proposta):
- O kit: `/Users/maujrp/mjrp/projects/MJRPpersonal/src/admin-kit/` (entrada `index.ts`; `ports.ts`, `skin-contract.ts`, `schema.ts`, `example/`), regido pela ADR-0011 do MJRPpersonal, aceita pelo MJRP em 2026-11-07.
- ADRs do MJRPpersonal em `/Users/maujrp/mjrp/projects/MJRPpersonal/docs/decisions/`: 0003 (gravação), 0008 (ler o que gravou), 0009 (um admin por site), 0013 (publicar sem deploy), 0015 (texto rico).
- `/Users/maujrp/mjrp/projects/MJRPpersonal/reports/evidence/F96-two-way-translation-in-the-admin-kit/` (tradução nos dois sentidos).

## Risks & Considerations
A escrever.
