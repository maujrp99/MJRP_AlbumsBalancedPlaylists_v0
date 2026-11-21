import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { checkPastedLines, pasteSummary } from '../../models/homePaste.js'

/**
 * The pasted list in the Home's one field (F79, HOME-05): one line per album, each line its own field,
 * with its number and, as it is typed, «ready» or what to fix (models/homePaste.js). Pasting several
 * lines makes several lines; Enter opens a new line; Backspace on an empty line closes it. The foot
 * says how many lines are ready and carries «Add N albums».
 *
 * After «Add», the lines that did not go in stay, each with the reason (red line and words, never the
 * colour alone), to be fixed in place, and the button sends what is in them («Add this line»). Typing
 * in the list again goes back to the check as it is typed.
 *
 * It searches nothing: «Add» asks `onAdd` with the text of the list.
 */
/** The class of a line in each state, written whole (the build reads class names from the source). */
const ROW_CLASSES = Object.freeze({ ok: 'home-line is-ok', bad: 'home-line is-bad', blank: 'home-line is-blank', skip: 'home-line is-skip' })

export class HomePasteList {
    /** @param {{ onAdd: (text: string) => void }} options */
    constructor({ onAdd }) {
        this.onAdd = onAdd
        this.report = null
        this.element = null
    }

    render() {
        this.lines = SafeDOM.div({ className: 'home-lines', role: 'list', 'aria-label': 'Your list' })
        this.summary = SafeDOM.span({ id: 'homePasteSummary', className: 'home-paste__summary', role: 'status' })
        this.button = SafeDOM.button({ id: 'btnProcessBulk', className: 'home-btn' }, 'Add albums')
        this.button.addEventListener('click', () => this.onAdd(this.value()))
        this.lines.addEventListener('input', () => this.refresh())
        this.lines.addEventListener('keydown', (event) => this.onKeydown(event))
        this.lines.addEventListener('paste', (event) => this.onPaste(event))

        this.element = SafeDOM.div({ id: 'homePaste', className: 'home-field home-paste' }, [
            SafeDOM.p({ className: 'home-paste__label', id: 'homePasteLabel' }, 'Your list · one album per line, as Artist - Album'),
            this.lines,
            SafeDOM.div({ className: 'home-paste__foot' }, [this.summary, this.button])
        ])
        this.setText('')
        return this.element
    }

    /** @returns {string} the list, one album per line */
    value() {
        return this.inputs().map(input => input.value).join('\n')
    }

    inputs() {
        return [...this.lines.querySelectorAll('.home-line__text')]
    }

    /** The list from a text: one line per line of it. */
    setText(text) {
        this.report = null
        const texts = String(text ?? '').split(/\r?\n/)
        SafeDOM.clear(this.lines)
        texts.forEach(line => this.lines.appendChild(this.row(line)))
        this.refresh()
    }

    /** The focus on the last line, at its end. */
    focusEnd() {
        const last = this.inputs().at(-1)
        last?.focus()
        last?.setSelectionRange?.(last.value.length, last.value.length)
    }

    row(text) {
        const input = SafeDOM.input({ type: 'text', className: 'home-line__text', value: text, autocomplete: 'off', spellcheck: 'false', placeholder: 'Artist - Album' })
        input.value = text
        return SafeDOM.div({ className: 'home-line', role: 'listitem' }, [
            SafeDOM.span({ className: 'home-line__n', 'aria-hidden': 'true' }),
            input,
            SafeDOM.span({ className: 'home-line__tag' })
        ])
    }

    /** Every line checked as it is now, and the foot. A list typed in again leaves the report. */
    refresh() {
        this.report = null
        const checked = checkPastedLines(this.value())
        this.rows().forEach((row, i) => this.drawRow(row, i, checked[i]))
        const summary = pasteSummary(checked)
        this.summary.textContent = summary.text
        this.drawButton(summary.button, summary.ready === 0, true)
    }

    rows() {
        return [...this.lines.querySelectorAll('.home-line')]
    }

