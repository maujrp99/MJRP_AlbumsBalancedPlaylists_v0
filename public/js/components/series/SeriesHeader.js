/**
 * SeriesHeader.js
 * 
 * Component: Page header with Breadcrumbs, Title, and Generate Playlists button
 * Migrated from AlbumsView header section
 */
import Component from '../base/Component.js';
import { getIcon } from '../Icons.js';
import { Breadcrumb } from '../Breadcrumb.js';

export default class SeriesHeader extends Component {
    /**
     * @param {Object} props
     * @param {Object} props.metadata - { title, description, albumCount, canGenerate }
     * @param {Function} props.onGeneratePlaylists - Callback for Generate Playlists click
     */
    constructor(props) {
        super(props);
    }

    render() {
        const { metadata, pageTitle: propTitle, albumCount: propCount, onGeneratePlaylists } = this.props;
        const title = propTitle || metadata?.title || 'All Albums Series';
        const albumCount = propCount ?? metadata?.albumCount ?? 0;
        const canGenerate = albumCount > 0;

        this.container.innerHTML = `
            <div class="view-header mb-8 fade-in">
                ${Breadcrumb.render('/albums')}

                <!-- Title Row -->
                <div class="header-title-row mb-6 flex justify-between items-center">
                    <h1 class="text-4xl font-bold flex items-center gap-3">
                        ${getIcon('Disc', 'w-8 h-8 text-accent-primary')}
                        ${this.escapeHtml(title)}
                    </h1>

                    <button
                        id="generatePlaylistsBtn"
                        class="tech-btn-primary px-8 py-3 text-base rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform"
                        ${!canGenerate ? 'disabled' : ''}
                    >
                        ${getIcon('Play', 'w-5 h-5')}
                        Generate Playlists
                    </button>
                </div>
            </div>
        `;

        // Bind generate button
        const btn = this.container.querySelector('#generatePlaylistsBtn');
        if (btn && onGeneratePlaylists) {
            btn.addEventListener('click', onGeneratePlaylists);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
