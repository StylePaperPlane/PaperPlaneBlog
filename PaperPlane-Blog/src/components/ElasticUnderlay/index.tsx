import {useEffect, useState} from "react";
import {getNotes} from "../../apis/NoteMethods.tsx";

type TodayInfo = {
    year: string;
    dayOfYear: number;
    yearPercentage: number;
    dayPercentage: number;
};

const getTodayInfo = (): TodayInfo => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayIndex = Math.floor(diff / oneDay);
    const totalDays = (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0 ? 366 : 365;
    const yearPercentage = (dayIndex / totalDays) * 100;
    const dayPercentage = ((now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400) * 100;

    return {
        year: now.getFullYear().toString(),
        dayOfYear: dayIndex + 1,
        yearPercentage: parseFloat(yearPercentage.toFixed(6)),
        dayPercentage: parseFloat(dayPercentage.toFixed(6))
    };
};

const ElasticUnderlay = () => {
    const [noteCount, setNoteCount] = useState(0);
    const [todayInfo, setTodayInfo] = useState<TodayInfo>(getTodayInfo);

    useEffect(() => {
        getNotes()
            .then(res => setNoteCount(res.data.data?.length || 0))
            .catch(() => setNoteCount(0));

        const intervalId = window.setInterval(() => {
            setTodayInfo(getTodayInfo());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <div className="frontElasticUnderlay">
            <div>共有 {noteCount} 篇文章，再接再厉 · 今天是 {todayInfo.year} 年的第{todayInfo.dayOfYear}天</div>
            <div>今年已过 {todayInfo.yearPercentage}% · 今天已过 {todayInfo.dayPercentage}% · 活在当下，珍惜眼下</div>
        </div>
    );
};

export default ElasticUnderlay;
