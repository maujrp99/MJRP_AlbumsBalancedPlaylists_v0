# Bug Specification Review - Issues #54, #55

**Updated**: 2025-12-18 16:14  
**Status**: ✅ Decisões tomadas - Aguardando última confirmação

---

## Decisões Confirmadas

| Pergunta | Decisão |
|----------|---------|
| **Arquitetura** | Opção A - Views Separadas |
| **Regenerate EDIT** | Permitir |
| **Carregar dados EDIT** | ❓ Aguardando |

---

## Análise: Regenerate no EDIT Mode

### O Problema dos IDs

```
Estado inicial:               Após Regenerate:
─────────────────────────────┼──────────────────────────
playlist.id = "abc123"       │ playlist.id = "xyz789" (NOVO)
playlist.batchName = "V1"    │ playlist.batchName = "V1" (mantido)
```

Quando você regenera, o algoritmo cria **playlists novas com IDs novos**.

Se o Save usa `playlist.id` para upsert no Firestore → cria **documentos novos** (bug #54)

### Solução Proposta

Na EditPlaylistView, o Save sempre:
1. Deleta TODOS os documentos onde `batchName === currentBatchName`
2. Salva as novas playlists com o mesmo `batchName`

Assim não importa se os IDs mudaram - o `batchName` é o identificador real.

> **Seu comentário sobre Regenerate**:

---

## Análise: Firestore vs localStorage

| Aspecto | Firestore (fresh) | localStorage |
|---------|-------------------|--------------|
| **Dados** | Sempre corretos | Pode estar stale |
| **Performance** | ~500ms latência | Instantâneo |
| **Offline** | Não funciona | Funciona |
| **Conflitos** | Evita | Pode ter dados antigos |
| **Bug #55** | ✅ Resolve | ❌ Causa o problema |

### Minha Recomendação: Firestore

O bug #55 (Ghost Playlists) é **exatamente** causado por localStorage trazendo dados antigos.

Se EditPlaylistView carregar sempre do Firestore:
- Dados sempre corretos
- Sem contaminação de outras sessões
- Trade-off de 500ms é aceitável para garantir integridade

> **Seu comentário sobre Firestore vs localStorage**:

---

## Implementação Proposta

### CreatePlaylistView (nova ou renomear atual)

- **Rota**: `/playlists` ou `/playlists?create=true`
- **Mount**: `playlistsStore.clear()` - sempre começa vazio
- **Regenerate**: Permitido, ilimitado
- **Save**: Sempre cria batch NOVO

### EditPlaylistView (nova)

- **Rota**: `/playlists?edit=batchName`
- **Mount**: Carregar do Firestore por batchName (não localStorage)
- **Regenerate**: Permitido (IDs mudam, batchName mantido)
- **Save**: Deleta batch antigo → Salva novo com mesmo batchName

> **Seu comentário sobre a implementação**:

---

## Próximos Passos (após sua confirmação)

1. Criar `EditPlaylistView.js`
2. Modificar router para distinguir as rotas
3. Modificar `SavedPlaylistsView` para usar nova rota de edit
4. Testar fluxos CREATE e EDIT separadamente


