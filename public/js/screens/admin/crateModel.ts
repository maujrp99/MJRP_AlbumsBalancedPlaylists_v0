/**
 * The crate of the entry page as the Painel works on it, as plain data (F82, REQ-03; F95): the two sides with the front
 * record first, each move the owner can make (up, down, to the other side, out, in), the limits of a side and what a save
 * will change. The rule of an album and of the limits is the core's (shared/content/crate.js): this only asks.
 *
 * Pure: no React, no Firebase, no `t()`. A move that cannot be made gives back the very same crate.
 */
import { CRATE_LIMITS } from '@shared/content/crate.js'

export interface Album {
    id: string
    title: string
    artist: string
    year: number
    /** The artwork path on Apple's image server. */
    art: string
    /** The album's page on Apple Music. */
    href: string
}

export type Side = 'a' | 'b'
export interface Sides { a: Album[]; b: Album[] }

export const SIDES: readonly Side[] = ['a', 'b']
export const otherSide = (side: Side): Side => (side === 'a' ? 'b' : 'a')
export const limitsOf = (side: Side): { min: number; max: number } => CRATE_LIMITS[side]

export const holds = (sides: Sides, id: string): boolean => SIDES.some((side) => sides[side].some((album) => album.id === id))
/** A side takes one more album while it is under its ceiling. */
export const canTake = (sides: Sides, side: Side): boolean => sides[side].length < limitsOf(side).max

/** The album at `from` goes to the place `to` of the same side. */
export function moved(sides: Sides, side: Side, from: number, to: number): Sides {
    const list = sides[side]
    if (from === to || !list[from] || to < 0 || to >= list.length) return sides
    const next = [...list]
    next.splice(to, 0, ...next.splice(from, 1))
    return { ...sides, [side]: next }
}

export function removed(sides: Sides, side: Side, index: number): Sides {
    if (!sides[side][index]) return sides
    return { ...sides, [side]: sides[side].filter((_, at) => at !== index) }
}

/** An album comes in at the back of a side; never twice, never into a full side. */
export function added(sides: Sides, side: Side, album: Album): Sides {
    if (holds(sides, album.id) || !canTake(sides, side)) return sides
    return { ...sides, [side]: [...sides[side], album] }
}

/** The album goes to the back of the other side, when that side takes one more. */
export function sentAcross(sides: Sides, side: Side, index: number): Sides {
    const album = sides[side][index]
    const to = otherSide(side)
    if (!album || !canTake(sides, to)) return sides
    return { ...removed(sides, side, index), [to]: [...sides[to], album] }
}

export type CountState = 'ok' | 'few' | 'many'

function stateOf(count: number, side: Side): CountState {
    const { min, max } = limitsOf(side)
    if (count < min) return 'few'
    return count > max ? 'many' : 'ok'
}

/** Whether each side holds what the crate can draw. */
export const countState = (sides: Sides): Record<Side, CountState> => ({ a: stateOf(sides.a.length, 'a'), b: stateOf(sides.b.length, 'b') })

export interface Changes {
    /** The names of the albums that come in. */
    added: string[]
    /** The names of the albums that go out. */
    removed: string[]
    /** An album that stays changed its place or its side. */
    moved: boolean
}

const everyAlbum = (sides: Sides): Album[] => [...sides.a, ...sides.b]
const placesOf = (sides: Sides, kept: Set<string>): string => SIDES.map((side) => sides[side].filter((album) => kept.has(album.id)).map((album) => album.id).join(',')).join('|')

/** What saving `now` over `saved` changes, for the confirmation of what goes live. */
export function changesOf(saved: Sides, now: Sides): Changes {
    const before = new Set(everyAlbum(saved).map((album) => album.id))
    const after = new Set(everyAlbum(now).map((album) => album.id))
    const kept = new Set([...before].filter((id) => after.has(id)))
    return {
        added: everyAlbum(now).filter((album) => !before.has(album.id)).map((album) => album.title),
        removed: everyAlbum(saved).filter((album) => !after.has(album.id)).map((album) => album.title),
        moved: placesOf(saved, kept) !== placesOf(now, kept),
    }
}
