/**
 * The rule of the final state of F83 (wave 8d): what counts as drawing by hand outside React, and the exceptions with their reasons.
 * Read by test/architecture/noHandMadeScreens.test.js and by scripts/migration-status.mjs.
 */
export const REACT_FOLDERS = ['screens/', 'ui/', 'shell/', 'react-bridge/', 'vendor/']

/** Folders that must not exist any more. */
export const GONE = ['views', 'components', 'react-bridge/legacy']

/** What drawing by hand looks like in a file of the site. */
export const WRITES_THE_DOM = /\.(?:inner|outer)HTML\s*=|insertAdjacentHTML\s*\(|document\.createElement(?:NS)?\s*\(|document\.write\s*\(|body\.style\b|body\.classList|\.appendChild\s*\(/

/** File -> why it writes the DOM without being a screen. Only the survey of wave 0 and what came after it. */
export const EXCEPTIONS = {
    'router.js': 'the house router puts a screen in #app and writes the panels of a failure («no connection», «new version») as text; the router stays (TASK-29)',
    'utils/pageScrollLock.js': 'a page utility, not drawing: it holds the page behind a sheet by writing the style of the body (a count of locks); React has no equivalent, and the sheet and the shell share it',
    'services/musickit/MusicKitAuth.js': 'adds the script tag of the MusicKit SDK to the head: loading code, not drawing',
    'services/AuthService.js': 'puts the class «authenticated» on the body: a state mark for the CSS, not drawing',
    'controllers/playlistExports.js': 'makes the link that hands the JSON file to the browser to download: a file, not a screen'
}
