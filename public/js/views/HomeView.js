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
    <div class="h-[calc(100vh-64px)] overflow-hidden flex flex-col md:flex-row relative">
        
        <!-- Background (Dynamic Flame) -->
        <div class="absolute inset-0 z-0 pointer-events-none">
            <img src="/assets/images/hero_bg.svg" class="w-full h-full object-cover opacity-30" alt="bg">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        </div>

        <!-- LEFT PANEL (Controls) - 40% Width -->
        <aside class="relative z-10 w-full md:w-[400px] lg:w-[450px] h-full flex flex-col border-r border-white/10 glass-panel shadow-2xl shrink-0 bg-black/60 backdrop-blur-md">
            
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
                
                <!-- 1. Series Name -->
                <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">01 // Series Name</label>
                    <input type="text" id="seriesNameInput" value="Start Your Series" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 focus:outline-none transition-colors" placeholder="Name your series...">
                </div>

                <!-- 2. Search / Bulk Toggle -->
                <div class="tech-panel rounded-xl p-0 border border-white/10 bg-black/40 relative overflow-hidden">
                    <!-- Tech Stripe -->
                    <div class="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>

                    <div class="bg-black/40 p-3 border-b border-white/5 flex justify-between items-center pl-4">
                        <span class="text-xs font-bold text-orange-500 uppercase">02 // Input Method</span>
                        <div class="flex gap-2">
                            <button id="btnModeVisual" class="text-[10px] bg-orange-500 text-white px-2 py-1 rounded hover:opacity-80 transition-opacity">Visual</button>
                            <button id="btnModeBulk" class="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors">Bulk</button>
                        </div>
                    </div>
                    
                    <div class="p-4 space-y-4">
                        <!-- Visual Search Mode -->
                        <div id="visualInputs" class="relative">
                            <span class="absolute left-3 top-3 text-gray-500 w-5 h-5 flex items-center justify-center">${getIcon('Search', 'w-4 h-4')}</span>
                            <input type="text" id="artistScanInput" class="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all" placeholder="Scan Artist Discography...">
                            <button id="btnScanArtist" class="absolute right-2 top-2 bg-white/10 hover:bg-white/20 p-1.5 rounded-md text-gray-300 transition-colors">
                                ${getIcon('ScanLine', 'w-4 h-4')}
                            </button>
                        </div>

                        <!-- Bulk Mode (Hidden by Default) -->
                        <div id="bulkInputs" class="hidden">
                            <textarea id="bulkPasteInput" class="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-mono text-white focus:border-orange-500 focus:outline-none custom-scrollbar" placeholder="Paste: Artist - Album&#10;One per line..."></textarea>
                        </div>
                        
                        <div class="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 p-2 rounded border border-green-500/20">
                            ${getIcon('CheckCircle', 'w-3 h-3')}
                            <span>Ready to scan Apple Music Catalog</span>
                        </div>
                    </div>
                </div>

                <!-- 3. Staging Area (Stack) -->
                <div class="flex-1 min-h-[200px] flex flex-col">
                    <div class="flex justify-between items-end mb-2">
                        <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">03 // Staging Stack</label>
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

        <!-- RIGHT PANEL (Results) - Remaining Width -->
        <main class="flex-1 relative h-full overflow-hidden flex flex-col bg-black/20">
            
            <!-- Top Toolbar (Sticky) -->
            <div class="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
                
                <!-- Breadcrumbs / Status -->
                <div class="flex items-center gap-2 text-sm text-gray-400">
                    <span>Discography Scan</span>
                    ${getIcon('ChevronRight', 'w-4 h-4')}
                    <span id="statusArtistName" class="text-white font-bold">Waiting...</span>
                </div>

                <!-- Filters -->
                <div class="flex items-center gap-2">
                    <button class="px-3 py-1.5 rounded-lg bg-flame-gradient text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2">
                        ${getIcon('Disc', 'w-3 h-3')} Albums
                    </button>
                    <!-- More filters can be re-enabled via Controller later -->
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
}
