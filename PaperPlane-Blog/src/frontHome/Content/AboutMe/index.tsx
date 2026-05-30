import './index.sass'
import {GithubOutlined, GlobalOutlined} from "@ant-design/icons";
import {useSelector} from "react-redux";
import UserState from "../../../interface/UserState";
import {resolveImageUrl} from "../../../utils/imageUrl.ts";

const AboutMe = () => {
    const avatar = useSelector((state: { user: UserState }) => state.user.avatar);
    const name = useSelector((state: { user: UserState }) => state.user.name);
    const talk = useSelector((state: { user: UserState }) => state.user.talk);
    const github = useSelector((state: { user: UserState }) => state.user.social?.socialGithub);

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
                    <h1>PaperPlane</h1>
                    <h2>Personal blog starter.</h2>

                    <div className="aboutLinks">
                        <a
                            href={github || undefined}
                            target={github ? '_blank' : undefined}
                            rel="noreferrer"
                            aria-disabled={!github}
                            className={!github ? 'isDisabled' : ''}
                        >
                            <GithubOutlined />
                            <span>GitHub</span>
                        </a>
                    </div>

                    <p className="aboutIntro">
                        {talk || 'Write a short introduction from the dashboard.'}
                    </p>
                </main>
            </div>
        </section>
    );
}

export default AboutMe
