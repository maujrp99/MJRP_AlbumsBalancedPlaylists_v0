/** What the windows of an inventory item read of an item (or of an album): the screens' own shapes, read through the fields they have. */
export interface ItemLike {
    id?: string
    title?: string
    artist?: string
    year?: number | string | null
    format?: string | null
    currency?: string | null
    purchasePrice?: number | null
    notes?: string | null
    /** An item as an album: the album inside holds the fields. */
    album?: ItemLike
}
