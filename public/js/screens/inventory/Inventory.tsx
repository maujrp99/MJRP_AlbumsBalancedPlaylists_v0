/**
 * The inventory screen (/inventory) in React (F83 wave 6a; the old InventoryView and the pieces under it). One screen, drawn for the computer or for
 * the phone (the phone has its own top, its own bar and its own rows, F76 TASK-07, F89).
 *
 * The state, the filters, the order, the stats and the values are the controller's (controllers/InventoryController.js, one for each visit, kept in
 * JavaScript); it tells this screen «draw again» through the bridge (InventoryBridge) and the screen reads the controller at the moment it draws: the
 * lists are made anew each time, never kept (the controller changes them in place). Like the hand-made screen, the albums are drawn anew at each
 * full notice (the box has a new `key`: the focus on a card goes back to the page, the covers are asked again), a card whose value moved is swapped
 * alone, and the search field is the one thing that is kept.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { t } from '../../i18n/t.js'
import { showDiscogsNotice } from '../../stores/discogsNotice.js'
import { SourceState } from '../../models/inventoryValue.js'
import { navigate } from '../../react-bridge/navigation'
import { useFocusLikeAfterAnewDraw } from '../../react-bridge/useFocusLikeAfterAnewDraw'
import { useLocale } from '../../react-bridge/useLocale'
import { usePhone } from '../../react-bridge/usePhone'
import { Breadcrumb, inventoryTrail } from '../../ui/Breadcrumb'
import { Filters } from './Filters'
import { Grid } from './Grid'
import { Header } from './Header'
import { Notices, PhoneNotices } from './Notices'
import { PhoneTotals, Totals } from './Totals'
import { editItem, removeItem, viewItem } from './inventoryActions'
import type { InventoryBridge } from './InventoryBridge'
import type { ItemActions } from './ItemCard'
import { PhoneBar } from './phone/PhoneBar'
import { PhoneList } from './phone/PhoneList'
import type { PhoneActions } from './phone/PhoneRow'
import { usePhoneSheets } from './phone/Sheets'
import type { InventoryController } from './types'

interface Props {
    controller: InventoryController
    bridge: InventoryBridge
}

export function Inventory({ controller, bridge }: Props) {
    useSyncExternalStore(bridge.subscribe, bridge.getVersion)
    // the hand-made screen drew everything anew when the controller said `render`, and let the focus go (the search field kept it); a sheet that closes
    // and gives the focus back to its opener, or a value that moves in place, is not a full draw
    useFocusLikeAfterAnewDraw({ keep: (held) => held.id === 'inventorySearch', letGo: (held) => held.matches('#formatFilter, #inventorySort'), after: bridge.drawn })
    useLocale()
    const phone = usePhone()
    const sheets = usePhoneSheets(controller, bridge)
    const state = controller.state
    const sourceOn = state.value?.source === SourceState.ON

    // the app says it uses the Discogs API while the Discogs values are on (the footer of the shell reads this small store); never while drawing
    useEffect(() => { showDiscogsNotice(sourceOn) }, [sourceOn])

    const items: ItemActions = {
        onView: (id) => { void viewItem(controller, bridge, id) },
        onEdit: (id) => { void editItem(controller, id) },
        onDelete: (id) => { void removeItem(controller, id) },
        onStatus: (id, status) => { void controller.handleStatusChange(id, status) }
    }
    const rows: PhoneActions = { onView: items.onView, onStatus: sheets.openStatus, onMore: sheets.openItem }

    // the sheets of the phone are drawn from here whatever the layout: the layer stays in one place of the tree, so a sheet open when the screen stops being a phone
    // is closed by the motor, not remounted (a layer that moved from one box to the other would be drawn again: its slide in would run once more before the slide out)
    const layer = sheets.layer
    if (phone) {
        return (
            <>
            <div className="inventory-view inventory-view--phone">
                <header className="view-header inv-phone-header">
                    <Header state={state} controller={controller} />
                    <PhoneTotals key={bridge.valuesKey()} known={state.value} controller={controller} onAbout={sheets.openValues} />
                    <div id="inventoryNotices"><PhoneNotices key={bridge.valuesKey()} known={state.value} controller={controller} /></div>
                </header>
                <PhoneBar state={state} controller={controller} actions={{ onJump: sheets.openJump, onFilters: sheets.openFilters, onActions: sheets.openActions }} />
                <div id="inventory-grid-container" key={bridge.gridKey()}><PhoneList state={state} bridge={bridge} controller={controller} actions={rows} /></div>
                {/* keyed with the box of the list (its own prefix: siblings never share a key): the hand-made screen rebuilt the notice on every draw; a notice that stays mounted under a box that is remounted is the anchor of Chromium's scroll anchoring, and «Show 50 more» throws the page to the end of the new chunk */}
                {sourceOn ? <p className="inv-discogs-notice" key={`notice.${bridge.gridKey()}`}>{t('shell.footer.discogsNotice')}</p> : null}
            </div>
            {layer}
            </>
        )
    }
    return (
        <>
        <div className="inventory-view container pb-20">
            <header className="view-header mb-8 fade-in">
                <Breadcrumb crumbs={inventoryTrail()} onNavigate={navigate} />
                <Header state={state} controller={controller} />
                <Totals key={bridge.valuesKey()} known={state.value} controller={controller} />
                <div id="inventoryNotices"><Notices key={bridge.valuesKey()} known={state.value} controller={controller} /></div>
                <Filters state={state} controller={controller} />
            </header>
            <div id="inventory-grid-container" key={bridge.gridKey()}><Grid state={state} bridge={bridge} actions={items} /></div>
        </div>
        {layer}
        </>
    )
}
