/** O dicionário em português do Brasil: um arquivo à parte, baixado só por quem o usa (o inglês fica no script principal). */
import { albums } from './albums.js'
import { comingSoon } from './comingSoon.js'
import { exportWindow } from './exportWindow.js'
import { inventory } from './inventory.js'
import { playlists } from './playlists.js'
import { savedPlaylists } from './savedPlaylists.js'
import { shell } from './shell.js'
import { start } from './start.js'
import { ui } from './ui.js'

export const pt = { ...albums, ...comingSoon, ...exportWindow, ...inventory, ...playlists, ...savedPlaylists, ...shell, ...start, ...ui }
