/**
 * Tailwind, built with the site (F59, UAT-25; docs/decisions/0021-tailwind-built-with-the-site.md).
 *
 * Read by vite.config.js (css.postcss), so `npx vite` and `npx vite build` make the same CSS from
 * public/css/tailwind.css. There is no other build of the styles.
 *
 * `content` names every file where a class is written: the page Vite builds and all the JavaScript
 * of the app (classes live in strings and templates there). Tailwind writes into the CSS only the
 * classes it finds, whole, in those files.
 *
 * `safelist` holds the classes that are never written whole: the app puts them together when it
 * runs. A new one has to be added here, in full; test/architecture/tailwindBuiltWithSite.test.js
 * fails until it is.
 *
 * `theme` is what public/index.html gave to the Tailwind that ran in the browser, unchanged.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        path.join(here, 'public/index.html'),
        path.join(here, 'public/js/**/*.{js,ts,tsx}') // .tsx too: a class written only in JSX must reach the CSS (F83)
    ],
    theme: {
        extend: {
            // `md` is the first screen that is not a phone: 900 px, the line of the phone's shell (js/utils/isPhone.js,
            // css/mobile.css) and of the entry page, so that a screen never mixes the phone's frame with the computer's content (F88)
            screens: { md: '900px' },
            fontFamily: {
                syne: ['Syne', 'sans-serif']
            },
            colors: {
                brand: {
                    orange: '#f97316', // orange-500
                    red: '#dc2626', // red-600
                    yellow: '#fbbf24', // amber-400
                    dark: '#0a0a0a' // neutral-950
                }
            },
            backgroundImage: {
                'flame-gradient': 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                'flame-gradient-hover': 'linear-gradient(135deg, #fb923c 0%, #ef4444 100%)'
            }
        }
    }
}
