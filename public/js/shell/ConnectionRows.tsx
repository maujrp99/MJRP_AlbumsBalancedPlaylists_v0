/**
 * ConnectionRows - the rows of the connections in the panel of the computer and in the sheet of the phone (F88; F83 sync of main: was drawn by
 * components/navigation/connections.js): Apple Music first, then Spotify, each with its state in words and the one action that fits.
 * What a service says about the person (the name of the account) is a text node, never HTML.
 *
 * `useConnections` makes the model for the life of the part that holds it (the panel, or the sheet) and lets it listen to the services only
 * while that part is on the page. When a row is redrawn the focus stays in it, even while its button is gone (connecting).
 */
import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Icon } from '../ui/Icon'
import { countListener } from '../react-bridge/listeners'
import { NAME_IN_THE_BAR } from './barName'
import { ConnectionsModel, SERVICES, describeConnection, realConnections, type ConnectionDeps, type ServiceKey } from './connections'
import { MENU_TEXT } from './menuText'

export function useConnections(deps: ConnectionDeps = realConnections()): ConnectionsModel {
    const [model] = useState(() => new ConnectionsModel(deps))
    const listen = useCallback((listener: () => void): (() => void) => {
        const release = countListener()
        const stop = model.subscribe(listener)
        return () => { stop(); release() }
    }, [model])
    useSyncExternalStore(listen, model.getVersion)
    return model
}

function Row({ service, view, onAction }: { service: (typeof SERVICES)[number]; view: ConnectionsModel['views'][ServiceKey]; onAction: (key: ServiceKey, action: 'connect' | 'disconnect') => void }) {
    const { text, action, actionLabel, busy, tone } = describeConnection(view)
    const named = view.state === 'connected' && view.detail
    return (
        <div className="conn" data-connection={service.key} data-state={view.state}>
            <span className={`conn__glyph conn__glyph--${service.key}`} aria-hidden="true"><Icon name={service.icon} className="w-4 h-4" /></span>
            <div className="conn__text">
                <div className="conn__name">{service.name}</div>
                <div className={`conn__status conn__status--${tone}`} role="status" aria-busy={busy ? 'true' : 'false'} data-status="">
                    {named ? <span className={NAME_IN_THE_BAR} data-spotify-name="" title={view.detail ?? undefined}>{text}</span> : text}
                </div>
            </div>
            {action ? (
                <button type="button" className={`conn__button conn__button--${action}`} aria-label={`${action === 'disconnect' ? MENU_TEXT.disconnect : actionLabel} ${service.name}`} data-action={action} onClick={() => onAction(service.key, action)}>{actionLabel}</button>
            ) : null}
        </div>
    )
}

/** The rows of a model. `id` and `className` are the box's own (the panel and the sheet have each their own). */
export function ConnectionRows({ model, id, className }: { model: ConnectionsModel; id: string; className?: string }) {
    const box = useRef<HTMLDivElement>(null)
    // Just before the rows change the focus is noted: if it is in a row, it goes back there
    model.beforeChange = () => {
        const inside = box.current?.contains(document.activeElement) ? document.activeElement : null
        model.keepFocusIn = (inside?.closest('[data-connection]') as HTMLElement | null)?.dataset.connection as ServiceKey | undefined ?? model.keepFocusIn
    }
    useLayoutEffect(() => {
        const key = model.keepFocusIn
        const back = key && box.current?.querySelector<HTMLElement>(`[data-connection="${key}"] button`)
        if (back) { back.focus(); model.keepFocusIn = null }
    })
    return (
        <div id={id} className={className} ref={box}>
            {SERVICES.map(service => <Row key={service.key} service={service} view={model.views[service.key]} onAction={model.run} />)}
        </div>
    )
}
