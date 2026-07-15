export interface TurnstileOptions {
    sitekey: string;
    action: 'admin_login';
    theme: 'auto';
    appearance: 'always';
    size: 'flexible';
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
    'unsupported-callback': () => void;
}

export interface TurnstileApi {
    render(container: HTMLElement, options: TurnstileOptions): string;
    remove(widgetId: string): void;
}

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}
