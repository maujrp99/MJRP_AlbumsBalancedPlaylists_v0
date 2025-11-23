// Client API layer for calling the server-side AI proxy
// Exports: fetchAlbumMetadata(query)

export async function fetchAlbumMetadata (albumQuery) {
  if (!albumQuery) throw new Error('Missing albumQuery')

  // Determine proxy URL. Use same host as page but default to port 3000 where the proxy runs.
  // Use an explicit override if provided, otherwise call the proxy via same-origin
  const url = (window.__api_base && typeof window.__api_base === 'string')
    ? window.__api_base.replace(/\/$/, '') + '/api/generate'
    : '/api/generate'

  console.debug('fetchAlbumMetadata -> proxy url:', url, 'query:', albumQuery)
  let resp
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumQuery })
    })
  } catch (err) {
    // Network-level failure (DNS, refused connection, CORS preflight failure may surface here)
    throw new Error(`Network error contacting proxy at ${url}: ${err && err.message ? err.message : String(err)}`)
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Proxy error: ${resp.status} ${text}`)
  }

  const result = await resp.json().catch(() => null)
  if (!result) throw new Error('Invalid JSON from proxy')

  // Expect normalized shape { data: <album> }
  if (result.data && typeof result.data === 'object') {
    // Ensure id exists
    if (!result.data.id) result.data.id = 'album_' + Date.now() + Math.random().toString(36).substr(2, 5)
    return result.data
  }

  // fallback: proxy didn't normalize; return null to indicate not found
  console.warn('Unexpected proxy response shape', result)
  return null
}

function sleep (ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

// Fetch multiple album metadata entries with limited concurrency, retries and progress callback.
// Returns an array of results in the same order as `queries` where each item is { success: true, data } or { success: false, error }
export async function fetchMultipleAlbumMetadata (queries, options = {}) {
  if (!Array.isArray(queries)) throw new Error('queries must be an array')
  const { concurrency = 3, retries = 3, backoffMs = 500, onProgress, signal } = options

  const baseUrl = (window.__api_base && typeof window.__api_base === 'string')
    ? window.__api_base.replace(/\/$/, '') + '/api/generate'
    : '/api/generate'

  const results = new Array(queries.length)
  let idx = 0

  async function doFetch (i) {
    const albumQuery = queries[i]
    let attempt = 0
    while (attempt <= retries) {
      if (signal && signal.aborted) {
        const err = new Error('aborted')
        results[i] = { success: false, error: err.message }
        onProgress && onProgress(i, false, err)
        return
      }
      try {
        const resp = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ albumQuery })
        })

        const text = await resp.text().catch(() => '')
        let parsed = null
        try { parsed = text ? JSON.parse(text) : null } catch (e) { parsed = null }

        if (resp.ok && parsed && parsed.data) {
          // success
          const album = parsed.data
          if (!album.id) album.id = 'album_' + Date.now() + Math.random().toString(36).substr(2, 5)
          results[i] = { success: true, data: album }
          onProgress && onProgress(i, true, album)
          return
        }

        // Non-OK responses: decide whether to retry
        if (resp.status >= 500) {
          // transient server error — retry
          attempt += 1
          const wait = backoffMs * Math.pow(2, attempt - 1)
          await sleep(wait)
          continue
        }

        // For 4xx (including 422 validation), treat as final
        const errMsg = parsed && parsed.error ? (parsed.error.message || parsed.error) : (text || `status ${resp.status}`)
        results[i] = { success: false, error: errMsg }
        onProgress && onProgress(i, false, errMsg)
        return
      } catch (err) {
        // network or other error: retry
        attempt += 1
        if (attempt > retries) {
          results[i] = { success: false, error: err.message || String(err) }
          onProgress && onProgress(i, false, err)
          return
        }
        const wait = backoffMs * Math.pow(2, attempt - 1)
        await sleep(wait)
      }
    }
  }

  const workers = new Array(Math.min(concurrency, queries.length)).fill(0).map(async () => {
    while (true) {
      const i = idx++
      if (i >= queries.length) break
      // eslint-disable-next-line no-await-in-loop
      await doFetch(i)
    }
  })

  await Promise.all(workers)
  return results
}
