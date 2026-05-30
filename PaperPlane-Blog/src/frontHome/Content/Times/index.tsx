import './index.sass'
import {useEffect, useMemo, useState} from "react";
import dayjs from "dayjs";
import {motion} from 'framer-motion';
import {ArrowRightOutlined, CalendarOutlined} from "@ant-design/icons";
import scrollToTop from "../../../utils/scrollToTop.tsx";
import {getNotes} from "../../../apis/NoteMethods.tsx";
import {getCategories} from "../../../apis/CategoryMethods.tsx";
import {useNavigate} from "react-router-dom";
import {NoteType} from "../../../interface/NoteType";
import {CategoriesType} from "../../../interface/CategoriesType";

type ArchiveNote = NoteType & {
    noteContent?: string;
};

type ArchiveCategory = {
    key: string;
    title: string;
    introduce: string;
    color: string;
    count: number;
};

const fallbackColors = ['#27a6cc', '#80bfd4', '#fcc5c5', '#79799a', '#303d67'];
const formatNoteDate = (note: ArchiveNote) => dayjs(note.publishTime || note.createTime || note.updateTime);
const getCategoryKey = (category: CategoriesType) => String(category.categoryKey ?? category.key);
const getNoteKey = (note: ArchiveNote) => String(note.noteCategory ?? 'uncategorized');

const Times = () => {
    const [notes, setNotes] = useState<ArchiveNote[]>([]);
    const [categories, setCategories] = useState<CategoriesType[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        scrollToTop();

        Promise.all([
            getNotes(),
            getCategories().catch(() => ({data: {data: []}}))
        ]).then(([notesRes, categoriesRes]) => {
            const nextNotes = notesRes.data.data.map((item: ArchiveNote) => ({
                ...item,
                key: item.noteKey || item.key,
                content: item.noteContent || item.content || ''
            }));

            nextNotes.sort((a: ArchiveNote, b: ArchiveNote) => formatNoteDate(b).valueOf() - formatNoteDate(a).valueOf());
            setNotes(nextNotes);
            setCategories(categoriesRes.data.data || []);
        }).catch(() => {
            setNotes([]);
            setCategories([]);
        });
    }, []);

    const categoryMap = useMemo(() => {
        const map = new Map<string, CategoriesType>();

        categories.forEach(category => {
            [category.categoryKey, String(category.key), category.categoryTitle].forEach(key => {
                if (key !== undefined && key !== null && key !== '') map.set(String(key), category);
            });
        });

        return map;
    }, [categories]);

    const archiveCategories = useMemo<ArchiveCategory[]>(() => {
        const noteCount = new Map<string, number>();

        notes.forEach(note => {
            const category = categoryMap.get(getNoteKey(note));
            const key = String(category?.categoryKey ?? category?.key ?? getNoteKey(note));
            noteCount.set(key, (noteCount.get(key) || 0) + 1);
        });

        const next = categories.map((category, index) => {
            const key = getCategoryKey(category);

            return {
                key,
                title: category.categoryTitle || '未命名分类',
                introduce: category.introduce || '这个分类暂时还没有简介',
                color: category.color || fallbackColors[index % fallbackColors.length],
                count: noteCount.get(key) || 0
            };
        });

        const hasUncategorized = notes.some(note => !categoryMap.get(getNoteKey(note)));
        if (hasUncategorized) {
            next.push({
                key: 'uncategorized',
                title: '未分类',
                introduce: '暂未归入固定分类的文章',
                color: '#79799a',
                count: notes.filter(note => !categoryMap.get(getNoteKey(note))).length
            });
        }

        return next;
    }, [categories, categoryMap, notes]);

    const activeCategoryInfo = archiveCategories.find(category => category.key === activeCategory);
    const filteredNotes = activeCategory === 'all'
        ? notes
        : notes.filter(note => {
            const category = categoryMap.get(getNoteKey(note));
            const key = String(category?.categoryKey ?? category?.key ?? getNoteKey(note));
            return key === activeCategory;
        });

    return <>
        <div className='TimesContainer'>
            <motion.header
                className="archiveHero"
                initial={{opacity: 0, y: 24}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.6}}
            >
                <div>
                    <span className="archiveEyebrow">Archive</span>
                    <h1>归档</h1>
                </div>
                <div className="archiveSummary">
                    <strong>{archiveCategories.length}</strong>
                    <span>个分类</span>
                    <strong>{notes.length}</strong>
                    <span>篇文章</span>
                </div>
            </motion.header>

            <main className="archiveIndex">
                <motion.section
                    className="archiveCategoryBoard"
                    initial={{opacity: 0, y: 18}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.45, delay: 0.08}}
                >
                    <div className="archiveSectionTitle">
                        <span>分类</span>
                        <strong>{activeCategory === 'all' ? '全部文章' : activeCategoryInfo?.title}</strong>
                    </div>
                    <div className="archiveCategoryList">
                        <button
                            type="button"
                            className={`archiveCategoryName ${activeCategory === 'all' ? 'isActive' : ''}`}
                            onClick={() => setActiveCategory('all')}
                        >
                            <span className="categoryMark allMark" />
                            <span className="categoryText">全部</span>
                            <span className="categoryCount">{notes.length}</span>
                        </button>
                        {archiveCategories.map(category => (
                            <button
                                type="button"
                                className={`archiveCategoryName ${activeCategory === category.key ? 'isActive' : ''}`}
                                key={category.key}
                                onClick={() => setActiveCategory(category.key)}
                                title={category.introduce}
                            >
                                <span className="categoryMark" style={{backgroundColor: category.color}} />
                                <span className="categoryText">{category.title}</span>
                                <span className="categoryCount">{category.count}</span>
                            </button>
                        ))}
                    </div>
                </motion.section>

                <motion.section
                    className="archiveTitleBoard"
                    initial={{opacity: 0, y: 18}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.45, delay: 0.14}}
                >
                    <div className="archiveSectionTitle">
                        <span>文章</span>
                        <strong>{filteredNotes.length} 篇</strong>
                    </div>
                    <div className="archiveTitleList">
                        {filteredNotes.length ? filteredNotes.map((note, index) => {
                            const date = formatNoteDate(note);
                            const category = categoryMap.get(getNoteKey(note));
                            const categoryColor = category?.color || '#79799a';

                            return (
                                <button
                                    type="button"
                                    className="archiveTitleRow"
                                    key={note.noteKey || note.key}
                                    onClick={() => navigate(`/article/${note.noteKey || note.key}`)}
                                >
                                    <span className="archiveTitleIndex">{String(index + 1).padStart(2, '0')}</span>
                                    <span className="archiveTitleDot" style={{backgroundColor: categoryColor}} />
                                    <span className="archiveTitleMain">{note.noteTitle}</span>
                                    <span className="archiveTitleDate">
                                        <CalendarOutlined />
                                        {date.format('YYYY-MM-DD')}
                                    </span>
                                    <ArrowRightOutlined className="archiveArrow" />
                                </button>
                            );
                        }) : (
                            <div className="archiveEmpty">这个分类暂时没有文章</div>
                        )}
                    </div>
                </motion.section>
            </main>
        </div>
    </>;
}

export default Times;
