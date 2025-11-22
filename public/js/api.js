// Client API layer for calling the server-side AI proxy
// Exports: fetchAlbumMetadata(query)

export async function fetchAlbumMetadata(albumQuery) {
  if (!albumQuery) throw new Error('Missing albumQuery');

  // Use relative path so it works in different environments
  const url = '/api/generate';

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ albumQuery })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Proxy error: ${resp.status} ${text}`);
  }

  const result = await resp.json().catch(() => null);
  if (!result) throw new Error('Invalid JSON from proxy');

  // Expect normalized shape { data: <album> }
  if (result.data && typeof result.data === 'object') {
    // Ensure id exists
    if (!result.data.id) result.data.id = 'album_' + Date.now() + Math.random().toString(36).substr(2,5);
    return result.data;
  }

  // fallback: proxy didn't normalize; return null to indicate not found
  console.warn('Unexpected proxy response shape', result);
  return null;
}
