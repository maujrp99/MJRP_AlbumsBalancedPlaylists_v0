/**
 * The entry page's script (F80): loaded by public/splash.html as a module, after the text is there.
 * Nothing of the app is imported here: the entry page is its own small bundle.
 */
import { startSplash } from './splash.js'

startSplash(window)
