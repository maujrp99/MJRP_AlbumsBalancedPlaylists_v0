/**
 * DataSyncService
 * Handles migration of data between contexts (e.g. Guest -> Authenticated)
 */

export class DataSyncService {
    /**
     * Migrate inventory albums to new repository
     * @param {InventoryRepository} targetRepository - Repository to write to
     * @param {Array} albums - List of albums to migrate
     * @returns {Promise<number>} Count of successfully migrated albums
     */
    async migrateInventory(targetRepository, albums) {
        if (!albums || albums.length === 0) return 0;

        console.log(`[DataSync] Migrating ${albums.length} albums...`);
        let count = 0;

        for (const album of albums) {
            try {
                // Prepare metadata options
                const options = {
                    purchasePrice: album.purchasePrice,
                    currency: album.currency || 'USD',
                    condition: album.condition,
                    notes: album.notes,
                    owned: album.owned
                };

                // Add to new repo
                // Only if title/artist present (basic validation)
                if (album.title && album.artist) {
                    await targetRepository.addAlbum(album, album.format || 'cd', options);
                    count++;
                }
            } catch (error) {
                console.warn(`[DataSync] Failed to migrate album: ${album.title}`, error);
                // Continue with others
            }
        }

        console.log(`[DataSync] Successfully migrated ${count}/${albums.length} albums.`);
        return count;
    }

    /**
     * Migrate series to new repository
     * @param {SeriesRepository} targetRepository 
     * @param {Array} seriesList 
     * @returns {Promise<number>} Count of migrated series
     */
    async migrateSeries(targetRepository, seriesList) {
        if (!seriesList || seriesList.length === 0) return 0;

        console.log(`[DataSync] Migrating ${seriesList.length} series...`);
        let count = 0;

        for (const series of seriesList) {
            try {
                const newSeries = {
                    name: series.name,
                    albumQueries: series.albumQueries || [],
                    notes: series.notes || '',
                    status: series.status || 'pending',
                    sourceType: series.sourceType || 'manual'
                };

                await targetRepository.create(newSeries);
                count++;
            } catch (error) {
                console.warn(`[DataSync] Failed to migrate series: ${series.name}`, error);
            }
        }

        return count;
    }
}

export const dataSyncService = new DataSyncService();
