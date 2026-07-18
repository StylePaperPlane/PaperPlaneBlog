import './index.sass'
import {Avatar} from "antd";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import UserState from "../../../interface/UserState";
import {motion} from 'framer-motion';
import {formatNote, NoteType} from "../../../interface/NoteType";
import {categoryList} from "../../../store/components/categories.tsx";
import type {RootState} from "../../../store";
import Article from "./Article.tsx";
import {useNavigate} from "react-router-dom";
import {getNotePage, getTopNotes} from "../../../apis/NoteMethods.tsx";
import {resolveImageUrl} from "../../../utils/imageUrl.ts";
import dayjs from "dayjs";
import {renderNoteTags} from "../../../apis/TagMethods.tsx";
import HeroIdentity from './HeroIdentity';
import {useHeroRevealMotion} from './useHeroRevealMotion';

const parseNoteTags = (noteTags?: string) => (
    noteTags
        ? noteTags.split(',').map(tag => parseInt(tag, 10)).filter(tag => Number.isFinite(tag))
        : []
);

const ContentHome = () => {
    const [currentTop,setCurrentTop] = useState(0)
    const [currentPage,setCurrentPage] = useState(1)
    const [hasMoreArticles, setHasMoreArticles] = useState(true);
    const [loading, setLoading] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
    const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
    const avatar = useSelector((state:{user:UserState}) => state.user.avatar)
    const name = useSelector((state:{user:UserState}) => state.user.name)
    const navigate = useNavigate()
    const [otherArticles,setOtherArticles] = useState<NoteType[]>([])
    const [topArticles,setTopArticles] = useState<NoteType[]>([])
    const Categories = useSelector((state: { categories: categoryList }) => state.categories.categories);
    const tagList = useSelector((state: RootState) => state.tags.tag)
    const social = useSelector((state:{user:UserState}) => state.user.social)
    const author =  useSelector((state: { user: UserState }) => state.user.name);
    const {
        contentScale,
        coverScale,
        heroMaskStyle,
    } = useHeroRevealMotion({viewportHeight, viewportWidth});

    useEffect(() => {
        const handleResize = () => {
            setViewportHeight(window.innerHeight);
            setViewportWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if(topArticles.length === 0)
            return;
        const timer = setInterval(() => {
            setCurrentTop(prevTop => (prevTop + 1) % topArticles.length);
        }, 3000);
        return () => clearInterval(timer);
    },[topArticles.length])

    useEffect(() => {
        getNotePage({
            page: 1,
            pageSize: 6
        }).then(res => {
            setOtherArticles(res.data.data.map((item: formatNote) => {
                return {
                    ...item,
                    key: item.noteKey,
                    noteTags: parseNoteTags(item.noteTags),
                }
            }))
        })
    }, []);

    useEffect(() => {
        getTopNotes().then(res => {
            setTopArticles(res.data.data.map((item: formatNote) => {
                return {
                    ...item,
                    key: item.noteKey,
                    noteTags: parseNoteTags(item.noteTags),
                }
            }))
        })
    }, []);
    const handleScrollDown = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    }
    const getMore = () => {
        setLoading(true)
        getNotePage({
            page: currentPage + 1,
            pageSize: 6
        }).then(res => {
            if (res.data.data.length === 0) {
                setHasMoreArticles(false);
            } else {
                setCurrentPage(currentPage + 1);
                setOtherArticles(prevArticles => [
                    ...prevArticles,
                    ...res.data.data.map((item: formatNote) => ({
                        ...item,
                        key: item.noteKey,
                        noteTags: parseNoteTags(item.noteTags),
                    }))
                ]);
                if(res.data.data.length < 6)
                    setHasMoreArticles(false)
            }
        }).finally(() => {
            setLoading(false);
        });
    };

    const groupedArticles = otherArticles.reduce((groups, article) => {
        const month = dayjs(article.publishTime || article.createTime).format('YYYY 年 MM 月');
        if (!groups[month]) {
            groups[month] = [];
        }
        groups[month].push(article);
        return groups;
    }, {} as Record<string, NoteType[]>);

    return <div className="HomeRevealShell">
        <motion.div
            className="SelfDescription"
            style={heroMaskStyle}
        >
            <motion.div
                className="HeroBackdrop"
                style={{scale: coverScale}}
                aria-hidden="true"
            />
            <HeroIdentity author={author} avatar={avatar} social={social}/>
            <motion.button
                type="button"
                className="HeroScrollCue"
                aria-label="向下浏览文章"
                onClick={handleScrollDown}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            >
                <i className="iconfont icon-rcd-angle-double-down upAndDown" aria-hidden="true"/>
            </motion.button>
        </motion.div>
        <motion.div className="HomeContentLayer" style={{scale: contentScale}}>
            <div className="ContentContainer">
                {topArticles.length>0&&<div className="TopArticle" onClick={() => navigate(`/article/${topArticles[currentTop]?.key}`)}>
                    <div className="TopCover">
                        {topArticles.map((item,index) => (
                            <img
                                src={resolveImageUrl(item.cover)}
                                key={item.key}
                                className={currentTop === index ? 'fade-in-out show' : 'fade-in-out'}
                            />
                        ))}

                        <span className="thumbnail-screen"></span>
                        <div className="topDots">
                            {topArticles.map((item,index) => <div className={`topDot ${currentTop===index&&'dotCurrent'}`} key={item.key} onMouseEnter={()=>setCurrentTop(index)}></div>)}
                        </div>
                    </div>
                    <div className="topContent">
                        <h4># {Categories.find(item => item.categoryKey === topArticles[currentTop]?.noteCategory)?.categoryTitle}</h4>
                        <h3 className="contentTitle">{topArticles[currentTop]?.noteTitle}</h3>
                        <p> {topArticles[currentTop]?.description}</p>
                        <div className='tags' style={{ width: '100%', marginTop: '10px' }}>
                            {renderNoteTags(topArticles[currentTop]?.noteTags, tagList)}
                        </div>
                        <div className="topFooter">
                            <Avatar src={avatar} size={40} style={{marginRight:10}}/>
                            <span style={{marginRight:10}}>{name}</span>
                            <span style={{fontSize:13,color:'var(--font-p-color)'}} className='post-date'><i className="iconfont icon-naozhong icon" style={{fontSize: 22, display: 'inline',verticalAlign: 'sub'}}></i>发布于 2024.03.02</span>
                        </div>
                    </div>
                </div>}


            {/*  其他文章  */}
                <div style={{width:'78%'}}>
                    <div className='allContent'>文章</div>
                </div>

                <div className="allArticles">
                    {Object.entries(groupedArticles).map(([month, articles]) => (
                        <section className="ArticleMonthGroup" key={month}>
                            <div className="ArticleMonthLabel">{month}</div>
                            <div className="ArticleMonthItems">
                                {articles.map((item,index) => (
                                    <Article item={item} index={index} Categories={Categories} name={name} tagList={tagList} key={item.key}/>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
                {loading ? (
                    <div className="loadingio-spinner-spinner-69tfms83mg9">
                        <div className="ldio-se504dvlmh">
                            <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
                        </div>
                    </div>
                ) : (
                    <div>
                        {hasMoreArticles ? (
                            <div className='allContent more' style={{ padding: '20px 50px 20px 50px', borderRadius: 20, fontSize: 20 }} onClick={getMore}>More</div>
                        ) : null}
                    </div>
                )}
            </div>
        </motion.div>
        <div className="HomeRevealScrollSpace"></div>
    </div>
}

export default ContentHome
