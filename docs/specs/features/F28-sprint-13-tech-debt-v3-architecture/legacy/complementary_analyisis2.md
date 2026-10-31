

Thought for 3s


Você tem razão, deixe-me verificar o HomeView atual primeiro:

Analyzed
HomeView.js#L1-789
Agora entendi! Você está certo. O fluxo atual é ótimo:

Digita o artista → Mostra discography grid
Seleciona álbuns → Vai para Staging Area
Cria série
O problema real que você identificou:

javascript
// Linha 446 - Usa MusicKitService.getArtistAlbums()
const apiResults = await musicKitService.getArtistAlbums(artistName)
E no MusicKitService.getArtistAlbums() (linha 247-291):

javascript
// Linha 269 - Limite de 100 álbuns
const albumsResult = await this.music.api.music(
    `/v1/catalog/${this._getStorefront()}/artists/${artistId}/albums`,
    { limit: 100 }
)
📊 Diagnóstico do Problema
Issue	Localização	Causa
Não vem todos os álbuns	
getArtistAlbums()
API retorna 100, mas pode haver mais (paginação?)
Filtro por tipo não funciona	Não implementado	API retorna isSingle, isCompilation mas não filtramos na UI
Variantes não agrupadas	N/A	Mostra "Album", "Album (Deluxe)", "Album (Remastered)" separados
💡 Proposta COMPLEMENTAR (sem substituir o fluxo atual)
Adições ao HomeView:
┌────────────────────────────────────────────────────────────────┐
│  🔍 Led Zeppelin                                    [X Clear]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ FILTROS: [✓ Albums] [  Singles] [  Compilations] [  Live]│  │  ← NOVO
│  │          [✓ Standard] [✓ Remasters] [  Deluxe]           │  │  ← NOVO
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ LZ I    │ │ LZ II   │ │ LZ III  │ │ LZ IV   │ │ Houses  │   │
│  │ 1969    │ │ 1969    │ │ 1970    │ │ 1971    │ │ 1973    │   │
│  │         │ │         │ │         │ │ 🔻 3    │ │         │   │  ← Badge mostra versões
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                │
│  ─────────────────────────────────────────────────────────────  │
│  📄 Showing 9 of 12 albums (3 hidden by filters)        [Load More] ← Se paginação
└────────────────────────────────────────────────────────────────┘
Quando clica em álbum com múltiplas versões (Badge 🔻 3):
┌──────────────────────────────────────┐
│  Led Zeppelin IV                      │
│  3 versões disponíveis               │
│                                      │
│  ○ Led Zeppelin IV (1971)         [+]│  ← Clica para adicionar
│  ○ Led Zeppelin IV (Remastered)   [+]│
│  ○ Led Zeppelin IV (Super Deluxe) [+]│
│                                      │
│  [Adicionar todas]  [Fechar]         │
└──────────────────────────────────────┘
🔧 Mudanças Técnicas Necessárias
1. Aumentar /paginação na API
javascript
// MusicKitService.getArtistAlbums() - Paginação
async getArtistAlbums(artistName, options = {}) {
    // ... find artist ...
    
    let allAlbums = []
    let offset = 0
    const limit = 100
    
    while (true) {
        const result = await this.music.api.music(
            `/v1/catalog/${this._getStorefront()}/artists/${artistId}/albums`,
            { limit, offset }  // ← Paginação
        )
        const albums = result.data?.data || []
        allAlbums.push(...albums)
        
        if (albums.length < limit) break // Acabou
        offset += limit
    }
    
    return this._mapAndClassify(allAlbums)
}
2. Adicionar Filtros na UI (HomeView)
javascript
// Novo estado
this.albumFilters = {
    types: ['album'],           // album, single, compilation
    editions: ['standard'],     // standard, remaster, deluxe, live
}
// Filtrar antes de renderizar
const filtered = apiResults.filter(album => {
    const matchesType = this.albumFilters.types.includes(album.albumType.toLowerCase())
    const matchesEdition = this.checkEditionFilter(album)
    return matchesType && matchesEdition
})
3. Agrupar Variantes (Opcional)
javascript
// AlbumVariantGrouper.group()
// "Led Zeppelin IV" → [Original, Remastered, Deluxe]
// Mostra badge com contagem de versões
❓ Perguntas para você
Paginação: Você quer que carregue TODOS os álbuns do artista (pode ser lento para artistas grandes como Beatles)?
Filtros: Quer os filtros visíveis sempre ou como dropdown/expandível?
Agrupamento: Quer que agrupe variantes (com popup) ou prefere ver todas separadas e filtrar manualmente?
O que você prefere?

