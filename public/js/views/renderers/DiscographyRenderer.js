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
        const img = SafeDOM.img({ src: coverUrl, className: 'w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300', alt: title, loading: 'lazy' });
        const imgContainer = SafeDOM.div({ className: 'absolute inset-0 bg-gray-800/50' }, [img]);
        const gradient = SafeDOM.div({ className: 'absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity' });

        // Badge Container
        const badgeContainer = SafeDOM.div({ className: 'absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%] pointer-events-none' }, badgeElements);

        // Plus Icon (Top Right)
        const plusIcon = SafeDOM.div({ className: 'absolute top-2 right-2 bg-black/40 group-hover:bg-orange-500 text-white p-1.5 rounded-full transition-all pointer-events-none' });
        plusIcon.appendChild(SafeDOM.fromHTML(getIcon('Plus', 'w-4 h-4')));

        // Text Content
        const textContent = SafeDOM.div({ className: 'absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/80 to-transparent pointer-events-none' }, [
            SafeDOM.h3({ className: 'text-white font-bold text-sm leading-tight', title: title }, title),
            SafeDOM.p({ className: 'text-gray-400 text-xs truncate' }, year)
        ]);

        return SafeDOM.div({
            className: 'group relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer transition-all bg-white/5',
            dataset: { action: 'toggle-staging', id: album.id }
        }, [
            imgContainer,
            gradient,
            badgeContainer,
            plusIcon,
            textContent
        ]);
    }
}
