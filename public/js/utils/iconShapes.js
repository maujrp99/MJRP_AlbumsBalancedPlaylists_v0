/**
 * iconShapes - the drawings of the site's icons, as data (F83, TASK-06; proposal § 4.4, risk R20).
 *
 * The icons were strings of SVG text inside components/Icons.js, imported by 59 files. A React screen must not put such a
 * string in the page (raw HTML is refused in React screens), so the drawings are data: the root attributes and the elements
 * of each icon, in the order the markup had them. `<Icon>` (ui/Icon.tsx) makes the elements. The text form the hand-made
 * screens used (`getIcon`) left in wave 8d with its last user; test/support/iconMarkup.js keeps it as the yardstick of the proof:
 * `test/ui/Icon.test.tsx` proves that `<Icon>` gives the HTML the strings of before gave, icon by icon
 * (test/fixtures/iconMarkupBeforeF83.json holds those strings). One exception, written there with its reason: MJRPLogo, which
 * no screen uses, lost its comments and the line breaks and indentation between its elements; none of that is drawn.
 *
 * Pure data and one small function: no DOM, no React, no store.
 */

/**
 * @typedef {string | { t: string, a: Record<string, string>, c?: IconNode[] }} IconNode - a text, or an element: its tag, its
 *          attributes in order, its children
 * @typedef {{ a: Record<string, string>, n: IconNode[] }} IconShape - the attributes of the root svg and its nodes
 */

/** The root of a line icon (Lucide style): drawn by stroke. */
const LINE = {
    xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
}

/** The root of a solid icon (the brand marks): drawn by fill. */
const SOLID = { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'currentColor' }

