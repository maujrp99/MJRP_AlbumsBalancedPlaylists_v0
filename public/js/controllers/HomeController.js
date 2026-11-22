import { albumSearchService } from '../services/album-search/AlbumSearchService.js';
import { AlbumPickerController } from '../components/album-picker/AlbumPickerController.js';
import { StagingAreaController } from '../components/home/StagingAreaController.js';
import { DiscographyRenderer } from '../views/renderers/DiscographyRenderer.js';
import { albumSeriesStore } from '../stores/albumSeries.js';
import { userStore } from '../stores/UserStore.js';
import { getSeriesService } from '../services/SeriesService.js';
import { router } from '../router.js';
import { showLoginModal } from '../components/LoginModal.js';
import { isSignedIn } from '../components/navigation/AuthNav.js';
import { toAlbumQuery } from '../models/albumQuery.js';
import { decodeEntities } from '../models/text.js';
import { isPhone } from '../utils/isPhone.js';
import { ScanStatus } from '../models/scanState.js';
import { visibleAlbums } from '../models/albumPicker.js';
import { readPastedList, toStagedAlbum, SkipReason } from '../models/bulkPaste.js';
import { pasteReport } from '../models/homePaste.js';
import { NameState, nameAfterChange, suggestName, flameOf, addAllLabel, typesLine } from '../models/homeSeries.js';

/** How long «Undo» stays after a removal or «Add all» (D9). */
export const UNDO_MS = 8000;

/** Where the series is when it is created. */
export const CreateState = Object.freeze({ IDLE: 'idle', NO_NAME: 'noname', CREATING: 'creating', CREATED: 'created', FAILED: 'failed' });

/** The save failed: say a cause only when it is known (the connection), never guess one. */
function failureText(error) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const network = offline || error?.code === 'unavailable' || /network|offline|fetch/i.test(String(error?.message || ''));
    return network
        ? 'The series was not saved: the connection dropped. Your albums are still here.'
        : 'The series was not saved. Your albums are still here.';
}

/** Nobody signed in with an account of their own (a guest session is not one), once the login has said who is there. */
const isGuest = ({ currentUser, loading } = {}) => !loading && !isSignedIn(currentUser);

/**
 * The Home (F79): one stage to find albums, a dock with the series being built, and «Create series».
 *
 * It holds the state of the screen: the mode of the field (an artist or a pasted list), the name
 * (suggested from the artists, or typed), where the creation is, the «Undo» of the last removal or
 * «Add all», the series panel open or not. The rules are in models/homeSeries.js and
 * models/homePaste.js; the albums of the series in StagingAreaController; the search in the one album
 * picker (F57), of which the Home is a frame.
 */
export class HomeController {
    constructor(view) {
        this.view = view;
        // One search service for the whole app: the AI list of an artist is asked (and paid) once
        this.albumSearchService = albumSearchService;
        this.state = {
            mode: 'artist', name: '', nameState: NameState.NONE, create: CreateState.IDLE, created: null,
            failure: '', open: false, moved: null, undo: null, report: false, guest: isGuest(userStore.getState())
        };
        this.scan = null;
        this.undoTimer = null;

        this.discographyRenderer = new DiscographyRenderer(this.view.$('#discographyGrid'), { variant: 'stage' });
        this.stagingController = new StagingAreaController({ onChange: () => this.seriesChanged() });
        // The one album picker (F57). The Home is its frame; what it does with a pick is the seam.
        this.picker = new AlbumPickerController({
            service: this.albumSearchService,
            view: {
                drawScan: (scan) => this.drawScan(scan),
                drawFilters: (filters, counts) => this.drawFilters(filters, counts),
                drawAlbums: (albums) => this.drawAlbums(albums)
            },
            onPick: (album) => this.stagingController.addAlbum(album)
        });
    }

    initialize() {
        this.bindEvents();
        this.picker.start();
        this.unsubscribeUser = userStore.subscribe((user) => {
            this.state.guest = isGuest(user);
            this.redraw();
        });
        this.redraw();
    }

