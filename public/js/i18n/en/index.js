/** The English dictionary: every area, in the main script (English is the reserve, so it is always at hand). */
import { albums } from './albums.js'
import { blend } from './blend.js'
import { comingSoon } from './comingSoon.js'
import { exportWindow } from './exportWindow.js'
import { inventory } from './inventory.js'
import { playlists } from './playlists.js'
import { savedPlaylists } from './savedPlaylists.js'
import { shell } from './shell.js'
import { start } from './start.js'
import { ui } from './ui.js'

export const en = { ...albums, ...blend, ...comingSoon, ...exportWindow, ...inventory, ...playlists, ...savedPlaylists, ...shell, ...start, ...ui }
