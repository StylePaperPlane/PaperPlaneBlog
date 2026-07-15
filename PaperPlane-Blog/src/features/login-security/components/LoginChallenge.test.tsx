import {render, waitFor} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {LoginChallenge} from './LoginChallenge';

afterEach(() => {
    vi.unstubAllEnvs();
    delete window.turnstile;
});

describe('LoginChallenge', () => {
    it('returns the one-time login token', async () => {
        vi.stubEnv('VITE_LOGIN_TURNSTILE_SITE_KEY', 'test-site-key');
        const onTokenChange = vi.fn();
        window.turnstile = {
            render: (_container, options) => {
                options.callback('verified-token');
                return 'login-widget';
            },
            remove: vi.fn(),
        };

        render(<LoginChallenge onTokenChange={onTokenChange} />);

        await waitFor(() => expect(onTokenChange).toHaveBeenCalledWith('verified-token'));
    });
});
