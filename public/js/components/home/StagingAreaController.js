import Sortable from 'sortablejs';

export class StagingAreaController {
    constructor(homeController) {
        this.home = homeController;
        this.selectedAlbums = [];
    }

    initialize() {
        // Init SortableJS
        const container = this.home.view.$('#stagingStackContainer');
        if (container) {
            this.sortable = new Sortable(container, {
                animation: 150,
                ghostClass: 'bg-white/10',
                onEnd: (evt) => this.handleReorder(evt)
            });
        }
    }

    addAlbum(album) {
        // Avoid duplicates
        if (this.selectedAlbums.find(a => a.id === album.id)) return;

        this.selectedAlbums.push(album);
        this.updateView();
    }

    removeAlbum(albumId) {
        this.selectedAlbums = this.selectedAlbums.filter(a => a.id !== albumId);
        this.updateView();
    }

    getSelectedAlbums() {
        return this.selectedAlbums;
    }

    /** @returns {boolean} whether the album of this id is already chosen */
    hasAlbum(albumId) {
        return this.selectedAlbums.some(a => String(a.id) === String(albumId));
    }

    /**
     * Move a chosen album one place up (-1) or down (+1), without dragging (F76, the phone: WCAG 2.5.7).
     * A move past either end does nothing.
     */
    moveAlbum(albumId, delta) {
        const from = this.selectedAlbums.findIndex(a => a.id === albumId);
        const to = from + delta;
        if (from < 0 || to < 0 || to >= this.selectedAlbums.length) return;
        this.handleReorder({ oldIndex: from, newIndex: to });
    }

    /** Put back an album at its place (the "Undo" of a removal on the phone). */
    insertAlbum(album, index) {
        if (this.hasAlbum(album.id)) return;
        const at = Math.max(0, Math.min(index, this.selectedAlbums.length));
        this.selectedAlbums.splice(at, 0, album);
        this.updateView();
    }

    handleReorder(evt) {
        // The same move Sortable made on screen, made in the list
        const item = this.selectedAlbums.splice(evt.oldIndex, 1)[0];
        this.selectedAlbums.splice(evt.newIndex, 0, item);

        console.log('Reordered Staging:', this.selectedAlbums.map(a => a.title));

        // Re-render to ensure indices update (1, 2, 3...)
        this.updateView();
    }

    updateView() {
        // Call Renderer
        this.home.stagingRenderer.render(this.selectedAlbums);
        console.log('Staging Updated:', this.selectedAlbums.length);

        // Updates the "Stack Count" in UI
        const countBadge = document.getElementById('stagingCount');
        if (countBadge) countBadge.textContent = `(${this.selectedAlbums.length} Albums)`;

        // The phone answers on the album tapped and in its action bar (F76; nothing on the computer)
        this.home.view.showChosen?.(this.selectedAlbums);
    }
}
