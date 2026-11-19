/**
 * Pager
 *
 * The paging controls of a list of series: how many are shown out of how many, the size of a page
 * (10 to 100), and the two ways to move on - numbered pages, or a list that grows when the person
 * reaches its end. It only shows and reports; the controller owns the page (arch.md, seção 16).
 *
 * When a filter reads facts that some album queries do not have yet, it also says how many
 * (`paging.unchecked`). With one series on screen (`paging.single`) only that notice is shown.
 *
 * Props: { paging: { mode, size, page, pages, total, from, to, hasMore, totalSeries, unchecked, single },
 *          onPage(page), onSize(size), onMode(mode), onMore() }
 */
import Component from '../base/Component.js';
import { PAGE_SIZES, PagingMode } from '../../models/paging.js';

/** At most this many page buttons; the rest collapses into "…". */
const MAX_PAGE_BUTTONS = 9;

export default class Pager extends Component {
    constructor(config) {
        super(config);
        this._signature = null;
        this._observer = null;
    }

    update(newProps) {
        this.props = { ...this.props, ...newProps };
        const signature = JSON.stringify(this.props.paging || null);
        if (signature === this._signature) return; // nothing to redraw: keeps focus and the observer
        this.render();
    }

    render() {
        const paging = this.props.paging;
        this._signature = JSON.stringify(paging || null);
        this._observer?.disconnect();

        if (!paging || paging.totalSeries === 0) {
            this.container.innerHTML = '';
            return;
        }

        const notice = this._renderUnchecked(paging);
        if (paging.single) {
            this.container.innerHTML = notice ? `<div class="series-pager glass-panel p-4 mt-6">${notice}</div>` : '';
            return;
        }

        const scroll = paging.mode === PagingMode.SCROLL;
        const filtered = paging.total < paging.totalSeries ? ` (of ${paging.totalSeries} in all)` : '';
        const count = paging.total === 0
            ? 'No series matches these filters'
            : `Showing <b class="text-white">${paging.from}–${paging.to}</b> of <b class="text-white">${paging.total}</b> series${filtered}`;

        this.container.innerHTML = `
            <div class="series-pager glass-panel p-4 mt-6 flex flex-col gap-4" data-paging-mode="${paging.mode}">
                <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
                    <p class="series-pager-count" aria-live="polite">${count}</p>
                    <div class="flex flex-wrap items-center gap-3">
                        <label class="flex items-center gap-2">Series per page
                            <select class="series-pager-size form-control text-sm py-1" aria-label="Series per page">
                                ${PAGE_SIZES.map(size => `<option value="${size}" ${size === paging.size ? 'selected' : ''}>${size}</option>`).join('')}
                            </select>
                        </label>
                        <div class="flex rounded-lg overflow-hidden border border-white/10" role="group" aria-label="Paging form">
                            <button type="button" data-pager-mode="${PagingMode.PAGES}" aria-pressed="${!scroll}"
                                class="px-3 py-1 text-xs ${!scroll ? 'bg-brand-orange text-white' : 'bg-brand-dark/50 text-gray-400 hover:text-white'}">Pages</button>
                            <button type="button" data-pager-mode="${PagingMode.SCROLL}" aria-pressed="${scroll}"
                                class="px-3 py-1 text-xs ${scroll ? 'bg-brand-orange text-white' : 'bg-brand-dark/50 text-gray-400 hover:text-white'}">Scroll</button>
                        </div>
                    </div>
                </div>
                ${notice}
                ${scroll ? this._renderMore(paging) : this._renderPages(paging)}
            </div>`;

        this._bind(paging);
    }

    /** The filter in use reads facts some albums do not have yet: say how many, and when they will. */
    _renderUnchecked(paging) {
        const count = Number(paging.unchecked) || 0;
        if (count <= 0) return '';
        const albums = count === 1 ? '1 album has' : `${count} albums have`;
        return `<p class="series-pager-unchecked text-xs text-amber-400" role="status">${albums} not been checked against the sources yet, so this filter may miss ${count === 1 ? 'it' : 'them'}. An album is checked the first time its series loads.</p>`;
    }

    _renderPages(paging) {
        if (paging.pages <= 1) return '';
        const button = (page, label = page, extra = '') => `
            <button type="button" data-pager-page="${page}" ${extra}
                class="min-w-[2.25rem] px-3 py-1.5 rounded-lg border text-sm ${page === paging.page && label === page ? 'bg-brand-orange border-brand-orange text-white font-bold' : 'bg-brand-dark/50 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'} disabled:opacity-40 disabled:cursor-default">${label}</button>`;

        const numbers = this._pageNumbers(paging.page, paging.pages).map(page =>
            page === null ? '<span class="px-1 text-gray-500">…</span>' : button(page, page, page === paging.page ? 'aria-current="page"' : '')).join('');

        return `
            <nav class="series-pager-pages flex flex-wrap items-center justify-center gap-2" aria-label="Pages">
                ${button(paging.page - 1, 'Previous', paging.page === 1 ? 'disabled' : '')}
                ${numbers}
                ${button(paging.page + 1, 'Next', paging.page === paging.pages ? 'disabled' : '')}
            </nav>`;
    }

    /** Page numbers to show; null marks a gap. */
    _pageNumbers(current, pages) {
        if (pages <= MAX_PAGE_BUTTONS) return Array.from({ length: pages }, (_, i) => i + 1);
        const keep = new Set([1, 2, pages - 1, pages, current - 1, current, current + 1]);
        const list = [];
        for (let page = 1; page <= pages; page++) {
            if (keep.has(page)) list.push(page);
            else if (list[list.length - 1] !== null) list.push(null);
        }
        return list;
    }

    _renderMore(paging) {
        if (!paging.hasMore) {
            return paging.total > 0 ? `<p class="text-center text-sm text-gray-500">All ${paging.total} series are on screen.</p>` : '';
        }
        const next = Math.min(paging.size, paging.total - paging.to);
        return `
            <div class="series-pager-more text-center text-sm text-gray-500" data-pager-sentinel>
                <button type="button" data-pager-more class="btn btn-secondary btn-sm">Load ${next} more</button>
            </div>`;
    }

    _bind(paging) {
        const { onPage, onSize, onMode, onMore } = this.props;

        this.container.querySelector('.series-pager-size')?.addEventListener('change', (e) => onSize?.(Number(e.target.value)));
        this.container.querySelectorAll('[data-pager-mode]').forEach(button =>
            button.addEventListener('click', () => { if (button.dataset.pagerMode !== paging.mode) onMode?.(button.dataset.pagerMode); }));
        this.container.querySelectorAll('[data-pager-page]').forEach(button =>
            button.addEventListener('click', () => { if (!button.disabled) onPage?.(Number(button.dataset.pagerPage)); }));
        this.container.querySelector('[data-pager-more]')?.addEventListener('click', () => onMore?.());

        // The growing list: reaching its end asks for the next batch, once per draw.
        const sentinel = this.container.querySelector('[data-pager-sentinel]');
        if (sentinel && typeof IntersectionObserver !== 'undefined') {
            let asked = false;
            this._observer = new IntersectionObserver((entries) => {
                if (asked || !entries.some(entry => entry.isIntersecting)) return;
                asked = true;
                onMore?.();
            }, { rootMargin: '0px 0px 300px 0px' });
            this._observer.observe(sentinel);
        }
    }

    onUnmount() {
        this._observer?.disconnect();
        this._observer = null;
    }
}