    /** The screen was left: what is still on its way draws nothing. */
    dispose() {
        this.disposed = true;
        this.picker.dispose();
        clearTimeout(this.undoTimer);
        this.unsubscribeUser?.();
    }

    bindEvents() {
        const view = this.view;
        // Every handler is delegated from #app and reads the field at the time of the event, so a
        // Home drawn again still answers (F67)
        const typed = () => view.$('#artistScanInput')?.value || '';
        view.$delegate('#artistScanInput', 'keydown', (e) => { if (e.key === 'Enter') this.search(typed()); });
        view.$delegate('#artistScanInput', 'input', (e, field) => { this.fieldFocused = document.activeElement === field; this.drawStage(); });
        view.$delegate('#artistScanInput', 'focusin', () => { this.fieldFocused = true; this.drawStage(); });
        view.$delegate('#artistScanInput', 'focusout', () => { this.fieldFocused = false; this.drawStage(); });
        view.$delegate('#artistScanInput', 'paste', (e) => this.pasteIntoField(e));
        view.$delegate('#btnScanArtist', 'click', () => this.search(typed()));
        view.$delegate('#btnScanRetry', 'click', () => this.picker.retry());
        view.$delegate('#home-toolbar [data-filter]', 'click', (e, chip) => this.picker.toggleFilter(chip.dataset.filter));
        view.$delegate('#btnAddAll', 'click', () => this.addAll());
        view.$delegate('[data-home-mode]', 'click', (e, link) => this.setMode(link.dataset.homeMode));
        view.$delegate('[data-dock="stage-sign-in"]', 'click', () => this.signIn());
        view.$delegate('#discographyGrid [data-action="pick-album"]', 'click', (e, card) => this.clickCard(card.dataset.id));
    }

    // --- the search ---

    search(text) {
        if (this.state.mode !== 'artist') this.setMode('artist');
        return this.picker.searchArtist(text);
    }

    drawScan(scan) {
        this.scan = scan;
        this.view.drawResults(scan, { chosen: this.albums().length, paste: this.state.mode === 'paste' });
        this.redraw(); // the stage, the line under the artist and the dock's note follow the scan
    }

    drawFilters(filters, counts) {
        this.view.drawFilters(filters, counts);
        this.drawArtistLine();
    }

    drawAlbums(albums) {
        this.discographyRenderer.render(albums);
        this.view.markCards(this.albums(), { created: this.isCreated() });
        this.drawArtistLine();
    }

    drawArtistLine() {
        const scan = this.scan;
        if (!scan || scan.status !== ScanStatus.RESULTS) return;
        const visible = visibleAlbums(scan.albums, this.picker.filters);
        const chosenIds = this.albums().map(album => album.id);
        const addAll = this.isCreated() ? '' : addAllLabel(visible, chosenIds, this.picker.filters);
        this.view.drawArtistLine(typesLine(this.picker.filters, visible.length, scan.classifying), addAll);
    }

    drawStage() {
        if (!this.scan) return;
        const typing = Boolean(this.fieldFocused && this.view.$('#artistScanInput')?.value.trim());
        this.view.drawStage({ scan: this.scan, mode: this.state.mode, report: this.state.report, flame: this.flame(), guest: this.state.guest, chosen: this.albums().length, typing });
    }

    // --- the field: an artist or a pasted list ---

    setMode(mode, text = '') {
        this.state.mode = mode === 'paste' ? 'paste' : 'artist';
        this.state.report = false;
        if (this.state.mode === 'paste') {
            this.view.pasteList.setText(text);
        }
        this.picker.start(); // the results of the scan drawn again for the mode
        this.redraw(); // the dock's note follows: no covers on screen while the list is open
        if (this.state.mode === 'paste') this.view.pasteList.focusEnd();
        else this.view.$('#artistScanInput')?.focus();
    }

    /** A list pasted in the field of the artist becomes the list (more than one line). */
    pasteIntoField(event) {
        const text = event.clipboardData?.getData('text') || '';
        if (!/\r?\n/.test(text.trim())) return;
        event.preventDefault();
        this.setMode('paste', text.trim());
    }

