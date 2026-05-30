import './index.sass'
import {useEffect, useMemo, useState} from "react";
import {Avatar, message} from "antd";
import {Talk} from "../../../interface/TalkType";
import {useSelector} from "react-redux";
import UserState from "../../../interface/UserState";
import {motion} from 'framer-motion';
import dayjs from "dayjs";
import scrollToTop from "../../../utils/scrollToTop.tsx";
import {getTalkList} from "../../../apis/TalkMethods.tsx";
import {resolveImageUrl} from "../../../utils/imageUrl.ts";

const TalkList = () => {
    const [talkList, setTalkList] = useState<Talk[]>([])
    const avatar = useSelector((state: { user: UserState }) => state.user.avatar)
    const name = useSelector((state: { user: UserState }) => state.user.name)

    useEffect(() => {
        scrollToTop();
        getTalkList().then((res) => {
            setTalkList(res.data.data || [])
        }).catch(() => {
            message.error('获取失败')
        })
    }, [])

    const sortedTalks = useMemo(() => {
        return [...talkList].sort((a, b) => dayjs(b.createTime).valueOf() - dayjs(a.createTime).valueOf());
    }, [talkList]);

    return (
        <div className='TalkContainer'>
            <header className="talkHero">
                <div>
                    <span className="talkEyebrow">Notes</span>
                    <h1>说说</h1>
                </div>
                <p>一些短句、近况和成长的瞬间。</p>
            </header>

            <main className="talkStream">
                {sortedTalks.map((talk: Talk, index) => {
                    const date = dayjs(talk.createTime);

                    return (
                        <motion.article
                            key={talk.talkKey}
                            initial={{opacity: 0, y: 18}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.42, delay: Math.min(index * 0.06, 0.36)}}
                            className="talkItem"
                        >
                            <time className="talkDate" dateTime={date.format('YYYY-MM-DD')}>
                                <strong>{date.format('DD')}</strong>
                                <span>{date.format('MMM YYYY')}</span>
                            </time>

                            <section className="talkNote">
                                <div className="talkAuthor">
                                    <Avatar src={resolveImageUrl(avatar)} size={38} />
                                    <div>
                                        <span>{name || 'PaperPlane'}</span>
                                        <time>{date.format('HH:mm')}</time>
                                    </div>
                                </div>
                                <h2>{talk.talkTitle}</h2>
                                <p>{talk.content}</p>
                            </section>
                        </motion.article>
                    );
                })}
            </main>
        </div>
    )
}

export default TalkList
