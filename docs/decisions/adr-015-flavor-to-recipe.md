# ADR 15: "Flavor" to "Recipe" Terminology Shift

> **Status**: APPROVED
> **Date**: 2026-01-10
> **Sprint**: 17.9

## Context
The application originally used the metaphor "Flavor" to describe algorithmic strategies for playlist generation (e.g., "Top N Popular", "Balanced Cascade").
User feedback and product vision refinement identified that "Flavor" was inconsistent with the broader "Blending Menu" metaphor, which uses terms like "Ingredients" (parameters) and "Blend" (action).
"Flavor" implies a static characteristic, whereas the algorithms are sets of instructions or methods.

## Decision
We have renamed the concept of "Flavor" to **"Recipe"** globally.
- **Old Term**: Flavor
- **New Term**: Recipe
- **Justification**: "Recipe" aligns better with:
    - **Blending Menu**: You select a Recipe, configure Ingredients, and Blend.
    - **Function**: Algorithms are procedural instructions (recipes for a playlist).
    - **User Model**: "Choose your Recipe" suggests a curated method, which fits the "Chef/Curator" persona of the app.
- **Code Impact**:
    - `BlendFlavorCard` -> `BlendRecipeCard`
    - `ALGORITHM_INGREDIENTS` -> `ALGORITHM_RECIPES`
    - `selectedFlavor` -> `selectedRecipe`

## Consequences
- **Positive**: Coherent UX metaphor ("Recipe" + "Ingredients" + "Blend").
- **Negative**: Legacy code references or muscle memory for "Flavor" may persist briefly (mitigated by global find-and-replace).
- **Compliance**: All future algorithm additions must use the "Recipe" nomenclature.
