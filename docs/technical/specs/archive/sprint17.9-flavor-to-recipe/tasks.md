# Tasks: Sprint 17.9 - Recipe Rebranding

**Feature**: Rename "Flavor" to "Recipe"
**Outcome**: Full terminology consistency across UI/Code/Docs.

## 1. Documentation Updates
- [x] Update `docs/MJRP_Album_Blender_Prod_Vision.md`: Replace "Flavor" concept with "Recipe" <!-- id: 1 -->
- [x] Update `docs/manual/15_Frontend_Components_Blend_Wizard.md`: Rename component references (`BlendFlavorCard` -> `BlendRecipeCard`) <!-- id: 2 -->
- [x] Update `docs/ROADMAP.md`: Verify Sprint 17.9 entry (Completed) <!-- id: 0 -->

## 2. Component Migration: BlendRecipeCard
- [x] Create `public/js/components/blend/BlendRecipeCard.js` (Clone of `BlendFlavorCard.js`) <!-- id: 3 -->
- [x] Refactor `BlendRecipeCard.js`: Rename class `BlendFlavorCard` -> `BlendRecipeCard` <!-- id: 4 -->
- [x] Refactor `BlendRecipeCard.js`: Rename event definition `onFlavorSelect` -> `onRecipeSelect` <!-- id: 5 -->
- [x] Refactor `BlendRecipeCard.js`: Update CSS classes (`.flavor-card` -> `.recipe-card`) <!-- id: 6 -->

## 3. Component Refactoring: BlendIngredientsPanel
- [x] Scan `public/js/components/blend/BlendIngredientsPanel.js` for "Flavor" <!-- id: 7 -->
- [x] Rename constant `ALGORITHM_INGREDIENTS` -> `ALGORITHM_RECIPES` <!-- id: 8 -->
- [x] Rename method `setFlavor(flavor)` -> `setRecipe(recipe)` <!-- id: 9 -->
- [x] Rename internal state `this.selectedFlavor` -> `this.selectedRecipe` <!-- id: 10 -->
- [x] Rename constructor arg `opts.selectedFlavor` -> `opts.selectedRecipe` <!-- id: 11 -->

## 4. View Integration: BlendingMenuView
- [x] Update Imports: Replace `BlendFlavorCard` with `BlendRecipeCard` <!-- id: 12 -->
- [x] Rename State: `this.flavorCard` -> `this.recipeCard` <!-- id: 13 -->
- [x] Rename State: `this.selectedFlavor` -> `this.selectedRecipe` <!-- id: 14 -->
- [x] Update Stepper UI: Change label "Flavor" -> "Recipe" (Step 2) <!-- id: 15 -->
- [x] Update Header UI: Change text "Choose Your Flavor" -> "Choose Your Recipe" <!-- id: 16 -->
- [x] Update Logic: `ingredientsPanel.setFlavor` -> `ingredientsPanel.setRecipe` <!-- id: 17 -->
- [x] Update Logic: `new BlendFlavorCard({...})` -> `new BlendRecipeCard({...})` <!-- id: 18 -->

## 5. View Integration: RegeneratePanel
- [x] Update Imports: Replace `BlendFlavorCard` with `BlendRecipeCard` <!-- id: 19 -->
- [x] Update DOM IDs: `regenerate-flavor-container` -> `regenerate-recipe-container` <!-- id: 20 -->
- [x] Rename Prop: `static flavorCard` -> `static recipeCard` <!-- id: 21 -->
- [x] Update Logic: `ingredientsPanel.setFlavor` -> `ingredientsPanel.setRecipe` <!-- id: 22 -->

## 6. Global Helper & Cleanup
- [x] Update `public/js/algorithms/index.js`: Update comments referencing "flavors" <!-- id: 23 -->
- [x] Delete Legacy File: `public/js/components/blend/BlendFlavorCard.js` <!-- id: 24 -->

## 7. Verification
- [x] **Build Check**: `npm run build` (Ensure no missing imports) <!-- id: 25 -->
- [x] **Manual Check**: Blending Menu Wizard Flow (Select Recipe -> Generate) <!-- id: 26 -->
- [x] **Manual Check**: Regenerate Panel (Expand -> Reconfigure -> Generate) <!-- id: 27 -->
