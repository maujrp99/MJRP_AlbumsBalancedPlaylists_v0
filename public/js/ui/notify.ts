/**
 * Notify - the notices a piece of ui/ may give (F83 wave 8b). A piece draws what it is given and holds no store, so whoever opens it hands over the
 * site's own notices (stores/toasts.js: `toast` fits this shape as it is).
 */
export interface Notify {
    success: (text: string) => void
    warning: (text: string) => void
    error: (text: string) => void
}
