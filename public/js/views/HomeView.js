import { BaseView } from './BaseView.js';
import { getIcon } from '../components/Icons.js';
import { HomeController } from '../controllers/HomeController.js';
import { SafeDOM } from '../utils/SafeDOM.js';
import { describeScan, ScanStatus } from '../models/scanState.js';
import { PICKER_FILTERS, defaultFilters } from '../models/albumPicker.js';
import { stageIsBig, equalizerState, barShows, guestNoticeShows, phoneHintLink } from '../models/homeSeries.js';
import { createEqualizer, setEqualizerState } from '../components/home/HomeEqualizer.js';
import { HomePasteList } from '../components/home/HomePasteList.js';
import { HomeDock, guestLine } from '../components/home/HomeDock.js';
import { isPhone, onPhoneChange } from '../utils/isPhone.js';
import { openSheet } from '../components/ui/Sheet.js';

/** The ids of the Home's type chips, by the key of the filter (models/albumPicker.js). */
const FILTER_BUTTON_IDS = Object.freeze({
    albums: 'btnFilterAlbums', eps: 'btnFilterEPs', singles: 'btnFilterSingles',
    live: 'btnFilterLive', compilations: 'btnFilterCompilations', uncategorized: 'btnFilterUncategorized'
});
const RETRY_BUTTON_ID = 'btnScanRetry';
const SKELETONS = { phone: 4, computer: 12 };
const EQ_BARS = { phone: 32, computer: 48 };

const SERIES_SENTENCE = 'A series is the set of albums you want to hear together, from one artist or many: the Blend turns it into balanced playlists.';
const FIELD_HINT = { phone: 'Type an artist', computer: 'An artist, or paste a list of albums' };

const gesture = () => (isPhone() ? 'Tap' : 'Click');

/**
 * The Home that explains itself (F79, design/inception/home-transformar-v2.html): one stage.
 *
 *   the stage     the title and what a series is (before anything is found), the one field (an artist
 *                 or a pasted list), the hint that points to the next gesture, the equalizer;
 *   the results   the three steps (first visit), the wait, the artist with the type chips and
 *                 «Add all», the grid of covers (numbered when chosen), «not found», «no answer»;
 *   the dock      the series being built, always in view (components/home/HomeDock.js); on the phone,
 *                 the action bar.
 *
 * The view draws; the controller (controllers/HomeController.js) decides.
 */
export class HomeView extends BaseView {
    constructor() {
        super();
        this.controller = null;
        this.dock = null;
        this.pasteList = null;
        this.helpSheet = null;
    }

    async render() {
        // One title for the whole app (UAT-192): the same text as in index.html
        this.setTitle('MJRP The Album Blender - Playlist Generator');

        this.pasteList = new HomePasteList({ onAdd: (text) => this.controller?.addPastedList(text) });

        return SafeDOM.div({ id: 'home-page', className: 'home-page' }, [
            this.renderStage(),
            this.renderResults(),
            SafeDOM.div({ id: 'homeDockHost' })
        ]);
    }

    renderStage() {
        const search = SafeDOM.button({ id: 'btnScanArtist', className: 'home-btn is-flame' }, 'Search');
        const field = SafeDOM.div({ id: 'homeField', className: 'home-field' }, [
            SafeDOM.fromHTML(getIcon('Search', 'home-field__ico')),
            SafeDOM.input({
                type: 'text', id: 'artistScanInput', autocomplete: 'off', spellcheck: 'false',
                placeholder: isPhone() ? FIELD_HINT.phone : FIELD_HINT.computer,
                'aria-label': 'Search an artist, or paste a list of albums'
            }),
            search
        ]);
        const paste = this.pasteList.render();
        paste.hidden = true;

        return SafeDOM.section({ id: 'homeStage', className: 'home-stage is-big' }, [
            SafeDOM.div({ id: 'homeHero', className: 'home-hero' }, [
                SafeDOM.h1({}, [SafeDOM.span({ className: 'home-hero__l1' }, 'Pick the albums.'), ' ', SafeDOM.span({ className: 'home-hero__l2' }, 'We blend the playlists.')]),
                // On the phone the sentence opens from this link (UAT-281); on the computer it stays on the screen
                SafeDOM.button({ type: 'button', className: 'home-what', 'aria-haspopup': 'dialog', onClick: () => this.openWhatIsASeries() }, 'What is a series?'),
                SafeDOM.p({}, SERIES_SENTENCE)
            ]),
            field,
            paste,
            SafeDOM.p({ id: 'homeHint', className: 'home-hint' }),
            SafeDOM.div({ id: 'homeGuestStage', className: 'home-guest-stage', hidden: true }),
            createEqualizer(isPhone() ? EQ_BARS.phone : EQ_BARS.computer)
        ]);
    }

