import {describe, expect, it} from 'vitest';
import {getVisibleSocialLinks} from './socialLinks';

describe('getVisibleSocialLinks', () => {
    it('omits empty and whitespace-only settings', () => {
        expect(getVisibleSocialLinks({
            socialGithub: ' ',
            socialEmail: '',
            socialBilibili: null,
            socialQQ: null,
            socialNeteaseCloud: null,
        })).toEqual([]);
    });

    it('returns every configured platform in a stable order', () => {
        const links = getVisibleSocialLinks({
            socialGithub: 'https://github.com/paperplane',
            socialEmail: 'hello@example.com',
            socialBilibili: 'space.bilibili.com/1',
            socialQQ: 'https://example.com/qq',
            socialNeteaseCloud: 'https://music.163.com/user/home?id=1',
        });

        expect(links.map(link => link.platform)).toEqual([
            'github',
            'bilibili',
            'email',
            'qq',
            'netease',
        ]);
        expect(links[1].href).toBe('https://space.bilibili.com/1');
        expect(links[2].href).toBe('mailto:hello@example.com');
    });

    it('does not expose unsafe URL schemes', () => {
        const links = getVisibleSocialLinks({
            socialGithub: 'javascript:alert(1)',
            socialEmail: null,
            socialBilibili: null,
            socialQQ: null,
            socialNeteaseCloud: null,
        });

        expect(links).toEqual([]);
    });
});
