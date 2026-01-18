/**
 * SeriesHeader.js
 * 
 * Component: Page header with Breadcrumbs, Title, and Generate Playlists button
 * Migrated from AlbumsView header section
 */
import Component from '../base/Component.js';
import { getIcon } from '../Icons.js';
import { Breadcrumb } from '../Breadcrumb.js';
import { SafeDOM } from '../../utils/SafeDOM.js';

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

        // Clear container
        SafeDOM.clear(this.container);

        const headerContainer = SafeDOM.div({ className: 'view-header mb-8 fade-in' });

        // Breadcrumb (Legacy String -> DOM)
        const breadcrumbNode = SafeDOM.fromHTML(Breadcrumb.render('/albums'));
        headerContainer.appendChild(breadcrumbNode);

        // Title Row
        const titleRow = SafeDOM.div({ className: 'header-title-row mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4' });

        // H1 Title
        const h1 = SafeDOM.h1({ className: 'text-2xl md:text-4xl font-bold flex items-center gap-3' }, [
            SafeDOM.fromHTML(getIcon('Disc', 'w-8 h-8 text-accent-primary')),
            title // SafeDOM text content (auto-escaped)
        ]);
        titleRow.appendChild(h1);

        // Generate Button
        const btn = SafeDOM.button({
            id: 'generatePlaylistsBtn',
            className: `tech-btn-primary w-full md:w-auto justify-center px-8 py-3 text-base rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform mt-4 md:mt-0`,
            onclick: (e) => {
                console.log('[SeriesHeader] Blend button clicked.');
                onGeneratePlaylists(e);
            }
        }, [
            SafeDOM.fromHTML(getIcon('Sliders', 'w-5 h-5')),
            'Blend your Albums'
        ]);
        titleRow.appendChild(btn);

        headerContainer.appendChild(titleRow);

        // Mount
        this.container.appendChild(headerContainer);
    }
}
