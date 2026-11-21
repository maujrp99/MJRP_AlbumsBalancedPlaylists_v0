/**
 * menuText - every text the top menu writes that is not the name of a destination (those are in
 * phoneTabs.js), in ONE place (F88): the later work on languages (F81) finds them here. The app's
 * interface is English today (test/architecture/interfaceInEnglish.test.js); nothing here is read
 * from outside.
 */
export const MENU_TEXT = Object.freeze({
    mainNav: 'Main',
    entryPage: 'The Album Blender, the entry page',
    flipMark: 'Side B',
    account: 'Account and connections',
    accountOf: 'Account menu',
    connectionsOnly: 'Connections',
    signIn: 'Sign In',
    signedInAs: 'Signed in as',
    signOut: 'Sign Out',
    signInHint: 'Sign in to keep your series and playlists.',
    connectionsTitle: 'Connections',
    clearCache: 'Clear album cache',
    // The line under the bar
    albumsLine: 'Albums',
    playlistsLine: 'Playlists',
    byAlbum: 'By Album',
    byArtist: 'By Artist',
    byGenre: 'By Genre',
    byTrack: 'By Track',
    soon: 'Soon',
    savedPlaylists: 'Saved',
    newPlaylists: 'New',
    playlistSeries: 'Series',
    // The connections
    notConnected: 'Not connected',
    connecting: 'Connecting…',
    checking: 'Checking…',
    failed: 'Could not connect',
    connected: 'Connected',
    connectedAs: (name) => `Connected as ${name}`,
    connect: 'Connect',
    tryAgain: 'Try again',
    disconnect: 'Disconnect',
    disconnectAsk: (name) => ({ title: `Disconnect from ${name}?`, message: 'You can connect again at any time.', confirmText: 'Disconnect' }),
    disconnectedToast: (name) => `Disconnected from ${name}`,
    connectedSummary: (names) => (names.length ? `${names.join(' and ')} connected` : 'Nothing connected')
})
