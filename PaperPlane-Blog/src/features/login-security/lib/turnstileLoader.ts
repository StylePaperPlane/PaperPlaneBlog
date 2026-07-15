import type {TurnstileApi} from '../model/turnstile';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_SELECTOR = 'script[data-paperplane-login-turnstile]';
const LOAD_TIMEOUT_MS = 15_000;

let pendingLoad: Promise<TurnstileApi> | undefined;

export function loadLoginTurnstile(): Promise<TurnstileApi> {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    pendingLoad ??= loadScript().finally(() => {
        pendingLoad = undefined;
    });
    return pendingLoad;
}

function loadScript(): Promise<TurnstileApi> {
    return new Promise((resolve, reject) => {
        document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR)?.remove();
        const script = document.createElement('script');
        const timeout = window.setTimeout(
            () => finish(() => reject(new Error('验证组件加载超时，请检查网络'))),
            LOAD_TIMEOUT_MS,
        );
        const finish = (settle: () => void) => {
            window.clearTimeout(timeout);
            script.removeEventListener('load', onLoad);
            script.removeEventListener('error', onError);
            settle();
        };
        const onLoad = () => finish(() => {
            if (window.turnstile) resolve(window.turnstile);
            else reject(new Error('验证组件初始化失败'));
        });
        const onError = () => finish(() => reject(new Error('验证组件加载失败，请重试')));

        script.addEventListener('load', onLoad, {once: true});
        script.addEventListener('error', onError, {once: true});
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.dataset.paperplaneLoginTurnstile = 'true';
        document.head.appendChild(script);
    });
}
