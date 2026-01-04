import { BaseView } from './BaseView.js';
import { getIcon } from '../components/Icons.js';
import { HomeController } from '../controllers/HomeController.js';
import { SafeDOM } from '../utils/SafeDOM.js';

export class HomeView extends BaseView {
    constructor() {
        super();
        this.controller = null;
    }

    async render(params) {
        this.setTitle('Home - Album Blender V3');

        // Background
        const background = SafeDOM.div({ className: 'absolute inset-0 z-0 pointer-events-none' }, [
            SafeDOM.img({ src: '/assets/images/hero_bg.svg', className: 'w-full h-full object-cover opacity-30', alt: 'bg' }),
            SafeDOM.div({ className: 'absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent' })
        ]);

        // --- LEFT PANEL ---

        // Header
        const header = SafeDOM.div({ className: 'p-6 border-b border-white/5 flex items-center gap-3' }, [
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
        const seriesConfig = SafeDOM.div({ className: 'space-y-2' }, [
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
        const visualBtn = SafeDOM.button({ id: 'btnModeVisual', className: 'text-[10px] bg-orange-500 text-white px-2 py-1 rounded hover:opacity-80 transition-opacity' }, 'Visual');
        const bulkBtn = SafeDOM.button({ id: 'btnModeBulk', className: 'text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors' }, 'Bulk Paste');

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
                placeholder: 'Paste: Artist - Album\nOne per line...'
            }),
            parseBtn
        ]);

        const techPanel = SafeDOM.div({ className: 'tech-panel rounded-xl p-0 border border-white/10 bg-black/40 relative overflow-hidden' }, [
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
        const stagingArea = SafeDOM.div({ className: 'flex-1 min-h-[200px] flex flex-col' }, [
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

        const leftContent = SafeDOM.div({ className: 'flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar' }, [
            seriesConfig,
            techPanel,
            stagingArea
        ]);

        const initBtn = SafeDOM.button({ id: 'btnInitializeLoad', className: 'w-full bg-flame-gradient text-white font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:shadow-[0_0_30px_rgba(255,85,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2' });
        initBtn.appendChild(SafeDOM.span({}, 'Initialize Load Sequence'));
        initBtn.appendChild(SafeDOM.fromHTML(getIcon('ArrowRight', 'w-5 h-5')));

        const leftFooter = SafeDOM.div({ className: 'p-6 border-t border-white/10 bg-black/40 backdrop-blur-md z-20' }, [initBtn]);

        const leftPanel = SafeDOM.aside({ className: 'relative z-10 w-full md:w-[400px] lg:w-[450px] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-white/10 glass-panel shadow-2xl shrink-0 bg-black/60 backdrop-blur-md' }, [
            header,
            leftContent,
            leftFooter
        ]);

        // --- RIGHT PANEL ---

        // Toolbar
        const createFilterBtn = (id, icon, text, filter) => {
            const btn = SafeDOM.button({
                id,
                className: 'filter-btn px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold border border-white/5 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0',
                dataset: { filter }
            });
            btn.appendChild(SafeDOM.fromHTML(getIcon(icon, 'w-3 h-3')));
            btn.appendChild(SafeDOM.span({}, text));
            return btn;
        }

        const filterBtns = [
            createFilterBtn('btnFilterAlbums', 'Disc', 'Studio', 'albums'),
            createFilterBtn('btnFilterSingles', 'Music2', 'Singles/EP', 'singles'),
            createFilterBtn('btnFilterLive', 'Mic2', 'Live', 'live'),
            createFilterBtn('btnFilterCompilations', 'Library', 'Compilations', 'compilations')
        ];

        // Fix first button style
        filterBtns[0].className = 'filter-btn px-3 py-1.5 rounded-lg bg-flame-gradient text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0';

        const toolbar = SafeDOM.div({ className: 'min-h-14 border-b border-white/5 bg-black/40 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 md:px-6 shrink-0 z-20 gap-2' }, [
            SafeDOM.div({ className: 'flex items-center gap-3 shrink-0' }, [
                SafeDOM.span({ className: 'text-xs font-bold text-orange-500 uppercase tracking-widest' }, '02b // Discography Scan'),
                SafeDOM.span({ id: 'statusArtistName', className: 'text-sm text-white font-bold truncate max-w-[200px]' })
            ]),
            SafeDOM.div({ className: 'flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1' }, filterBtns)
        ]);

        // Grid
        const grid = SafeDOM.div({ id: 'discographyGrid', className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20' }, [
            SafeDOM.div({ className: 'col-span-full flex flex-col items-center justify-center text-gray-600 space-y-4 py-20' }, [
                SafeDOM.fromHTML(getIcon('Search', 'w-12 h-12 opacity-20')),
                SafeDOM.p({}, 'Search for an artist to begin scanning.')
            ])
        ]);

        const rightPanel = SafeDOM.main({ className: 'flex-1 relative min-h-[50vh] md:h-full overflow-hidden flex flex-col bg-black/20' }, [
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
    }

    // DOM Helpers for Controller
    updateModeUI(mode) {
        const visualBtn = this.$('#btnModeVisual');
        const bulkBtn = this.$('#btnModeBulk');
        const visualInputs = this.$('#visualInputs');
        const bulkInputs = this.$('#bulkInputs');
        const scanBtn = this.$('#btnScanArtist'); // Only enable scan in visual mode? No, handled by logic.

        if (mode === 'visual') {
            visualBtn.className = "text-[10px] bg-orange-500 text-white px-2 py-1 rounded hover:opacity-80 transition-opacity";
            bulkBtn.className = "text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors";
            visualInputs.classList.remove('hidden');
            bulkInputs.classList.add('hidden');
        } else {
            bulkBtn.className = "text-[10px] bg-orange-500 text-white px-2 py-1 rounded hover:opacity-80 transition-opacity";
            visualBtn.className = "text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors";
            bulkInputs.classList.remove('hidden');
            visualInputs.classList.add('hidden');
        }

    }

    setLoading(isLoading) {
        const btn = this.$('#btnScanArtist');
        const grid = this.$('#discographyGridContainer');
        const status = this.$('#statusArtistName');

        if (isLoading) {
            // Use SafeDOM for button content
            if (btn) {
                SafeDOM.clear(btn);
                btn.appendChild(SafeDOM.div({ className: 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' }));
            }
            if (grid) grid.classList.add('opacity-50', 'pointer-events-none');
            if (status) status.textContent = "Scanning...";
        } else {
            if (btn) {
                SafeDOM.clear(btn);
                btn.appendChild(SafeDOM.fromHTML(getIcon('ScanLine', 'w-4 h-4')));
                btn.appendChild(SafeDOM.span({}, 'Scan'));
            }
            if (grid) grid.classList.remove('opacity-50', 'pointer-events-none');
        }
    }
}
