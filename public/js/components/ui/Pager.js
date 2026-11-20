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
 * The list has one pager below it and one above (F72): the one above (`place: 'top'`) shows the
 * same count, page size, form and page numbers, so the person does not go to the end of a long
 * page to move on. It leaves to the one below what belongs to the end of the list: the notice
 * about unchecked albums, "Load N more" and the watch that asks for more when the end is reached.
 *
 * On the phone (F76, REQ-05) the same behaviour is drawn for the finger: the pager above is one
 * line (the count, and Previous / Next of 44 px in the pages form), so the albums are not pushed
 * down; the one below holds the page size, the form, and Previous · «Page n of m» (a field that
 * jumps to any page) · Next. Drawn only when isPhone(); a turn of the phone draws it again.
 *
 * Props: { paging: { mode, size, page, pages, total, from, to, hasMore, totalSeries, albums, unchecked, single },
 *          place: 'bottom' (default) | 'top', onPage(page), onSize(size), onMode(mode), onMore() }
 */
import Component from '../base/Component.js';
import { PAGE_SIZES, PagingMode } from '../../models/paging.js';
import { isPhone, onPhoneChange } from '../../utils/isPhone.js';
import { getIcon } from '../Icons.js';

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

        const top = this.props.place === 'top';
        const notice = top ? '' : this._renderUnchecked(paging);
        if (paging.single) {
            this.container.innerHTML = notice ? `<div class="series-pager glass-panel p-4 mt-6">${notice}</div>` : '';
            return;
        }

        this.container.innerHTML = isPhone() ? this._renderPhonePager(paging, top, notice) : this._renderPager(paging, top, notice);

        this._bind(paging);
    }

    /** «Showing 1–20 of 48 series · 230 albums», or that no series matches. */
    _count(paging, showing = 'Showing ') {
        const filtered = paging.total < paging.totalSeries ? ` (of ${paging.totalSeries} in all)` : '';
        return paging.total === 0
            ? 'No series matches these filters'
            : `${showing}<b class="text-white">${paging.from}–${paging.to}</b> of <b class="text-white">${paging.total}</b> series${filtered}${this._albumsOnScreen(paging)}`;
    }

    /** The box of the pager: the count, the page size, the form, and the way to move on. */
    _renderPager(paging, top, notice) {
        const scroll = paging.mode === PagingMode.SCROLL;
        const count = this._count(paging);

        return `
            <div class="series-pager glass-panel p-4 ${top ? 'mb-6' : 'mt-6'} flex flex-col gap-4" data-paging-mode="${paging.mode}" data-pager-place="${top ? 'top' : 'bottom'}">
                <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
                    <p class="series-pager-count" ${top ? '' : 'aria-live="polite"'}>${count}</p>
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
                ${scroll ? (top ? '' : this._renderMore(paging)) : this._renderPages(paging)}
            </div>`;
    }

    /** The phone's pager: one line above the list; below it, the settings and the way to move on. */
    _renderPhonePager(paging, top, notice) {
        const scroll = paging.mode === PagingMode.SCROLL;
        const paged = !scroll && paging.pages > 1;
        if (top) {
            const arrows = paged ? `
                <div class="series-pager-arrows">
                    ${this._phoneStep(paging, -1)}
                    ${this._phoneStep(paging, 1)}
                </div>` : '';
            return `
            <div class="series-pager series-pager--phone series-pager--phone-top" data-paging-mode="${paging.mode}" data-pager-place="top">
                <p class="series-pager-count">${this._count(paging, '')}</p>
                ${arrows}
            </div>`;
        }
        return `
            <div class="series-pager series-pager--phone" data-paging-mode="${paging.mode}" data-pager-place="bottom">
                <p class="series-pager-count" aria-live="polite">${this._count(paging)}</p>
                ${notice}
                ${scroll ? this._renderMore(paging) : (paged ? this._renderPhonePages(paging) : '')}
                <div class="series-pager-settings">
                    <label class="series-pager-size-label">Series per page
                        <select class="series-pager-size form-control" aria-label="Series per page">
                            ${PAGE_SIZES.map(size => `<option value="${size}" ${size === paging.size ? 'selected' : ''}>${size}</option>`).join('')}
                        </select>
                    </label>
                    <div class="series-pager-form" role="group" aria-label="Paging form">
                        <button type="button" data-pager-mode="${PagingMode.PAGES}" aria-pressed="${!scroll}">Pages</button>
                        <button type="button" data-pager-mode="${PagingMode.SCROLL}" aria-pressed="${scroll}">Scroll</button>
                    </div>
                </div>
            </div>`;
    }

    /** Previous (-1) or Next (+1), as a 44 px arrow with its name. */
    _phoneStep(paging, step) {
        const page = paging.page + step;
        const off = step < 0 ? paging.page === 1 : paging.page === paging.pages;
        const look = step < 0
            ? 'class="series-pager-step series-pager-step--back" aria-label="Previous page"'
            : 'class="series-pager-step" aria-label="Next page"';
        return `<button type="button" ${look} data-pager-page="${page}" ${off ? 'disabled' : ''}>${getIcon('ChevronRight', 'series-pager-step__icon')}</button>`;
    }

    /** Previous · «Page n of m» (jumps to any page) · Next. */
    _renderPhonePages(paging) {
        const options = Array.from({ length: paging.pages }, (_, i) => i + 1)
            .map(page => `<option value="${page}" ${page === paging.page ? 'selected' : ''}>Page ${page} of ${paging.pages}</option>`).join('');
        return `
            <nav class="series-pager-pages series-pager-pages--phone" aria-label="Pages">
                ${this._phoneStep(paging, -1)}
                <select class="series-pager-jump form-control" aria-label="Go to page">${options}</select>
                ${this._phoneStep(paging, 1)}
            </nav>`;
    }

    /** How many albums the series on screen hold: this page, or what the scroll has loaded so far (F72). */
    _albumsOnScreen(paging) {
        const count = Number(paging.albums);
        if (!Number.isFinite(count) || paging.albums === undefined || paging.albums === null) return '';
        return ` · <b class="text-white">${count}</b> ${count === 1 ? 'album' : 'albums'}`;
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
        this.container.querySelector('.series-pager-jump')?.addEventListener('change', (e) => onPage?.(Number(e.target.value)));

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

    onMount() {
        // The phone and the computer draw the pager differently: a turn across the line draws it again
        this._stopHearingPhone = onPhoneChange(() => this.render());
    }

    onUnmount() {
        this._stopHearingPhone?.();
        this._observer?.disconnect();
        this._observer = null;
    }
}