    renderResults() {
        const chips = PICKER_FILTERS.map(filter => {
            const on = defaultFilters()[filter.key];
            return SafeDOM.button({ id: FILTER_BUTTON_IDS[filter.key], className: `home-chip${on ? ' is-on' : ''}`, 'aria-pressed': String(on), dataset: { filter: filter.key } }, [
                SafeDOM.span({ className: 'filter-btn-text' }, filter.label),
                SafeDOM.span({ className: 'filter-btn-count', id: `${FILTER_BUTTON_IDS[filter.key]}Count` })
            ]);
        });
        const addAll = SafeDOM.button({ id: 'btnAddAll', className: 'home-btn is-ghost home-addall', hidden: true });

        return SafeDOM.section({ id: 'homeResults', className: 'home-results' }, [
            SafeDOM.p({ id: 'homeAfter', className: 'home-after', role: 'status', hidden: true }),
            SafeDOM.create('ol', { id: 'homeHow', className: 'home-how' }, [
                this.step(1, 'Find', 'an artist, or paste a list'),
                this.step(2, 'Add', 'the albums you want, in the order you want'),
                this.step(3, 'Create', 'the series, then blend it')
            ]),
            SafeDOM.p({ id: 'homeWait', className: 'home-wait', role: 'status', hidden: true }),
            SafeDOM.div({ id: 'homeMessage', className: 'home-msg', hidden: true }),
            SafeDOM.header({ id: 'homeArtist', className: 'home-artist', hidden: true }, [
                SafeDOM.div({ className: 'home-artist__t' }, [
                    SafeDOM.h2({ id: 'homeArtistName' }),
                    SafeDOM.span({ id: 'statusArtistName', role: 'status', 'aria-live': 'polite' })
                ]),
                SafeDOM.div({ id: 'home-toolbar', className: 'home-chips', role: 'group', 'aria-label': 'Album types' }, chips),
                addAll
            ]),
            SafeDOM.div({ id: 'discographyGrid', className: 'home-grid' })
        ]);
    }

    step(n, verb, rest) {
        return SafeDOM.li({}, [SafeDOM.strong({ className: 'home-how__n' }, String(n)), SafeDOM.span({}, [SafeDOM.strong({}, verb), ` ${rest}`])]);
    }

    async mount() {
        this.dock = new HomeDock({ on: this.dockHandlers(), phone: () => isPhone() });
        this.dock.mount(this.$('#homeDockHost'));

        this.controller = new HomeController(this);
        // Attached to window for the console (and the browser proof of F79)
        window.controller = this.controller;
        this.controller.initialize();

        this.subscriptions.push(onPhoneChange(() => this.controller?.screenChanged()));
    }

    dockHandlers() {
        const c = () => this.controller;
        return {
            create: () => c().createSeries(),
            toggleOpen: () => c().toggleOpen(),
            close: () => c().closePanel(),
            move: (id, delta) => c().move(id, delta),
            remove: (id) => c().removeWithUndo(id),
            undo: () => c().undo(),
            name: (text) => c().setName(text),
            useName: () => c().useSuggestedName(),
            blend: () => c().blendNow(),
            openSeries: () => c().openSeries(),
            restart: () => c().startAnother(),
            signIn: () => c().signIn()
        };
    }

    /** «What is a series?» (phone): the same sentence, in the app's bottom sheet. */
    openWhatIsASeries() {
        if (this.helpSheet?.isOpen()) return;
        this.helpSheet = openSheet({
            variant: 'bottom',
            title: 'What is a series?',
            content: SafeDOM.p({ className: 'home-what__text' }, SERIES_SENTENCE),
            id: 'whatIsASeries',
            onClose: () => { this.helpSheet = null; }
        });
    }

    destroy() {
        this.helpSheet?.close();
        // What is still on its way (a scan, the AI list, a save) must not draw on the next screen
        this.controller?.dispose?.();
        this.dock?.unmount();
        super.destroy();
    }

