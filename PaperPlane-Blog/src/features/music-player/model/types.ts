import type {MusicTrack} from "../../../interface/MusicType";

export interface LyricLine {
    time: number;
    text: string;
}

export type PlayerNoticeKind = 'info' | 'error';

export interface PlayerNotice {
    kind: PlayerNoticeKind;
    text: string;
}

export interface PreparedAudioSource {
    url: string;
    ready?: Promise<void>;
    completed?: Promise<void>;
    release: () => void;
}

export class AudioSourceError extends Error {
    readonly skippable: boolean;

    constructor(message: string, skippable: boolean) {
        super(message);
        this.name = 'AudioSourceError';
        this.skippable = skippable;
    }
}

export type AudioSourceResolver = (track: MusicTrack, signal: AbortSignal) => Promise<PreparedAudioSource>;

export interface AudioController {
    currentTrack?: MusicTrack;
    currentIndex: number;
    playing: boolean;
    currentTime: number;
    duration: number;
    notice: PlayerNotice | null;
    togglePlay: () => void;
    next: () => void;
    previous: () => void;
    selectTrack: (musicKey: number) => void;
    seek: (percentage: number) => void;
}
