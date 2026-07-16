import {useCallback, useEffect, useMemo, useState} from 'react';
import type {MusicCatalog, PlayerPlaylistId} from '../model/playlist';

const STORAGE_KEY = 'musicPlayerPlaylist';

const readStoredId = (): PlayerPlaylistId => {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        if (!value || value === 'all') return 'all';
        const id = Number(value);
        return Number.isSafeInteger(id) ? id : 'all';
    } catch {
        return 'all';
    }
};

export const usePlaylistSelection = (catalog: MusicCatalog) => {
    const [selectedId, setSelectedIdState] = useState<PlayerPlaylistId>(readStoredId);
    const selected = useMemo(
        () => catalog.playlists.find(playlist => playlist.id === selectedId && playlist.tracks.length > 0)
            ?? catalog.playlists[0],
        [catalog.playlists, selectedId],
    );

    useEffect(() => {
        if (selected.id !== selectedId) setSelectedIdState(selected.id);
    }, [selected.id, selectedId]);

    const selectPlaylist = useCallback((id: PlayerPlaylistId) => {
        setSelectedIdState(id);
        try {
            localStorage.setItem(STORAGE_KEY, String(id));
        } catch {
            // Keep playlist selection usable when storage is unavailable.
        }
    }, []);

    return {selected, selectedId: selected.id, selectPlaylist};
};
