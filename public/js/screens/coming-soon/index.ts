/**
 * The route of the «Coming soon» screen: what app.js asks for when the person opens /artists, /genres or /tracks. A view the
 * router can mount (the bridge makes it one), named `coming_soon` for the measurement of use.
 */
import { ReactView } from '../../react-bridge/ReactView'
import { ComingSoon, type ComingSoonKind } from './ComingSoon'

export function comingSoonView(kind: ComingSoonKind) {
    return new ReactView(ComingSoon, { kind }, { screen: 'coming_soon' })
}
