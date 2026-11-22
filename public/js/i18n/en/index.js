/** The English dictionary: every area, in the main script (English is the reserve, so it is always at hand). */
import { albums } from './albums.js'
import { comingSoon } from './comingSoon.js'
import { playlists } from './playlists.js'
import { savedPlaylists } from './savedPlaylists.js'
import { shell } from './shell.js'
import { start } from './start.js'
import { ui } from './ui.js'

export const en = { ...albums, ...comingSoon, ...playlists, ...savedPlaylists, ...shell, ...start, ...ui }
