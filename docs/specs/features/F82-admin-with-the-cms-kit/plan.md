# Plan — Feature F82: Um admin para o site, com o CMS-kit do MJRP · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Esboço, com o que as duas conversas de 2026-11-21 08:12 trouxeram (relato dos outros agentes, a conferir lendo o kit):
- O kit é uma pasta do MJRPpersonal, não um pacote. O núcleo é TypeScript sem framework; a interface é React 19 (com `@dnd-kit` e `clsx`); não importa nada do projeto nem do Next.
- O projeto entrega ao kit o esquema do conteúdo, a pele (CSS de tokens) e as portas: ler, gravar, imagem, traduzir, publicação.
- Não vêm no kit: o login, o banco e o copy deck. As telas do CMS partem do copy deck (regra do MJRP), nunca só do protótipo.
- Caminho recomendado por eles para o V0: o kit como uma ilha React numa rota `/admin`, com React só nessa entrada do Vite; as portas de ler e gravar sobre o Firestore, o site lendo em tempo de execução; o login com o Firebase Auth que já existe, e as regras do Firestore liberando a escrita só ao dono; a tradução num endpoint do servidor Node (a chave da IA nunca vai ao navegador).
- **Decisão do MJRP, que esta feature provoca:** a ADR-0011 diz que o kit «vira pacote quando houver o segundo projeto», e proíbe construir copiando a pasta. O V0 é o segundo projeto. Onde o pacote mora (repositório próprio ou no harness) e quem o extrai é dele.
- **Decidido pelo MJRP em 2026-11-21 09:04** (Control Center, lote `reports/proposals/2026-11-21-0845-v0-pending-decisions.md`, D-01): o pacote do kit mora **dentro do harness, distribuído aos projetos como o kernel**. A extração é trabalho do harness com o MJRPpersonal; o V0 espera o kit chegar por esse caminho e não copia a pasta.
- Regras do MJRP lembradas por eles: recurso de CMS nasce no kit e vale para todos os CMS; diz-se «CMS», não «painel».
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
