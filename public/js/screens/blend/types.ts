/** What the Blend screen takes of the things written in JavaScript: a series of the store and the controller that generates. */
export interface Series {
    id: string
    name?: string
    albumQueries?: unknown[]
    albums?: unknown[]
}

export interface GenerationConfig {
    algorithmId: string
    [key: string]: unknown
}

export interface BlendingController {
    generateFromSeries: (seriesId: string, config: GenerationConfig, options: { onProgress: (message: string) => void; signal: AbortSignal }) => Promise<{ playlists: unknown[]; notices: string[] }>
}

/** What the result area of the screen shows: nothing, the progress of the generation, or the message of a failure. */
export type Results = { kind: 'progress' | 'error'; message: string } | null
