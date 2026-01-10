# Implementation Plan: Flavor -> Recipe Renaming

**Goal**: Complete refactoring of "Flavor" to "Recipe" across Code, UI, and Documentation.
**Sprint**: 17.9
**Reference**: [Spec](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/technical/specs/sprint17.9-flavor-to-recipe/spec.md)

## User Review Required
> [!IMPORTANT]
> The term "Flavor" will be completely eradicated. This breaks backward compatibility for any stored configs that use the key `flavorId` (migration logic included).

## Terminology Map (The "Cheat Sheet")

### 1. Component Renaming
| Current File | New File | Class Name |
| :--- | :--- | :--- |
| `components/blend/BlendFlavorCard.js` | `components/blend/BlendRecipeCard.js` | `BlendRecipeCard` |
| `components/blend/BlendIngredientsPanel.js` | *No Rename* | `BlendIngredientsPanel` (Updates `setFlavor` -> `setRecipe`) |

### 2. View & Logic Updates
| File | Old Construct | New Construct |
| :--- | :--- | :--- |
| `views/BlendingMenuView.js` | `this.selectedFlavor` | `this.selectedRecipe` |
| | "Choose Your Flavor" (UI) | "Choose Your Recipe" (UI) |
| | `.flavor-card` (CSS) | `.recipe-card` (CSS) |
| `components/blend/*.js` | `ALGORITHM_INGREDIENTS` | `ALGORITHM_RECIPES` |
| `components/playlists/RegeneratePanel.js` | `flavor-container` | `recipe-container` |
| `algorithms/index.js` | `getRecommendedAlgorithm` | *No change* |

### 3. Variable Remapping
| Scope | Old Variable | New Variable |
| :--- | :--- | :--- |
| `BlendingMenuView` | `flavorId` | `recipeId` |
| `BlendIngredientsPanel` | `selectedFlavor` | `selectedRecipe` |
| `RegeneratePanel` | `flavorCard` | `recipeCard` |
| Global Constants | `ALGORITHM_FLAVORS` | `ALGORITHM_RECIPES` |

## Proposed Changes

### Frontend Components

#### [MODIFY] [BlendingMenuView.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/BlendingMenuView.js)
- Update Stepper labels: "Flavor" -> "Recipe".
- Update UI Headers: "Choose Your Flavor" -> "Choose Your Recipe".
- Rename `this.selectedFlavor` -> `this.selectedRecipe`.
- Change `BlendFlavorCard` import to `BlendRecipeCard`.

#### [DELETE] [BlendFlavorCard.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/blend/BlendFlavorCard.js)
#### [NEW] [BlendRecipeCard.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/blend/BlendRecipeCard.js)
- Clone `BlendFlavorCard.js` content.
- Rename class `BlendFlavorCard` -> `BlendRecipeCard`.
- Update events: `onFlavorSelect` -> `onRecipeSelect`.

#### [MODIFY] [BlendIngredientsPanel.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/blend/BlendIngredientsPanel.js)
- Rename `ALGORITHM_INGREDIENTS` -> `ALGORITHM_RECIPES`.
- Rename method `setFlavor(flavor)` -> `setRecipe(recipe)`.
- Update prop `selectedFlavor` -> `selectedRecipe`.

#### [MODIFY] [RegeneratePanel.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/playlists/RegeneratePanel.js)
- Switch import to `BlendRecipeCard`.
- Rename DOM ID `regenerate-flavor-container` -> `regenerate-recipe-container`.

### Documentation

#### [MODIFY] [MJRP_Album_Blender_Prod_Vision.md](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/MJRP_Album_Blender_Prod_Vision.md)
- Replace "Flavor" concept with "Recipe".

#### [MODIFY] [15_Frontend_Components_Blend_Wizard.md](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/manual/15_Frontend_Components_Blend_Wizard.md)
- Update component documentation to reflect renames.

## Verification Plan

### Automated Tests
*   `npm test` (Unit tests likely fail due to missing `BlendFlavorCard`).
*   **Action**: Update any unit tests referencing `BlendFlavorCard` to `BlendRecipeCard` (if they exist).

### Manual Verification
1.  **Load App**: Open `localhost`.
2.  **Navigate**: Go to "Blending Menu" (Home -> Series -> Blend).
3.  **Visual Check**:
    *   Verify Step 2 says "Choose Your Recipe".
    *   Verify cards render correctly.
4.  **Action**: Select a Recipe (e.g., "Top 3").
    *   Verify Ingredients Panel unlocks.
5.  **Generate**: Click "Blend It!".
    *   Verify playlist is generated successfully.
