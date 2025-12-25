# Specification: CRIT-2 Remove innerHTML Vulnerabilities

## 1. Problem Description
The codebase currently uses `innerHTML` in approximately 49 instances across `*Card.js` and `*View.js` files.
Using `innerHTML` with unsanitized data (e.g., user-provided playlist names, track titles) exposes the application to **Cross-Site Scripting (XSS)** attacks.
Additionally, it negatively impacts performance due to browser re-parsing and layout thrashing.

## 2. Goal
Eliminate all instances of `innerHTML` assignment where user input is involved, replacing them with safer alternatives.

## 3. Scope
- **Files**: All files in `public/js/views/` and `public/js/components/`.
- **Method**: Systematic replacement.
- **Exceptions**: If `innerHTML` is strictly necessary (e.g., for rich text rendering), it must be sanitized using `DOMPurify` (though `textContent` is preferred).

## 4. Success Criteria
1.  **Security**: Zero instances of `innerHTML` being assigned valid user-controlled strings without sanitization.
2.  **Functionality**: UI rendering remains textually identical (no breaking of bold tags if they were intended, but usually they shouldn't be in user input).
3.  **Performance**: Slight improvement in rendering performance.

## 5. Implementation Strategy (High Level)
- Use `textContent` for plain text.
- Use `kebab-case` component construction or `document.createElement` if complex HTML structure is needed (or the existing string template literal approach *if* properly escaped, but `innerHTML` itself is the setter to avoid).
- **Note**: Since we use template literals for rendering components (String-based rendering), we rely on `innerHTML` for the initial mount.
    - *Correction*: The issue is likely updating specific elements via `el.innerHTML = ...` or rendering user input inside the template strings without escaping.
    - **Refinement**: The fix often involves using an `escapeHtml` utility function for all variable interpolations in template strings.

## 6. User Review Required
- **Escaping Strategy**: Are you okay with strictly escaping all HTML entities in user content? This (e.g. `<b>bold</b>`) will render as literal text, not bold. (This is desired for security).
