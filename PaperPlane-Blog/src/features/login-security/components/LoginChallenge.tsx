import {useEffect, useRef, useState} from 'react';
import {loadLoginTurnstile} from '../lib/turnstileLoader';

interface LoginChallengeProps {
    onTokenChange: (token: string | null) => void;
}

export function LoginChallenge({onTokenChange}: LoginChallengeProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const callbackRef = useRef(onTokenChange);
    const [status, setStatus] = useState('正在加载安全验证…');

    callbackRef.current = onTokenChange;

    useEffect(() => {
        const sitekey = import.meta.env.VITE_LOGIN_TURNSTILE_SITE_KEY?.trim();
        if (!sitekey) {
            setStatus('登录验证尚未配置');
            return;
        }
        let disposed = false;
        let widgetId = '';

        void loadLoginTurnstile()
            .then(turnstile => {
                if (disposed || !mountRef.current) return;
                widgetId = turnstile.render(mountRef.current, {
                    sitekey,
                    action: 'admin_login',
                    theme: 'auto',
                    appearance: 'always',
                    size: 'flexible',
                    callback: token => {
                        setStatus('验证已完成');
                        callbackRef.current(token);
                    },
                    'expired-callback': () => {
                        setStatus('验证已过期，请重新完成');
                        callbackRef.current(null);
                    },
                    'error-callback': () => {
                        setStatus('验证失败，请刷新后重试');
                        callbackRef.current(null);
                    },
                    'unsupported-callback': () => {
                        setStatus('当前浏览器不支持安全验证');
                        callbackRef.current(null);
                    },
                });
            })
            .catch(error => {
                if (!disposed) setStatus(error instanceof Error ? error.message : '验证组件加载失败');
            });

        return () => {
            disposed = true;
            callbackRef.current(null);
            if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
        };
    }, []);

    return (
        <div className="login-challenge">
            <div ref={mountRef} className="login-challenge__widget" />
            <span className="login-challenge__status" role="status" aria-live="polite">{status}</span>
        </div>
    );
}
