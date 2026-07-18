import {MotionStyle, useScroll, useSpring, useTransform} from 'framer-motion';

interface HeroRevealMotionOptions {
    viewportHeight: number;
    viewportWidth: number;
}

const scrollSpring = {
    stiffness: 230,
    damping: 34,
    mass: 0.32,
    restDelta: 0.05,
};

/**
 * Keeps every layer of the hero reveal on the same smoothed scroll signal.
 * The first stage is intentionally gradual so a one-pixel scroll cannot
 * abruptly punch a transparent strip through the bottom of the image.
 */
export const useHeroRevealMotion = ({viewportHeight, viewportWidth}: HeroRevealMotionOptions) => {
    const {scrollY} = useScroll();
    const smoothScrollY = useSpring(scrollY, scrollSpring);
    const revealDistance = Math.max(viewportHeight, 1);

    const coverScale = useTransform(smoothScrollY, [0, revealDistance], [1, 0.985]);
    const largeScreenContentScale = useTransform(
        smoothScrollY,
        [0, revealDistance * 0.72, revealDistance],
        [0.94, 0.985, 1],
    );
    const contentScale = viewportWidth >= 1200 ? largeScreenContentScale : 1;

    const heroBottomVisibility = useTransform(scrollY, value => value > 0 ? 0 : 1);
    const maskRange = [0, revealDistance * 0.015, revealDistance * 0.08, revealDistance * 0.55];
    const heroOpaqueStop = useTransform(
        smoothScrollY,
        maskRange,
        ['100%', '98%', '89%', '72%'],
    );
    const heroFeatherNearStop = useTransform(
        smoothScrollY,
        maskRange,
        ['100%', '98.35%', '90.8%', '76%'],
    );
    const heroFeatherMidStop = useTransform(
        smoothScrollY,
        maskRange,
        ['100%', '98.85%', '93.4%', '82%'],
    );
    const heroFeatherFarStop = useTransform(
        smoothScrollY,
        maskRange,
        ['100%', '99.35%', '96.2%', '89%'],
    );
    const heroFeatherEdgeStop = useTransform(
        smoothScrollY,
        maskRange,
        ['100%', '99.75%', '98.45%', '95%'],
    );

    const heroMaskStyle = {
        '--hero-bottom-visibility': heroBottomVisibility,
        '--hero-opaque-stop': heroOpaqueStop,
        '--hero-feather-near-stop': heroFeatherNearStop,
        '--hero-feather-mid-stop': heroFeatherMidStop,
        '--hero-feather-far-stop': heroFeatherFarStop,
        '--hero-feather-edge-stop': heroFeatherEdgeStop,
    } as MotionStyle;

    return {
        contentScale,
        coverScale,
        heroMaskStyle,
    };
};
