import {Card, Col, Row, Statistic} from "antd";
import CountUp from "react-countup";
import './index.sass'
import {useSelector} from "react-redux";
import React from "react";
import type {RootState} from "../../store";

const ArticleAnalytics = () => {
    const tagCount = useSelector((state: RootState) => state.tags.tagCount)
    const noteCount = useSelector((state: RootState) => state.notes.noteCount);
    const categoryCount = useSelector((state: RootState) => state.categories.categoryCount)
    const list = [
        {
            index: 1,
            name: <p><span className="logo2" style={{ backgroundColor: 'rgba(230,240,0,0.3)'}}>✨️</span>文章总数</p>,
            value: noteCount,
            bgColor: '#f1dfba'
        },
        {
            index: 2,
            name: <p><span className="logo2" style={{ backgroundColor: 'rgba(255,0,0,0.3)'}}>❤️️</span>分类总数</p>,
            value: categoryCount,
            bgColor: '#fbcbd5'
        },
        {
            index: 3,
            name: <p><span className="logo2" style={{ backgroundColor: 'rgb(147,154,216,0.3)'}}>🎯</span>标签总数</p>,
            value: tagCount,
            bgColor: '#91ccef'
        },
    ]
    const formatter = (value: React.ReactText): React.ReactNode => (
        <CountUp end={Number(value)} separator="," />
    );

    return <>
        <div className="analyticsCard">
            {list.map(item => (
                <Card className='akCard' key={item.index} style={{backgroundColor:item.bgColor}}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Statistic title={item.name} value={item.value} formatter={formatter}/>
                        </Col>
                    </Row>
                </Card>
            ))}
        </div>
    </>
}

export default ArticleAnalytics
