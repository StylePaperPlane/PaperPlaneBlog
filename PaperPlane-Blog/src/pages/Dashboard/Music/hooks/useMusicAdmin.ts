import {useCallback, useEffect, useState} from "react";
import {message} from "antd";
import type {AxiosProgressEvent} from "axios";
import type {MusicTrack} from "../../../../interface/MusicType";
import {deleteMusic, getMusicList, updateMusic, uploadMusic} from "../../../../apis/MusicMethods";
import {getMusicRequestErrorMessage} from "../lib/errorMessage";
import {toMusicTrack} from "../lib/adminTrack";

export interface MusicUploadValues {
    title?: string;
    artist?: string;
    sortOrder?: number | null;
}

export const useMusicAdmin = () => {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getMusicList();
            setTracks(response.data.data.map(toMusicTrack));
        } catch (error) {
            message.error(getMusicRequestErrorMessage(error, '获取音乐列表失败'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const uploadTrack = useCallback(async (file: File, values: MusicUploadValues) => {
        const formData = new FormData();
        formData.append('file', file);
        if (values.title) formData.append('title', values.title);
        if (values.artist) formData.append('artist', values.artist);
        if (values.sortOrder !== undefined && values.sortOrder !== null) {
            formData.append('sortOrder', String(values.sortOrder));
        }

        setUploading(true);
        setUploadProgress(0);
        try {
            await uploadMusic(formData, (event: AxiosProgressEvent) => {
                if (!event.total) return;
                setUploadProgress(Math.min(100, Math.round(event.loaded / event.total * 100)));
            });
            message.success('上传成功');
            await refresh();
        } catch (error) {
            message.error(getMusicRequestErrorMessage(error, '上传失败，请检查压缩包内容'));
            throw error;
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [refresh]);

    const saveTrack = useCallback(async (track: MusicTrack, values: Partial<MusicTrack>) => {
        try {
            await updateMusic(track.musicKey, values);
            message.success('保存成功');
            await refresh();
        } catch (error) {
            message.error(getMusicRequestErrorMessage(error, '保存音乐信息失败'));
            throw error;
        }
    }, [refresh]);

    const setTrackEnabled = useCallback(async (track: MusicTrack, enabled: boolean) => {
        try {
            await updateMusic(track.musicKey, {enabled});
            await refresh();
        } catch (error) {
            message.error(getMusicRequestErrorMessage(error, '更新启用状态失败'));
        }
    }, [refresh]);

    const deleteTracks = useCallback(async (ids: number[]) => {
        try {
            await deleteMusic(ids);
            message.success('删除成功');
            await refresh();
        } catch (error) {
            message.error(getMusicRequestErrorMessage(error, '删除音乐失败'));
            throw error;
        }
    }, [refresh]);

    return {
        tracks,
        loading,
        refresh,
        uploading,
        uploadProgress,
        uploadTrack,
        saveTrack,
        setTrackEnabled,
        deleteTracks
    };
};
