import type {LyricLine} from "../model/types";

export const parseLyrics = (content: string): LyricLine[] => content
    .split(/\r?\n/)
    .flatMap(line => {
        const matches = [...line.matchAll(/\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g)];
        const text = line.replace(/\[[^\]]+\]/g, '').trim();
        if (!matches.length || !text) return [];

        return matches.map(match => ({
            time: Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] || '0'}`),
            text
        }));
    })
    .sort((a, b) => a.time - b.time);

export const findActiveLyricIndex = (lyrics: LyricLine[], currentTime: number) => {
    if (!lyrics.length) return -1;
    return lyrics.findIndex((line, index) => (
        currentTime >= line.time && (!lyrics[index + 1] || currentTime < lyrics[index + 1].time)
    ));
};

export const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '00:00';
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};
