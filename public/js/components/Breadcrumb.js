import { router } from '../router.js'
import { escapeHtml } from '../utils/stringUtils.js'

/**
 * Breadcrumb Component
 * Displays navigation trail (Home > Albums > Ranking)
 */

export class Breadcrumb {
    static render(currentPath, params = {}) {
        const crumbs = this.getCrumbs(currentPath, params)

        if (crumbs.length <= 1) return '' // Don't show for home only

        return `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1

            if (isLast) {
                return `<span class="breadcrumb-current">${crumb.label}</span>`
            }

            return `
            <a href="${escapeHtml(crumb.path)}" class="breadcrumb-link" data-path="${escapeHtml(crumb.path)}">
              ${crumb.label}
            </a>
            <span class="breadcrumb-separator">›</span>
          `
        }).join('')}
      </nav>
    `
    }

    static getCrumbs(currentPath, params) {
        const crumbs = [{ label: 'Home', path: '/home' }]

        if (currentPath.startsWith('/albums')) {
            crumbs.push({ label: 'Albums', path: '/albums' })
        }

        if (currentPath.startsWith('/ranking')) {
            crumbs.push({ label: 'Albums', path: '/albums' })
            crumbs.push({ label: 'Ranking', path: currentPath })
        }

        // The playlists screen: a set that comes from the blend, or a saved batch being edited
        if (currentPath.startsWith('/playlists')) {
            crumbs.push(params.editing
                ? { label: 'Saved Playlists', path: '/saved-playlists' }
                : { label: 'Blend', path: '/blend' })
            crumbs.push({ label: params.editing ? 'Edit Batch' : 'Playlists', path: '/playlists' })
        }

        return crumbs
    }

    static attachListeners(container) {
        const links = container.querySelectorAll('.breadcrumb-link')
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()
                const path = link.dataset.path
                if (path) router.navigate(path)
            })
        })
    }
}
