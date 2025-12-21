/**
 * SkeletonLoader.js
 * 
 * Reusable loading placeholders.
 * Variants: 'card' (Grid items), 'list' (Rows), 'text' (Headers).
 */
import Component from '../base/Component.js';

export default class SkeletonLoader extends Component {
    /**
     * @param {Object} props
     * @param {number} props.count - Number of skeletons to render
     * @param {string} props.variant - 'card' | 'list' | 'text'
     */
    constructor(props) {
        super(props);
    }

    render() {
        const { count = 1, variant = 'card' } = this.props;
        let html = '';

        for (let i = 0; i < count; i++) {
            if (variant === 'card') {
                html += `
                    <div class="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                        <div class="w-full aspect-square bg-gray-700"></div>
                        <div class="p-4 space-y-2">
                            <div class="h-4 bg-gray-700 rounded w-3/4"></div>
                            <div class="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                `;
            } else if (variant === 'list') {
                html += `
                    <div class="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg animate-pulse mb-2">
                        <div class="w-12 h-12 bg-gray-700 rounded"></div>
                        <div class="flex-1 space-y-2">
                            <div class="h-4 bg-gray-700 rounded w-1/3"></div>
                            <div class="h-3 bg-gray-700 rounded w-1/4"></div>
                        </div>
                    </div>
                `;
            }
        }

        // If wrapping is needed, the parent should handle the grid layout class.
        // Or we can return a fragment.
        this.container.innerHTML = html;
    }
}
