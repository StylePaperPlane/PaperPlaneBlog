import {MusicTrack} from "../interface/MusicType";
import type {AxiosProgressEvent} from "axios";
import {mediaHttp} from "../features/secure-media/api/http";
import type {components} from "../features/secure-media/api/schema";

const MUSIC_UPLOAD_TIMEOUT_MS = 120_000;
type AdminTrackDto = components['schemas']['AdminTrack'];
type AdminPlaylistDto = components['schemas']['AdminPlaylist'];

function getPublicMusicCatalog() {
    return mediaHttp({
        url: '/v1/catalog',
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

function getPlaylists() {
    return mediaHttp<{data: AdminPlaylistDto[]}>({url: '/v1/admin/playlists', method: 'GET'});
}

function createPlaylist(name: string) {
    return mediaHttp<{data: AdminPlaylistDto}>({url: '/v1/admin/playlists', method: 'POST', data: {name}});
}

function renamePlaylist(id: number, name: string) {
    return mediaHttp<{data: AdminPlaylistDto}>({url: `/v1/admin/playlists/${id}`, method: 'PATCH', data: {name}});
}

function replacePlaylistTracks(id: number, trackIds: number[]) {
    return mediaHttp<{data: AdminPlaylistDto}>({url: `/v1/admin/playlists/${id}/tracks`, method: 'PUT', data: {trackIds}});
}

function deletePlaylist(id: number) {
    return mediaHttp({url: `/v1/admin/playlists/${id}`, method: 'DELETE'});
}

export {
    getPublicMusicCatalog,
    getMusicList,
    uploadMusic,
    updateMusic,
    deleteMusic,
    getPlaylists,
    createPlaylist,
    renamePlaylist,
    replacePlaylistTracks,
    deletePlaylist,
};
