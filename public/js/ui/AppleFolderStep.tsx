/**
 * AppleFolderStep - the step before an export to Apple Music: in which folder do the playlists go (F90; written in React in F83 sync 2,
 * it was views/playlists/AppleFolderStep.js).
 *
 * The series' name is selected (the folder the export always used), so accepting it is one tap on «Export». The person can pick a folder
 * the library already has, type a new name, or choose no folder. The list of folders is read when the step opens; while it is read, when
 * there is none and when it could not be read, the step says so and the other choices stay. What was picked is remembered for the series
 * (models/appleFolderChoice.js). The progress of the export is written on the «Export» button, which the step draws (the export tells it).
 */
import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { Icon } from './Icon'
import { t } from '../i18n/t.js'
import { readChoice, saveChoice, findFolder, initialPick, folderForExport } from '../models/appleFolderChoice.js'

export interface Folder {
    id: string
    name: string
}

/** What the export is told about the folder: its name, its id when it was picked from the library's list, or none. */
export interface FolderChoice {
    folderName?: string
    folderId?: string
    noFolder?: boolean
}

type Mode = 'series' | 'existing' | 'new' | 'none'
interface Pick {
    mode: Mode
    name: string
}
type Status = 'loading' | 'ready' | 'empty' | 'failed'

const ROW_CLASS = 'flex items-center gap-3 px-3 rounded-xl bg-white/5 cursor-pointer'
const STATUS_KEY: Record<Status, string | null> = {
    loading: 'exportWindow.step.loading',
    ready: null,
    empty: 'exportWindow.step.empty',
    failed: 'exportWindow.step.failed'
}

type FocusMark = { typed: true } | { mode: string; value: string }

/** The focus is on the page or on something outside the list: it was not lost to a change in the list. */
const isFocusKept = (list: HTMLElement): boolean => list.contains(document.activeElement) || Boolean(document.activeElement && document.activeElement !== document.body)

