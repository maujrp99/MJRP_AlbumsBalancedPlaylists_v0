import { BaseView } from './BaseView.js';
import { getIcon } from '../components/Icons.js';
import { HomeController } from '../controllers/HomeController.js';
import { showVariantPickerModal } from '../components/search/VariantPickerModal.js';

export class HomeView extends BaseView {
    constructor() {
        super();
        this.controller = null;
    }

    async render(params) {
        this.setTitle('Home - Album Blender V3');

        // V3 Split-Panel Layout (Nano/Flame Style)
        // Structure taken from static_prototype_v3.html
        return `
    <div class="min-h-[calc(100vh-64px)] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row relative">
        
        <!-- Background (Dynamic Flame) -->
        <div class="absolute inset-0 z-0 pointer-events-none">
            <img src="/assets/images/hero_bg.svg" class="w-full h-full object-cover opacity-30" alt="bg">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        </div>

        <!-- LEFT PANEL (Controls) - Full width on mobile, fixed width on desktop -->
        <aside class="relative z-10 w-full md:w-[400px] lg:w-[450px] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-white/10 glass-panel shadow-2xl shrink-0 bg-black/60 backdrop-blur-md">
            
            <!-- Header / Brand -->
            <div class="p-6 border-b border-white/5 flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    ${getIcon('Music', 'text-white w-6 h-6')}
                </div>
                <div>
                    <h1 class="font-syne font-bold text-xl text-white tracking-wide">Album Blender <span class="text-orange-500 text-xs align-top">V3</span></h1>
                    <p class="text-xs text-gray-500 uppercase tracking-widest">Balanced Playlist Generator</p>
                </div>
            </div>

            <!-- Scrollable Content in Left Panel -->
            <div class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                <!-- 1. Series Configuration -->
                <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">01 // Series Configuration</label>
                    <span class="text-[10px] text-gray-500 uppercase tracking-wider block">Your Albums Series Name</span>
                    <input type="text" id="seriesNameInput" value="" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 focus:outline-none transition-colors" placeholder="e.g., 'Summer Vibes 2024'">
                </div>

                <!-- 2. Search / Bulk Toggle -->
                <div class="tech-panel rounded-xl p-0 border border-white/10 bg-black/40 relative overflow-hidden">
                    <!-- Tech Stripe -->
                    <div class="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>

                    <div class="bg-black/40 p-3 border-b border-white/5 flex justify-between items-center pl-4">
                        <span class="text-xs font-bold text-orange-500 uppercase">02a // Artist Filter</span>
                        <div class="flex gap-2">
                            <button id="btnModeVisual" class="text-[10px] bg-orange-500 text-white px-2 py-1 rounded hover:opacity-80 transition-opacity">Visual</button>
                            <button id="btnModeBulk" class="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors">Bulk Paste</button>
                        </div>
                    </div>
                    
                    <div class="p-4 space-y-4">
                        <!-- Visual Search Mode -->
                        <div id="visualInputs" class="flex gap-3 items-stretch">
                            <div class="flex-1 relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">${getIcon('Search', 'w-4 h-4')}</span>
                                <input type="text" id="artistScanInput" 
                                       style="background-color: #111 !important; color: #fff !important;" 
                                       class="w-full border border-white/10 rounded-lg py-3 pl-10 pr-3 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all" 
                                       placeholder="Type artist name...">
                            </div>
                            <button id="btnScanArtist" class="min-w-[100px] px-5 py-3 bg-flame-gradient rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shrink-0">
                                ${getIcon('ScanLine', 'w-4 h-4')}
                                <span>Scan</span>
                            </button>
                        </div>

                        <!-- Bulk Mode (Hidden by Default) -->
                        <div id="bulkInputs" class="hidden">
                            <textarea id="bulkPasteInput" class="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-mono text-white focus:border-orange-500 focus:outline-none custom-scrollbar" placeholder="Paste: Artist - Album&#10;One per line..."></textarea>
                        </div>
                        
                        <div class="flex items-center gap-2 text-xs text-gray-500 p-2">
                            ${getIcon('Info', 'w-3 h-3')}
                            <span>Filtering by artist unlocks the verified discography grid.</span>
                        </div>
                    </div>
                </div>

                <!-- 3. Selected Albums -->
                <div class="flex-1 min-h-[200px] flex flex-col">
                    <div class="flex justify-between items-end mb-2">
                        <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">03 // Selected Albums</label>
                        <span id="stagingCount" class="text-xs text-orange-500 font-mono">(0 Albums)</span>
                    </div>
                    
                    <div id="stagingStackContainer" class="flex-1 bg-black/20 rounded-xl border border-white/5 p-2 space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                        <!-- Dynamic Stack Items Here -->
                        <div class="text-center text-xs text-gray-500 py-10">Stack Empty</div>
                    </div>
                </div>

            </div>

            <!-- Footer Action (Sticky) -->
            <div class="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md z-20">
                <button id="btnInitializeLoad" class="w-full bg-flame-gradient text-white font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:shadow-[0_0_30px_rgba(255,85,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <span>Initialize Load Sequence</span>
                    ${getIcon('ArrowRight', 'w-5 h-5')}
                </button>
            </div>
        </aside>

        <!-- RIGHT PANEL (Results) - Remaining Width, visible on mobile -->
        <main class="flex-1 relative min-h-[50vh] md:h-full overflow-hidden flex flex-col bg-black/20">
            
            <!-- Top Toolbar (Sticky) -->
            <div class="min-h-14 border-b border-white/5 bg-black/40 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 md:px-6 shrink-0 z-20 gap-2">
                
                <!-- Section Header - Matching 2a style -->
                <div class="flex items-center gap-3 shrink-0">
                    <span class="text-xs font-bold text-orange-500 uppercase tracking-widest">02b // Discography Scan</span>
                    <span id="statusArtistName" class="text-sm text-white font-bold truncate max-w-[200px]"></span>
                </div>

                <!-- Filters - Horizontal scroll on mobile -->
                <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
                    <button id="btnFilterAlbums" class="filter-btn px-3 py-1.5 rounded-lg bg-flame-gradient text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0" data-filter="albums">
                        ${getIcon('Disc', 'w-3 h-3')} <span>Studio</span>
                    </button>
                    <button id="btnFilterSingles" class="filter-btn px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold border border-white/5 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0" data-filter="singles">
                        ${getIcon('Music2', 'w-3 h-3')} <span>Singles/EP</span>
                    </button>
                    <button id="btnFilterLive" class="filter-btn px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold border border-white/5 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0" data-filter="live">
                        ${getIcon('Mic2', 'w-3 h-3')} <span>Live</span>
                    </button>
                    <button id="btnFilterCompilations" class="filter-btn px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold border border-white/5 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0" data-filter="compilations">
                        ${getIcon('Library', 'w-3 h-3')} <span>Compilations</span>
                    </button>
                </div>
            </div>

            <!-- Scrollable Grid -->
            <div id="discographyGridContainer" class="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div id="discographyGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
                    <!-- Dynamic Grid Items Here -->
                     <div class="col-span-full flex flex-col items-center justify-center text-gray-600 space-y-4 py-20">
                        ${getIcon('Search', 'w-12 h-12 opacity-20')}
                        <p>Search for an artist to begin scanning.</p>
                     </div>
                </div>
            </div>
        </main>
    </div>
    `;
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
            if (btn) btn.innerHTML = `<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>`;
            if (grid) grid.classList.add('opacity-50', 'pointer-events-none');
            if (status) status.textContent = "Scanning...";
        } else {
            if (btn) btn.innerHTML = `${getIcon('ScanLine', 'w-4 h-4')} <span>Scan</span>`;
            if (grid) grid.classList.remove('opacity-50', 'pointer-events-none');
        }
    }
}
