import type {ReactNode} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import type {PlayerContentMode} from '../model/playlist';

interface AnimatedPlayerContentProps {
    mode: PlayerContentMode;
    children: ReactNode;
}

const AnimatedPlayerContent = ({mode, children}: AnimatedPlayerContentProps) => {
    const reduceMotion = useReducedMotion();
    const duration = reduceMotion ? 0.01 : 0.24;

    return (
        <motion.div
            className="musicContentTransition"
            initial={false}
            animate={{height: mode ? 'auto' : 0}}
            transition={{duration, ease: [0.22, 1, 0.36, 1]}}
        >
            <AnimatePresence initial={false} mode="wait">
                {mode && (
                    <motion.div
                        key={mode}
                        className="musicContentMotion"
                        initial={{opacity: 0, y: reduceMotion ? 0 : -6}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: reduceMotion ? 0 : -3}}
                        transition={{duration: reduceMotion ? 0.01 : 0.18, ease: 'easeOut'}}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AnimatedPlayerContent;
