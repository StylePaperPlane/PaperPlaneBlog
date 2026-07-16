import {useCallback, useEffect, useState} from 'react';
import {message} from 'antd';
import {
    createPlaylist,
    deletePlaylist,
    getPlaylists,
    renamePlaylist,
    replacePlaylistTracks,
} from '../../../../apis/MusicMethods';
import type {AdminPlaylist} from '../lib/adminPlaylist';
import {getMusicRequestErrorMessage} from '../lib/errorMessage';

export const usePlaylistAdmin = () => {
    const [playlists, setPlaylists] = useState<AdminPlaylist[]>([]);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState<number | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getPlaylists();
            setPlaylists(response.data.data);
        } catch (error) {
            message.error(getMusicRequestErrorMessage(error, '获取歌单失败'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const add = useCallback(async (name: string) => {
        try {
            const response = await createPlaylist(name);
            setPlaylists(current => [...current, response.data.data]);
            message.success('歌单已创建');
            return response.data.data;
        } catch (error) {
            message.error(getMusicRequestErrorMessage(error, '创建歌单失败'));
            throw error;
        }
    }, []);

    const rename = useCallback(async (id: number, name: string) => {
        setSavingId(id);
        try {
            const response = await renamePlaylist(id, name);
            setPlaylists(current => current.map(item => item.playlistId === id ? response.data.data : item));
            message.success('歌单名称已保存');
        } catch (error) {
            message.error(getMusicRequestErrorMessage(error, '重命名歌单失败'));
            throw error;
        } finally {
            setSavingId(null);
        }
    }, []);

    const replaceTracks = useCallback(async (id: number, trackIds: number[]) => {
        const previous = playlists;
        setPlaylists(current => current.map(item => item.playlistId === id ? {...item, trackIds} : item));
        setSavingId(id);
        try {
            const response = await replacePlaylistTracks(id, trackIds);
            setPlaylists(current => current.map(item => item.playlistId === id ? response.data.data : item));
        } catch (error) {
            setPlaylists(previous);
            message.error(getMusicRequestErrorMessage(error, '更新歌单歌曲失败'));
            throw error;
        } finally {
            setSavingId(null);
        }
    }, [playlists]);

    const remove = useCallback(async (id: number) => {
        setSavingId(id);
        try {
            await deletePlaylist(id);
            setPlaylists(current => current.filter(item => item.playlistId !== id));
            message.success('歌单已删除，歌曲文件未受影响');
        } catch (error) {
            message.error(getMusicRequestErrorMessage(error, '删除歌单失败'));
            throw error;
        } finally {
            setSavingId(null);
        }
    }, []);

    return {playlists, loading, savingId, refresh, add, rename, replaceTracks, remove};
};
