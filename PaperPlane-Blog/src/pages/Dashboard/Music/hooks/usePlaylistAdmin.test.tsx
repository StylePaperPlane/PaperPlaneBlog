import {act, renderHook, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {usePlaylistAdmin} from './usePlaylistAdmin';

const api = vi.hoisted(() => ({
    getPlaylists: vi.fn(),
    createPlaylist: vi.fn(),
    renamePlaylist: vi.fn(),
    replacePlaylistTracks: vi.fn(),
    deletePlaylist: vi.fn(),
}));

vi.mock('../../../../apis/MusicMethods', () => api);
vi.mock('antd', () => ({message: {success: vi.fn(), error: vi.fn()}}));

const initial = {
    playlistId: 1,
    name: '夜间',
    trackIds: [1, 2],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

describe('usePlaylistAdmin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.getPlaylists.mockResolvedValue({data: {data: [initial]}});
    });

    it('rolls an optimistic membership change back when the server rejects it', async () => {
        api.replacePlaylistTracks.mockRejectedValue(new Error('failed'));
        const {result} = renderHook(usePlaylistAdmin);
        await waitFor(() => expect(result.current.playlists).toHaveLength(1));

        await act(async () => {
            await expect(result.current.replaceTracks(1, [2, 1])).rejects.toThrow('failed');
        });

        expect(result.current.playlists[0].trackIds).toEqual([1, 2]);
    });
});
