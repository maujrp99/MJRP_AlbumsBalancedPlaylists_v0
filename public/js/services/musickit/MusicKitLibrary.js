/**
 * MusicKitLibrary.js
 * Handles user library interactions (Playlists, Folders).
 */

import { musicKitAuth } from './MusicKitAuth.js';

const FOLDERS_PATH = '/v1/me/library/playlist-folders';
const FOLDERS_PAGE = 100;
/** A library never has this many pages of folders: a stop for an API that keeps answering `next`. */
const MAX_FOLDER_PAGES = 100;

/** The path and the query of a `next` link the API gave, as `music.api.music` takes them. */
function pageOf(next) {
    const url = new URL(next, 'https://api.music.apple.com');
    return { path: url.pathname, params: Object.fromEntries(url.searchParams) };
}

/**
 * Every folder of the library: the first page, then each `next` the API names, to the end (F90).
 * @returns {Promise<Array>} the folders as the API gives them
 */
async function readAllFolders(music) {
    const folders = [];
    const seen = new Set();
    let page = { path: FOLDERS_PATH, params: { limit: FOLDERS_PAGE } };
    for (let count = 0; page && count < MAX_FOLDER_PAGES; count++) {
        const result = await music.api.music(page.path, page.params);
        folders.push(...(result.data?.data || []));
        const next = result.data?.next;
        page = next && !seen.has(next) ? pageOf(next) : null;
        if (next) seen.add(next);
    }
    return folders;
}

class MusicKitLibrary {
    /**
     * Create a playlist in user's library
     */
    async createPlaylist(name, trackIds) {
        await musicKitAuth.authorize(); // ensure authorized
        const music = await musicKitAuth.init();

        try {
            const playlist = await music.api.music('/v1/me/library/playlists', null, {
                fetchOptions: {
                    method: 'POST',
                    body: JSON.stringify({
                        attributes: {
                            name: name,
                            description: "Created by MJRP's The Album Blender"
                        },
                        relationships: {
                            tracks: {
                                data: trackIds.map(id => ({
                                    id: id,
                                    type: 'songs'
                                }))
                            }
                        }
                    })
                }
            });

            console.log('[MusicKit] Playlist created:', name);
            return playlist.data?.data?.[0];
        } catch (error) {
            console.error('[MusicKit] Create playlist failed:', error);
            throw error;
        }
    }

    /**
     * The playlist folders of the person's library, to choose one (F90). Unlike createOrGetFolder it
     * does not hide a failure: the caller says the list could not be read.
     * @returns {Promise<Array<{ id: string, name: string }>>}
     */
    async listFolders() {
        await musicKitAuth.authorize();
        const music = await musicKitAuth.init();
        return (await readAllFolders(music))
            .map(folder => ({ id: folder.id, name: folder.attributes?.name || '' }))
            .filter(folder => folder.name);
    }

    /**
     * Create or find a playlist folder by name
     */
    async createOrGetFolder(folderName) {
        await musicKitAuth.authorize();
        const music = await musicKitAuth.init();

        try {
            const folders = await readAllFolders(music);

            const existingFolder = folders.find(f =>
                f.attributes?.name?.toLowerCase() === folderName.toLowerCase()
            );

            if (existingFolder) return existingFolder.id;

            const newFolder = await music.api.music('/v1/me/library/playlist-folders', null, {
                fetchOptions: {
                    method: 'POST',
                    body: JSON.stringify({
                        attributes: { name: folderName }
                    })
                }
            });

            return newFolder.data?.data?.[0]?.id || null;
        } catch (error) {
            console.error('[MusicKit] Folder operation failed:', error);
            return null;
        }
    }

    /**
     * Create playlist inside a folder
     */
    async createPlaylistInFolder(name, trackIds, folderId = null) {
        await musicKitAuth.authorize();
        const music = await musicKitAuth.init();

        const playlistData = {
            attributes: {
                name: name,
                description: "Created by MJRP's The Album Blender"
            },
            relationships: {
                tracks: {
                    data: trackIds.map(id => ({
                        id: id,
                        type: 'songs'
                    }))
                }
            }
        };

        if (folderId) {
            playlistData.relationships.parent = {
                data: [{
                    id: folderId,
                    type: 'library-playlist-folders'
                }]
            };
        }

        try {
            const playlist = await music.api.music('/v1/me/library/playlists', null, {
                fetchOptions: {
                    method: 'POST',
                    body: JSON.stringify(playlistData)
                }
            });

            console.log('[MusicKit] Playlist created in folder:', name);
            return playlist.data?.data?.[0];
        } catch (error) {
            console.error('[MusicKit] Create playlist in folder failed:', error);
            throw error;
        }
    }
}

export const musicKitLibrary = new MusicKitLibrary();
