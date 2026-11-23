// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// A small DOM for the editor's way back (`fromEditor`), with no browser and no package: it reads the HTML the editor itself
// writes (`toEditorHtml`) into nodes with the few members `fromEditor` reads — nodeType, nodeValue, tagName, childNodes,
// children, textContent, getAttribute, hasAttribute, classList. Not an HTML parser for anything else.
const VOID = new Set(['br', 'img', 'hr', 'input', 'source']);
const decode = (text) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

class Text {
    constructor(value) { this.nodeType = 3; this.nodeValue = value; this.childNodes = []; }
    get textContent() { return this.nodeValue; }
}

class Element {
    constructor(tag, attributes) {
        this.nodeType = 1;
        this.tagName = tag.toUpperCase();
        this.attributes = attributes;
        this.childNodes = [];
        const classes = (attributes.class ?? '').split(/\s+/).filter(Boolean);
        this.classList = { contains: (name) => classes.includes(name) };
    }
    get children() { return this.childNodes.filter((node) => node.nodeType === 1); }
    get textContent() { return this.childNodes.map((node) => node.textContent).join(''); }
    getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; }
    hasAttribute(name) { return name in this.attributes; }
}

/** The root element (a `div`) holding the HTML. */
export function parseHtml(html) {
    const root = new Element('div', {});
    const stack = [root];
    const pattern = /<\/([a-zA-Z0-9]+)\s*>|<([a-zA-Z0-9]+)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*\/?>|([^<]+)/g;
    for (const [, close, open, attrs, text] of html.matchAll(pattern)) {
        const top = stack[stack.length - 1];
        if (text !== undefined) top.childNodes.push(new Text(decode(text)));
        else if (close) { if (stack.length > 1) stack.pop(); }
        else {
            const attributes = Object.fromEntries([...(attrs ?? '').matchAll(/([^\s=>/]+)(?:="([^"]*)")?/g)].map(([, name, value]) => [name, decode(value ?? '')]));
            const element = new Element(open, attributes);
            top.childNodes.push(element);
            if (!VOID.has(open.toLowerCase())) stack.push(element);
        }
    }
    return root;
}
