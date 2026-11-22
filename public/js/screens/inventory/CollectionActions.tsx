/**
 * The three actions of the whole collection (F83 wave 6a; the port of InventoryView.renderAddSeriesAlbums, renderUpdateRatings and renderUpdateValues):
 * «Add the albums of my series» (F71), «Update ratings» (F71, S-56) and «Update values» (F75, REQ-09). They are real buttons, reached by the keyboard.
 * While one runs it is disabled and says what is being done, and the other waits (the controller refuses both). «Update values» exists only
 * while the Discogs values are on (REQ-10). The computer's row and the phone's sheet draw the same buttons, with the same ids.
 */
import { t } from '../../i18n/t.js'
import { Icon } from '../../ui/Icon'
import { SourceState } from '../../models/inventoryValue.js'
import { addSeriesAlbums, updateRatings } from './inventoryActions'
import type { ActionState, InventoryController, InventoryState } from './types'

export const ACTION_IDS = { series: 'addSeriesAlbumsBtn', ratings: 'updateRatingsBtn', values: 'updateValuesBtn' } as const

function ActionButton({ id, icon, title, label, action, locked, extraClass, onPress }: {
    id: string
    icon: string
    title: string
    label: string
    action: ActionState | undefined
    locked: boolean
    extraClass?: string
    onPress: () => void
}) {
    const { busy = false, text = null } = action ?? {}
    return (
        <button type="button" id={id} className={`btn btn-secondary flex items-center gap-2 whitespace-nowrap${extraClass ? ` ${extraClass}` : ''}`} title={title} disabled={Boolean(busy || locked)} aria-busy={Boolean(busy)} onClick={onPress}>
            <Icon name={icon} className="w-4 h-4" /><span data-role="label">{text || label}</span>
        </button>
    )
}

/** What each action of the collection does, in words: on a phone there is no title to hover. */
export const actionAbout = (id: string): string => t(`inventory.action.${Object.entries(ACTION_IDS).find(([, value]) => value === id)?.[0]}.about`)

export function CollectionActions({ state, controller, extraClass, only }: { state: InventoryState; controller: InventoryController; extraClass?: string; only?: string }) {
    const wanted = (id: string) => !only || only === id
    return (
        <>
            {wanted(ACTION_IDS.series) ? <ActionButton id={ACTION_IDS.series} icon="Plus" title={t('inventory.action.series.title')} label={t('inventory.action.series.label')} action={state.seriesAdd} locked={Boolean(state.ratings?.busy)} extraClass={extraClass} onPress={() => { void addSeriesAlbums(controller) }} /> : null}
            {wanted(ACTION_IDS.ratings) ? <ActionButton id={ACTION_IDS.ratings} icon="Star" title={t('inventory.action.ratings.title')} label={t('inventory.action.ratings.label')} action={state.ratings} locked={Boolean(state.seriesAdd?.busy)} extraClass={extraClass} onPress={() => { void updateRatings(controller) }} /> : null}
            {wanted(ACTION_IDS.values) && state.value?.source === SourceState.ON
                ? <ActionButton id={ACTION_IDS.values} icon="RefreshCw" title={t('inventory.action.values.title')} label={t('inventory.action.values.label')} action={state.value.run} locked={false} extraClass={extraClass} onPress={() => { void controller.handleUpdateValues() }} />
                : null}
        </>
    )
}
