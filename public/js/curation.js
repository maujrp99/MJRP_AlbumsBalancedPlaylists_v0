// public/js/curation.js
// ES module implementing the playlist curation algorithm in a DOM-free way

export function curateAlbums(albums, opts = {}) {
  const DURATION_TARGET_S = opts.targetSeconds || 45 * 60; // default 45 minutes
  const P_HITS = 2; // P1 and P2

  // Defensive copy
  const workingAlbums = JSON.parse(JSON.stringify(albums || []));

  // Initialize playlists
  const playlists = [
    { id: 'p1', title: 'Greatest Hits Vol. 1', subtitle: 'Rank #1 de cada álbum', tracks: [] },
    { id: 'p2', title: 'Greatest Hits Vol. 2', subtitle: 'Rank #2 de cada álbum', tracks: [] }
  ];

  // Pool for remaining tracks
  const remaining = [];

  // Phase: extract rank 1 and 2
  for (const album of workingAlbums) {
    if (!album || !Array.isArray(album.tracks)) continue;
    const tracks = [...album.tracks];

    const t1 = tracks.find(t => t.rank === 1);
    if (t1) {
      // annotate hit provenance
      t1.rankingInfo = t1.rankingInfo || [];
      t1.rankingInfo.push({ reason: 'P1 Hit', source: 'algorithm' });
      playlists[0].tracks.push(t1);
    }

    const t2 = tracks.find(t => t.rank === 2);
    if (t2) {
      t2.rankingInfo = t2.rankingInfo || [];
      t2.rankingInfo.push({ reason: 'P2 Hit', source: 'algorithm' });
      playlists[1].tracks.push(t2);
    }

    // add remaining tracks to pool (exclude rank 1/2 copies)
    for (const t of tracks) {
      if (t.rank === 1 || t.rank === 2) continue;
      // keep origin for rules
      t.originAlbumId = album.id;
      remaining.push(t);
    }
  }

  // Phase: fill P1 and P2 if under duration target using worst-ranked-first
  // Sort remaining descending by rank (highest numeric value first)
  remaining.sort((a, b) => (b.rank || 999) - (a.rank || 999));

  function totalDuration(tracks) {
    return (tracks || []).reduce((s, x) => s + (x.duration || 0), 0);
  }

  // Fill helper: append worst-ranked tracks until >= target or pool exhausted
  function fillPlaylistIfNeeded(playlist) {
    let dur = totalDuration(playlist.tracks);
    while (dur < DURATION_TARGET_S && remaining.length > 0) {
      const candidate = remaining.shift(); // already sorted worst-first
      if (!candidate) break;
      // annotate as fill
      candidate.rankingInfo = candidate.rankingInfo || [];
      candidate.rankingInfo.push({ reason: 'fill:worse-ranked', source: 'algorithm' });
      playlist.tracks.push(candidate);
      dur += candidate.duration || 0;
    }
  }

  fillPlaylistIfNeeded(playlists[0]);
  fillPlaylistIfNeeded(playlists[1]);

  // After filling P1/P2, distribute the rest into deep cuts using serpentine
  // Compute number of deep cut playlists from remaining durations
  const totalDeepCutsDuration = totalDuration(remaining);
  const P_DEEP_CUTS_IDEAL = Math.ceil(totalDeepCutsDuration / DURATION_TARGET_S);
  const numDeepCutPlaylists = Math.max(1, P_DEEP_CUTS_IDEAL);

  for (let i = 0; i < numDeepCutPlaylists; i++) {
    playlists.push({ id: `p${P_HITS + i + 1}`, title: `Deep Cuts Vol. ${i + 1}`, subtitle: 'S-Draft Balanceado', tracks: [] });
  }

  // Serpentine distribution on remaining pool (which may be already sorted worst-first, but order here is not critical)
  let direction = 1;
  let p_index = 0;
  for (const track of remaining) {
    playlists[p_index + P_HITS].tracks.push(track);
    p_index += direction;
    if (p_index >= numDeepCutPlaylists) {
      direction = -1;
      p_index = numDeepCutPlaylists - 1;
    } else if (p_index < 0) {
      direction = 1;
      p_index = 0;
    }
  }

  // Phase: run swap balancing with conservative swap rules
  runFase4SwapBalancing(playlists, DURATION_TARGET_S);

  return playlists;
}

export function runFase4SwapBalancing(playlists, targetDurationS) {
  const FLEXIBILITY = 7 * 60; // 7 minutes
  const MAX_SWAP_ITERATIONS = 100;

  function calculateTotalDuration(tracks) {
    return (tracks || []).reduce((s, x) => s + (x.duration || 0), 0);
  }

  function isLastTrackOfAlbumInPlaylist(playlist, track) {
    if (!track || !track.originAlbumId) return false;
    let count = 0;
    for (const t of playlist.tracks) if (t.originAlbumId === track.originAlbumId) count++;
    return count === 1;
  }

  function isSwapValid(p_over, p_under, trackOver, trackUnder) {
    // Disallow removing rank===1 from p1, or rank===2 from p2
    if (trackOver && trackOver.rank === 1 && p_over.id === 'p1') return false;
    if (trackOver && trackOver.rank === 2 && p_over.id === 'p2') return false;

    // Album representation constraints (existing rule)
    const isLast_Over = isLastTrackOfAlbumInPlaylist(p_over, trackOver);
    if (isLast_Over && (trackOver.originAlbumId !== trackUnder.originAlbumId)) return false;

    const isLast_Under = isLastTrackOfAlbumInPlaylist(p_under, trackUnder);
    if (isLast_Under && (trackUnder.originAlbumId !== trackOver.originAlbumId)) return false;

    return true;
  }

  for (let iter = 0; iter < MAX_SWAP_ITERATIONS; iter++) {
    const p_durations = playlists.map(p => ({ id: p.id, duration: calculateTotalDuration(p.tracks), playlist: p }));
    p_durations.sort((a, b) => a.duration - b.duration);
    const p_under = p_durations[0];
    const p_over = p_durations[p_durations.length - 1];

    const isUnderOk = p_under.duration >= (targetDurationS - FLEXIBILITY);
    const isOverOk = p_over.duration <= (targetDurationS + FLEXIBILITY);
    if (isUnderOk && isOverOk) return playlists;

    let bestSwap = { trackOver: null, trackUnder: null, newGap: Math.abs(p_over.duration - p_under.duration) };

    for (const trackOver of p_over.playlist.tracks) {
      for (const trackUnder of p_under.playlist.tracks) {
        if (!isSwapValid(p_over.playlist, p_under.playlist, trackOver, trackUnder)) continue;
        const newOverDuration = p_over.duration - (trackOver.duration || 0) + (trackUnder.duration || 0);
        const newUnderDuration = p_under.duration - (trackUnder.duration || 0) + (trackOver.duration || 0);
        const newGap = Math.abs(newOverDuration - newUnderDuration);
        if (newGap < bestSwap.newGap) bestSwap = { trackOver, trackUnder, newGap };
      }
    }

    if (bestSwap.trackOver) {
      // execute swap
      p_over.playlist.tracks = p_over.playlist.tracks.filter(t => t.id !== bestSwap.trackOver.id);
      p_over.playlist.tracks.push(bestSwap.trackUnder);
      p_under.playlist.tracks = p_under.playlist.tracks.filter(t => t.id !== bestSwap.trackUnder.id);
      p_under.playlist.tracks.push(bestSwap.trackOver);
    } else {
      return playlists;
    }
  }

  return playlists;
}
