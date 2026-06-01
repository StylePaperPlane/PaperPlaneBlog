import LazyImage from "../../../components/LazyImage";
import {Tag} from "antd";
import {motion} from "framer-motion";
import {useNavigate} from "react-router-dom";
import React, {useEffect, useRef, useState} from "react";
import {NoteType} from "../../../interface/NoteType";
import {CategoriesType} from "../../../interface/CategoriesType";
import {TagLevelOne} from "../../../interface/TagType";
import {renderNoteTags} from "../../../apis/TagMethods.tsx";
import dayjs from "dayjs";

interface ArticleOption {
    item: NoteType
    index: number
    Categories: CategoriesType[]
    name: string
    tagList: TagLevelOne[]
}

const Article:React.FC<ArticleOption> = ({ item, index, Categories, name, tagList }) => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        });

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    const getTimeAgo = () => {
        const diffMonth = dayjs().diff(dayjs(item.publishTime || item.createTime), 'month');
        if (diffMonth > 0) {
            return `${diffMonth} 个月前`;
        }
        const diffDay = dayjs().diff(dayjs(item.publishTime || item.createTime), 'day');
        if (diffDay > 0) {
            return `${diffDay} 天前`;
        }
        const diffHour = dayjs().diff(dayjs(item.publishTime || item.createTime), 'hour');
        if (diffHour > 0) {
            return `${diffHour} 小时前`;
        }
        return '刚刚';
    };

    return (
        <motion.div
            key={index}
            initial={{ opacity: 0, y: -20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            ref={elementRef}
            className="article"
        >
            <div className="ArticleCard" onClick={() => navigate(`/article/${item.key}`)}>
                <div className="ArticleMeta">
                    <div>
                        <strong>{name}</strong>
                        <span>发布了文章</span>
                    </div>
                    <time>{getTimeAgo()}</time>
                </div>

                <div className="ArticleContent">
                    <div className="ArticleCover">
                        {isVisible && <LazyImage src={item.cover} />}
                    </div>
                    <div className="ArticleBody">
                        <div className="ArticleCategory" style={{ color: Categories.find(category => category.categoryKey === item.noteCategory)?.color }}>
                            # {Categories.filter(category => category.categoryKey === item.noteCategory).map(item => item.categoryTitle)}
                        </div>
                    <h3 className='ArticleTitle'>{item.noteTitle}</h3>
                    <p>{item.description}</p>
                        <div className='tags'>
                            {renderNoteTags(item.noteTags,tagList)}
                        </div>
                    </div>
                </div>

                <div className="ArticleFooter">
                    <span>
                        <i className="iconfont icon-naozhong icon"></i>
                        {dayjs(item.publishTime || item.createTime).format("YYYY-MM-DD")}
                    </span>
                    <div>
                        <Tag color="blue">查看文章</Tag>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Article;
