import { describe, it, expect, beforeEach } from 'vitest';
import { UserRankingStrategy } from '../../public/js/ranking/UserRankingStrategy.js';

describe('UserRankingStrategy', () => {
    let strategy;
    let mockAlbum;

    beforeEach(() => {
        strategy = new UserRankingStrategy();
        mockAlbum = {
            id: 'album-123',
            tracks: [
                { id: 't1', title: 'Song A', position: 1 },
                { id: 't2', title: 'Song B', position: 2 },
                { id: 't3', title: 'Song C', position: 3 }
            ]
        };
    });

    it('should have correct metadata', () => {
        expect(UserRankingStrategy.metadata.id).toBe('user');
        expect(UserRankingStrategy.metadata.name).toBe('My Ranking');
    });

    it('should sort tracks based on user ranking (pre-hydrated)', () => {
        // UserRankingStrategy expects 'userRanking' property to be already present (injected by Controller)
        mockAlbum.userRanking = [
            { trackTitle: 'Song C', userRank: 1 },
            { trackTitle: 'Song A', userRank: 2 },
            { trackTitle: 'Song B', userRank: 3 }
        ];

        const rankedTracks = strategy.rank(mockAlbum);

        expect(rankedTracks[0].title).toBe('Song C');
        expect(rankedTracks[1].title).toBe('Song A');
        expect(rankedTracks[2].title).toBe('Song B');

        expect(rankedTracks[0].userRank).toBe(1);
    });

    it('should fallback to original position if no ranking exists', () => {
        const rankedTracks = strategy.rank(mockAlbum);

        expect(rankedTracks[0].title).toBe('Song A');
        expect(rankedTracks[1].title).toBe('Song B');
        expect(rankedTracks[2].title).toBe('Song C');
    });
});
