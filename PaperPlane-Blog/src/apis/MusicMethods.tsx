import {MusicTrack} from "../interface/MusicType";
import type {AxiosProgressEvent} from "axios";
import {mediaHttp} from "../features/secure-media/api/http";
import type {components} from "../features/secure-media/api/schema";

const MUSIC_UPLOAD_TIMEOUT_MS = 120_000;
type AdminTrackDto = components['schemas']['AdminTrack'];

function getPublicMusicList() {
    return mediaHttp({
        url: '/v1/tracks',
        method: 'GET'
    });
}

function getMusicList() {
    return mediaHttp<{data: AdminTrackDto[]}>({
        url: '/v1/admin/tracks',
        method: 'GET'
    });
}

function uploadMusic(formData: FormData, onUploadProgress?: (event: AxiosProgressEvent) => void) {
    return mediaHttp({
        url: '/v1/admin/tracks',
        method: 'POST',
        data: formData,
        timeout: MUSIC_UPLOAD_TIMEOUT_MS,
        onUploadProgress
    });
}

function updateMusic(id: number, data: Partial<MusicTrack>) {
    return mediaHttp({
        url: `/v1/admin/tracks/${id}`,
        method: 'PATCH',
        data
    });
}

function deleteMusic(ids: number[]) {
    return mediaHttp({
        url: '/v1/admin/tracks',
        method: 'DELETE',
        data: {ids}
    });
}

export {getPublicMusicList, getMusicList, uploadMusic, updateMusic, deleteMusic};
