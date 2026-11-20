import { BaseView } from './BaseView.js';
import { getIcon } from '../components/Icons.js';
import { HomeController } from '../controllers/HomeController.js';
import { SafeDOM } from '../utils/SafeDOM.js';
import { describeScan, idleScan } from '../models/scanState.js';
import { PICKER_FILTERS, defaultFilters } from '../models/albumPicker.js';
import { createFilterButton, drawFilterButton, drawScanButton, createScanPanel } from '../components/album-picker/pickerParts.js';
import { HomePhoneChosen } from '../components/home/HomePhoneChosen.js';
import { isPhone, onPhoneChange } from '../utils/isPhone.js';

/** The ids of the Home's filter buttons, by the key of the filter (models/albumPicker.js). */
const FILTER_BUTTON_IDS = Object.freeze({
    albums: 'btnFilterAlbums', eps: 'btnFilterEPs', singles: 'btnFilterSingles',
    live: 'btnFilterLive', compilations: 'btnFilterCompilations', uncategorized: 'btnFilterUncategorized'
});
const RETRY_BUTTON_ID = 'btnScanRetry';

export class HomeView extends BaseView {
    constructor() {
        super();
        this.controller = null;
        this.phoneChosen = null; // the chosen set on the phone (F76): bar, marks, sheet
    }

