/**
 * CoverImage - the image of an album cover, for a React screen (F83 wave 1; the port of components/ui/coverImage.js).
 *
 * The same image the hand-made screens draw: marked `data-cover`, with no address (or an address that fails to load) it shows
 * the one stand-in. The failure is heard once on the document by `watchCovers` of the old module (an `error` is seen on the way
 * down, in the capture phase, so it works for an image React drew as it does for one drawn by hand): the address of the stand-in
 * and the listener are the old module's, so there is one of each for the whole site. The element is keyed by its address, so a
 * cover whose address changes is a new image and not one that already shows the stand-in.
 */
import { COVER_STAND_IN, watchCovers } from '../components/ui/coverImage.js'

export interface CoverImageProps {
    src?: string | null
    alt: string
    className?: string
    style?: React.CSSProperties
}

const hasAddress = (src: string | null | undefined): src is string => typeof src === 'string' && src.trim().length > 0

export function CoverImage({ src, alt, className, style }: CoverImageProps) {
    watchCovers() // asked any number of times, it listens once
    const withAddress = hasAddress(src)
    return (
        <img
            key={withAddress ? src : 'stand-in'}
            alt={alt}
            className={className}
            style={style}
            data-cover="true"
            data-cover-stand-in={withAddress ? undefined : 'true'}
            src={withAddress ? src : COVER_STAND_IN}
        />
    )
}
