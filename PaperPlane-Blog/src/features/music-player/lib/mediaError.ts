export interface PlaybackErrorDetails {
    message: string;
    blocked: boolean;
    skippable: boolean;
}

const MEDIA_ERROR_MESSAGES: Record<number, string> = {
    1: '音频加载已中止',
    2: '音频网络加载失败',
    3: '音频文件无法解码',
    4: '音频格式不受支持'
};

export const describePlayError = (error: unknown): PlaybackErrorDetails => {
    if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
            return {message: '浏览器阻止了自动播放，请点击播放按钮', blocked: true, skippable: false};
        }
        if (error.name === 'AbortError') {
            return {message: '', blocked: false, skippable: false};
        }
        if (error.name === 'NotSupportedError') {
            return {message: '音频格式不受支持', blocked: false, skippable: true};
        }
    }

    return {message: '音频播放失败', blocked: false, skippable: true};
};

export const describeMediaError = (error: MediaError | null) => (
    error ? MEDIA_ERROR_MESSAGES[error.code] || '音频播放失败' : '音频播放失败'
);

export const describeSourceError = (error: unknown): Pick<PlaybackErrorDetails, 'message' | 'skippable'> => {
    if (error instanceof AudioSourceError) {
        return {message: error.message, skippable: error.skippable};
    }
    if (error instanceof Error && error.message) {
        return {message: error.message, skippable: true};
    }
    return {message: '安全媒体流初始化失败', skippable: true};
};
import {AudioSourceError} from '../model/types';
