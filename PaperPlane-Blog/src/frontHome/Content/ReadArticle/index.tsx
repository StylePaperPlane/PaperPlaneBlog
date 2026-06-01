import './index.sass'
import {ReactNode, useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {useNavigate, useParams} from "react-router-dom";
import {NoteType} from "../../../interface/NoteType";
import Markdown from 'react-markdown'
import { motion } from 'framer-motion';
import {Avatar} from "antd";
import {FileTextOutlined} from "@ant-design/icons";
import {useSelector} from "react-redux";
import UserState from "../../../interface/UserState";
import dayjs from "dayjs";
import 'github-markdown-css/github-markdown-light.css'
import 'katex/dist/katex.min.css'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import type {SyntaxHighlighterProps} from 'react-syntax-highlighter'
import {oneDark} from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import MarkdownNavbar from 'markdown-navbar'
import 'markdown-navbar/dist/navbar.css'
import Loading from "../../Loading";
import scrollToTop from "../../../utils/scrollToTop.tsx";
import {getNoteById, getNotes} from "../../../apis/NoteMethods.tsx";
import {resolveImageUrl} from "../../../utils/imageUrl.ts";
import {categoryList} from "../../../store/components/categories.tsx";

const createCodeBlockProps = (children: ReactNode, language: string): SyntaxHighlighterProps => ({
    PreTag: "div",
    children: String(children).replace(/\n$/, ''),
    language,
    style: oneDark,
});

type ArticleNote = NoteType & {
    noteContent?: string;
};

const ReadArticle = () => {
    const avatar = useSelector((state:{user:UserState}) => state.user.avatar)
    const name = useSelector((state:{user:UserState}) => state.user.name)
    const Categories = useSelector((state: { categories: categoryList }) => state.categories.categories);
    const {id} = useParams()
    const navigate = useNavigate()
    const[isLoading,setLoading] = useState(true)
    const [article,setArticle] = useState<NoteType|null>(null)
    const [collectionNotes,setCollectionNotes] = useState<NoteType[]>([])
    const [canRenderAside,setCanRenderAside] = useState(false)
    const [isDarkMode,setIsDarkMode] = useState(() => localStorage.getItem('isDarkMode') === 'true')

    useEffect(() => {
        setCanRenderAside(true);
    }, []);

    useEffect(() => {
        const syncTheme = () => setIsDarkMode(localStorage.getItem('isDarkMode') === 'true');
        const handleThemeChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
            setIsDarkMode(Boolean(customEvent.detail?.isDarkMode));
        };

        syncTheme();
        window.addEventListener('storage', syncTheme);
        window.addEventListener('theme-mode-change', handleThemeChange);
        return () => {
            window.removeEventListener('storage', syncTheme);
            window.removeEventListener('theme-mode-change', handleThemeChange);
        };
    }, []);

    useEffect(() => {
        if (id){
            setLoading(true)
            getNoteById(id).then((res) => {
                const note: ArticleNote = res.data.data;
                setArticle({
                    ...note,
                    content: note.noteContent || note.content || ''
                });
                getNotes().then((notesRes) => {
                    const sameCategoryNotes = notesRes.data.data
                        .filter((item: ArticleNote) => String(item.noteCategory) === String(note.noteCategory))
                        .map((item: ArticleNote) => ({
                            ...item,
                            key: item.noteKey,
                            content: item.noteContent || item.content || ''
                        }));
                    setCollectionNotes(sameCategoryNotes);
                }).catch(() => {
                    setCollectionNotes([]);
                });
            }).catch(() => {
                console.error('获取失败')
            }).finally(() => {
                setLoading(false)
            });
        }
        scrollToTop();
    }, [id]);

    const sidePanel = (
        <aside className={`readAside ${isDarkMode ? 'frontDark' : ''}`}>
            <div className="readSideCard readTocCard">
                <div className="readTocTitle">目录</div>
                <div className="navigation" id='toc'>
                    <MarkdownNavbar source={article?.content || ''} ordered={false} headingTopOffset={100}/>
                </div>
            </div>
            {collectionNotes.length > 0 && (
                <section className="readSideCard readCollection">
                    <div className="collectionHead">
                        <FileTextOutlined className="collectionIcon" />
                        <strong>合集目录</strong>
                    </div>
                    <div className="collectionCategory">
                        {Categories.find(item => String(item.categoryKey) === String(article?.noteCategory))?.categoryTitle || article?.categoryTitle || '同分类文章'}
                        <span>({collectionNotes.length})</span>
                    </div>
                    <div className="collectionDivider" />
                    <div className="collectionList">
                        {collectionNotes.map((item, index) => (
                            <button
                                type="button"
                                key={item.noteKey || item.key}
                                className={`collectionItem ${String(item.noteKey || item.key) === String(id) ? 'active' : ''}`}
                                onClick={() => navigate(`/article/${item.noteKey || item.key}`)}
                            >
                                <span className="collectionName">
                                    <span className="collectionIndex">{index + 1}.</span>
                                    <span className="collectionTitle">{item.noteTitle}</span>
                                </span>
                                <time>{dayjs(item.publishTime || item.createTime).format('MM-DD')}</time>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </aside>
    );

    return <>
        <div className='readContainer'>
        {isLoading ? <div style={{width:'100vw',height:'100vh',display:'flex',justifyContent:'center',alignItems:'center'}}>
            <Loading />
        </div> : (
            <div className="readLayout">
                <main className="readMain">
                    <div className="readCover">
                        <motion.img
                            src={resolveImageUrl(article?.cover)}
                            initial={{ filter: "blur(10px)" }}
                            animate={{ filter: "blur(0px)" }}
                            transition={{ duration: 1 }}
                        />
                    </div>
                    <motion.div
                        className="readInfo"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="readMeta">
                            <span className="readAuthor">
                                <Avatar src={resolveImageUrl(avatar)} size={88} className="frontAvatar" />
                                <span>{name}</span>
                            </span>
                            <span className="readMetaDot" />
                            <time>{dayjs(article?.createTime || article?.publishTime || article?.updateTime).format("YYYY-MM-DD")}</time>
                        </div>
                        <h1>{article?.noteTitle}</h1>
                        <motion.div
                            className="readDivider"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 1, delay: 0.3 }}
                        />
                    </motion.div>
                    <div className='readContent markdown-body'>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                        >
                            <div id="content" className='markdown-body'>
                                <Markdown
                                    children={article?.content || ''}
                                    remarkPlugins={[[remarkGfm, {singleTilde: false}], remarkMath, [remarkToc,{heading: 'structure'}]]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                    components={{
                                        code(props) {
                                            const {children, className, ...rest} = props
                                            const match = /language-(\w+)/.exec(className || '')
                                            return match ? (
                                                <SyntaxHighlighter
                                                    {...createCodeBlockProps(children, match[1])}
                                                />
                                            ) : (
                                                <code {...rest} className={className}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                        img(props) {
                                            const {src, ...rest} = props
                                            return <img {...rest} src={resolveImageUrl(src)} />
                                        }
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>)}
        </div>
        {!isLoading && canRenderAside ? createPortal(sidePanel, document.body) : null}
    </>
}

export default ReadArticle
