# Specification: Flavor to Recipe Renaming

> **Status**: [IMPLEMENTED]
> **Sprint**: 17.9
> **Date**: 2026-01-08
**Feature ID**: FEAT-RECIPE-REBRAND

## 1. Goal (The What)
Rename the core concept of "Flavor" (Algorithm Strategy) to "Recipe" across the entire application stack:
1.  **Code**: Variable names, function names, class names, file names.
2.  **UI**: User-facing labels, tooltips, and iconography contexts.
3.  **Documentation**: Technical guides and comments.

## 2. Context (The Why)
The "Flavor" metaphor was part of the initial "Album Blender" branding. However, "Recipe" is a stronger, more accurate metaphor for the "Menu" experience:
*   **Recipe**: imply a specific set of instructions and ingredients.
*   **Metaphor Alignment**: Users "Pick a Recipe" (Balanced Cascade, Top 3) and then "Configure Ingredients" (Duration, Ranking Source), which feels more natural than "picking a flavor".
*   **Future Proofing**: Supports the vision of "Collaborative Series Sharing" where users might share their "Recipes".

## 3. Scope of Changes

### 3.1 Terminology Mapping
| Old Term | New Term | Context |
| :--- | :--- | :--- |
| **Flavor** | **Recipe** | General Concept |
| `BlendFlavorCard` | `BlendRecipeCard` | Component Name |
| `ALGORITHM_FLAVORS` | `ALGORITHM_RECIPES` | Config Constant |
| `flavorId` | `recipeId` | Variable Name |
| "Choose your Flavor" | "Choose your Recipe" | UI Label |

### 3.2 Impact Analysis

#### Frontend (High Impact)
*   **Components**: `BlendFlavorCard.js` -> `BlendRecipeCard.js`
*   **Views**: `BlendingMenuView.js` (Major UI rework)
*   **Constants**: `algorithms.js` or `constants.js`
*   **CSS**: Classes like `.flavor-card`, `.flavor-ICON`

#### Backend (Low Impact)
*   Review if "flavor" is passed as an API parameter. (Likely frontend-only concept, but need verification).

#### Documentation
*   `MJRP_Album_Blender_Prod_Vision.md`
*   `15_Frontend_Components_Blend_Wizard.md`

## 4. Success Criteria
1.  **Zero "Flavor"**: Searching for "Flavor" (case-insensitive) in `public/src` returns 0 results (excluding deprecated/legacy comments explicitly marked).
2.  **UI Integrity**: The Blending Menu loads, renders "Recipe Cards", and generates playlists correctly.
3.  **No Regression**: Existing functionality (generating playlists) works exactly as before.

## 5. Risks
*   **Refactoring Bugs**: Missed variable renames could break the "Wizard" state machine.
*   **CSS Breakage**: Renaming CSS classes might break specific layout overrides.

## 6. User Verification
*   User can navigate to the Blending Menu and see "Recipe" terminology.
*   User can generate a playlist using a "Recipe".