/** Give the focus back after the list changed: the typed field, the same choice, else the selected one, else the first. */
function focusAfterChange(mark: FocusMark, list: HTMLElement, typed: HTMLInputElement | null): void {
    if ('typed' in mark) { typed?.focus({ preventScroll: true }); return }
    const inputs = [...list.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
    const same = inputs.find(input => input.dataset.mode === mark.mode && input.value === mark.value)
    ;(same || inputs.find(input => input.checked) || inputs[0])?.focus({ preventScroll: true })
}

function RadioRow({ mode, value, label, note, checked, onPick, extra }: {
    mode: Mode
    value: string
    label: string
    note?: string
    checked: boolean
    onPick: () => void
    extra?: ReactNode
}) {
    return (
        <label className={ROW_CLASS} style={{ minHeight: '44px' }}>
            <input type="radio" name="apple-folder" className="accent-orange-500" data-mode={mode} value={value} checked={checked} onChange={onPick} />
            <span className="min-w-0 flex-1 text-white">
                {label}
                {note ? <span className="text-white/50 text-sm">{` ${note}`}</span> : null}
            </span>
            {extra}
        </label>
    )
}

export function AppleFolderStep({ seriesName, loadFolders, onExport, onBack, storage }: {
    seriesName: string
    loadFolders: () => Promise<Folder[]>
    /** `report` is how the export writes its progress on the button (a text while it runs, null at the end). */
    onExport: (folder: FolderChoice, report: (text: string | null) => void) => void
    onBack: () => void
    storage?: Storage
}) {
    const remembered = useRef(readChoice(seriesName, storage))
    const [folders, setFolders] = useState<Folder[]>([])
    const [status, setStatus] = useState<Status>('loading')
    const [pick, setPick] = useState<Pick>(() => initialPick({ seriesName, folders: [], remembered: remembered.current }))
    const [typed, setTyped] = useState(() => (pick.mode === 'new' ? pick.name : ''))
    const [typedByHand, setTypedByHand] = useState(false)
    const [alert, setAlert] = useState('')
    const [progress, setProgress] = useState<string | null>(null)
    const touched = useRef(false)
    const typedField = useRef<HTMLInputElement>(null)
    const list = useRef<HTMLDivElement>(null)
    const focused = useRef<FocusMark | null>(null)

    // The folders are read once, when the step opens (a second read in the strict mode of development is the same read).
    useEffect(() => {
        let stale = false
        Promise.resolve().then(loadFolders).then(
            (read) => { if (!stale) { setFolders(read); setStatus(read.length === 0 ? 'empty' : 'ready') } },
            () => { if (!stale) setStatus('failed') }
        )
        return () => { stale = true }
    }, [loadFolders])

    // What the list says once it is read: the pick the person left alone becomes what was remembered, if the library still has it.
    useEffect(() => {
        if (status === 'loading') return
        setPick(current => {
            let next = current
            if (!touched.current) next = initialPick({ seriesName, folders, remembered: remembered.current })
            if (next.mode === 'existing' && !findFolder(folders, next.name)) next = { mode: 'series', name: seriesName }
            return next
        })
    }, [status, folders, seriesName])

    // The field is the person's own text, or the remembered new name: never an old folder's name
    const shownTyped = pick.mode === 'new' ? pick.name : (typedByHand ? typed : '')

    // A row that had the focus and is gone (the list changed under it): the focus goes to the choice that is selected, not to the page.
    useLayoutEffect(() => {
        if (focused.current && list.current && !isFocusKept(list.current)) focusAfterChange(focused.current, list.current, typedField.current)
    })

    const pickRow = (mode: Mode, name: string) => {
        touched.current = true
        setPick({ mode, name })
        setAlert('')
    }
    const onType = (value: string) => {
        setTyped(value)
        setTypedByHand(true)
        pickRow('new', value)
    }
    const onFocus = (event: FocusEvent<HTMLDivElement>) => {
        const target = event.target as HTMLInputElement
        focused.current = target === typedField.current ? { typed: true } : { mode: target.dataset.mode ?? '', value: target.value }
    }
    const onBlur = (event: FocusEvent<HTMLDivElement>) => { if (event.relatedTarget) focused.current = null }

    const exportNow = () => {
        const folder = folderForExport(pick)
        if (!folder.ok) {
            setAlert(t('exportWindow.step.needName'))
            typedField.current?.focus()
            return
        }
        const known = pick.mode === 'new' ? null : findFolder(folders, folder.folderName)
        const choice: FolderChoice = { ...(folder.noFolder ? { noFolder: true } : { folderName: folder.folderName }), ...(known ? { folderId: known.id } : {}) }
        saveChoice(seriesName, folder.noFolder ? { none: true } : { name: folder.folderName ?? '' }, storage)
        onExport(choice, setProgress)
    }

    const statusKey = STATUS_KEY[status]
    const others = folders.filter(folder => folder.name.trim().toLowerCase() !== seriesName.trim().toLowerCase())
    return (
        <div className="flex flex-col gap-3" data-apple-folder-step="true">
            <h3 className="text-lg font-bold text-white">{t('exportWindow.step.heading')}</h3>
            <p className="text-sm text-white/60" role="status">{statusKey ? t(statusKey) : ''}</p>
            <div ref={list} className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '40vh' }} role="radiogroup" aria-label={t('exportWindow.step.listLabel')} onFocus={onFocus} onBlur={onBlur}>
                <RadioRow mode="series" value={seriesName} label={seriesName} note={t('exportWindow.step.default')} checked={pick.mode === 'series'} onPick={() => pickRow('series', seriesName)} />
                {others.map(folder => (
                    <RadioRow key={folder.name} mode="existing" value={folder.name} label={folder.name} checked={pick.mode === 'existing' && pick.name === folder.name} onPick={() => pickRow('existing', folder.name)} />
                ))}
                <RadioRow
                    mode="new"
                    value=""
                    label={t('exportWindow.step.new')}
                    checked={pick.mode === 'new'}
                    onPick={() => pickRow('new', shownTyped)}
                    extra={(
                        <input
                            ref={typedField}
                            type="text"
                            className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
                            placeholder={t('exportWindow.step.new')}
                            aria-label={t('exportWindow.step.newLabel')}
                            autoComplete="off"
                            data-folder-name="true"
                            value={shownTyped}
                            onChange={(event) => onType(event.target.value)}
                        />
                    )}
                />
                <RadioRow mode="none" value="" label={t('exportWindow.step.none')} note={t('exportWindow.step.noneNote')} checked={pick.mode === 'none'} onPick={() => pickRow('none', '')} />
            </div>
            <p className="text-sm text-red-400" role="alert">{alert}</p>
            <button type="button" className="btn btn-primary w-full justify-center" data-apple-export="true" disabled={progress !== null} onClick={exportNow}>
                {progress === null ? t('exportWindow.step.export') : <><Icon name="Apple" className="w-5 h-5" />{` ${progress}`}</>}
            </button>
            <button type="button" className="btn btn-ghost w-full justify-center" data-folder-back="true" onClick={onBack}>{t('exportWindow.step.back')}</button>
        </div>
    )
}