/** @type {Record<string, IconShape>} */
export const ICON_SHAPES = {
    Undo: {"a":LINE,"n":[{"t":"path","a":{"d":"M9 14 4 9l5-5"}},{"t":"path","a":{"d":"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"}}]},
    Redo: {"a":LINE,"n":[{"t":"path","a":{"d":"m15 14 5-5-5-5"}},{"t":"path","a":{"d":"M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"}}]},
    Rocket: {"a":LINE,"n":[{"t":"path","a":{"d":"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"}},{"t":"path","a":{"d":"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"}},{"t":"path","a":{"d":"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"}},{"t":"path","a":{"d":"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"}}]},
    BarChart: {"a":LINE,"n":[{"t":"line","a":{"x1":"12","x2":"12","y1":"20","y2":"10"}},{"t":"line","a":{"x1":"18","x2":"18","y1":"20","y2":"4"}},{"t":"line","a":{"x1":"6","x2":"6","y1":"20","y2":"16"}}]},
    Database: {"a":LINE,"n":[{"t":"ellipse","a":{"cx":"12","cy":"5","rx":"9","ry":"3"}},{"t":"path","a":{"d":"M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"}},{"t":"path","a":{"d":"M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"}}]},
    Music: {"a":LINE,"n":[{"t":"path","a":{"d":"M9 18V5l12-2v13"}},{"t":"circle","a":{"cx":"6","cy":"18","r":"3"}},{"t":"circle","a":{"cx":"18","cy":"16","r":"3"}}]},
    SpotifyConfig: {"a":SOLID,"n":[{"t":"path","a":{"d":"M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.717.476-1.076.236-2.948-1.8-6.661-2.209-11.037-1.211-.421.084-.827-.185-.911-.597-.084-.421.185-.827.597-.911 4.856-1.108 8.948-.65 12.191 1.341.332.25.476.696.236 1.142zm1.474-3.267c-.314.492-.93.65-1.422.336-3.415-2.091-8.618-2.697-12.656-1.472-.53.167-1.111-.122-1.278-.652-.167-.53.122-1.111.652-1.278 4.639-1.416 10.37-0.748 14.368 1.64.492.29.65.929.336 1.426zm.135-3.376c-4.079-2.42-10.8-2.643-14.7-1.458-.616.187-1.276-.174-1.463-.79-.187-.616.174-1.276.79-1.463 4.475-1.353 11.833-1.096 16.48 1.666.571.337.755 1.087.418 1.658-.337.571-1.087.755-1.658.418z"}}]},
    Trash: {"a":LINE,"n":[{"t":"path","a":{"d":"M3 6h18"}},{"t":"path","a":{"d":"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"}},{"t":"path","a":{"d":"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"}}]},
    User: {"a":LINE,"n":[{"t":"path","a":{"d":"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"}},{"t":"circle","a":{"cx":"12","cy":"7","r":"4"}}]},
    Refresh: {"a":LINE,"n":[{"t":"path","a":{"d":"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}},{"t":"path","a":{"d":"M3 3v5h5"}},{"t":"path","a":{"d":"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"}},{"t":"path","a":{"d":"M16 21h5v-5"}}]},
    Share: {"a":LINE,"n":[{"t":"path","a":{"d":"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"}},{"t":"polyline","a":{"points":"16 6 12 2 8 6"}},{"t":"line","a":{"x1":"12","x2":"12","y1":"2","y2":"15"}}]},
    Archive: {"a":LINE,"n":[{"t":"rect","a":{"width":"20","height":"5","x":"2","y":"3","rx":"1"}},{"t":"path","a":{"d":"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"}},{"t":"path","a":{"d":"M10 12h4"}}]},
    FolderPlus: {"a":LINE,"n":[{"t":"path","a":{"d":"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"}},{"t":"line","a":{"x1":"12","x2":"12","y1":"11","y2":"17"}},{"t":"line","a":{"x1":"9","x2":"15","y1":"14","y2":"14"}}]},
    TrendingUp: {"a":LINE,"n":[{"t":"polyline","a":{"points":"23 6 13.5 15.5 8.5 10.5 1 18"}},{"t":"polyline","a":{"points":"17 6 23 6 23 12"}}]},
    Disc: {"a":LINE,"n":[{"t":"circle","a":{"cx":"12","cy":"12","r":"10"}},{"t":"circle","a":{"cx":"12","cy":"12","r":"3"}}]},
    Film: {"a":LINE,"n":[{"t":"rect","a":{"width":"18","height":"18","x":"3","y":"3","rx":"2","ry":"2"}},{"t":"circle","a":{"cx":"8.5","cy":"8.5","r":"1.5"}},{"t":"polyline","a":{"points":"21 15 16 10 5 21"}}]},
    Download: {"a":LINE,"n":[{"t":"path","a":{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}},{"t":"polyline","a":{"points":"7 10 12 15 17 10"}},{"t":"line","a":{"x1":"12","x2":"12","y1":"15","y2":"3"}}]},
    Search: {"a":LINE,"n":[{"t":"circle","a":{"cx":"11","cy":"11","r":"8"}},{"t":"path","a":{"d":"m21 21-4.3-4.3"}}]},
    ChevronDown: {"a":LINE,"n":[{"t":"path","a":{"d":"m6 9 6 6 6-6"}}]},
    Star: {"a":LINE,"n":[{"t":"polygon","a":{"points":"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"}}]},
    List: {"a":LINE,"n":[{"t":"line","a":{"x1":"8","x2":"21","y1":"6","y2":"6"}},{"t":"line","a":{"x1":"8","x2":"21","y1":"12","y2":"12"}},{"t":"line","a":{"x1":"8","x2":"21","y1":"18","y2":"18"}},{"t":"line","a":{"x1":"3","x2":"3.01","y1":"6","y2":"6"}},{"t":"line","a":{"x1":"3","x2":"3.01","y1":"12","y2":"12"}},{"t":"line","a":{"x1":"3","x2":"3.01","y1":"18","y2":"18"}}]},
    Grid: {"a":LINE,"n":[{"t":"rect","a":{"width":"7","height":"7","x":"3","y":"3","rx":"1"}},{"t":"rect","a":{"width":"7","height":"7","x":"14","y":"3","rx":"1"}},{"t":"rect","a":{"width":"7","height":"7","x":"14","y":"14","rx":"1"}},{"t":"rect","a":{"width":"7","height":"7","x":"3","y":"14","rx":"1"}}]},
    Check: {"a":LINE,"n":[{"t":"polyline","a":{"points":"20 6 9 17 4 12"}}]},
    AlertTriangle: {"a":LINE,"n":[{"t":"path","a":{"d":"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"}},{"t":"line","a":{"x1":"12","x2":"12","y1":"9","y2":"13"}},{"t":"line","a":{"x1":"12","x2":"12.01","y1":"17","y2":"17"}}]},
    Info: {"a":LINE,"n":[{"t":"circle","a":{"cx":"12","cy":"12","r":"10"}},{"t":"line","a":{"x1":"12","x2":"12","y1":"16","y2":"12"}},{"t":"line","a":{"x1":"12","x2":"12.01","y1":"8","y2":"8"}}]},
    X: {"a":LINE,"n":[{"t":"path","a":{"d":"M18 6 6 18"}},{"t":"path","a":{"d":"m6 6 12 12"}}]},
    ArrowLeft: {"a":LINE,"n":[{"t":"path","a":{"d":"m12 19-7-7 7-7"}},{"t":"path","a":{"d":"M19 12H5"}}]},
    GripVertical: {"a":LINE,"n":[{"t":"circle","a":{"cx":"9","cy":"12","r":"1"}},{"t":"circle","a":{"cx":"9","cy":"5","r":"1"}},{"t":"circle","a":{"cx":"9","cy":"19","r":"1"}},{"t":"circle","a":{"cx":"15","cy":"12","r":"1"}},{"t":"circle","a":{"cx":"15","cy":"5","r":"1"}},{"t":"circle","a":{"cx":"15","cy":"19","r":"1"}}]},
    History: {"a":LINE,"n":[{"t":"path","a":{"d":"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}},{"t":"path","a":{"d":"M3 3v5h5"}},{"t":"path","a":{"d":"M12 7v5l4 2"}}]},
    FileText: {"a":LINE,"n":[{"t":"path","a":{"d":"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"}},{"t":"polyline","a":{"points":"14 2 14 8 20 8"}},{"t":"line","a":{"x1":"16","x2":"8","y1":"13","y2":"13"}},{"t":"line","a":{"x1":"16","x2":"8","y1":"17","y2":"17"}},{"t":"line","a":{"x1":"10","x2":"8","y1":"9","y2":"9"}}]},
    MJRPLogo: {"a":{"xmlns":"http://www.w3.org/2000/svg","viewBox":"0 0 100 100","fill":"none"},"n":[{"t":"defs","a":{},"c":[{"t":"linearGradient","a":{"id":"flameGrad","x1":"20","y1":"80","x2":"80","y2":"20","gradientUnits":"userSpaceOnUse"},"c":[{"t":"stop","a":{"offset":"0%","stop-color":"#FF4D00"}},{"t":"stop","a":{"offset":"50%","stop-color":"#FF8800"}},{"t":"stop","a":{"offset":"100%","stop-color":"#FFCC00"}}]},{"t":"radialGradient","a":{"id":"vinylGrad","cx":"50","cy":"50","r":"45","gradientUnits":"userSpaceOnUse"},"c":[{"t":"stop","a":{"offset":"0%","stop-color":"#222"}},{"t":"stop","a":{"offset":"100%","stop-color":"#000"}}]}]},{"t":"path","a":{"d":"M50 5 C30 20, 10 40, 15 65 C20 90, 45 95, 50 95 C55 95, 80 90, 85 65 C90 40, 70 20, 50 5 Z","fill":"url(#flameGrad)","opacity":"0.8"}},{"t":"path","a":{"d":"M50 15 C40 30, 30 45, 35 60 C40 75, 50 80, 50 80 C50 80, 60 75, 65 60 C70 45, 60 30, 50 15 Z","fill":"#FFF","opacity":"0.2"}},{"t":"circle","a":{"cx":"50","cy":"55","r":"30","fill":"url(#vinylGrad)","stroke":"#333","stroke-width":"1"}},{"t":"circle","a":{"cx":"50","cy":"55","r":"24","stroke":"#444","stroke-width":"0.5","fill":"none"}},{"t":"circle","a":{"cx":"50","cy":"55","r":"18","stroke":"#444","stroke-width":"0.5","fill":"none"}},{"t":"circle","a":{"cx":"50","cy":"55","r":"12","stroke":"#444","stroke-width":"0.5","fill":"none"}},{"t":"circle","a":{"cx":"50","cy":"55","r":"8","fill":"#FF4D00"}},{"t":"circle","a":{"cx":"50","cy":"55","r":"2","fill":"#000"}}]},
    Plus: {"a":LINE,"n":[{"t":"line","a":{"x1":"12","x2":"12","y1":"5","y2":"19"}},{"t":"line","a":{"x1":"5","x2":"19","y1":"12","y2":"12"}}]},
    PlusCircle: {"a":LINE,"n":[{"t":"circle","a":{"cx":"12","cy":"12","r":"10"}},{"t":"line","a":{"x1":"12","x2":"12","y1":"8","y2":"16"}},{"t":"line","a":{"x1":"8","x2":"16","y1":"12","y2":"12"}}]},
    Save: {"a":LINE,"n":[{"t":"path","a":{"d":"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"}},{"t":"polyline","a":{"points":"17 21 17 13 7 13 7 21"}},{"t":"polyline","a":{"points":"7 3 7 8 15 8"}}]},
    Menu: {"a":LINE,"n":[{"t":"line","a":{"x1":"4","x2":"20","y1":"12","y2":"12"}},{"t":"line","a":{"x1":"4","x2":"20","y1":"6","y2":"6"}},{"t":"line","a":{"x1":"4","x2":"20","y1":"18","y2":"18"}}]},
    Edit: {"a":LINE,"n":[{"t":"path","a":{"d":"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"}},{"t":"path","a":{"d":"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"}}]},
    Play: {"a":LINE,"n":[{"t":"polygon","a":{"points":"5 3 19 12 5 21 5 3"}}]},
    RefreshCw: {"a":LINE,"n":[{"t":"path","a":{"d":"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}},{"t":"path","a":{"d":"M3 3v5h5"}},{"t":"path","a":{"d":"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"}},{"t":"path","a":{"d":"M16 21h5v-5"}}]},
    ExternalLink: {"a":LINE,"n":[{"t":"path","a":{"d":"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}},{"t":"polyline","a":{"points":"15 3 21 3 21 9"}},{"t":"line","a":{"x1":"10","x2":"21","y1":"14","y2":"3"}}]},
    ArrowRight: {"a":LINE,"n":[{"t":"path","a":{"d":"M5 12h14"}},{"t":"path","a":{"d":"m12 5 7 7-7 7"}}]},
    Loader: {"a":LINE,"n":[{"t":"line","a":{"x1":"12","x2":"12","y1":"2","y2":"6"}},{"t":"line","a":{"x1":"12","x2":"12","y1":"18","y2":"22"}},{"t":"line","a":{"x1":"4.93","x2":"7.76","y1":"4.93","y2":"7.76"}},{"t":"line","a":{"x1":"16.24","x2":"19.07","y1":"16.24","y2":"19.07"}},{"t":"line","a":{"x1":"2","x2":"6","y1":"12","y2":"12"}},{"t":"line","a":{"x1":"18","x2":"22","y1":"12","y2":"12"}},{"t":"line","a":{"x1":"4.93","x2":"7.76","y1":"19.07","y2":"16.24"}},{"t":"line","a":{"x1":"16.24","x2":"19.07","y1":"7.76","y2":"4.93"}}]},
    Layers: {"a":LINE,"n":[{"t":"polygon","a":{"points":"12 2 2 7 12 12 22 7 12 2"}},{"t":"polyline","a":{"points":"2 17 12 22 22 17"}},{"t":"polyline","a":{"points":"2 12 12 17 22 12"}}]},
    Trash2: {"a":LINE,"n":[{"t":"polyline","a":{"points":"3 6 5 6 21 6"}},{"t":"path","a":{"d":"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}},{"t":"line","a":{"x1":"10","x2":"10","y1":"11","y2":"17"}},{"t":"line","a":{"x1":"14","x2":"14","y1":"11","y2":"17"}}]},
    Apple: {"a":SOLID,"n":[{"t":"path","a":{"d":"M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"}}]},
    Cloud: {"a":LINE,"n":[{"t":"path","a":{"d":"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"}}]},
    Spotify: {"a":SOLID,"n":[{"t":"path","a":{"d":"M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.717.476-1.076.236-2.948-1.8-6.661-2.209-11.037-1.211-.421.084-.827-.185-.911-.597-.084-.421.185-.827.597-.911 4.856-1.108 8.948-.65 12.191 1.341.332.25.476.696.236 1.142zm1.474-3.267c-.314.492-.93.65-1.422.336-3.415-2.091-8.618-2.697-12.656-1.472-.53.167-1.111-.122-1.278-.652-.167-.53.122-1.111.652-1.278 4.639-1.416 10.37-0.748 14.368 1.64.492.29.65.929.336 1.426zm.135-3.376c-4.079-2.42-10.8-2.643-14.7-1.458-.616.187-1.276-.174-1.463-.79-.187-.616.174-1.276.79-1.463 4.475-1.353 11.833-1.096 16.48 1.666.571.337.755 1.087.418 1.658-.337.571-1.087.755-1.658.418z"}}]},
    Cpu: {"a":LINE,"n":[{"t":"rect","a":{"x":"4","y":"4","width":"16","height":"16","rx":"2"}},{"t":"rect","a":{"x":"9","y":"9","width":"6","height":"6"}},{"t":"path","a":{"d":"M9 1v3"}},{"t":"path","a":{"d":"M15 1v3"}},{"t":"path","a":{"d":"M9 20v3"}},{"t":"path","a":{"d":"M15 20v3"}},{"t":"path","a":{"d":"M20 9h3"}},{"t":"path","a":{"d":"M20 14h3"}},{"t":"path","a":{"d":"M1 9h3"}},{"t":"path","a":{"d":"M1 14h3"}}]},
    Maximize2: {"a":LINE,"n":[{"t":"polyline","a":{"points":"15 3 21 3 21 9"}},{"t":"polyline","a":{"points":"9 21 3 21 3 15"}},{"t":"line","a":{"x1":"21","x2":"14","y1":"3","y2":"10"}},{"t":"line","a":{"x1":"3","x2":"10","y1":"21","y2":"14"}}]},
    Shuffle: {"a":LINE,"n":[{"t":"polyline","a":{"points":"16 3 21 3 21 8"}},{"t":"line","a":{"x1":"4","x2":"21","y1":"20","y2":"3"}},{"t":"polyline","a":{"points":"21 16 21 21 16 21"}},{"t":"line","a":{"x1":"15","x2":"21","y1":"15","y2":"21"}},{"t":"line","a":{"x1":"4","x2":"9","y1":"4","y2":"9"}}]},
    Sparkles: {"a":LINE,"n":[{"t":"path","a":{"d":"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"}},{"t":"path","a":{"d":"M5 3v4"}},{"t":"path","a":{"d":"M9 3v4"}},{"t":"path","a":{"d":"M3 9h4"}},{"t":"path","a":{"d":"M3 5h4"}}]},
    Award: {"a":LINE,"n":[{"t":"circle","a":{"cx":"12","cy":"8","r":"6"}},{"t":"path","a":{"d":"M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"}}]},
    Scale: {"a":LINE,"n":[{"t":"path","a":{"d":"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}},{"t":"path","a":{"d":"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}},{"t":"path","a":{"d":"M7 21h10"}},{"t":"path","a":{"d":"M12 3v18"}},{"t":"path","a":{"d":"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"}}]},
    Clock: {"a":LINE,"n":[{"t":"circle","a":{"cx":"12","cy":"12","r":"10"}},{"t":"polyline","a":{"points":"12 6 12 12 16 14"}}]},
    LayoutGrid: {"a":LINE,"n":[{"t":"rect","a":{"width":"7","height":"7","x":"3","y":"3","rx":"1"}},{"t":"rect","a":{"width":"7","height":"7","x":"14","y":"3","rx":"1"}},{"t":"rect","a":{"width":"7","height":"7","x":"14","y":"14","rx":"1"}},{"t":"rect","a":{"width":"7","height":"7","x":"3","y":"14","rx":"1"}}]},
    ListMusic: {"a":LINE,"n":[{"t":"path","a":{"d":"M21 15V6"}},{"t":"path","a":{"d":"M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"}},{"t":"path","a":{"d":"M12 12H3"}},{"t":"path","a":{"d":"M16 6H3"}},{"t":"path","a":{"d":"M12 18H3"}}]},
    Users: {"a":LINE,"n":[{"t":"path","a":{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}},{"t":"circle","a":{"cx":"9","cy":"7","r":"4"}},{"t":"path","a":{"d":"M22 21v-2a4 4 0 0 0-3-3.87"}},{"t":"path","a":{"d":"M16 3.13a4 4 0 0 1 0 7.75"}}]},
    GitMerge: {"a":LINE,"n":[{"t":"circle","a":{"cx":"18","cy":"18","r":"3"}},{"t":"circle","a":{"cx":"6","cy":"6","r":"3"}},{"t":"path","a":{"d":"M6 21V9a9 9 0 0 0 9 9"}}]},
    Compass: {"a":LINE,"n":[{"t":"circle","a":{"cx":"12","cy":"12","r":"10"}},{"t":"polygon","a":{"points":"16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"}}]},
    CheckCircle: {"a":LINE,"n":[{"t":"path","a":{"d":"M22 11.08V12a10 10 0 1 1-5.93-9.14"}},{"t":"polyline","a":{"points":"22 4 12 14.01 9 11.01"}}]},
    AlertCircle: {"a":LINE,"n":[{"t":"circle","a":{"cx":"12","cy":"12","r":"10"}},{"t":"line","a":{"x1":"12","x2":"12","y1":"8","y2":"12"}},{"t":"line","a":{"x1":"12","x2":"12.01","y1":"16","y2":"16"}}]},
    Home: {"a":LINE,"n":[{"t":"path","a":{"d":"M3 10.5 12 3l9 7.5"}},{"t":"path","a":{"d":"M5 9.5V21h14V9.5"}},{"t":"path","a":{"d":"M10 21v-6h4v6"}}]},
    Blend: {"a":LINE,"n":[{"t":"line","a":{"x1":"21","x2":"14","y1":"4","y2":"4"}},{"t":"line","a":{"x1":"10","x2":"3","y1":"4","y2":"4"}},{"t":"line","a":{"x1":"21","x2":"12","y1":"12","y2":"12"}},{"t":"line","a":{"x1":"8","x2":"3","y1":"12","y2":"12"}},{"t":"line","a":{"x1":"21","x2":"16","y1":"20","y2":"20"}},{"t":"line","a":{"x1":"12","x2":"3","y1":"20","y2":"20"}},{"t":"line","a":{"x1":"14","x2":"14","y1":"2","y2":"6"}},{"t":"line","a":{"x1":"8","x2":"8","y1":"10","y2":"14"}},{"t":"line","a":{"x1":"16","x2":"16","y1":"18","y2":"22"}}]},
    ArrowUp: {"a":LINE,"n":[{"t":"path","a":{"d":"m5 12 7-7 7 7"}},{"t":"path","a":{"d":"M12 19V5"}}]},
    ChevronRight: {"a":LINE,"n":[{"t":"path","a":{"d":"m9 18 6-6-6-6"}}]},
    SignOut: {"a":LINE,"n":[{"t":"path","a":{"d":"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}},{"t":"polyline","a":{"points":"16 17 21 12 16 7"}},{"t":"line","a":{"x1":"21","x2":"9","y1":"12","y2":"12"}}]}
}
