import {useCallback, useEffect, useState} from 'react';
import {getPublicMusicCatalog} from '../../../apis/MusicMethods';
import {normalizeCatalog} from '../catalog/normalizeCatalog';
import type {MusicCatalog} from '../model/playlist';

const EMPTY_CATALOG: MusicCatalog = {
    tracks: [],
    playlists: [{id: 'all', name: '全部歌曲', tracks: []}],
};

export const useMusicCatalog = () => {
    const [catalog, setCatalog] = useState<MusicCatalog>(EMPTY_CATALOG);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    const reload = useCallback(() => {
        setLoading(true);
        setFailed(false);
        getPublicMusicCatalog()
            .then(response => setCatalog(normalizeCatalog(response.data.data)))
            .catch(error => {
                if (import.meta.env.DEV) console.error('安全音乐目录加载失败', error);
                setCatalog(EMPTY_CATALOG);
                setFailed(true);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(reload, [reload]);

    return {catalog, loading, failed, reload};
};
