import {useEffect, useState} from "react";
import type {MusicTrack} from "../../../interface/MusicType";
import {resolveMusicUrl} from "../../../utils/musicUrl";
import {parseLyrics} from "../lib/lyricParser";
import type {LyricLine} from "../model/types";

export const useLyrics = (track?: MusicTrack) => {
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);

    useEffect(() => {
        if (!track?.lyricUrl) {
            setLyrics([]);
            return;
        }

        const controller = new AbortController();
        setLyrics([]);
        fetch(resolveMusicUrl(track.lyricUrl), {signal: controller.signal})
            .then(response => response.ok ? response.text() : '')
            .then(content => setLyrics(parseLyrics(content)))
            .catch(error => {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                    setLyrics([]);
                }
            });

        return () => controller.abort();
    }, [track?.lyricUrl]);

    return lyrics;
};
