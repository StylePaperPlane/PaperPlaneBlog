import {SocialType} from '../../../interface/SocialType';

export type SocialPlatform = 'github' | 'bilibili' | 'email' | 'qq' | 'netease';

type SocialField = keyof SocialType;

export interface VisibleSocialLink {
    platform: SocialPlatform;
    label: string;
    href: string;
}

const SOCIAL_DEFINITIONS: ReadonlyArray<{
    field: SocialField;
    platform: SocialPlatform;
    label: string;
}> = [
    {field: 'socialGithub', platform: 'github', label: 'GitHub'},
    {field: 'socialBilibili', platform: 'bilibili', label: 'Bilibili'},
    {field: 'socialEmail', platform: 'email', label: 'Email'},
    {field: 'socialQQ', platform: 'qq', label: 'QQ'},
    {field: 'socialNeteaseCloud', platform: 'netease', label: '网易云音乐'},
];

const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toSafeHref = (platform: SocialPlatform, rawValue: string): string | null => {
    const value = rawValue.trim();
    if (!value) return null;

    if (platform === 'email' && EMAIL_ADDRESS.test(value)) {
        return `mailto:${value}`;
    }

    if (/^https?:\/\//i.test(value) || (platform === 'email' && /^mailto:/i.test(value))) {
        return value;
    }

    if (HAS_SCHEME.test(value)) {
        return null;
    }

    return `https://${value}`;
};

export const getVisibleSocialLinks = (social?: SocialType | null): VisibleSocialLink[] => {
    if (!social) return [];

    return SOCIAL_DEFINITIONS.flatMap(({field, platform, label}) => {
        const value = social[field];
        if (!value) return [];

        const href = toSafeHref(platform, value);
        return href ? [{platform, label, href}] : [];
    });
};