    /**
     * «Add N albums»: every ready line is searched and added; a line that cannot go in stays, with why (F63).
     * @param {string} text - the list
     */
    async addPastedList(text) {
        const pasted = readPastedList(text);
        if (pasted.entries.length === 0 && pasted.skipped.length === 0) return;
        const list = this.view.pasteList;
        list.setBusy(true);
        try {
            const searched = await this.stageBulkEntries(pasted.entries);
            const report = pasteReport({ added: searched.added, skipped: [...pasted.skipped, ...searched.skipped] });
            this.state.report = true;
            list.showReport(report);
            this.drawStage();
        } finally {
            list.setBusy(false);
        }
    }

    /** Search each line in the catalog and add what is found. One line never stops the others. */
    async stageBulkEntries(entries) {
        let added = 0;
        const skipped = [];
        for (const entry of entries) {
            const reason = await this.stageBulkEntry(entry);
            if (reason) skipped.push({ line: entry.line, text: entry.text, reason });
            else added++;
        }
        return { added, skipped };
    }

    /** @returns {Promise<string|null>} null when the album went in, or why it did not (SkipReason) */
    async stageBulkEntry({ artist, title }) {
        let results;
        try {
            results = await this.albumSearchService.search(artist, title, { limit: 1 });
        } catch (error) {
            console.error(`[Home] The search failed for: ${artist} - ${title}`, error);
            return SkipReason.SEARCH_FAILED;
        }
        const match = results?.[0];
        if (!match) return SkipReason.NOT_FOUND;
        if (this.stagingController.hasAlbum(match.id)) return SkipReason.ALREADY_SELECTED;
        if (this.isCreated()) this.startAnother();
        this.stagingController.addAlbum(toStagedAlbum(match));
        return null;
    }

    // --- the series ---

    albums() {
        return this.stagingController.getSelectedAlbums();
    }

    isCreated() {
        return this.state.create === CreateState.CREATED;
    }

    flame() {
        return flameOf({ chosen: this.albums().length, results: this.scan?.status === ScanStatus.RESULTS || this.scan?.status === ScanStatus.FAILED, created: this.isCreated() });
    }

    /** A cover was clicked: in the series it goes out (with Undo); not in it, it goes in. */
    clickCard(id) {
        if (this.isCreated()) this.startAnother();
        else if (this.stagingController.hasAlbum(id)) return this.removeWithUndo(id);
        this.state.undo = null;
        if (!this.picker.pick(id)) console.warn(`Album not found in the scan: ${id}`);
    }

    /** «Add all»: what the filters show goes in, and «Undo» gives the series back as it was. */
    addAll() {
        if (!this.scan) return;
        if (this.isCreated()) this.startAnother();
        const before = this.stagingController.snapshot();
        const n = this.stagingController.addMany(visibleAlbums(this.scan.albums, this.picker.filters));
        if (n > 0) this.offerUndo({ kind: 'addall', before, n });
    }

    removeWithUndo(id) {
        const removed = this.stagingController.removeAlbum(id);
        if (removed) this.offerUndo({ kind: 'remove', ...removed });
    }

    offerUndo(undo) {
        clearTimeout(this.undoTimer);
        this.state.undo = undo;
        this.state.moved = null;
        this.redraw();
        this.undoTimer = setTimeout(() => {
            this.state.undo = null;
            if (!this.disposed) this.redraw();
        }, UNDO_MS);
    }

    undo() {
        const undo = this.state.undo;
        if (!undo) return;
        clearTimeout(this.undoTimer);
        this.state.undo = null;
        if (undo.kind === 'remove') this.stagingController.insertAlbum(undo.album, undo.index);
        else this.stagingController.restore(undo.before);
    }

    move(id, delta) {
        const album = this.albums().find(a => String(a.id) === String(id));
        if (!album) return;
        this.state.moved = { id: album.id, dir: delta < 0 ? 'up' : 'down' };
        this.stagingController.moveAlbum(album.id, delta);
    }

    toggleOpen() {
        this.state.open = !this.state.open;
        this.state.moved = null;
        this.redraw();
    }

