import {useEffect, useRef} from 'react';
import {useReducedMotion} from 'framer-motion';
import type {SpectrumAnalyser} from '../audio/createSpectrumAnalyser';
import {
    buildDiffuseGlowLobes,
    DIFFUSE_GLOW_RANDOM_CHANNELS,
    type DiffuseGlowLobe,
} from '../lib/diffuseGlow';
import {advanceOrganicPulse, createOrganicPulseState} from '../lib/organicPulse';
import {
    advanceRhythmDynamics,
    createRhythmDynamicsState,
    resetRhythmDynamicsState,
} from '../lib/rhythmDynamics';
import {getGlowPresentation} from '../lib/glowPresentation';

interface AudioRhythmGlowProps {
    analyser: SpectrumAnalyser;
    playing: boolean;
    theme: 'light' | 'dark';
    expanded: boolean;
}

const AudioRhythmGlow = ({analyser, playing, theme, expanded}: AudioRhythmGlowProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playingRef = useRef(playing);
    const reduceMotion = useReducedMotion();
    playingRef.current = playing;

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        const levels = new Float32Array(analyser.barCount);
        const targets = new Float32Array(analyser.barCount);
        const rhythmDynamics = createRhythmDynamicsState(analyser.barCount);
        const organicPulse = createOrganicPulseState(DIFFUSE_GLOW_RANDOM_CHANNELS);
        let animationFrame = 0;
        let previousTime = performance.now();
        let width = 0;
        let height = 0;
        const glowRgb = getComputedStyle(canvas).getPropertyValue('--music-glow-rgb').trim() || '252, 197, 197';

        const resize = () => {
            const bounds = canvas.getBoundingClientRect();
            const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
            width = bounds.width;
            height = bounds.height;
            canvas.width = Math.max(1, Math.round(width * pixelRatio));
            canvas.height = Math.max(1, Math.round(height * pixelRatio));
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        };

        const drawLobe = (lobe: DiffuseGlowLobe, scale: number, opacityScale: number) => {
            const radiusX = Math.max(1, width * lobe.widthRatio * scale);
            const reach = Math.max(3, height * lobe.reachRatio * scale);
            const radiusY = reach / 0.92;
            const centerX = width * lobe.centerXRatio;
            const centerY = height + radiusY * 0.08;

            context.save();
            context.translate(centerX, centerY);
            context.scale(radiusX, radiusY);
            const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
            const opacity = lobe.opacity * opacityScale;
            gradient.addColorStop(0, `rgba(${glowRgb}, ${opacity})`);
            gradient.addColorStop(0.28, `rgba(${glowRgb}, ${opacity * 0.72})`);
            gradient.addColorStop(0.58, `rgba(${glowRgb}, ${opacity * 0.3})`);
            gradient.addColorStop(0.82, `rgba(${glowRgb}, ${opacity * 0.08})`);
            gradient.addColorStop(1, `rgba(${glowRgb}, 0)`);
            context.fillStyle = gradient;
            context.fillRect(-1, -1, 2, 2);
            context.restore();
        };

        const draw = (organic = organicPulse.values) => {
            context.clearRect(0, 0, width, height);
            const lobes = buildDiffuseGlowLobes(levels, organic);
            const presentation = getGlowPresentation(expanded);

            context.save();
            context.globalCompositeOperation = 'source-over';
            lobes.forEach((lobe) => drawLobe(
                lobe,
                presentation.outerScale,
                presentation.outerOpacity,
            ));
            lobes.forEach((lobe) => drawLobe(
                lobe,
                presentation.innerScale,
                presentation.innerOpacity,
            ));
            context.restore();
        };

        const renderFrame = (time: number) => {
            const elapsed = Math.min(64, Math.max(4, time - previousTime));
            previousTime = time;
            if (playingRef.current) {
                if (!analyser.sample(targets)) targets.fill(0);
            } else {
                targets.fill(0);
            }
            advanceRhythmDynamics(rhythmDynamics, targets, levels, playingRef.current, elapsed);
            const organic = advanceOrganicPulse(organicPulse, playingRef.current, elapsed);
            draw(organic);
            animationFrame = requestAnimationFrame(renderFrame);
        };

        const renderRestingState = () => {
            levels.fill(0);
            resetRhythmDynamicsState(rhythmDynamics);
            organicPulse.values.fill(0);
            organicPulse.targets.fill(0);
            resize();
            draw();
        };

        const start = () => {
            cancelAnimationFrame(animationFrame);
            previousTime = performance.now();
            if (reduceMotion || document.hidden) {
                renderRestingState();
                return;
            }
            animationFrame = requestAnimationFrame(renderFrame);
        };

        const resizeObserver = typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(() => {
                resize();
                draw();
            });
        resizeObserver?.observe(canvas);
        resize();
        start();
        document.addEventListener('visibilitychange', start);

        return () => {
            cancelAnimationFrame(animationFrame);
            resizeObserver?.disconnect();
            document.removeEventListener('visibilitychange', start);
        };
    }, [analyser, expanded, reduceMotion, theme]);

    return <canvas ref={canvasRef} className="musicRhythmGlow" aria-hidden="true" />;
};

export default AudioRhythmGlow;
