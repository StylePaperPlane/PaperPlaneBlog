import {
    CustomerServiceOutlined,
    GithubOutlined,
    MailOutlined,
    QqOutlined,
} from '@ant-design/icons';
import {ReactNode} from 'react';
import {SocialType} from '../../../interface/SocialType';
import {getVisibleSocialLinks, SocialPlatform} from '../model/socialLinks';
import BilibiliIcon from './icons/BilibiliIcon';

type SocialLinksVariant = 'icons' | 'labeled';

interface SiteSocialLinksProps {
    social?: SocialType | null;
    variant?: SocialLinksVariant;
    className?: string;
}

const PLATFORM_ICONS: Record<SocialPlatform, ReactNode> = {
    github: <GithubOutlined />,
    bilibili: <BilibiliIcon />,
    email: <MailOutlined />,
    qq: <QqOutlined />,
    netease: <CustomerServiceOutlined />,
};

const SiteSocialLinks = ({social, variant = 'icons', className = ''}: SiteSocialLinksProps) => {
    const links = getVisibleSocialLinks(social);
    if (links.length === 0) return null;

    const classes = ['siteSocialLinks', `siteSocialLinks--${variant}`, className]
        .filter(Boolean)
        .join(' ');

    return (
        <nav className={classes} aria-label="社交媒体链接">
            {links.map(({platform, label, href}) => {
                const opensNewWindow = !href.startsWith('mailto:');
                return (
                    <a
                        className={`siteSocialLink siteSocialLink--${platform}`}
                        href={href}
                        target={opensNewWindow ? '_blank' : undefined}
                        rel={opensNewWindow ? 'noreferrer' : undefined}
                        aria-label={variant === 'icons' ? label : undefined}
                        key={platform}
                    >
                        <span className="siteSocialLinkIcon" aria-hidden="true">
                            {PLATFORM_ICONS[platform]}
                        </span>
                        {variant === 'labeled' ? <span>{label}</span> : null}
                        {variant === 'icons' ? (
                            <span className="siteSocialLinkBackground" aria-hidden="true"/>
                        ) : null}
                    </a>
                );
            })}
        </nav>
    );
};

export default SiteSocialLinks;