    async render(params) {
        // One title for the whole app (UAT-192): the same text as in index.html
        this.setTitle('MJRP The Album Blender - Playlist Generator');

        // Background
        const background = SafeDOM.div({ className: 'absolute inset-0 z-0 pointer-events-none' }, [
            SafeDOM.img({ src: '/assets/images/hero_bg.svg', className: 'w-full h-full object-cover opacity-30', alt: 'bg' }),
            SafeDOM.div({ className: 'absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent' })
        ]);

        // --- LEFT PANEL ---

        // Header
        const header = SafeDOM.div({ id: 'home-header', className: 'p-6 border-b border-white/5 flex items-center gap-3' }, [
            SafeDOM.div({ className: 'w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20' }, [
                SafeDOM.fromHTML(getIcon('Music', 'text-white w-6 h-6'))
            ]),
            SafeDOM.div({}, [
                SafeDOM.h1({ className: 'font-syne font-bold text-xl text-white tracking-wide' }, [
                    'Album Blender ',
                    SafeDOM.span({ className: 'text-orange-500 text-xs align-top' }, 'V3')
                ]),
                SafeDOM.p({ className: 'text-xs text-gray-500 uppercase tracking-widest' }, 'Balanced Playlist Generator')
            ])
        ]);

        // Series Config
        const seriesConfig = SafeDOM.div({ id: 'home-series-config', className: 'space-y-2' }, [
            SafeDOM.label({ className: 'text-xs font-bold text-gray-400 uppercase tracking-widest' }, '01 // Series Configuration'),
            SafeDOM.span({ className: 'text-[10px] text-gray-500 uppercase tracking-wider block' }, 'Your Albums Series Name'),
            SafeDOM.input({
                type: 'text',
                id: 'seriesNameInput',
                value: '',
                className: 'w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 focus:outline-none transition-colors',
                placeholder: "e.g., 'Summer Vibes 2024'"
            })
        ]);

        // Tech Stripe & Panel
        const visualBtn = SafeDOM.button({ id: 'btnModeVisual', 'aria-pressed': 'true', className: 'text-[10px] bg-orange-500 text-white px-2 py-1 rounded hover:opacity-80 transition-opacity' }, 'Visual');
        const bulkBtn = SafeDOM.button({ id: 'btnModeBulk', 'aria-pressed': 'false', className: 'text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors' }, 'Bulk Paste');

        const scanBtn = SafeDOM.button({ id: 'btnScanArtist', className: 'min-w-[100px] px-5 py-3 bg-flame-gradient rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shrink-0' })
        scanBtn.appendChild(SafeDOM.fromHTML(getIcon('ScanLine', 'w-4 h-4')));
        scanBtn.appendChild(SafeDOM.span({}, 'Scan'));

        const visualInputs = SafeDOM.div({ id: 'visualInputs', className: 'flex gap-3 items-stretch' }, [
            SafeDOM.div({ className: 'flex-1 relative' }, [
                SafeDOM.span({ className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' }, [SafeDOM.fromHTML(getIcon('Search', 'w-4 h-4'))]),
                SafeDOM.input({
                    type: 'text',
                    id: 'artistScanInput',
                    className: 'w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all',
                    placeholder: 'Type artist name...'
                })
            ]),
            scanBtn
        ]);

        const parseBtn = SafeDOM.button({
            id: 'btnProcessBulk',
            className: 'w-full mt-2 px-4 py-2 bg-flame-gradient rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2'
        });
        parseBtn.appendChild(SafeDOM.fromHTML(getIcon('Search', 'w-3 h-3')));
        parseBtn.appendChild(SafeDOM.span({}, 'Process List'));

        const bulkInputs = SafeDOM.div({ id: 'bulkInputs', className: 'hidden' }, [
            SafeDOM.textarea({
                id: 'bulkPasteInput',
                className: 'w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-mono text-white focus:border-orange-500 focus:outline-none custom-scrollbar resize-none',
                placeholder: 'Paste: Artist - Album\nOne per line...',
                'aria-describedby': 'bulkPasteReport'
            }),
            parseBtn,
            // The lines that did not go in, each with its number and the reason (F63)
            SafeDOM.div({ id: 'bulkPasteReport', className: 'hidden mt-3 rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 text-xs text-orange-100', role: 'status', 'aria-live': 'polite' })
        ]);

        const techPanel = SafeDOM.div({ id: 'home-tech-panel', className: 'tech-panel rounded-xl p-0 border border-white/10 bg-black/40 relative overflow-hidden' }, [
            SafeDOM.div({ className: 'absolute top-0 left-0 w-1 h-full bg-orange-500' }),
            SafeDOM.div({ className: 'bg-black/40 p-3 border-b border-white/5 flex justify-between items-center pl-4' }, [
                SafeDOM.span({ className: 'text-xs font-bold text-orange-500 uppercase' }, '02a // Artist Filter'),
                SafeDOM.div({ className: 'flex gap-2' }, [visualBtn, bulkBtn])
            ]),
            SafeDOM.div({ className: 'p-4 space-y-4' }, [
                visualInputs,
                bulkInputs,
                SafeDOM.div({ className: 'flex items-center gap-2 text-xs text-gray-500 p-2' }, [
                    SafeDOM.fromHTML(getIcon('Info', 'w-3 h-3')),
                    SafeDOM.span({}, 'Filtering by artist unlocks the verified discography grid.')
                ])
            ])
        ]);

        // Staging Area
        const stagingArea = SafeDOM.div({ id: 'home-staging-area', className: 'flex-1 min-h-[200px] flex flex-col' }, [
            SafeDOM.div({ className: 'flex justify-between items-end mb-2' }, [
                SafeDOM.label({ className: 'text-xs font-bold text-gray-400 uppercase tracking-widest' }, '03 // Selected Albums'),
                SafeDOM.span({ id: 'stagingCount', className: 'text-xs text-orange-500 font-mono' }, '(0 Albums)')
            ]),
            SafeDOM.div({
                id: 'stagingStackContainer',
                className: 'flex-1 bg-black/20 rounded-xl border border-white/5 p-2 space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar'
            }, [
                SafeDOM.div({ className: 'text-center text-xs text-gray-500 py-10' }, 'Stack Empty')
            ])
        ]);

        const leftContent = SafeDOM.div({ id: 'home-left-content', className: 'flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar' }, [
            seriesConfig,
            techPanel,
            stagingArea
        ]);

        const initBtn = SafeDOM.button({ id: 'btnInitializeLoad', className: 'w-full bg-flame-gradient text-white font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:shadow-[0_0_30px_rgba(255,85,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2' });
        initBtn.appendChild(SafeDOM.span({}, 'Initialize Load Sequence'));
        initBtn.appendChild(SafeDOM.fromHTML(getIcon('ArrowRight', 'w-5 h-5')));

        const leftFooter = SafeDOM.div({ id: 'home-left-footer', className: 'p-6 border-t border-white/10 bg-black/40 backdrop-blur-md z-20' }, [initBtn]);

        const leftPanel = SafeDOM.aside({ id: 'home-left-panel', className: 'relative z-10 w-full md:w-[400px] lg:w-[450px] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-white/10 glass-panel shadow-2xl shrink-0 bg-black/60 backdrop-blur-md' }, [
            header,
            leftContent,
            leftFooter
        ]);

        // --- RIGHT PANEL ---

        // The filter buttons of the album picker: one definition for every screen (F57)
        const filterBtns = PICKER_FILTERS.map(filter =>
            createFilterButton(filter, { id: FILTER_BUTTON_IDS[filter.key], active: defaultFilters()[filter.key] }));

        const toolbar = SafeDOM.div({ id: 'home-toolbar', className: 'min-h-14 border-b border-white/5 bg-black/40 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 md:px-6 shrink-0 z-20 gap-2' }, [
            SafeDOM.div({ className: 'flex items-center gap-3 shrink-0' }, [
                SafeDOM.span({ className: 'text-xs font-bold text-orange-500 uppercase tracking-widest' }, '02b // Discography Scan'),
                SafeDOM.span({ id: 'statusArtistName', className: 'text-sm text-white font-bold truncate max-w-[320px]', role: 'status', 'aria-live': 'polite' })
            ]),
            SafeDOM.div({ className: 'flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1' }, filterBtns)
        ]);

        // Grid
        const grid = SafeDOM.div({ id: 'discographyGrid', className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20' }, [
            createScanPanel(describeScan(idleScan()).panel, { retryId: RETRY_BUTTON_ID })
        ]);

        const rightPanel = SafeDOM.main({ id: 'home-right-panel', className: 'flex-1 relative min-h-[50vh] md:h-full overflow-hidden flex flex-col bg-black/20' }, [
            toolbar,
            SafeDOM.div({ id: 'discographyGridContainer', className: 'flex-1 overflow-y-auto p-6 custom-scrollbar' }, [grid])
        ]);

        return SafeDOM.div({ className: 'min-h-[calc(100vh-64px)] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row relative' }, [
            background,
            leftPanel,
            rightPanel
        ]);
    }

    async mount(params) {
        // Initialize Controller V3
        this.controller = new HomeController(this);

        // Attach to window for global access/debugging (temp)
        window.controller = this.controller;

        this.controller.initialize();

        // The phone: the chosen set travels with the finger (F76, REQ-09). Mounted only on the phone
        this.phoneChosen = new HomePhoneChosen({
            staging: this.controller.stagingController,
            onCreate: () => this.controller.handleInitializeLoad(),
            findCards: (selector) => this.$$('#discographyGrid ' + selector),
            nameField: () => this.$('#seriesNameInput')
        });
        this.placePhoneParts(isPhone());
        this.subscriptions.push(onPhoneChange((phone) => this.placePhoneParts(phone)));
    }

    /** Mount the phone's parts on the phone, take them away on a wider screen. */
    placePhoneParts(phone) {
        if (!this.phoneChosen) return;
        if (!phone) {
            this.phoneChosen.unmount();
            return;
        }
        this.phoneChosen.mount(document.getElementById('app'));
        this.phoneChosen.show(this.controller.stagingController.getSelectedAlbums());
    }

    destroy() {
        // What is still on its way (a scan, the AI list) must not draw on the next screen
        if (this.controller?.dispose) this.controller.dispose();
        this.phoneChosen?.unmount();
        super.destroy();
    }

    /**
     * The chosen albums changed, or the cards were drawn again: the phone answers on the album and
     * in its action bar. Nothing is drawn on the computer (the phone's parts are not mounted there).
     * @param {Array<Object>} albums - the chosen albums, in their order
     */
    showChosen(albums) {
        this.phoneChosen?.show(albums);
    }

    /** «Create series» is busy on the phone while the series is written. */
    setCreating(busy) {
        this.phoneChosen?.setBusy(busy);
    }

    // DOM Helpers for Controller
    updateModeUI(mode) {
        const visualBtn = this.$('#btnModeVisual');
        const bulkBtn = this.$('#btnModeBulk');
        const visualInputs = this.$('#visualInputs');
        const bulkInputs = this.$('#bulkInputs');

        if (mode === 'visual') {
            visualBtn.className = "text-[10px] bg-orange-500 text-white px-2 py-1 rounded hover:opacity-80 transition-opacity";
            bulkBtn.className = "text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors";
            visualInputs.classList.remove('hidden');
            bulkInputs.classList.add('hidden');
            visualBtn.setAttribute('aria-pressed', 'true');
            bulkBtn.setAttribute('aria-pressed', 'false');
        } else {
            bulkBtn.className = "text-[10px] bg-orange-500 text-white px-2 py-1 rounded hover:opacity-80 transition-opacity";
            visualBtn.className = "text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors";
            bulkInputs.classList.remove('hidden');
            visualInputs.classList.add('hidden');
            bulkBtn.setAttribute('aria-pressed', 'true');
            visualBtn.setAttribute('aria-pressed', 'false');
        }

    }

    /**
     * "Process List" while the list is searched: busy, and not to be clicked again.
     * @param {boolean} busy
     */
    setBulkBusy(busy) {
        const btn = this.$('#btnProcessBulk');
        if (!btn) return;
        btn.disabled = busy;
        if (busy) btn.setAttribute('aria-busy', 'true');
        else btn.removeAttribute('aria-busy');
        const label = btn.querySelector('span');
        if (label) {
            label.textContent = busy ? 'Processing…' : 'Process List';
            label.classList.toggle('animate-pulse', busy);
        }
    }

    /**
     * The border of the box says whether every pasted line is an album.
     * @param {'empty'|'valid'|'invalid'} state - models/bulkPaste.js, bulkInputState
     */
    setBulkInputState(state) {
        const input = this.$('#bulkPasteInput');
        if (!input) return;
        input.classList.toggle('border-white/10', state === 'empty');
        input.classList.toggle('border-green-500', state === 'valid');
        input.classList.toggle('bg-green-900/10', state === 'valid');
        input.classList.toggle('border-orange-500', state === 'invalid');
    }

    /**
     * The lines of the pasted list that did not go in, under the box. An empty list hides it.
     * @param {Array<{ line: number, text: string, why: string }>} report - models/bulkPaste.js, bulkOutcome
     */
    renderBulkReport(report) {
        const box = this.$('#bulkPasteReport');
        if (!box) return;
        SafeDOM.clear(box);
        box.classList.toggle('hidden', report.length === 0);
        if (report.length === 0) return;

        box.appendChild(SafeDOM.p({ className: 'font-bold mb-1' }, `Skipped lines (${report.length})`));
        box.appendChild(SafeDOM.ul({ className: 'space-y-1 list-disc pl-4' },
            report.map(item => SafeDOM.li({}, `Line ${item.line}: «${item.text}» — ${item.why}`))
        ));
    }

    /**
     * Draw the filter buttons from the picker's state: which are on, how many albums each has.
     * @param {Object} filters - { albums: boolean, eps: boolean, ... } (models/albumPicker.js)
     * @param {Object} counts - { albums: n, eps: n, ... }
     */
    renderFilters(filters, counts) {
        PICKER_FILTERS.forEach(({ key }) => {
            drawFilterButton(this.$(`#${FILTER_BUTTON_IDS[key]}`), filters[key], counts[key]);
        });
    }

    /**
     * Draw the scan from its state (F67): the one place that says what the Scan button, the
     * status line and the panel show. The albums of the results state are drawn by the
     * discography renderer; every other state has its message here.
     * @param {Object} scan - a state of models/scanState.js
     */
    renderScan(scan) {
        const shown = describeScan(scan);
        drawScanButton(this.$('#btnScanArtist'), shown);

        const status = this.$('#statusArtistName');
        if (status) status.textContent = shown.statusLine;

        const grid = this.$('#discographyGrid');
        if (grid && shown.panel) {
            SafeDOM.clear(grid);
            grid.appendChild(createScanPanel(shown.panel, { retryId: RETRY_BUTTON_ID }));
        }
    }
}
