import {useEffect, useMemo, useRef} from 'react';
import {findActiveLyricIndex} from '../lib/lyricParser';
import type {LyricLine} from '../model/types';

interface LyricsViewProps {
    title: string;
    lyrics: LyricLine[];
    currentTime: number;
}

const LyricsView = ({title, lyrics, currentTime}: LyricsViewProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
    const activeIndex = useMemo(
        () => findActiveLyricIndex(lyrics, currentTime),
        [currentTime, lyrics],
    );

    useEffect(() => {
        lineRefs.current = lineRefs.current.slice(0, lyrics.length);
    }, [lyrics]);

    useEffect(() => {
        const container = containerRef.current;
        const activeLine = lineRefs.current[activeIndex];
        if (!container || !activeLine || activeIndex < 0) return;
        const containerRect = container.getBoundingClientRect();
        const lineRect = activeLine.getBoundingClientRect();
        const targetTop = container.scrollTop + lineRect.top - containerRect.top
            - container.clientHeight / 2 + lineRect.height / 2;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        container.scrollTo({top: Math.max(0, targetTop), behavior: reducedMotion ? 'auto' : 'smooth'});
    }, [activeIndex]);

    return (
        <div className="musicContentScroll musicLyrics" ref={containerRef} aria-label={`${title} 歌词`}>
            {lyrics.length ? lyrics.map((line, index) => (
                <p
                    key={`${line.time}-${line.text}-${index}`}
                    ref={node => { lineRefs.current[index] = node; }}
                    className={index === activeIndex ? 'active' : ''}
                    aria-current={index === activeIndex ? 'true' : undefined}
                >
                    {line.text}
                </p>
            )) : <p className="empty">暂无歌词</p>}
        </div>
    );
};

export default LyricsView;
