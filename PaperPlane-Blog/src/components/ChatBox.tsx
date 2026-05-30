import { useEffect } from 'react';
import {createBot} from 'botui';
import {BotUI, BotUIMessageList, BotUIAction, useBotUI, useBotUIAction} from "@botui/react"
import '../assets/default.theme.scss'


const myBot = createBot()

const StarsAction = () => {
    const bot = useBotUI();
    const action = useBotUIAction();
    const array = new Array(action?.data.total).fill('⭐️');

    return (
        <div>
            {array.map((v, i) => (
                <button
                    key={i}
                    onClick={() => {
                        bot.next({ starsGiven: i + 1 }, { messageType: 'stars' });
                    }}
                >
                    {/*@ts-ignore*/}
                    {i + 1} {v}
                </button>
            ))}
        </div>
    );
};

interface Message {
    data: {
        starsGiven: number
    }
}

const StarsMessage = ({ message }: { message: Message }) => {
    const stars = new Array(message.data.starsGiven).fill('⭐️')

    return (
        <div>
            {stars}
        </div>
    )
}

const actionRenderers = {
    'stars': StarsAction
}

const messageRenderers = {
    'stars': StarsMessage
}

function ChatBox() {
    useEffect(() => {
        // @ts-ignore
        myBot.message.add({
            text: "你好，这里是 PaperPlane の Blog👋",
        }).then(() => {
            return myBot.wait({ waitTime: 1500 });
        }).then(() => {
            return myBot.message.add({
                text: "我是博客的站点作者，可以在后台修改这段介绍。",
            });
        }).then(() => {
            return myBot.wait({ waitTime: 1500 });
        }).then(() => {
            return myBot.message.add({
                text: "是 [ PaperPlane ] 的使用者",
            });
        }).then(() => {
            return myBot.wait({ waitTime: 1500 });
        }).then(() => {
            return myBot.action.set(
                {
                    options: [
                        { label: '然后呢？😃', value: 'and' },
                        // { label: '少废话！😆', value: 'gg' },
                    ],
                },
                { actionType: 'selectButtons' }
            );
            //@ts-ignore
        }).then((res: any) => {
            console.log(res);
            if (res.value == "and") {
                return myBot.next()
            }
            if (res.value == "gg") {
                return myBot.message.add({
                    text: "![](https://view.amogu.cn/images/2020/08/30/sanlian.jpg)",
                });
            }
        }).then(async () => {
            await myBot.message.add({
                text: "😘",
            });
            await myBot.wait({waitTime: 1500});
            await myBot.message.add({
                text: "是一个正在学习的全栈开发，虽然专业是通信，但并不影响我热爱Web开发",
            });
            await myBot.wait({waitTime: 1500});
            await myBot.message.add({
                text: "略懂前端和后端，可以自己写全栈项目，偶尔也练练算法(算法菜鸟一个",
            });
            await myBot.wait({waitTime: 1500});
            await myBot.message.add({
                text: "最擅长...编程???o(*ï¿£ï¸¶ï¿£*)o",
            });
            await myBot.wait({waitTime: 1500});
            await myBot.message.add({
                text: "喜欢编程，热爱编程，目前正在计算机领域探索",
            });
            await myBot.wait({waitTime: 1500});
            await myBot.action.set(
                {
                    options: [
                        {label: '为什么叫 [ PaperPlane ] 呢？🤔', value: 'why'},
                    ],
                },
                {actionType: 'selectButtons'}
            );
            await myBot.wait({waitTime: 1500});
            await myBot.message.add({
                text: "为了纪念过去美化的回忆，以及逝去的亲人...",
            });
            await myBot.wait({waitTime: 1500});
            await myBot.action.set(
                {
                    options: [
                        {label: '你有什么爱好呢', value: 'like'},
                    ],
                },
                {actionType: 'selectButtons'}
            );
            await myBot.wait({waitTime: 1500});
            await myBot.message.add({
                text: "编程，健身，足球~",
            });
            await myBot.wait({waitTime: 1500});
            await myBot.message.add({
                text: "这就是我😊朝着自己的梦想一直努力吧！",
            });
        }).then(async () => {
            await myBot.wait({waitTime: 1500});
            return myBot.message.add({
                text: "给 [ PaperPlane ] 评个星吧！"
            }).then(() => {
                myBot.action.set(
                    { total: 6 },
                    { actionType: 'stars' }
                )
                    .then(async (data) => { // data 是从 .next() 返回的数据
                        await myBot.message.add({text: `你对 [ PaperPlane ] 的评价是 ${data.starsGiven} 星!`});
                        await myBot.wait({waitTime: 1500});
                        return myBot.message.add({
                            text: "再见啦，祝你开心呦 ^_^",
                        });
                    });
            })
        });

        return () => {
        //     销毁
            myBot.message.removeAll()
        }
    },[])
    return (
        <div className='chatbot' id='paperplane'>
            <div className="logofont" style={{ textAlign: 'center', fontSize: '50px', marginBottom: '20px', marginRight: '-20px' }}>[PaperPlane]</div>
            <div className="popcontainer" id="fogforest" style={{ minHeight: '500px', padding: '2px 6px 4px 6px', backgroundColor: 'rgba(242, 242, 242,0.5)', borderRadius: '10px',display:'flex',flexDirection:'column'
            ,justifyContent:'center'
            }}>
                <BotUI bot={myBot}>
                    <BotUIMessageList renderer={messageRenderers} />
                    <BotUIAction renderer={actionRenderers} />
                </BotUI>
                <div>
                </div>
            </div>

        </div>
    )
}

export default ChatBox;
