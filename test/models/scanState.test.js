/**
 * F67 - the Home scan has exactly one state at any time, and the rules are pure functions.
 */
import { describe, it, expect } from 'vitest'
import {
    ScanStatus, ScanFailure, idleScan, startScan, scanFound, scanEmpty, scanFailed, scanReclassified,
    canStartScan
} from '../../public/js/models/scanState.js'

const album = (title, type = 'Album') => ({ id: title, title, artist: 'Pavement', type })

describe('scanState: transitions (F67)', () => {
    it('starts idle', () => {
        expect(idleScan()).toMatchObject({ status: ScanStatus.IDLE, generation: 0, query: '', albums: [] })
    })

    it('a scan can start from idle, results, empty and failed, never while scanning or with no text', () => {
        const scanning = startScan(idleScan(), 'pavement')
        expect(canStartScan(idleScan(), 'pavement')).toBe(true)
        expect(canStartScan(scanning, 'pavement')).toBe(false)
        expect(canStartScan(scanning, 'other')).toBe(false)
        expect(canStartScan(idleScan(), '   ')).toBe(false)
        expect(canStartScan(scanFailed(scanning, scanning.generation, ScanFailure.TIMEOUT), 'pavement')).toBe(true)
        expect(canStartScan(scanEmpty(scanning, scanning.generation), 'pavement')).toBe(true)
        expect(canStartScan(scanFound(scanning, scanning.generation, { albums: [album('A')] }), 'x')).toBe(true)
    })

    it('starting gives a new generation, the trimmed text and no albums', () => {
        const first = startScan(idleScan(), '  pavement ')
        expect(first).toMatchObject({ status: ScanStatus.SCANNING, generation: 1, query: 'pavement', albums: [] })
        const second = startScan(scanEmpty(first, 1), 'wilco')
        expect(second.generation).toBe(2)
    })

    it('startScan while scanning changes nothing', () => {
        const scanning = startScan(idleScan(), 'pavement')
        expect(startScan(scanning, 'wilco')).toBe(scanning)
    })

    it('found: the albums, the artist of the first, and whether the AI list is still to come', () => {
        const scanning = startScan(idleScan(), 'pavement')
        const found = scanFound(scanning, 1, { albums: [album('A'), album('B', 'EP')], classifying: true })
        expect(found).toMatchObject({ status: ScanStatus.RESULTS, artist: 'Pavement', classifying: true })
        expect(found.albums).toHaveLength(2)
    })

    it('found with no album is the empty state', () => {
        const scanning = startScan(idleScan(), 'pavement')
        expect(scanFound(scanning, 1, { albums: [] }).status).toBe(ScanStatus.EMPTY)
    })

    it('failed keeps the reason and the text, so "Try again" can ask again', () => {
        const scanning = startScan(idleScan(), 'pavement')
        const failed = scanFailed(scanning, 1, ScanFailure.TIMEOUT)
        expect(failed).toMatchObject({ status: ScanStatus.FAILED, failure: ScanFailure.TIMEOUT, query: 'pavement' })
    })

    it('a late answer of an older scan changes nothing', () => {
        const first = startScan(idleScan(), 'pavement')
        const second = startScan(scanFailed(first, 1, ScanFailure.TIMEOUT), 'wilco')
        expect(scanFound(second, 1, { albums: [album('Old')] })).toBe(second)
        expect(scanEmpty(second, 1)).toBe(second)
        expect(scanFailed(second, 1, ScanFailure.ERROR)).toBe(second)
        expect(scanReclassified(second, 1, [album('Old')])).toBe(second)
    })

    it('an answer that comes after the scan already ended changes nothing', () => {
        const scanning = startScan(idleScan(), 'pavement')
        const failed = scanFailed(scanning, 1, ScanFailure.TIMEOUT)
        expect(scanFound(failed, 1, { albums: [album('Late')] })).toBe(failed)
        expect(scanEmpty(failed, 1)).toBe(failed)
    })

    it('reclassified: the albums of the AI pass replace the first ones and the wait ends', () => {
        const found = scanFound(startScan(idleScan(), 'x'), 1, { albums: [album('A', 'Uncategorized')], classifying: true })
        const again = scanReclassified(found, 1, [album('A', 'Album')])
        expect(again.classifying).toBe(false)
        expect(again.albums[0].type).toBe('Album')
    })

    it('reclassified with nothing (the AI list did not come): the first albums stay and the wait ends', () => {
        const found = scanFound(startScan(idleScan(), 'x'), 1, { albums: [album('A', 'Uncategorized')], classifying: true })
        const again = scanReclassified(found, 1, null)
        expect(again.classifying).toBe(false)
        expect(again.albums).toBe(found.albums)
    })

    it('reclassified is ignored when no AI list was awaited', () => {
        const found = scanFound(startScan(idleScan(), 'x'), 1, { albums: [album('A')] })
        expect(scanReclassified(found, 1, [album('B')])).toBe(found)
    })
})
