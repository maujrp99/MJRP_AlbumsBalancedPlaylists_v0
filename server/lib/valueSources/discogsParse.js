/**
 * Reading what the Discogs API answers (F75), as pure functions: no network, no time.
 *
 * The field names of the search and of the versions were checked against real answers on
 * 2026-11-20 (test/fixtures/discogs). The shape of the price suggestion is the documented one:
 * the live call needs the token of the account and was never made while this was written, so
 * `suggestionsOf` believes nothing it cannot read as a number with a currency.
 */

/** The three conditions the value of an album is made of, and how the name of each starts at Discogs. */
const CONDITIONS = Object.freeze({
  mint: /^mint\b/i, // "Mint (M)"
  nearMint: /^near mint\b/i, // "Near Mint (NM or M-)"
  veryGoodPlus: /^very good plus\b/i // "Very Good Plus (VG+)"; "Very Good (VG)" is another one
})

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const listOf = (value) => (Array.isArray(value) ? value : [])
const count = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0)

/** One condition of the answer: { value, currency }, or null when it is not there or is not a price. */
function suggestionFor (body, pattern) {
  const name = Object.keys(body).find(key => pattern.test(key.trim()))
  const entry = name ? body[name] : null
  if (!isObject(entry)) return null
  const value = typeof entry.value === 'number' ? entry.value : NaN
  const currency = typeof entry.currency === 'string' ? entry.currency.trim().toUpperCase() : ''
  return Number.isFinite(value) && value > 0 && currency ? { value, currency } : null
}

/**
 * The three conditions of a price suggestion.
 * @param {*} body - the answer of GET /marketplace/price_suggestions/{release_id}
 * @returns {{ conditions: { mint: number, nearMint: number, veryGoodPlus: number }, currency: string }|null}
 *   null when one of the three is missing or unreadable, or when they are not in one currency
 */
function suggestionsOf (body) {
  if (!isObject(body)) return null
  const read = Object.entries(CONDITIONS).map(([name, pattern]) => [name, suggestionFor(body, pattern)])
  if (read.some(([, one]) => !one)) return null
  const currencies = new Set(read.map(([, one]) => one.currency))
  if (currencies.size !== 1) return null
  return { conditions: Object.fromEntries(read.map(([name, one]) => [name, one.value])), currency: [...currencies][0] }
}

/** "Label 1984, Europe": what the person is told of an edition. */
function editionTitle ({ label, year, country }) {
  const first = [label, year].map(part => String(part || '').trim()).filter(Boolean).join(' ')
  return [first, String(country || '').trim()].filter(Boolean).join(', ')
}

const yearOf = (value) => (/^\d{4}/.exec(String(value || '')) || [''])[0]
const firstOf = (value) => (Array.isArray(value) ? value[0] : value)
const isCd = (formats) => listOf(formats).some(format => String(format).toUpperCase() === 'CD')
const haveOf = (result) => count(result.community && result.community.have)

/** Is this result of the search one that may be listed for the type asked? A release only when it is a CD. */
function isCandidate (one, type) {
  if (!isObject(one) || one.type !== type) return false
  if (!Number.isInteger(one.id) || typeof one.title !== 'string') return false
  return type !== 'release' || isCd(one.format)
}

/**
 * The results of a search that may be the album, the most collected first (the identity rule then
 * says which one IS the album; this only lists them).
 * @param {*} body - the answer of GET /database/search
 * @param {'master'|'release'} type - a release counts only when it is a CD
 * @returns {Array<{ id: number, label: string, year: string, have: number, edition: string }>}
 */
function candidatesOf (body, type) {
  return listOf(body && body.results)
    .filter(one => isCandidate(one, type))
    .map(one => ({
      id: one.id,
      label: one.title,
      year: yearOf(one.year),
      have: haveOf(one),
      edition: editionTitle({ label: firstOf(one.label), year: yearOf(one.year), country: one.country })
    }))
    .sort((a, b) => b.have - a.have)
}

/** Discogs tells two artists of one name apart with a number ("Nirvana (2)") and marks a variation with "*". */
const plainArtist = (name) => name.replace(/\s*\(\d+\)\s*$/, '').replace(/\*$/, '').trim()

/**
 * A search result names its album as "Artist - Title". A dash may be part of either, so the label
 * is read at each " - ": the identity rule accepts the reading that is the album, if any.
 * @param {string} label
 * @returns {Array<{ artist: string, title: string }>}
 */
function readingsOfLabel (label) {
  const text = String(label || '')
  return [...text.matchAll(/ - /g)]
    .map(dash => ({ artist: plainArtist(text.slice(0, dash.index)), title: text.slice(dash.index + 3).trim() }))
    .filter(reading => reading.artist && reading.title)
}

const inCollection = (version) => count(version.stats && version.stats.community && version.stats.community.in_collection)

/**
 * The CD version of a master that most people have in their collections.
 * @param {*} body - the answer of GET /masters/{id}/versions?format=CD
 * @returns {{ id: number, title: string }|null} null when the master lists no CD version
 */
function mostCollectedCd (body) {
  const versions = listOf(body && body.versions)
    .filter(one => isObject(one) && Number.isInteger(one.id) && isCd(one.major_formats))
    .sort((a, b) => inCollection(b) - inCollection(a))
  const best = versions[0]
  return best ? { id: best.id, title: editionTitle({ label: best.label, year: yearOf(best.released), country: best.country }) } : null
}

/**
 * The lowest price an edition is for sale at, and how many copies are for sale.
 * @param {*} body - the answer of GET /marketplace/stats/{release_id}: { num_for_sale, lowest_price: { value, currency } | null }
 * @returns {{ lowest: { value: number, currency: string }, forSale: number }|null} null when none is for sale, or the price is unreadable
 */
function lowestForSaleOf (body) {
  const price = isObject(body) && isObject(body.lowest_price) ? body.lowest_price : null
  if (!price || typeof price.value !== 'number' || !(price.value > 0) || typeof price.currency !== 'string') return null
  return { lowest: { value: price.value, currency: price.currency.trim().toUpperCase() }, forSale: count(body.num_for_sale) }
}

/** The page of a release at Discogs: where "Data provided by Discogs." links to. */
const releaseUrl = (id) => `https://www.discogs.com/release/${id}`

module.exports = { lowestForSaleOf, suggestionsOf, candidatesOf, readingsOfLabel, mostCollectedCd, releaseUrl, editionTitle }
