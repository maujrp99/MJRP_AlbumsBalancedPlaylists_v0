/** O dicionário em português do Brasil: um arquivo à parte, baixado só por quem o usa (o inglês fica no script principal). */
import { comingSoon } from './comingSoon.js'
import { playlists } from './playlists.js'
import { savedPlaylists } from './savedPlaylists.js'
import { shell } from './shell.js'
import { start } from './start.js'
import { ui } from './ui.js'

export const pt = { ...comingSoon, ...playlists, ...savedPlaylists, ...shell, ...start, ...ui }
