import {Avatar} from 'antd';
import {SocialType} from '../../../interface/SocialType';
import SiteSocialLinks from '../../../features/site-social';
import PaperPlaneMark from './PaperPlaneMark';

interface HeroIdentityProps {
    author: string;
    avatar: string;
    social: SocialType | null;
}

const renderAuthorWithPlaneMark = (author: string) => {
    const suffixIndex = author.toLowerCase().lastIndexOf('plane');
    if (suffixIndex < 0) {
        return <span className="HeroPlaneWord">{author}<PaperPlaneMark/></span>;
    }

    return <>
        {author.slice(0, suffixIndex)}
        <span className="HeroPlaneWord">
            {author.slice(suffixIndex)}
            <PaperPlaneMark/>
        </span>
    </>;
};

const HeroIdentity = ({author, avatar, social}: HeroIdentityProps) => (
    <div className="HeroIdentity">
        <div className="HeroGreetingRow">
            <p className="HeroGreeting">Hi, I’m</p>
            <Avatar src={avatar} size={236} className="frontAvatar"/>
        </div>

        <div className="HeroNameRow">
            <h1>{renderAuthorWithPlaneMark(author)}</h1>
        </div>

        <h2 className="HeroRole">A Reverse CTFer.</h2>
        <SiteSocialLinks social={social} className="Social"/>
    </div>
);

export default HeroIdentity;
