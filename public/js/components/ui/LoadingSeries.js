/**
 * LoadingSeries.js - the way the app says «your series are being read» (F79).
 * The Blend screen and the Albums screen say it with the same words and the same spinner:
 * the words on the phone, the spinner on the computer.
 */

/** The words of the phone. */
export const LOADING_SERIES_TEXT = 'Loading your series…'

/** The spinner of the computer (markup, as the Blend screen has always drawn it). */
export const LOADING_SERIES_SPINNER_HTML = `<div class="flex items-center justify-center py-8">
                   <div class="animate-spin rounded-full h-8 w-8 border-2 border-orange-400 border-t-transparent"></div>
               </div>`
