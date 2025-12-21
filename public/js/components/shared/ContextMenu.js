/**
 * ContextMenu.js
 * 
 * Floating menu for "Three-dot" actions.
 * Singleton-ish behavior: Only one should be open at a time.
 */
import Component from '../base/Component.js';

export default class ContextMenu extends Component {
    /**
     * @param {Object} props
     * @param {Array<{label, icon, action, danger}>} props.actions
     * @param {number} props.x - ClientX
     * @param {number} props.y - ClientY
     * @param {Function} props.onClose - Callback when closed
     */
    constructor(props) {
        super(props);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    // Override mount to attach global listeners
    onMount() {
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutside);
        }, 0); // Defer to avoid immediate close from the trigger click
    }

    onUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    }

    handleClickOutside(e) {
        if (!this.container.contains(e.target)) {
            this.props.onClose?.();
        }
    }

    render() {
        const { actions = [], x = 0, y = 0 } = this.props;

        const itemsHTML = actions.map(item => `
            <button 
                class="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors ${item.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-200'}"
                data-action="${item.id}"
            >
                <i class="${item.icon || 'fas fa-circle'} w-4 text-center"></i>
                ${item.label}
            </button>
        `).join('');

        // Prevent menu from going off-screen (basic check)
        const style = `top: ${y}px; left: ${x}px; min-width: 160px; z-index: 50; position: fixed;`;

        this.container.innerHTML = `
            <div style="${style}" class="bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-fade-in">
                ${itemsHTML}
            </div>
        `;

        // Bind clicks
        this.container.querySelectorAll('button').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const action = actions[index].action;
                if (action) action();
                this.props.onClose?.();
            });
        });
    }
}
