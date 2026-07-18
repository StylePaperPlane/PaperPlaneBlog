import {useEffect, useMemo} from 'react';
import {bindSpectrumActivation} from '../audio/bindSpectrumActivation';
import {createSpectrumAnalyser} from '../audio/createSpectrumAnalyser';
import type {AudioElementHandle} from '../model/types';

export const useAudioAnalyser = (audioHandle: AudioElementHandle) => {
    const analyser = useMemo(() => createSpectrumAnalyser(audioHandle), [audioHandle]);

    useEffect(() => {
        const unbindActivation = bindSpectrumActivation(audioHandle, analyser);
        return () => {
            unbindActivation();
            void analyser.dispose();
        };
    }, [analyser, audioHandle]);

    return analyser;
};
