import { escapeHtml } from '../../utils/stringUtils.js';
import { getIcon } from '../../components/Icons.js';
import { SafeDOM } from '../../utils/SafeDOM.js';

export class StagingAreaRenderer {
    constructor(container) {
        this.container = container;
    }

    render(selectedAlbums) {
        if (!this.container) return;

        SafeDOM.clear(this.container);

        if (!selectedAlbums || selectedAlbums.length === 0) {
            this.container.appendChild(SafeDOM.div({ className: 'text-center text-xs text-gray-500 py-8' }, 'No albums selected yet.'));
            return;
        }

        const fragment = SafeDOM.fragment(
            selectedAlbums.map(album => this.createAlbumItem(album))
        );
        this.container.appendChild(fragment);
    }

    createAlbumItem(album) {
        // Image
        let image;
        if (album.artworkTemplate || album.coverUrl) {
            const src = (album.artworkTemplate || album.coverUrl).replace('{w}', '100').replace('{h}', '100');
            image = SafeDOM.img({ src, className: 'w-full h-full object-cover', alt: 'art' });
        } else {
            image = SafeDOM.div({ className: 'w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] text-gray-500' }, '?');
        }

        const imgContainer = SafeDOM.div({ className: 'w-10 h-10 rounded overflow-hidden bg-gray-800 shrink-0 relative' }, [image]);

        // Text
        const textInfo = SafeDOM.div({ className: 'flex-1 min-w-0' }, [
            SafeDOM.h4({ className: 'text-sm font-bold text-white truncate', title: album.title }, album.title),
            SafeDOM.p({ className: 'text-[10px] text-gray-400 truncate' }, album.artist)
        ]);

        // Remove Button
        const removeBtn = SafeDOM.button({
            className: 'text-white bg-red-500/30 hover:bg-red-500 p-2 rounded-lg transition-all shrink-0 flex items-center justify-center',
            dataset: { action: 'remove-album', id: album.id },
            title: 'Remove album'
        });
        removeBtn.appendChild(SafeDOM.fromHTML(getIcon('X', 'w-5 h-5 pointer-events-none')));

        // Item Container
        return SafeDOM.div({
            className: 'group flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-transparent hover:border-white/10 transition-all cursor-grab active:cursor-grabbing mb-2'
        }, [imgContainer, textInfo, removeBtn]);
    }
}
