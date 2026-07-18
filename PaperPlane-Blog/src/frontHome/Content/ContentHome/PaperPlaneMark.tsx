const PaperPlaneMark = () => (
    <svg
        className="HeroPaperPlane"
        viewBox="0 0 370 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <defs>
            <linearGradient id="heroPaperPlaneGradient" x1="4" y1="106" x2="366" y2="28" gradientUnits="userSpaceOnUse">
                <stop className="HeroPlaneStopDeep"/>
                <stop offset="0.48" className="HeroPlaneStopBright"/>
                <stop offset="1" className="HeroPlaneStopSky"/>
            </linearGradient>
        </defs>
        <g stroke="url(#heroPaperPlaneGradient)">
            <path
                className="HeroPlaneTrail"
                d="M4 114C45 128 88 126 118 114c18-7 38-5 39 6 1 11-15 14-23 4-10-13 12-22 43-17 43 5 91 5 123-1 13-4 16-30 26-41"
            />
            <path d="m318 62 48-26-13 50-16-17-14 9 3-13-8-3Z"/>
            <path d="m326 65 40-29-29 33m0 0-2 11-12-2"/>
        </g>
    </svg>
);

export default PaperPlaneMark;
