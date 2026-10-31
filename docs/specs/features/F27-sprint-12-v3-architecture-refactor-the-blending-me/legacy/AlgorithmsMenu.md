# Blending Menu - Algorithms & Ingredients Reference

**Updated**: 2025-12-23  
**Sprint**: 12 (V3 Architecture)

---

## 🍬 Available Flavors (Algorithms)

### Recommended

| ID | Name | Badge | Description |
|----|------|-------|-------------|
| `mjrp-balanced-cascade` | MJRP Balanced Cascade | ⭐ RECOMMENDED | Cria playlists balanceadas mesclando as melhores faixas de cada álbum |

### Full Experience

| ID | Name | Description |
|----|------|-------------|
| `mjrp-cascade-v0` | MJRP Cascade V0 | Variante V0 do algoritmo cascade |
| `s-draft-original` | S-Draft Original | Serpentine distribution original |
| `legacy-roundrobin` | Legacy RoundRobin | Round-robin por álbum (legado) |

### Curated Selection (Top N)

| ID | Name | Badge | Ranking Source |
|----|------|-------|----------------|
| `top-3-popular` | Crowd Favorites | TOP 3 | Spotify Popularity (locked) |
| `top-3-acclaimed` | Critics' Choice | TOP 3 | BEA Rankings (locked) |
| `top-5-popular` | Greatest Hits | TOP 5 | Spotify Popularity (locked) |
| `top-5-acclaimed` | Deep Cuts | TOP 5 | BEA Rankings (locked) |

---

## 🥗 Ingredients Matrix

### Which ingredients each algorithm supports:

| Algorithm | Duration | Output Mode | Ranking Type | Discovery Mode |
|-----------|:--------:|:-----------:|:------------:|:--------------:|
| `mjrp-balanced-cascade` | ✅ Deep Cuts | ❌ Auto | ✅ | ✅ |
| `mjrp-cascade-v0` | ✅ Deep Cuts | ❌ Auto | ✅ | ✅ |
| `s-draft-original` | ✅ | ✅ | ✅ | ✅ |
| `legacy-roundrobin` | ✅ | ❌ | ❌ | ✅ |
| `top-3-popular` | ✅ | ✅ | 🔒 Spotify | ❌ |
| `top-3-acclaimed` | ✅ | ✅ | 🔒 BEA | ❌ |
| `top-5-popular` | ✅ | ✅ | 🔒 Spotify | ❌ |
| `top-5-acclaimed` | ✅ | ✅ | 🔒 BEA | ❌ |

> **Note**: For MJRP algorithms, Duration controls the **Deep Cuts playlist duration limit** (default: 48 min). Greatest Hits are auto-split at 60 min.

---

## 📋 Ingredient Definitions

### Duration (always visible)
- **Values**: 30, 45, 50, 60, 70, 75, 80, 90, 100, 120 minutes
- **Effect**: Controls target playlist length

### Output Mode (conditional)
- **Single**: One playlist with all tracks
- **Multiple**: Split by duration limits
- **Auto**: Let algorithm decide
- **Shown for**: TopN, S-Draft

### Ranking Type (conditional)
- **Spotify Popularity**: Based on play counts (0-100 score)
- **BEA/Critics Choice**: Based on Best Ever Albums rankings
- **Combined**: Balanced mix of both
- **Shown for**: MJRP, S-Draft

### Discovery Mode (conditional)
- **Toggle**: Include tracks without ranking data
- **Use case**: Explore rare/live recordings
- **Shown for**: MJRP, S-Draft, Legacy

---

## 🔧 Implementation

```javascript
// File: public/js/components/blend/BlendIngredientsPanel.js

const ALGORITHM_INGREDIENTS = {
    'mjrp-balanced-cascade': {
        duration: true,
        outputMode: false,      // Auto-split internally
        rankingType: true,      // Spotify / BEA / Combined
        discoveryMode: true     // Include unranked
    },
    'top-3-popular': {
        duration: true,
        outputMode: true,
        rankingType: false,     // Locked: Spotify
        discoveryMode: false    // Requires ranking data
    },
    // ... etc
}
```

---

## 📁 Related Files

- [BlendIngredientsPanel.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/blend/BlendIngredientsPanel.js)
- [BlendFlavorCard.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/blend/BlendFlavorCard.js)
- [BlendingMenuView.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/BlendingMenuView.js)
- [algorithms/index.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/algorithms/index.js)
