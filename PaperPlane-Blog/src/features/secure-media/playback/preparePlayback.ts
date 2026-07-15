import type {MusicTrack} from '../../../interface/MusicType';
import {AudioSourceError, type PreparedAudioSource} from '../../music-player/model/types';
import {toSecureDescriptor} from '../model/types';
import {createWorkerMediaSource} from './workerMediaSource';
import {SecureMediaSessionError} from '../model/errors';

export async function prepareTrackPlayback(track: MusicTrack, signal: AbortSignal): Promise<PreparedAudioSource> {
    const descriptor = toSecureDescriptor(track);
    if (!descriptor) {
        throw new AudioSourceError('曲目缺少安全媒体描述，无法播放', true);
    }
    try {
        const source = await createWorkerMediaSource(descriptor, signal);
        return {
            ...source,
            ready: wrapStreamPromise(source.ready),
            completed: wrapStreamPromise(source.completed),
        };
    } catch (error) {
        throw normalizeStreamError(error);
    }
}

function wrapStreamPromise(promise?: Promise<void>): Promise<void> | undefined {
    return promise?.catch(error => {
        throw normalizeStreamError(error);
    });
}

function normalizeStreamError(error: unknown): AudioSourceError {
    if (error instanceof AudioSourceError) return error;
    const message = error instanceof Error && error.message ? error.message : '安全媒体流初始化失败';
    return new AudioSourceError(message, !(error instanceof SecureMediaSessionError));
}
