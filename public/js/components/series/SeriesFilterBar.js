/**
 * SeriesFilterBar.js
 * 
 * Handles Search Input and Sorting Options.
 * Emits events to the Controller via callbacks.
 */
import Component from '../base/Component.js';

export default class SeriesFilterBar extends Component {
    /**
     * @param {Object} props
     * @param {Function} props.onSearch - (query) => void
     * @param {Function} props.onSort - (sortType) => void
     */
    constructor(props) {
        super(props);
    }

    render() {
        this.container.innerHTML = `
            <div class="space-y-6">
                <!-- Search -->
                <div class="relative group">
                    <i class="fas fa-search absolute left-3 top-3 text-gray-500 group-focus-within:text-green-500 transition-colors"></i>
                    <input type="text" 
                        id="series-search-input"
                        placeholder="Search albums, artists..." 
                        class="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium text-sm text-gray-200 placeholder-gray-600"
                    />
                </div>

                <!-- Sort & Filter Groups -->
                <div class="space-y-4">
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Sort By</label>
                        <select id="series-sort-select" class="bg-gray-800 border-none rounded-lg text-sm py-2 px-3 text-gray-300 focus:ring-2 focus:ring-green-500 cursor-pointer hover:bg-gray-700 transition-colors">
                            <option value="custom">Custom Order</option>
                            <option value="date-added">Date Added</option>
                            <option value="rating">Rating (BEA)</option>
                            <option value="popularity">Popularity</option>
                            <option value="release-date">Release Date</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    onMount() {
        // Bind Events
        const searchInput = this.container.querySelector('#series-search-input');
        const sortSelect = this.container.querySelector('#series-sort-select');

        if (searchInput && this.props.onSearch) {
            searchInput.addEventListener('input', (e) => {
                this.props.onSearch(e.target.value);
            });
        }

        if (sortSelect && this.props.onSort) {
            sortSelect.addEventListener('change', (e) => {
                this.props.onSort(e.target.value);
            });
        }
    }
}
