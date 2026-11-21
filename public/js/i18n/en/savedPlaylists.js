/**
 * The texts of the saved playlists screen (/saved-playlists), in English: the reserve of every language. The words are the ones the
 * hand-made screen had (F83 wave 1). A name a person wrote (series, batch, playlist) is never here: it goes in as a {placeholder}.
 * Where the old screen wrote «playlists» even for one (the cards on the computer), the text is a single key: the same words.
 */
export const savedPlaylists = {
    'savedPlaylists.title': 'Your Playlists Series',

    'savedPlaylists.sort.updated': 'Recently Updated',
    'savedPlaylists.sort.nameAsc': 'Name (A-Z)',
    'savedPlaylists.sort.nameDesc': 'Name (Z-A)',
    'savedPlaylists.filter.seriesTitle': 'Album series',
    'savedPlaylists.filter.seriesAll': 'All Albums Series',
    'savedPlaylists.filter.batchTitle': 'Batch',
    'savedPlaylists.filter.batchAll': 'All Playlist Series',
    'savedPlaylists.filter.reload': 'Read the saved playlists again',
    'savedPlaylists.filter.done': 'Show series',

    'savedPlaylists.status.firstLoad': 'Reading your series...',
    'savedPlaylists.status.reading': 'Reading playlists: {settled} of {total} series',
    'savedPlaylists.status.updating': 'Updating...',
    'savedPlaylists.list.failed': 'Your series could not be read.',
    'savedPlaylists.list.failedStale': 'The list could not be updated. What you see may be out of date.',
    'savedPlaylists.tryAgain': 'Try again',
    'savedPlaylists.noMatches': 'No matches found.',
    'savedPlaylists.empty.title': 'No Playlists Found',
    'savedPlaylists.empty.body': 'Generate and save playlists in your series to see them here.',
    'savedPlaylists.empty.create': 'Create Series',

    'savedPlaylists.deleteBatch.title': 'Delete Batch?',
    'savedPlaylists.deleteBatch.message': 'Are you sure you want to delete batch "{name}"? Contains {count} playlists.',
    'savedPlaylists.deleteBatch.confirm': 'Delete Batch',
    'savedPlaylists.deleteAll.title': 'Delete All Playlists?',
    'savedPlaylists.deleteAll.message': 'This will permanently delete all playlists in "{name}". The series and its albums will remain.',
    'savedPlaylists.deleteAll.confirm': 'Delete All Playlists',

    'savedPlaylists.series.add': 'Add Playlists',
    'savedPlaylists.series.open': 'Open Albums Series',
    'savedPlaylists.series.deleteAllTitle': 'Delete all playlists in this series',
    'savedPlaylists.series.deleteAllLabel': 'Delete all playlists in {name}',
    'savedPlaylists.series.id': 'ID: {id}...',
    'savedPlaylists.series.failed': 'The playlists of this series could not be read.',
    'savedPlaylists.series.failedStale': 'The playlists of this series could not be updated. What you see may be out of date.',

    'savedPlaylists.batch.edit': 'Edit Batch',
    'savedPlaylists.batch.editTitle': 'Edit this batch',
    'savedPlaylists.batch.editLabel': 'Edit batch {name}',
    'savedPlaylists.batch.deleteTitle': 'Delete entire batch',
    'savedPlaylists.batch.deleteLabel': 'Delete batch {name}',
    'savedPlaylists.batch.delete': 'Delete',
    'savedPlaylists.batch.playlists': '{count} playlists',
    'savedPlaylists.batch.tracks': '{count} tracks',
    'savedPlaylists.batch.albums': '{count} albums',
    'savedPlaylists.batch.empty': 'No playlists in this batch',

    'savedPlaylists.playlist.facts': '{tracks} tracks • {duration}',
    'savedPlaylists.playlist.viewTitle': 'View Details',
    'savedPlaylists.playlist.viewLabel': 'View the tracks of {name}',
    'savedPlaylists.playlist.noTracks': 'No tracks',

    'savedPlaylists.details.tracks': 'tracks',
    'savedPlaylists.details.duration': 'duration',
    'savedPlaylists.details.close': 'Close',

    'savedPlaylists.duration.minutes': '{count} min',
    'savedPlaylists.duration.hours': '{hours} h',
    'savedPlaylists.duration.hoursMinutes': '{hours} h {minutes} min',

    'savedPlaylists.phone.batches.one': '{count} batch',
    'savedPlaylists.phone.batches.other': '{count} batches',
    'savedPlaylists.phone.playlists.one': '{count} playlist',
    'savedPlaylists.phone.playlists.other': '{count} playlists',
    'savedPlaylists.phone.tracks.one': '{count} track',
    'savedPlaylists.phone.tracks.other': '{count} tracks',
    'savedPlaylists.phone.seriesActions': 'Actions for series {name}',
    'savedPlaylists.phone.batchActions': 'Actions for batch {name}',
    'savedPlaylists.phone.openTracks': 'Open the tracks of {name}',
    'savedPlaylists.phone.playlistFallback': 'Playlist',
    'savedPlaylists.phone.noPlaylists': 'No playlists in this batch',
    'savedPlaylists.phone.seriesFallback': 'Series',
    'savedPlaylists.phone.addPlaylists': 'Add playlists',
    'savedPlaylists.phone.openSeries': 'Open the album series',
    'savedPlaylists.phone.deleteAll': 'Delete all playlists of this series',
    'savedPlaylists.phone.editBatch': 'Edit batch',
    'savedPlaylists.phone.deleteBatch': 'Delete batch',
    'savedPlaylists.phone.savedAs': 'Saved as “{name}”',
    'savedPlaylists.phone.close': 'Close',

    'savedPlaylists.toast.deletedBatch': 'Deleted batch: {name}',
    'savedPlaylists.toast.deleteBatchFailed': 'Failed to delete batch',
    'savedPlaylists.toast.deletedAll': 'Deleted playlists for {name}',
    'savedPlaylists.toast.deleteAllFailed': 'Failed to delete playlists',

    'savedPlaylists.batchName.saved': 'Saved {stamp}',
    'savedPlaylists.batchName.untitled': 'Untitled batch'
}
