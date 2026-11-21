/** Not app code (F83 TASK-02): a React file that writes the history of the browser by itself. */
export function GoSomewhere() {
    return <button type="button" onClick={() => history.pushState({}, '', '/somewhere')}>go</button>
}
