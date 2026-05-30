import http from "./axios.tsx";
import {MusicTrack} from "../interface/MusicType";

function getPublicMusicList() {
    return http({
        url: '/api/public/music',
        method: 'GET'
    });
}

function getMusicList() {
    return http({
        url: '/api/protected/music',
        method: 'GET'
    });
}

function uploadMusic(formData: FormData) {
    return http({
        url: '/api/protected/music/upload',
        method: 'POST',
        data: formData
    });
}

function updateMusic(id: number, data: Partial<MusicTrack>) {
    return http({
        url: `/api/protected/music/${id}`,
        method: 'POST',
        data
    });
}

function deleteMusic(ids: number[]) {
    return http({
        url: '/api/protected/music',
        method: 'DELETE',
        data: ids
    });
}

export {getPublicMusicList, getMusicList, uploadMusic, updateMusic, deleteMusic};
