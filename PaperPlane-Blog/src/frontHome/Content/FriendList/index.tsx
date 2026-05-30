import './index.sass'
import {useEffect, useState} from "react";
import {Friend} from "../../../interface/FriendType";
import {message} from "antd";
import { motion } from 'framer-motion';
import scrollToTop from "../../../utils/scrollToTop.tsx";
import {getFriendsList} from "../../../apis/FriendMethods.tsx";
const FriendList = () => {
    const [Friends,setFriends] = useState<Friend[]>([])
    useEffect(() => {
        scrollToTop();
        initFriendsList()
    },[]);

    const initFriendsList = () => {
        getFriendsList().then((res) => {
            setFriends(res.data.data)
        }).catch(() => {
            message.error("获取失败")
        });
    }

    return <div className='FriendsContainer'>

        <div className="FriendList">
            <h3>Friends</h3>
            <ul className='link-items'>
                {Friends.map((item,index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: index * 0.08 ,ease: "easeOut"}}
                        className="article"
                    >
                        <a key={item.friendKey} href={item.siteUrl} target='_blank' rel="noreferrer">
                            <li className='link-item'>
                                <div className="avatar-wrap">
                                    <img
                                        alt={item.siteName}
                                        className="lazyload"
                                        data-src={item.avatar}
                                        src={item.avatar}
                                    />
                                    <span className="status-dot" />
                                </div>
                                <span className="sitename">{item.siteName}</span>
                                <div className="linkdes">{item.description}</div>
                            </li>
                        </a>
                    </motion.div>
                ))}
            </ul>
        </div>
    </div>
}

export default FriendList
