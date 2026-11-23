/** Not app code (F83 TASK-02): outside text put in an HTML string with no escapeHtml, in TypeScript. */
interface Album { title: string }
export const row = (album: Album): string => `<li class="row">${album.title}</li>`
