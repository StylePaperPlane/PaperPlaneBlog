import type {ReactNode} from 'react';
import {motion, useReducedMotion} from 'framer-motion';

interface ModeToggleButtonProps {
    active: boolean;
    label: string;
    title: string;
    rotation: number;
    onClick: () => void;
    children: ReactNode;
}

const ModeToggleButton = ({active, label, title, rotation, onClick, children}: ModeToggleButtonProps) => {
    const reduceMotion = useReducedMotion();

    return (
        <button
            type="button"
            className={active ? 'active' : ''}
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            title={title}
        >
            <motion.span
                className="modeToggleIcon"
                aria-hidden="true"
                animate={{scale: active && !reduceMotion ? 1.08 : 1, rotate: active && !reduceMotion ? rotation : 0}}
                transition={{duration: reduceMotion ? 0.01 : 0.2, ease: [0.22, 1, 0.36, 1]}}
            >
                {children}
            </motion.span>
        </button>
    );
};

export default ModeToggleButton;
