/** The name of the series that is open: the default Apple Music folder of an export from the edit screen (what the hand-made window read from the store). */
import { albumSeriesStore } from '../../stores/albumSeries.js'

export const activeSeriesName = (): string | undefined => (albumSeriesStore.getActiveSeries() as { name?: string } | null)?.name
