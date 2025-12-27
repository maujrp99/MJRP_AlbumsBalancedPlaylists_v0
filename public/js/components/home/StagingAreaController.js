export class StagingAreaController {
    constructor(homeController) {
        this.home = homeController;
        this.selectedAlbums = [];
    }

    initialize() {
        // Will bind drag/drop events here later
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

    updateView() {
        // Call Renderer
        // this.home.stagingRenderer.render(this.selectedAlbums);
        console.log('Staging Updated:', this.selectedAlbums.length);

        // Updates the "Stack Count" in UI
        const countBadge = document.getElementById('stagingCount');
        if (countBadge) countBadge.textContent = `(${this.selectedAlbums.length} Albums)`;
    }
}
