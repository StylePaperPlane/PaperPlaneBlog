import {RefObject, useCallback, useEffect, useRef, useState} from "react";
import type {MusicTrack} from "../../../interface/MusicType";
import {resolveMusicUrl} from "../../../utils/musicUrl";
import {describeMediaError, describePlayError, describeSourceError} from "../lib/mediaError";
import {AudioSourceError, type AudioController, type AudioSourceResolver, type PlayerNotice, type PreparedAudioSource} from "../model/types";

interface UseAudioControllerOptions {
    playlist: MusicTrack[];
    volume: number;
    playerRootRef: RefObject<HTMLElement>;
    prepareSource?: AudioSourceResolver;
}

export const useAudioController = ({playlist, volume, playerRootRef, prepareSource}: UseAudioControllerOptions): AudioController => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playlistRef = useRef(playlist);
    const currentIndexRef = useRef(0);
    const playIntentRef = useRef(false);
    const failedTrackKeysRef = useRef<Set<number>>(new Set());
    const nextRef = useRef<() => void>(() => undefined);
    const trackFailureRef = useRef<(error: unknown) => void>(() => undefined);
    const sourceReadyRef = useRef(false);
    const activeSourceRef = useRef<PreparedAudioSource | null>(null);
    const startSourceRef = useRef<() => void>(() => undefined);
    const [currentIndex, setCurrentIndexState] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [notice, setNotice] = useState<PlayerNotice | null>(null);
    const [firstInteractionConsumed, setFirstInteractionConsumed] = useState(false);

    const setCurrentIndex = useCallback((index: number) => {
        currentIndexRef.current = index;
        setCurrentIndexState(index);
    }, []);

    const currentTrack = playlist[currentIndex];

    const moveToNextPlayable = useCallback(() => {
        const tracks = playlistRef.current;
        if (!tracks.length) return;
        const failed = failedTrackKeysRef.current;

        for (let offset = 1; offset <= tracks.length; offset += 1) {
            const candidateIndex = (currentIndexRef.current + offset) % tracks.length;
            if (!failed.has(tracks[candidateIndex].musicKey)) {
                setCurrentIndex(candidateIndex);
                return;
            }
        }

        playIntentRef.current = false;
        audioRef.current?.pause();
        setNotice({kind: 'error', text: '所有歌曲暂时都无法播放'});
    }, [setCurrentIndex]);

    const handleTrackFailure = useCallback((error: unknown) => {
        const tracks = playlistRef.current;
        const track = tracks[currentIndexRef.current];
        if (!track || failedTrackKeysRef.current.has(track.musicKey)) return;

        const {message, skippable} = describeSourceError(error);
        if (!skippable) {
            playIntentRef.current = false;
            audioRef.current?.pause();
            setNotice({kind: 'error', text: message});
            return;
        }

        failedTrackKeysRef.current.add(track.musicKey);
        if (!playIntentRef.current) {
            setNotice({kind: 'error', text: message});
            return;
        }
        if (failedTrackKeysRef.current.size >= tracks.length) {
            playIntentRef.current = false;
            audioRef.current?.pause();
            setNotice({kind: 'error', text: '所有歌曲暂时都无法播放'});
            return;
        }

        setNotice({kind: 'info', text: `${track.title} 无法播放，正在尝试下一首`});
        moveToNextPlayable();
    }, [moveToNextPlayable]);

    trackFailureRef.current = handleTrackFailure;

    const requestPlay = useCallback((resetFailures = false) => {
        const audio = audioRef.current;
        const track = playlistRef.current[currentIndexRef.current];
        if (!audio || !track) return;

        if (resetFailures) failedTrackKeysRef.current.clear();
        playIntentRef.current = true;
        if (!sourceReadyRef.current) {
            startSourceRef.current();
            return;
        }
        audio.play()
            .then(() => setNotice(null))
            .catch(error => {
                const details = describePlayError(error);
                if (!details.message) return;
                if (details.blocked) {
                    setNotice({kind: 'info', text: details.message});
                    return;
                }
                if (details.skippable) {
                    trackFailureRef.current(details.message);
                    return;
                }
                setNotice({kind: 'error', text: details.message});
            });
    }, []);

    const selectRelativeTrack = useCallback((direction: 1 | -1) => {
        const tracks = playlistRef.current;
        if (!tracks.length) return;
        failedTrackKeysRef.current.clear();
        setNotice(null);
        const nextIndex = (currentIndexRef.current + direction + tracks.length) % tracks.length;
        setCurrentIndex(nextIndex);
    }, [setCurrentIndex]);

    const next = useCallback(() => selectRelativeTrack(1), [selectRelativeTrack]);
    const previous = useCallback(() => selectRelativeTrack(-1), [selectRelativeTrack]);
    nextRef.current = next;

    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audioRef.current = audio;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        const handleEnded = () => {
            if (playIntentRef.current) nextRef.current();
        };
        const handlePlay = () => setPlaying(true);
        const handlePause = () => setPlaying(false);
        const handleError = () => trackFailureRef.current(new AudioSourceError(describeMediaError(audio.error), true));

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleDuration);
        audio.addEventListener('durationchange', handleDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);

        return () => {
            playIntentRef.current = false;
            sourceReadyRef.current = false;
            activeSourceRef.current?.release();
            activeSourceRef.current = null;
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleDuration);
            audio.removeEventListener('durationchange', handleDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('error', handleError);
            audioRef.current = null;
        };
    }, []);

    useEffect(() => {
        playlistRef.current = playlist;
        if (!playlist.length) {
            playIntentRef.current = false;
            audioRef.current?.pause();
            setCurrentIndex(0);
            return;
        }
        if (currentIndexRef.current >= playlist.length) setCurrentIndex(0);
    }, [playlist, setCurrentIndex]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, volume));
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;
        const abortController = new AbortController();
        let preparedSource: PreparedAudioSource | null = null;
        let sourceStarted = false;
        sourceReadyRef.current = false;
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        setCurrentTime(0);
        setDuration(0);
        setNotice(null);

        const resolveSource: AudioSourceResolver = prepareSource
            ?? ((track) => Promise.resolve({url: resolveMusicUrl(track.audioUrl), release: () => undefined}));
        const startSource = () => {
            if (sourceStarted || abortController.signal.aborted) return;
            sourceStarted = true;
            void resolveSource(currentTrack, abortController.signal)
                .then(source => {
                    preparedSource = source;
                    if (abortController.signal.aborted) {
                        source.release();
                        return;
                    }
                    activeSourceRef.current?.release();
                    activeSourceRef.current = source;
                    audio.src = source.url;
                    audio.load();
                    const markReady = () => {
                        if (abortController.signal.aborted || activeSourceRef.current !== source) return;
                        sourceReadyRef.current = true;
                        setNotice(null);
                        if (playIntentRef.current) requestPlay();
                    };
                    const reportSourceFailure = (error: unknown) => {
                        if (abortController.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
                        trackFailureRef.current(error);
                    };
                    if (source.ready) {
                        void source.ready.then(markReady).catch(reportSourceFailure);
                    } else {
                        markReady();
                    }
                    void source.completed?.catch(error => {
                        if (!sourceReadyRef.current) return;
                        reportSourceFailure(error);
                    });
                })
                .catch(error => {
                    if (abortController.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
                    trackFailureRef.current(error);
                });
        };
        startSourceRef.current = startSource;
        if (playIntentRef.current) startSource();

        return () => {
            abortController.abort();
            if (startSourceRef.current === startSource) startSourceRef.current = () => undefined;
            sourceReadyRef.current = false;
            if (preparedSource && activeSourceRef.current === preparedSource) {
                preparedSource.release();
                activeSourceRef.current = null;
            }
        };
    }, [currentTrack, prepareSource, requestPlay]);

    useEffect(() => {
        if (firstInteractionConsumed || !playlist.length) return;
        const handleFirstPointerDown = (event: PointerEvent) => {
            const target = event.target;
            if (target instanceof Node && playerRootRef.current?.contains(target)) return;
            setFirstInteractionConsumed(true);
            requestPlay(true);
        };
        document.addEventListener('pointerdown', handleFirstPointerDown);
        return () => document.removeEventListener('pointerdown', handleFirstPointerDown);
    }, [firstInteractionConsumed, playerRootRef, playlist.length, requestPlay]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !playlistRef.current[currentIndexRef.current]) return;
        setFirstInteractionConsumed(true);

        if (audio.paused) {
            requestPlay(true);
        } else {
            playIntentRef.current = false;
            audio.pause();
            setNotice(null);
        }
    }, [requestPlay]);

    const seek = useCallback((percentage: number) => {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
        audio.currentTime = Math.min(audio.duration, Math.max(0, percentage / 100 * audio.duration));
    }, []);

    return {currentTrack, currentIndex, playing, currentTime, duration, notice, togglePlay, next, previous, seek};
};