    closePanel() {
        if (!this.state.open && !this.state.moved) return;
        this.state.open = false;
        this.state.moved = null;
        this.redraw();
    }

    /** The series changed: the suggested name follows it, a failed or missing-name state is left. */
    seriesChanged() {
        const albums = this.albums();
        const named = nameAfterChange({ name: this.state.name, state: this.state.nameState }, albums);
        this.state.name = named.name;
        this.state.nameState = named.state;
        if (!albums.length) this.state.open = false;
        if (this.state.create === CreateState.FAILED || (this.state.create === CreateState.NO_NAME && named.name.trim())) this.state.create = CreateState.IDLE;
        this.redraw();
    }

    setName(text) {
        this.state.name = text;
        this.state.nameState = NameState.EDITED;
        if (this.state.create === CreateState.NO_NAME && text.trim()) {
            this.state.create = CreateState.IDLE;
            this.redraw();
        }
    }

    useSuggestedName() {
        this.state.name = suggestName(this.albums());
        this.state.nameState = NameState.SUGGESTED;
        this.state.create = CreateState.IDLE;
        this.redraw();
    }

    // --- create ---

    /** «Create series»: never without a name (no silent «New Album Series»). */
    async createSeries() {
        const albums = [...this.albums()];
        const state = this.state;
        if (albums.length === 0 || state.create === CreateState.CREATING) return;
        const name = decodeEntities(state.name || '').trim();
        if (!name) {
            state.create = CreateState.NO_NAME;
            this.redraw();
            this.view.focusName();
            return;
        }
        clearTimeout(this.undoTimer);
        Object.assign(state, { create: CreateState.CREATING, open: false, undo: null, moved: null });
        this.redraw();
        try {
            const series = await this.writeSeries(name, albums);
            Object.assign(state, { create: CreateState.CREATED, created: { id: series.id, name, count: albums.length } });
        } catch (error) {
            console.error('[HomeController] The series was not saved:', error);
            Object.assign(state, { create: CreateState.FAILED, failure: failureText(error) });
        }
        if (!this.disposed) this.redraw();
    }

    /** Writes the series (the seam the browser proof replaces, so no real series is written). */
    async writeSeries(name, albums) {
        const db = albumSeriesStore.getDb();
        if (!db) throw new Error('Database not initialized');
        const service = getSeriesService(db, null, albumSeriesStore.getUserId());
        // One shape, written in one place, with plain text, in the order of the series (models/albumQuery.js)
        return service.createSeries({ name, albumQueries: albums.map(toAlbumQuery), status: 'pending' });
    }

    blendNow() {
        if (this.state.created) router.navigate(`/blend?seriesId=${encodeURIComponent(this.state.created.id)}`);
    }

    openSeries() {
        if (this.state.created) router.navigate(`/albums/${encodeURIComponent(this.state.created.id)}`);
    }

    /** A new series: the saved one stays as it is; the dock is empty again. */
    startAnother() {
        Object.assign(this.state, { create: CreateState.IDLE, created: null, undo: null, name: '', nameState: NameState.NONE, open: false, moved: null });
        if (this.albums().length) this.stagingController.clear();
        else this.redraw();
    }

    signIn() {
        showLoginModal();
    }

    /** The screen became a phone or stopped being one: the dock takes the other form. */
    screenChanged() {
        this.state.open = false;
        this.redraw();
    }

    // --- drawing ---

    redraw() {
        if (this.disposed) return;
        const albums = this.albums();
        this.view.drawSeries({
            albums,
            name: this.state.name,
            nameState: this.state.nameState,
            suggestion: suggestName(albums),
            create: this.state.create,
            created: this.state.created,
            failure: this.state.failure,
            open: this.state.open && !isPhone(),
            moved: this.state.moved,
            undo: this.state.undo,
            guest: this.state.guest && !isPhone(),
            flame: this.flame(),
            coversOnScreen: this.scan?.status === ScanStatus.RESULTS && this.state.mode === 'artist'
        });
        this.view.markCards(albums, { created: this.isCreated() });
        this.view.drawAfter(this.isCreated() ? this.state.created : null);
        this.drawStage();
        this.drawArtistLine();
    }
}
