/**
 * SafeDOM - Safe DOM Construction Utility
 * 
 * Sprint 15 - Phase 3: SafeRender Foundation
 * 
 * Purpose: Provides a fluent API for creating DOM elements without innerHTML,
 * eliminating XSS vectors while maintaining developer ergonomics.
 * 
 * Usage:
 *   import { SafeDOM } from '../utils/SafeDOM.js';
 *   
 *   const card = SafeDOM.div({ className: 'card' }, [
 *     SafeDOM.div({ className: 'title' }, 'Album Name'),
 *     SafeDOM.img({ src: albumArt, alt: 'Cover' })
 *   ]);
 * 
 * @module SafeDOM
 */

export const SafeDOM = {
    /**
     * Primary factory method - creates a DOM element with props and children
     * 
     * @param {string} tag - HTML tag name (e.g., 'div', 'span', 'button')
     * @param {Object} [props={}] - Element properties
     * @param {string} [props.className] - CSS classes
     * @param {Object} [props.style] - Inline styles object
     * @param {Object} [props.dataset] - Data attributes (data-*)
     * @param {Function} [props.onClick] - Event handlers (on* pattern)
     * @param {string|number|Node|Array} [children] - Child content
     * @returns {HTMLElement} The created DOM element
     */
    create(tag, props = {}, children = null) {
        // Standard HTML creation
        return this._createWithFactory(tag, props, children, (t) => document.createElement(t));
    },

    /**
     * Create Namespaced Element (e.g. SVG)
     * @param {string} namespace - URI (e.g., 'http://www.w3.org/2000/svg')
     * @param {string} tag 
     * @param {Object} props 
     * @param {*} children 
     */
    createNS(namespace, tag, props = {}, children = null) {
        return this._createWithFactory(tag, props, children, (t) => document.createElementNS(namespace, t));
    },

    /**
     * Internal factory to share logic between standard and namespaced creation
     * @private
     */
    _createWithFactory(tag, props, children, factoryFn) {
        const el = factoryFn(tag);

        // Process props
        if (props && typeof props === 'object') {
            Object.entries(props).forEach(([key, val]) => {
                if (val === null || val === undefined) return;

                if (key === 'className') {
                    // SVG uses classList or setAttribute('class', ...) - className property behaves differently on SVGElement
                    if (el instanceof SVGElement) {
                        el.setAttribute('class', val);
                    } else {
                        el.className = val;
                    }
                } else if (key === 'style' && typeof val === 'object') {
                    Object.assign(el.style, val);
                } else if (key === 'dataset' && typeof val === 'object') {
                    Object.entries(val).forEach(([dataKey, dataVal]) => {
                        if (dataVal !== null && dataVal !== undefined) {
                            el.dataset[dataKey] = dataVal;
                        }
                    });
                } else if (key.startsWith('on') && typeof val === 'function') {
                    const eventName = key.substring(2).toLowerCase();
                    el.addEventListener(eventName, val);
                } else if (key === 'htmlFor') {
                    el.setAttribute('for', val);
                } else if (typeof val === 'boolean') {
                    if (val) el.setAttribute(key, '');
                } else {
                    el.setAttribute(key, String(val));
                }
            });
        }

        // Process children
        if (children !== null && children !== undefined) {
            this._appendChildren(el, children);
        }

        return el;
    },

    /**
     * Internal method to safely append children
     * @private
     */
    _appendChildren(parent, children) {
        const kids = Array.isArray(children) ? children : [children];

        kids.forEach(child => {
            if (child === null || child === undefined) return;

            if (typeof child === 'string' || typeof child === 'number') {
                // Safe text node - no HTML parsing, immune to XSS
                parent.appendChild(document.createTextNode(String(child)));
            } else if (child instanceof Node) {
                parent.appendChild(child);
            } else if (Array.isArray(child)) {
                // Nested arrays (from .map() calls)
                this._appendChildren(parent, child);
            }
        });
    },

    // ============================================================
    // Convenience Methods (Common Tags)
    // ============================================================

    div(props, children) { return this.create('div', props, children); },
    span(props, children) { return this.create('span', props, children); },
    p(props, children) { return this.create('p', props, children); },
    strong(props, children) { return this.create('strong', props, children); },
    em(props, children) { return this.create('em', props, children); },
    small(props, children) { return this.create('small', props, children); },

    button(props, children) { return this.create('button', { type: 'button', ...props }, children); },
    a(props, children) { return this.create('a', props, children); },

    img(props) { return this.create('img', props); },

    h1(props, children) { return this.create('h1', props, children); },
    h2(props, children) { return this.create('h2', props, children); },
    h3(props, children) { return this.create('h3', props, children); },
    h4(props, children) { return this.create('h4', props, children); },

    ul(props, children) { return this.create('ul', props, children); },
    li(props, children) { return this.create('li', props, children); },

    // Semantic Sectioning
    aside(props, children) { return this.create('aside', props, children); },
    header(props, children) { return this.create('header', props, children); },
    footer(props, children) { return this.create('footer', props, children); },
    section(props, children) { return this.create('section', props, children); },
    nav(props, children) { return this.create('nav', props, children); },
    article(props, children) { return this.create('article', props, children); },
    main(props, children) { return this.create('main', props, children); },

    input(props) { return this.create('input', props); },
    label(props, children) { return this.create('label', props, children); },
    textarea(props, children) { return this.create('textarea', props, children); },
    select(props, children) { return this.create('select', props, children); },
    option(props, children) { return this.create('option', props, children); },

    table(props, children) { return this.create('table', props, children); },
    thead(props, children) { return this.create('thead', props, children); },
    tbody(props, children) { return this.create('tbody', props, children); },
    tr(props, children) { return this.create('tr', props, children); },
    th(props, children) { return this.create('th', props, children); },
    td(props, children) { return this.create('td', props, children); },

    // SVG Support
    svg(props, children) { return this.createNS('http://www.w3.org/2000/svg', 'svg', props, children); },
    path(props, children) { return this.createNS('http://www.w3.org/2000/svg', 'path', props, children); },
    circle(props, children) { return this.createNS('http://www.w3.org/2000/svg', 'circle', props, children); },
    rect(props, children) { return this.createNS('http://www.w3.org/2000/svg', 'rect', props, children); },
    polyline(props, children) { return this.createNS('http://www.w3.org/2000/svg', 'polyline', props, children); },
    line(props, children) { return this.createNS('http://www.w3.org/2000/svg', 'line', props, children); },

    // ============================================================
    // Utility Methods
    // ============================================================

    /**
     * Creates a DocumentFragment for efficient batch appending
     * @param {Array<Node>} children - Nodes to add to fragment
     * @returns {DocumentFragment}
     */
    fragment(children = []) {
        const frag = document.createDocumentFragment();
        this._appendChildren(frag, children);
        return frag;
    },

    /**
     * Safely clears all children from an element
     * @param {HTMLElement} el - Element to clear
     */
    clear(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    },

    /**
     * Replaces all content of an element with new children
     * @param {HTMLElement} el - Target element
     * @param {string|number|Node|Array} children - New content
     */
    replaceChildren(el, children) {
        this.clear(el);
        if (children !== null && children !== undefined) {
            this._appendChildren(el, children);
        }
    },

    /**
     * Creates a text node (explicit alternative to inline strings)
     * @param {string|number} text - Text content
     * @returns {Text}
     */
    text(text) {
        return document.createTextNode(String(text ?? ''));
    },

    /**
     * Parses an HTML string and returns a DocumentFragment containing the nodes.
     * USE WITH CAUTION: Only use with trusted HTML (e.g., SVG icons).
     * @param {string} html - HTML string to parse
     * @returns {DocumentFragment}
     */
    fromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html ? String(html).trim() : '';
        return template.content;
    }
};

// Default export for convenience
export default SafeDOM;
