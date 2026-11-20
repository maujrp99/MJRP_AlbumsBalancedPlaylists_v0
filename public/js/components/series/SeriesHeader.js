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
     * @param {string} [props.counts] - the line under the title: how many series and albums (F72)
     * @param {Function} props.onGeneratePlaylists - Callback for Generate Playlists click
     */
    constructor(props) {
        super(props);
    }

    render() {
        const { metadata, pageTitle: propTitle, onGeneratePlaylists, counts } = this.props;
        const title = propTitle || metadata?.title || 'All Albums Series';

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
        // Title and, under it, how many series and albums the screen holds (F72)
        const titleBlock = SafeDOM.div({ className: 'flex flex-col gap-1' }, [h1]);
        if (counts) {
            titleBlock.appendChild(SafeDOM.p({ className: 'text-sm text-white/60', 'data-series-counts': '' }, counts));
        }
        titleRow.appendChild(titleBlock);

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
