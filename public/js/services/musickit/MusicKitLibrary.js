/**
 * MusicKitLibrary.js
 * Handles user library interactions (Playlists, Folders).
 */

import { musicKitAuth } from './MusicKitAuth.js';

class MusicKitLibrary {
    /**
     * Create a playlist in user's library
     */
    async createPlaylist(name, trackIds) {
        const token = await musicKitAuth.authorize(); // ensure authorized
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
     * Create or find a playlist folder by name
     */
    async createOrGetFolder(folderName) {
        await musicKitAuth.authorize();
        const music = await musicKitAuth.init();

        try {
            const foldersResult = await music.api.music('/v1/me/library/playlist-folders');
            const folders = foldersResult.data?.data || [];

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
