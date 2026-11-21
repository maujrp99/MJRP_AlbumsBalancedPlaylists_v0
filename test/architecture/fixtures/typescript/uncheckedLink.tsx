/** Not app code (F83 TASK-02): an address that is not written in the code, followed with no safeUrl, in JSX. */
export function Link({ album }: { album: { url: string } }) {
    return <a href={album.url}>open</a>
}
