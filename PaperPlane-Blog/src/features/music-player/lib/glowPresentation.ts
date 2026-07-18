export interface GlowPresentation {
    outerScale: number;
    innerScale: number;
    outerOpacity: number;
    innerOpacity: number;
}

const COMPACT_GLOW: GlowPresentation = {
    outerScale: 1.28,
    innerScale: 0.94,
    outerOpacity: 0.48,
    innerOpacity: 0.68,
};

const EXPANDED_GLOW: GlowPresentation = {
    outerScale: 1.58,
    innerScale: 1.16,
    outerOpacity: 0.56,
    innerOpacity: 0.78,
};

export const getGlowPresentation = (expanded: boolean) => (
    expanded ? EXPANDED_GLOW : COMPACT_GLOW
);
