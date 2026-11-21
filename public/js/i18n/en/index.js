/** The English dictionary: every area, in the main script (English is the reserve, so it is always at hand). */
import { comingSoon } from './comingSoon.js'
import { playlists } from './playlists.js'
import { savedPlaylists } from './savedPlaylists.js'
import { ui } from './ui.js'

export const en = { ...comingSoon, ...playlists, ...savedPlaylists, ...ui }