    // --- drawn by the controller ---

    /** The stage: big or small, the field or the list, the hint, the equalizer, the fire on «Search». */
    drawStage({ scan, mode, report, flame, guest, chosen = 0, typing = false }) {
        const phone = isPhone();
        const paste = mode === 'paste';
        const stage = this.$('#homeStage');
        if (!stage) return;
        const big = stageIsBig({ scan: scan.status, paste, report, phone });
        stage.classList.toggle('is-big', big);
        stage.classList.toggle('is-small', !big);
        this.$('#homeHero').hidden = !big;
        this.$('#homeField').hidden = paste;
        this.$('#homePaste').hidden = !paste;
        this.drawHint(paste, typing, scan.status === ScanStatus.EMPTY, phone);
        this.$('#artistScanInput').placeholder = phone ? FIELD_HINT.phone : FIELD_HINT.computer;
        setEqualizerState(stage.querySelector('.home-eq'), equalizerState(scan.status));

        const search = this.$('#btnScanArtist');
        const busy = scan.status === ScanStatus.SCANNING;
        search.textContent = busy ? 'Searching…' : 'Search';
        search.disabled = busy;
        if (busy) search.setAttribute('aria-busy', 'true');
        else search.removeAttribute('aria-busy');
        search.classList.toggle('is-flame', flame === 'search');

        const guestHost = this.$('#homeGuestStage');
        SafeDOM.clear(guestHost);
        const guestShows = phone && guestNoticeShows({ guest, chosen });
        guestHost.hidden = !guestShows;
        if (guestShows) guestHost.appendChild(guestLine('stage-sign-in'));
    }

    drawHint(paste, typing, notFound = false, phone = false) {
        const hint = this.$('#homeHint');
        SafeDOM.clear(hint);
        if (phone) {
            // One link, nothing else (UAT-281); none when the «not found» message has «Paste a list»
            const link = phoneHintLink({ paste, notFound: notFound && !paste });
            hint.hidden = !link;
            if (link === 'artist') hint.append(this.modeLink('artist', 'Search an artist instead'));
            if (link === 'paste') hint.append(this.modeLink('paste', 'or paste a list'));
            return;
        }
        hint.hidden = false;
        if (paste) {
            hint.append('Paste or type one album per line. ', this.modeLink('artist', 'Search an artist instead'));
        } else if (typing) {
            hint.append('Press Enter or Search to see their albums. A list with one album per line works too.');
        } else {
            hint.append('Type an artist to see their albums, or ', this.modeLink('paste', 'paste a list'), ' of albums from many artists.');
        }
    }

    modeLink(mode, text) {
        return SafeDOM.button({ className: 'home-link', dataset: { homeMode: mode } }, text);
    }

    /**
     * The results of the scan (F67 states, F79 words): one place, drawn from the state.
     * @param {Object} scan - a state of models/scanState.js
     * @param {{ chosen: number, paste: boolean }} context
     */
    drawResults(scan, { chosen, paste }) {
        const show = (id, on) => { const element = this.$(id); if (element) element.hidden = !on; };
        const status = paste ? 'paste' : scan.status;
        show('#homeHow', status === ScanStatus.IDLE);
        show('#homeWait', status === ScanStatus.SCANNING);
        show('#homeArtist', status === ScanStatus.RESULTS);
        show('#homeMessage', status === ScanStatus.EMPTY || status === ScanStatus.FAILED);
        show('#discographyGrid', status === ScanStatus.RESULTS || status === ScanStatus.SCANNING);

        this.drawResultsContent(scan, status, chosen);
    }

    /** What the state of the scan writes: the wait, the message (cleared in every other state), the artist. */
    drawResultsContent(scan, status, chosen) {
        const message = { [ScanStatus.EMPTY]: 'empty', [ScanStatus.FAILED]: 'failed' }[status];
        if (message) this.drawMessage(scan, message, chosen);
        else SafeDOM.clear(this.$('#homeMessage'));
        if (status === ScanStatus.SCANNING) this.drawWaiting(scan);
        if (status === ScanStatus.RESULTS) this.$('#homeArtistName').textContent = scan.artist || scan.query;
    }

