# Specification: ARCH-3 Implement BaseCard Component

## 1. Problem Description
The application uses multiple "Card" components (`PlaylistCard`, `BatchGroupCard`, `BlendFlavorCard`) which duplicate common logic:
- Basic container styling (Glassmorphism, borders).
- Hover effects.
- Icon rendering.
- Basic interactions.

This leads to visual inconsistencies and code duplication (Low Reuse: 5%).

## 2. Goal
Create a `BaseCard` component that encapsulates the shared structure and styling of all cards in the application. Refactor existing cards to extend or compose `BaseCard`.

## 3. Scope
- **New Component**: `public/js/components/base/BaseCard.js`
- **Refactor Targets**:
    - `BatchGroupCard.js`
    - `BlendFlavorCard.js`
    - `PlaylistCard.js` (if exists or its equivalent)

## 4. Success Criteria
1.  **Reuse**: `BaseCard` is used by at least 2 distinct card implementations.
2.  **Consistency**: All cards share the exact same base padding, border-radius, and hover behaviors.
3.  **Code Reduction**: Reduced boilerplate in individual card files.

## 5. Constraints
- Must support `HTMLElement` or String-based rendering (depending on current architecture).
    - *Note*: Current App seems to use String-Template rendering (`static render()`). `BaseCard` should likely provide a static `renderContainer(innerHtml, options)` helper.

## 6. User Review Required
- **Design Pattern**: Composition vs Inheritance. Recommendation: Composition (Helper function) since we use String Templates. `BaseCard.render({ header, body, footer, classes })`.
