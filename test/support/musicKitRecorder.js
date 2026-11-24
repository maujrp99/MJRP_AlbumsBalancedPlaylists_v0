/**
 * musicKitRecorder (F83 wave 8a): a stand-in for Apple's MusicKit SDK that writes down EVERY call the app makes to it, in order.
 *
 * One function, no closure over anything, so the same text runs in jsdom (the golden of the export, test/services/musickit/
 * AppleMusicExport.recording.test.js) and inside the BUILT site (Playwright `addInitScript`, reports/evidence/F83/wave-8a/): the same
 * seam on both sides. It stands where the real SDK stands: `window.MusicKit` (configure, getInstance, instance.authorize,
 * instance.api.music) and the one `fetch` of the developer token. Nothing here touches Apple.
 *
 * `behavior` (plain data, so it can be sent to a page):
 *   tokenStatus     200 (default) or another status: the answer of /api/musickit-token
 *   authorize       'ok' (default) | 'denied' (rejects: «The user denied authorization») | 'expired' (rejects: «Authorization expired»)
 *   folders         [{ id, name }] the library's folders; paged `pageSize` at a time (default 100) with a `next` link
 *   folderListFails true: reading the folders rejects (500)
 *   catalog         { '<title>': '<id>' }: what the search finds; a title not in it finds nothing; a search for '*' term fails when `searchFails`
 *   searchFails     true: every catalog search rejects (500, or `searchStatus`)
 *   searchStatus    the status a failing search rejects with (F98: 403 is Apple Music refusing the person)
 *   searchFailsFor  { '<title>': <status> }: the search of that title rejects with that status, the others are answered (F98)
 *   postFails       { '<nth playlist POST, 1-based>': { status, message } }: that creation rejects
 *   postAlwaysFails { status, message }: every playlist creation rejects
 *   folderPostFails true: creating a folder rejects
 * The calls are pushed to `calls` (an array the caller owns).
 */
export function installMusicKitRecorder(win, calls, behavior = {}) {
    const b = behavior
    const pageSize = b.pageSize || 100
    let playlistPosts = 0
    const note = (...entry) => calls.push(entry)
    const rejection = (status, message) => Object.assign(new Error(message), { status })

    const instance = {
        isAuthorized: false,
        musicUserToken: 'USER-TOKEN-STAND-IN',
        storefrontId: 'us',
        async authorize() {
            note('authorize')
            if (b.authorize === 'denied') throw new Error('The user denied authorization')
            if (b.authorize === 'expired') throw new Error('Authorization expired')
            instance.isAuthorized = true
            return 'USER-TOKEN-STAND-IN'
        },
        async unauthorize() { note('unauthorize'); instance.isAuthorized = false },
        api: {
            async music(path, params, options) {
                const method = options?.fetchOptions?.method || 'GET'
                const body = options?.fetchOptions?.body ? JSON.parse(options.fetchOptions.body) : undefined
                note('api.music', method, path, params === undefined ? null : params, body === undefined ? null : body)
                if (path === '/v1/me/library/playlist-folders' && method === 'GET') {
                    if (b.folderListFails) throw rejection(500, 'Folders unavailable')
                    const all = b.folders || []
                    const offset = Number((params && params.offset) || 0)
                    const slice = all.slice(offset, offset + pageSize)
                    const more = offset + pageSize < all.length
                    return {
                        data: {
                            data: slice.map(folder => ({ id: folder.id, attributes: { name: folder.name } })),
                            ...(more ? { next: `/v1/me/library/playlist-folders?limit=${pageSize}&offset=${offset + pageSize}` } : {})
                        }
                    }
                }
                if (path === '/v1/me/library/playlist-folders' && method === 'POST') {
                    if (b.folderPostFails) throw rejection(500, 'Folder not created')
                    return { data: { data: [{ id: 'new-folder-1' }] } }
                }
                if (path === '/v1/me/library/playlists' && method === 'POST') {
                    playlistPosts += 1
                    const refused = (b.postFails && b.postFails[String(playlistPosts)]) || b.postAlwaysFails
                    if (refused) throw rejection(refused.status, refused.message)
                    return { data: { data: [{ id: `p.${playlistPosts}` }] } }
                }
                if (/\/search$/.test(path)) {
                    if (b.searchFails) throw rejection(b.searchStatus || 500, b.searchStatus === 403 ? 'Forbidden' : 'Search unavailable')
                    const term = String((params && params.term) || '')
                    const failing = Object.keys(b.searchFailsFor || {}).find(title => term.startsWith(`${title} `))
                    if (failing) throw rejection(b.searchFailsFor[failing], 'Search unavailable')
                    const found = Object.keys(b.catalog || {}).find(title => term.startsWith(`${title} `))
                    const songs = found ? [{ id: b.catalog[found], attributes: { name: found } }] : []
                    return { data: { results: songs.length ? { songs: { data: songs } } : {} } }
                }
                throw rejection(404, `unexpected call ${method} ${path}`)
            }
        }
    }

    win.MusicKit = {
        async configure(config) { note('MusicKit.configure', config) },
        getInstance() { note('MusicKit.getInstance'); return instance }
    }

    const realFetch = win.fetch ? win.fetch.bind(win) : null
    win.fetch = async (url, init) => {
        if (String(url) === '/api/musickit-token') {
            note('fetch', '/api/musickit-token')
            const status = b.tokenStatus || 200
            return {
                ok: status === 200,
                status,
                json: async () => (status === 200 ? { token: 'DEVELOPER-TOKEN-STAND-IN' } : { error: 'MusicKit not configured' })
            }
        }
        if (!realFetch) throw new Error(`unexpected fetch ${url}`)
        return realFetch(url, init)
    }
    return instance
}
