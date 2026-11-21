/**
 * AlbumCascade - a stack of album covers in a diagonal cascade, for a React screen (F83 wave 1; the port of
 * components/common/AlbumCascade.js).
 *
 * The same element with the same classes and the same sizes: up to three covers, each 10 px to the right and 6 px lower than the
 * one before, the first on top; with none, a stand-in with a music note. The hand-made one stays for the Blend screen, which
 * writes it as text (`render()`), until that screen migrates (wave 7); a test keeps the two the same.
 */
import { CoverImage } from './CoverImage'
import { Icon } from './Icon'
import { t } from '../i18n/t.js'

const BASE_SIZE = 40
const X_OFFSET = 10
const Y_OFFSET = 6

export function AlbumCascade({ thumbnails = [], max = 3 }: { thumbnails?: (string | null)[]; max?: number }) {
    const items = thumbnails.slice(0, max)
    if (items.length === 0) {
        return (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center border border-white/10">
                <Icon name="Music" className="w-6 h-6 text-orange-400" />
            </div>
        )
    }
    const width = BASE_SIZE + (items.length - 1) * X_OFFSET
    const height = BASE_SIZE + (items.length - 1) * Y_OFFSET
    return (
        <div className="relative shrink-0 album-cascade" style={{ width: `${width}px`, height: `${height}px` }}>
            {items.map((url, i) => (
                <CoverImage
                    key={i}
                    src={url}
                    alt={t('ui.cover.alt')}
                    className="w-10 h-10 rounded-md object-cover shadow-lg border border-white/20 absolute transition-transform hover:scale-105 hover:z-50"
                    style={{ left: `${i * X_OFFSET}px`, top: `${i * Y_OFFSET}px`, zIndex: items.length - i }}
                />
            ))}
        </div>
    )
}
