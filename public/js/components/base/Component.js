/**
 * @abstract
 * Base Component Class
 * All UI components in V3 must extend this class.
 * Enforces a standard lifecycle: mount -> update -> unmount.
 */
export default class Component {
    constructor({ container, props = {} }) {
        if (!container) throw new Error("Component requires a container element.");
        this.container = container;
        this.props = props;
        this.elements = {}; // To store references to DOM elements
    }

    /**
     * Renders the component into the container.
     * @param {Object} [newProps] - Optional new props to merge before mounting.
     */
    mount(newProps = {}) {
        this.props = { ...this.props, ...newProps };
        this.render();
        this.onMount();
    }

    /**
     * Updates the component with new data.
     * @param {Object} newProps 
     */
    update(newProps) {
        this.props = { ...this.props, ...newProps };
        this.render(); // Re-render by default, override for optimization
        this.onUpdate();
    }

    /**
     * Cleans up the component (events, DOM).
     */
    unmount() {
        this.onUnmount();
        // SafeDOM.clear logic inlined to avoid dependency if desired, 
        // but importing SafeDOM is better for consistency.
        // However, adding an import to the base class effectively adds it everywhere.
        // Let's stick to raw DOM manipulation for the base class to keep it lightweight 
        // OR import SafeDOM. Given the project direction, SafeDOM is standard.
        // But to avoid circular deps or heavy imports in base, I'll inline the clear loop.
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.elements = {};
    }

    /**
     * @abstract
     * Implementation required. Should generate HTML and attach to this.container.
     */
    render() {
        throw new Error("Component.render() must be implemented.");
    }

    // Lifecycle Loops (Optional Override)
    onMount() { }
    onUpdate() { }
    onUnmount() { }
}