    drawRow(row, i, line) {
        const state = line.ready ? 'ok' : (line.blank ? 'blank' : 'bad')
        this.tagRow(row, i, state, line.why)
    }

    tagRow(row, i, state, why) {
        row.className = ROW_CLASSES[state]
        row.querySelector('.home-line__n').textContent = String(i + 1)
        const tag = row.querySelector('.home-line__tag')
        SafeDOM.clear(tag)
        if (state === 'ok') {
            tag.appendChild(SafeDOM.fromHTML(getIcon('Check', 'home-line__check')))
            tag.appendChild(document.createTextNode(' ready'))
        } else if (why) {
            tag.textContent = why
        }
        tag.id = `homeLineWhy${i + 1}`
        const input = row.querySelector('.home-line__text')
        input.setAttribute('aria-label', `Line ${i + 1}${why ? `, ${why}` : ''}`)
    }

    drawButton(label, disabled, flame) {
        this.button.textContent = label
        this.button.disabled = disabled
        this.button.classList.toggle('is-flame', flame && !disabled)
    }

    /**
     * After «Add»: what went in and what stays to fix.
     * @param {{ message: string, lines: Array<{ text: string, why: string }>, button: string }} report
     */
    showReport(report) {
        SafeDOM.clear(this.lines)
        const left = report.lines.length ? report.lines : [{ text: '', why: '' }]
        left.forEach((line, i) => {
            const row = this.row(line.text)
            this.lines.appendChild(row)
            this.tagRow(row, i, line.why ? 'skip' : 'blank', line.why)
        })
        this.report = report
        this.drawReportMessage(report.message)
        this.drawButton(report.button || 'Add albums', !report.button, false)
    }

    /** «Added 2 albums.» in bold, as the prototype; the rest of the sentence after it. */
    drawReportMessage(message) {
        SafeDOM.clear(this.summary)
        const end = message.indexOf('. ')
        if (end < 0) {
            this.summary.appendChild(SafeDOM.strong({}, message))
            return
        }
        this.summary.append(SafeDOM.strong({}, message.slice(0, end + 1)), message.slice(end + 1))
    }

    /** «Add» while the lines are searched: busy, and not to be clicked again. */
    setBusy(busy) {
        this.button.disabled = busy
        if (busy) {
            this.button.setAttribute('aria-busy', 'true')
            this.button.textContent = 'Adding…'
            return
        }
        this.button.removeAttribute('aria-busy')
        // the report, when there is one, says what the button is now; with none, the list does
        if (this.report) this.drawButton(this.report.button || 'Add albums', !this.report.button, false)
        else this.refresh()
    }

    onKeydown(event) {
        const input = event.target.closest('.home-line__text')
        if (!input) return
        if (event.key === 'Enter') {
            event.preventDefault()
            this.insertAfter(input.closest('.home-line'), '')
        } else if (event.key === 'Backspace' && input.value === '' && this.inputs().length > 1) {
            event.preventDefault()
            this.removeRow(input.closest('.home-line'))
        }
    }

    /** Several lines pasted in one line: one line each. */
    onPaste(event) {
        const input = event.target.closest('.home-line__text')
        const text = event.clipboardData?.getData('text') || ''
        if (!input || !/\r?\n/.test(text)) return
        event.preventDefault()
        const [first, ...rest] = text.split(/\r?\n/)
        const start = input.selectionStart ?? input.value.length
        input.value = input.value.slice(0, start) + first
        let after = input.closest('.home-line')
        rest.forEach(line => { after = this.insertAfter(after, line, false) })
        this.refresh()
    }

    insertAfter(row, text, focus = true) {
        const fresh = this.row(text)
        row.after(fresh)
        if (focus) {
            this.refresh()
            fresh.querySelector('input').focus()
        }
        return fresh
    }

    removeRow(row) {
        const previous = row.previousElementSibling || row.nextElementSibling
        row.remove()
        this.refresh()
        const input = previous?.querySelector('input')
        input?.focus()
        input?.setSelectionRange?.(input.value.length, input.value.length)
    }
}
