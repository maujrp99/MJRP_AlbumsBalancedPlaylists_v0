/**
 * schemaVersion - the version rule of the documents (F78, REQ-10; proposal § 6.2).
 *
 * Every document a repository writes carries `_schemaVersion`: the version of the shape it was
 * written in. It NEVER goes down. A version of the app stays installed after the data change; if an
 * old writer stamped its own lower number, a newer reader would take a new document for an old one.
 *
 * Where it holds:
 *   - here, for every write that stamps the version over a document that may exist
 *     (BaseRepository.save): the version written is the higher of the writer's and the one of the
 *     document as the writer holds it (what it read, handed back in the payload);
 *   - in firestore.rules, for every writer, old code included: a write that would lower it is refused.
 * An update of some fields (`update`, `updateMany`, `saveAlbumFacts`, the ranking's merge) does not
 * touch it at all.
 *
 * Pure: no import, no global.
 */

/**
 * The version to write: the higher of the writer's and the document's.
 * @param {number} writerVersion - the `schemaVersion` of the repository that writes
 * @param {*} documentVersion - `_schemaVersion` of the document as the writer holds it (may be absent)
 * @returns {number}
 */
export function keptSchemaVersion(writerVersion, documentVersion) {
    return Number.isFinite(documentVersion) && documentVersion > writerVersion ? documentVersion : writerVersion
}
