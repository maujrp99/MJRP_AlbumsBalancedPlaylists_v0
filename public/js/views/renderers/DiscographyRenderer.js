import { escapeHtml } from '../../utils/stringUtils.js';
import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../../components/Icons.js';

export class DiscographyRenderer {
    constructor(container) {
        this.container = container; // The grid container element
    }

    render(albums) {
        if (!this.container) return;

        SafeDOM.clear(this.container);

        if (!albums || albums.length === 0) {
            this.container.appendChild(SafeDOM.div({ className: 'col-span-full text-center text-gray-500 py-10' }, 'No albums found.'));
            return;
        }

        const fragment = SafeDOM.fragment(
            albums.map(album => this.createAlbumCard(album))
        );
        this.container.appendChild(fragment);
    }

    createAlbumCard(album) {
        const title = album.title;
        const artist = album.artist;
        const year = album.year || 'Unknown';
        const coverUrl = album.coverUrl ? album.coverUrl.replace('{w}', '300').replace('{h}', '300') : '/assets/images/cover_placeholder.png';

        // Badge Logic
        const badges = [];
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('deluxe')) badges.push('Deluxe');
        if (lowerTitle.includes('remaster')) badges.push('Remaster');
        if (lowerTitle.includes('live') || album.isLive) badges.push('Live');
        if (album.isSingle) badges.push('Single');
        if (album.isCompilation) badges.push('Comp');

        const badgeElements = badges.map(b =>
            SafeDOM.span({ className: 'px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider' }, b)
        );

        // Images & Overlays
        const img = SafeDOM.img({ src: coverUrl, className: 'w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300', alt: title, loading: 'lazy' });

        // Image Container (Relative parent for overlays)
        const imageWrapper = SafeDOM.div({ className: 'relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/5 group-hover:border-orange-500/50 group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all' }, [
            img,
            // Gradient Overlay (subtle)
            SafeDOM.div({ className: 'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity' }),
            // Badge Container (Top Left)
            SafeDOM.div({ className: 'absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%] pointer-events-none' }, badgeElements),
            // Plus Icon (Top Right)
            (() => {
                const icon = SafeDOM.div({ className: 'absolute top-2 right-2 bg-black/40 group-hover:bg-orange-500 text-white p-1.5 rounded-full transition-all pointer-events-none' });
                icon.appendChild(SafeDOM.fromHTML(getIcon('Plus', 'w-4 h-4')));
                return icon;
            })()
        ]);

        // Text Content (Below Image)
        const textContent = SafeDOM.div({ className: 'mt-3 pl-1' }, [
            SafeDOM.h3({ className: 'text-white font-bold text-sm leading-tight truncate group-hover:text-orange-500 transition-colors', title: title }, title),
            SafeDOM.p({ className: 'text-gray-400 text-xs truncate mt-0.5' }, year)
        ]);

        // Main Card Container (Flex Column)
        return SafeDOM.div({
            className: 'group cursor-pointer flex flex-col',
            dataset: { action: 'toggle-staging', id: album.id }
        }, [
            imageWrapper,
            textContent
        ]);
    }
}
