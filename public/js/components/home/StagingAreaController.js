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
        // Sync state with DOM order
        const reordered = [];
        const items = this.home.view.$$('#stagingStackContainer > div'); // Assuming div items
        // Or better, use evt.oldIndex/newIndex but simpler to read DOM data-ids if we added them?
        // We didn't add data-id to the row wrapper in renderer, we added it to the button.
        // Let's add data-id to the row wrapper in Renderer first to make this robust.

        // Actually, let's rely on array splice for now which matches Sortable's index change
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
