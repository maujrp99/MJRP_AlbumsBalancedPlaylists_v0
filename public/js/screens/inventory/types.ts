/**
 * The shapes the inventory screen reads (F83 wave 6a). The controller (controllers/InventoryController.js) and what holds the values
 * (controllers/InventoryValues.js) are hand-written JavaScript that lives on under the screen; this file says what the screen takes from
 * them, as the albums screen does in screens/albums/types.ts. Nothing here is drawn.
 */

export interface Averages {
    rating?: number | null
    popularity?: number | null
    ratedTracks?: number
    popTracks?: number
    tracks?: number
}

/** An item of the inventory: what the person keeps of an album. */
export interface InventoryItem {
    id: string
    title?: string
    artist?: string
    format?: string | null
    owned?: boolean | null
    coverUrl?: string
    albumData?: { coverUrl?: string; [name: string]: unknown }
    averages?: Averages
    bestEverAlbumId?: string
    spotifyId?: string
    spotifyUrl?: string
    hasUserRanking?: boolean
    userRanking?: unknown[]
    [name: string]: unknown
}

/** What models/inventoryValue.js `valueOfItem` says of one item. */
export interface ItemValue {
    origin: string | null
    reason?: string
    basis?: string
    release?: { url?: string }
    readAt?: string
    amount?: number
    currency?: string
    [name: string]: unknown
}

/** What `moneyOf` of the model asks of a value that has one. */
export interface Priced {
    amount: number
    currency: string
}

export interface Money {
    chosen?: string
    currency: string
    rates: Record<string, number> | null
    ratesMissing?: boolean
}

export interface Total {
    sum: number
    valued: number
    total: number
}

export interface ActionState {
    busy: boolean
    text: string | null
    count?: { done: number; total: number } | null
}

/** What InventoryValues.view gives: made anew at every computation. */
export interface ValueView {
    source: string | null
    values: Map<string, ItemValue>
    money: Money
    totals: { owned: Total; toBuy: Total }
    waiting: number
    discogsShown: boolean
    lowestShown: boolean
    sellerSettingsMissing: boolean
    run: ActionState
}

export interface Stats {
    totalCount?: number
    ownedCount?: number
    notOwnedCount?: number
    wishlistCount?: number
    [name: string]: unknown
}

export interface InventoryState {
    albums: InventoryItem[]
    filteredAlbums: InventoryItem[]
    stats: Stats
    filters: { search: string; format: string; ownership: string }
    seriesAdd: ActionState
    ratings: ActionState
    sorting: { field: string; direction: string }
    viewMode: string
    viewChosen: boolean
    value: ValueView
    isLoading: boolean
}

/** What the album window asks of the screen about the value of an item. */
export interface ValueHost {
    view: () => unknown
    onWrite: (text: string) => Promise<boolean>
    onForget: () => Promise<boolean>
    onRead: () => Promise<void>
}

export interface InventoryController {
    state: InventoryState
    initialize(): Promise<void>
    dispose(): void
    refresh(): void
    updateStateFromStore(): void
    handleFilterChange(type: string, value: string): void
    handleSortChoice(value: string): void
    handleViewModeChange(mode: string): void
    handleCurrencyChoice(code: string): void
    handleStatusCount(status: string): void
    handleUpdateValues(options?: { onlyNeverRead?: boolean }): Promise<void>
    handleStopValues(): void
    handleStatusChange(albumId: string, status: string): Promise<void>
    handleAddSeriesAlbums(options: { confirm: (options: object) => Promise<boolean> }): Promise<void>
    handleUpdateRatings(options: { confirm: (options: object) => Promise<boolean> }): Promise<void>
    handleUpdateAlbum(albumId: string, updates: object): Promise<void>
    handleDelete(albumId: string): Promise<void>
    handleWriteValue(albumId: string, text: string): Promise<boolean>
    handleForgetValue(albumId: string): Promise<boolean>
    handleReadValue(albumId: string): Promise<void>
    valueViewOf(albumId: string): { value: ItemValue; money: Money; source: string | null; busy: boolean }
    albumOfItem(item: InventoryItem, signal?: AbortSignal): Promise<unknown>
}
