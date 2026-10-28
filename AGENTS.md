# AGENTS.md - MJRP_AlbumsBalancedPlaylists_v0

Instruções canônicas deste projeto, para qualquer AI Platform (Claude Code, Gemini, ou outra). `CLAUDE.md`/`GEMINI.md` importam este arquivo - o que é específico de uma ferramenta vive lá, nunca aqui.

## Herança

Este projeto segue o `PRINCIPLES.md` do MJRP Harness, versão 1.0 - cópia carimbada na raiz deste projeto (`PRINCIPLES.md`), não edite ali. A `docs/specs/constitution.md` deste projeto acrescenta o que é da stack; não reescreve nada do PRINCIPLES.md.

## Antes de qualquer trabalho

1. Ler `MEMORY.md` -> `## Now` e `## Ways of Working` (o estado e as correções já feitas).
2. Ler `VISION.md` (por que este projeto existe) e `docs/specs/constitution.md` (padrões da stack).
3. Se for trabalho de implementação: existe `spec.md` -> `plan.md` -> `tasks.md` aprovados para a feature? Sem isso, não implementar - ver os requisitos por épico do `docs/specs/prd.md` e o ciclo SDD.
4. Se a tarefa cria ou altera uma tela: o último passo do `tasks.md` é verificar num navegador real via MCP Playwright (`@playwright/mcp`) antes de dar como pronta - `PRINCIPLES.md` §I.12. Sem essa verificação, a entrega não está pronta, mesmo com o código certo.
5. Git por ponte de arquivos da AI Platform: pedir a permissão de apagar arquivos no começo da sessão - sem ela o git não remove as próprias travas (.git/*.lock).
6. Commit só por pathspec (`git commit -m ... -- <arquivos desta sessão>`), um por assunto - nunca `git add -A`: outra sessão pode estar no mesmo repo.
7. Rodar `python3 mjrp-scripts/doctor.py .` antes de commitar. Vermelho não commita.

## O que este arquivo NÃO faz

Não decide stack, não decide quem-faz-o-quê (isso é do contrato de instância, `.mjrp-project.yml`) e não reescreve o PRINCIPLES.md - só declara que este projeto o segue.