    drawWaiting(scan) {
        this.$('#homeWait').textContent = `Looking for «${scan.query}» in the catalog… the covers appear as soon as it answers.`;
        const grid = this.$('#discographyGrid');
        SafeDOM.clear(grid);
        const n = isPhone() ? SKELETONS.phone : SKELETONS.computer;
        for (let i = 0; i < n; i++) grid.appendChild(SafeDOM.span({ className: 'home-skel', 'aria-hidden': 'true' }));
    }

    drawMessage(scan, kind, chosen) {
        const box = this.$('#homeMessage');
        SafeDOM.clear(box);
        box.classList.toggle('is-error', kind === 'failed');
        box.setAttribute('role', kind === 'failed' ? 'alert' : 'status');
        if (kind === 'empty') {
            box.append(
                SafeDOM.strong({}, `No albums found for «${scan.query}».`),
                SafeDOM.span({}, 'Check the spelling, or paste the albums as a list: one per line, Artist - Album.'),
                SafeDOM.button({ className: 'home-btn', dataset: { homeMode: 'paste' } }, 'Paste a list'));
            return;
        }
        const holds = chosen > 0 ? `Your series still has its ${chosen} album${chosen === 1 ? '' : 's'}. Try again in a moment.` : 'Nothing was changed. Try again in a moment.';
        box.append(
            SafeDOM.strong({}, describeScan(scan).panel.title),
            SafeDOM.span({}, holds),
            SafeDOM.button({ id: RETRY_BUTTON_ID, className: 'home-btn' }, 'Try again'));
    }

    /** The type chips: on or off, with how many albums each has. */
    drawFilters(filters, counts) {
        PICKER_FILTERS.forEach(({ key }) => {
            const chip = this.$(`#${FILTER_BUTTON_IDS[key]}`);
            if (!chip) return;
            chip.classList.toggle('is-on', Boolean(filters[key]));
            chip.setAttribute('aria-pressed', String(Boolean(filters[key])));
            chip.querySelector('.filter-btn-count').textContent = counts[key] > 0 ? ` · ${counts[key]}` : '';
        });
    }

    /** The line under the artist and «Add all» (empty label: hidden). */
    drawArtistLine(line, addAll) {
        const status = this.$('#statusArtistName');
        if (status) status.textContent = line;
        const button = this.$('#btnAddAll');
        if (!button) return;
        SafeDOM.clear(button);
        button.hidden = !addAll;
        if (addAll) button.append(SafeDOM.fromHTML(getIcon('Plus', 'home-ico')), ` ${addAll}`);
    }

    /** The covers on screen: the chosen ones with the ring and their place; after creating, none. */
    markCards(albums, { created }) {
        const place = new Map(albums.map((album, index) => [String(album.id), index + 1]));
        this.$$('#discographyGrid [data-action="pick-album"]').forEach(card => {
            const n = created ? 0 : place.get(card.dataset.id) || 0;
            this.markCard(card, n);
        });
    }

    markCard(card, n) {
        card.classList.toggle('is-in', n > 0);
        card.setAttribute('aria-pressed', String(n > 0));
        const mark = card.querySelector('.home-card__mark');
        if (mark && mark.dataset.n !== String(n)) {
            SafeDOM.clear(mark);
            mark.dataset.n = String(n);
            if (n) mark.textContent = String(n);
            else mark.appendChild(SafeDOM.fromHTML(getIcon('Plus', 'home-card__plus')));
        }
        const title = card.querySelector('.home-card__title')?.textContent || '';
        const year = (card.querySelector('.home-card__year')?.textContent || '').split(' · ')[0];
        card.setAttribute('aria-label', n
            ? `${title}, ${year}, number ${n} in your series. ${gesture()} to take it out`
            : `${title}, ${year}. ${gesture()} to add it`);
    }

    /** After creating: the green line above the covers says the saved series will not change here. */
    drawAfter(created) {
        const after = this.$('#homeAfter');
        if (!after) return;
        after.hidden = !created;
        after.textContent = created ? `«${created.name}» is saved and won't change here. ${gesture()} a cover to start another series.` : '';
    }

    drawSeries(model) {
        // The phone's bar comes with the first cover (UAT-281): without it the page needs less room below
        const barless = isPhone() && !barShows({ chosen: model.albums.length, created: Boolean(model.created) });
        this.$('#home-page')?.classList.toggle('is-barless', barless);
        this.dock?.draw(model);
    }

    focusName() {
        this.dock?.focusName();
    }
}
