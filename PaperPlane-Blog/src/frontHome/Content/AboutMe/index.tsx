import './index.sass'
import {GlobalOutlined} from "@ant-design/icons";
import {useSelector} from "react-redux";
import UserState from "../../../interface/UserState";
import {resolveImageUrl} from "../../../utils/imageUrl.ts";
import SiteSocialLinks from "../../../features/site-social";

const AboutMe = () => {
    const avatar = useSelector((state: { user: UserState }) => state.user.avatar);
    const name = useSelector((state: { user: UserState }) => state.user.name);
    const social = useSelector((state: { user: UserState }) => state.user.social);

    return (
        <section className="AboutContainer">
            <div className="aboutProfile">
                <aside className="aboutSidebar">
                    <img className="aboutAvatar" src={resolveImageUrl(avatar)} alt={name} />
                    <div className="aboutLocation">
                        <GlobalOutlined />
                        <span>Asia/China</span>
                    </div>
                </aside>

                <main className="aboutMain">
                    <h1>{name}</h1>
                    <h2>One Ctfer of CDUT.</h2>
                    <SiteSocialLinks social={social} variant="labeled" className="aboutSocialLinks"/>
                </main>
            </div>
        </section>
    );
}

export default AboutMe
