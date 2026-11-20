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
    }
}
