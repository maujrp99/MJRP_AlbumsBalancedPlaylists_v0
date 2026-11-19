# ADR-0020: The Server Runs on Node 24

**Date**: 2026-11-19
**Status**: Accepted
**Deciders**: MJRP (decided in conversation on 2026-11-19: «Node do servidor: continuar em 18 ou subir para 24? = 24»), Claude agent (drafter)
**Related work**: release v5.0, feature F64

## Context
The server image (`server/Dockerfile`, Cloud Run service `mjrp-proxy`) was built on `node:18-slim`. Node 18 left support in April 2025: no security fixes. The tests run on Node 26 on the owner's machine and in the CI.

## Decision
The server image is built on `node:24-slim`. The change is published alone, by `npm run deploy:server`, so that a problem has one cause; the way back is the previous revision (`mjrp-proxy-00197-mps`).

## Options
- **Stay on 18** — no change in production; no security fixes. Refused.
- **24** — supported line with long-term support; one line behind the one the tests run on. Chosen.
- **26** — the line the tests run on; newer, shorter track record in production. Not chosen by the owner.

## Consequences
- The tests (Node 26) and production (Node 24) are on different lines; the deploy script starts the built server and checks it before the deploy, and production is checked after.
- `docs/specs/tech-stack.md` cites this record in the Runtime and Build rows.
