/**
 * VariantPickerModal
 * 
 * Helper modal to allow users to choose between variations of an album
 * (Standard, Deluxe, Remastered) when they click a grouped album card.
 */
import { escapeHtml } from '../../utils/stringUtils.js';
import { getIcon } from '../Icons.js';

export function showVariantPickerModal(albumGroup, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay animate-fade-in';

    const variantsHtml = albumGroup.variants.map((v, idx) => `
    <div class="variant-row flex items-center p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer group"
         data-id="${v.id}"
    >
        <div class="chk-container mr-4">
             <input type="checkbox" 
                    id="chk-${v.id}" 
                    value="${v.id}" 
                    class="form-checkbox w-5 h-5 text-accent-primary rounded border-gray-600 bg-black/40 focus:ring-accent-primary focus:ring-offset-0 transition duration-150 ease-in-out"
                    ${idx === 0 ? 'checked' : ''} 
             />
        </div>
        
        <div class="flex-1 min-w-0">
            <h4 class="font-bold text-white text-sm truncate pr-2 group-hover:text-accent-primary transition-colors">
                ${escapeHtml(v.title)}
            </h4>
            <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-gray-400 font-mono">${v.year}</span>
                ${v.trackCount ? `<span class="text-xs bg-surface-light px-1.5 rounded text-gray-300">${v.trackCount} trk</span>` : ''}
            </div>
            ${getBadges(v.title)}
        </div>

        <div class="w-12 h-12 rounded bg-surface-dark overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-accent-primary/50 transition-colors">
            ${v.coverUrl ? `<img src="${v.coverUrl}" class="w-full h-full object-cover">` : ''}
        </div>
    </div>
  `).join('');

    modal.innerHTML = `
    <div class="modal-container glass-panel max-w-lg w-full m-4 shadow-2xl transform transition-all scale-100">
      <div class="modal-header p-5 border-b border-white/10 bg-surface-darker/50">
        <h3 class="text-xl font-bold flex items-center gap-2">
            ${getIcon('Layers', 'w-5 h-5 text-accent-primary')}
            Select Version
        </h3>
        <p class="text-xs text-gray-400 mt-1">Found ${albumGroup.variants.length} editions for "${escapeHtml(albumGroup.title)}"</p>
      </div>

      <div class="modal-content p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
        ${variantsHtml}
      </div>

      <div class="modal-footer p-5 border-t border-white/10 bg-surface-darker/30 flex justify-between items-center">
        <div class="text-xs text-gray-500">
            <button class="hover:text-white underline decoration-dotted" data-action="selectAll">Select All</button>
        </div>
        <div class="flex gap-3">
             <button class="btn btn-secondary btn-sm" data-action="cancel">Cancel</button>
             <button class="btn btn-primary btn-sm px-6" data-action="confirm">
                Add Selected
             </button>
        </div>
      </div>
    </div>
  `;

    // Helper Logic
    function getBadges(title) {
        const t = title.toLowerCase();
        let badges = '';
        if (t.includes('deluxe')) badges += `<span class="badge badge-warning text-[10px] ml-1">Deluxe</span>`;
        if (t.includes('remaster')) badges += `<span class="badge badge-info text-[10px] ml-1">Remaster</span>`;
        if (t.includes('live')) badges += `<span class="badge badge-error text-[10px] ml-1">Live</span>`;
        return badges ? `<div class="mt-1 flex flex-wrap gap-1">${badges}</div>` : '';
    }

    // Interaction
    const close = () => {
        modal.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('[data-action="cancel"]').addEventListener('click', close);

    // Toggle checkbox on row click (if not clicking checkbox itself)
    modal.querySelectorAll('.variant-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                const chk = row.querySelector('input[type="checkbox"]');
                chk.checked = !chk.checked;
            }
        });
    });

    // Select All
    modal.querySelector('[data-action="selectAll"]').addEventListener('click', () => {
        const all = modal.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(all).every(c => c.checked);
        all.forEach(c => c.checked = !allChecked);
    });

    // Confirm
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        const selectedIds = Array.from(modal.querySelectorAll('input:checked')).map(cb => cb.value);

        if (selectedIds.length === 0) {
            // Toast warning? or just close?
            return;
        }

        // Map IDs back to full objects
        const selectedAlbums = albumGroup.variants.filter(v => selectedIds.includes(v.id));

        onConfirm(selectedAlbums);
        close();
    });

    // Click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    document.body.appendChild(modal);
}
