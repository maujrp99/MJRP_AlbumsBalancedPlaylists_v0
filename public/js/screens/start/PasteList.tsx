/**
 * PasteList - the pasted list in the Start screen's one field (F79, HOME-05; ported from components/home/HomePasteList.js, the same
 * elements and classes): one line per album, each line its own field, with its number and, as it is typed, «ready» or what to fix
 * (homePaste.ts). Pasting several lines makes several lines; Enter opens a new line; Backspace on an empty line closes it. The foot says
 * how many lines are ready and carries «Add N albums».
 *
 * After «Add», the lines that did not go in stay, each with the reason (red line and words, never the colour alone), to be fixed in
 * place, and the button sends what is in them («Add this line»). Typing in the list again goes back to the check as it is typed.
 *
 * It searches nothing: «Add» asks the controller with the text of the list. The lines are the controller's (so the browser proof of the
 * Home can read them); a line is keyed by its number in the controller, so a line that stays is the same field and one that is made
 * anew is a new one.
 */
import { useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Icon } from '../../ui/Icon'
import { t } from '../../i18n/t.js'
import { checkPastedLines, pasteSummary, type CheckedLine, type PasteReport } from './homePaste'
import type { FocusRequest, PasteLine, StartController } from './StartController'

/** The class of a line in each state, written whole (the build reads class names from the source). */
const ROW_CLASSES = { ok: 'home-line is-ok', bad: 'home-line is-bad', blank: 'home-line is-blank', skip: 'home-line is-skip' } as const

type RowState = keyof typeof ROW_CLASSES

/** «Added 2 albums.» in bold, as the prototype; the rest of the sentence after it. */
function ReportMessage({ message }: { message: string }) {
    const end = message.indexOf('. ')
    if (end < 0) return <strong>{message}</strong>
    return <><strong>{message.slice(0, end + 1)}</strong>{message.slice(end + 1)}</>
}

/** The line was written to, in a way the page knows of: React owns the value, and the page may also write it and tell us. */
const noop = (): void => {}

interface LineProps {
    controller: StartController
    id: number
    text: string
    number: number
    state: RowState
    why: string
    only: boolean
    register: (id: number, element: HTMLInputElement | null) => void
}

/** Enter opens a new line after this one; Backspace on an empty line closes it (when it is not the only one). */
function onLineKey(controller: StartController, id: number, only: boolean, event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
        event.preventDefault()
        controller.pasteInsertAfter(id)
    } else if (event.key === 'Backspace' && event.currentTarget.value === '' && !only) {
        event.preventDefault()
        controller.pasteRemove(id)
    }
}

/** Several lines pasted in one line make several lines. */
function onLinePaste(controller: StartController, id: number, event: ClipboardEvent<HTMLInputElement>): void {
    const text = event.clipboardData?.getData('text') || ''
    if (!/\r?\n/.test(text)) return
    event.preventDefault()
    controller.pasteSeveral(id, text, event.currentTarget.selectionStart)
}

function Line({ controller, id, text, number, state, why, only, register }: LineProps) {
    return (
        <div className={ROW_CLASSES[state]} role="listitem">
            <span className="home-line__n" aria-hidden="true">{String(number)}</span>
            <input
                type="text" className="home-line__text" autoComplete="off" spellCheck={false} placeholder={t('start.list.placeholder')}
                aria-label={why ? t('start.list.lineWhy', { number, why }) : t('start.list.line', { number })}
                value={text}
                ref={(element) => register(id, element)}
                onChange={noop}
                onInput={(event) => controller.pasteTyped(id, event.currentTarget.value)}
                onKeyDown={(event) => onLineKey(controller, id, only, event)}
                onPaste={(event) => onLinePaste(controller, id, event)}
            />
            <span className="home-line__tag" id={`homeLineWhy${number}`}>
                {state === 'ok' ? <><Icon name="Check" className="home-line__check" />{' '}{t('start.list.ready')}</> : why}
            </span>
        </div>
    )
}

/** The state of a line and the reason it says: from the report while it is shown, from the check as it is typed otherwise. */
function readLine(report: PasteReport | null, line: { why: string }, read: CheckedLine | undefined): { state: RowState; why: string } {
    if (report) return { state: line.why ? 'skip' : 'blank', why: line.why }
    if (read?.ready) return { state: 'ok', why: '' }
    return { state: read?.blank ? 'blank' : 'bad', why: read?.why ?? '' }
}

/** The field a request for the focus points at, when it points at one of the list. */
function focusTarget(request: FocusRequest, lines: PasteLine[], fields: Map<number, HTMLInputElement>): HTMLInputElement | undefined {
    if (request.to === 'pasteEnd') return fields.get(lines.at(-1)?.id ?? -1)
    return request.to === 'pasteLine' ? fields.get(request.id) : undefined
}

export function PasteList({ controller, hidden }: { controller: StartController; hidden: boolean }) {
    const fields = useRef(new Map<number, HTMLInputElement>())
    const { lines, report, busy } = controller.paste
    const checked = checkPastedLines(controller.pasteValue())
    const summary = pasteSummary(checked)
    const requestId = controller.focusRequest?.id

    // Where the focus goes after a change of the list (a mode opened, a line opened or closed).
    useLayoutEffect(() => {
        const request = controller.focusRequest?.request
        const target = request ? focusTarget(request, controller.paste.lines, fields.current) : undefined
        if (!request || !target) return
        target.focus()
        if (request.to === 'pasteEnd' || (request.to === 'pasteLine' && request.atEnd)) target.setSelectionRange(target.value.length, target.value.length)
    }, [controller, requestId])

    const register = (id: number, element: HTMLInputElement | null) => {
        if (element) fields.current.set(id, element)
        else fields.current.delete(id)
    }
    const button = report
        ? { label: report.button || t('start.list.add'), disabled: !report.button, flame: false }
        : { label: summary.button, disabled: summary.ready === 0, flame: true }

    return (
        <div id="homePaste" className="home-field home-paste" hidden={hidden}>
            <p className="home-paste__label" id="homePasteLabel">{t('start.list.label')}</p>
            <div className="home-lines" role="list" aria-label={t('start.list.aria')}>
                {lines.map((line, i) => (
                    <Line key={line.id} controller={controller} id={line.id} text={line.text} number={i + 1} only={lines.length === 1} register={register} {...readLine(report, line, checked[i])} />
                ))}
            </div>
            <div className="home-paste__foot">
                <span id="homePasteSummary" className="home-paste__summary" role="status">
                    {report ? <ReportMessage message={report.message} /> : summary.text}
                </span>
                <button
                    type="button" id="btnProcessBulk" className={`home-btn${button.flame && !button.disabled ? ' is-flame' : ''}`}
                    disabled={busy || button.disabled} aria-busy={busy ? 'true' : undefined}
                    onClick={() => { void controller.addPastedList(controller.pasteValue()) }}
                >
                    {busy ? t('start.list.adding') : button.label}
                </button>
            </div>
        </div>
    )
}
