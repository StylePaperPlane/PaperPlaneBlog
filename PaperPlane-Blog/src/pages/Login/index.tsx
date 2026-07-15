import './index.sass';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchToken } from "../../store/components/user.tsx";
import { useNavigate } from 'react-router-dom';
import getToken from '../../apis/getToken';
import UserData from "../../interface/UserData";
import {AppDispatch} from "../../store";
import {LoginChallenge} from '../../features/login-security';
import {
    ArrowLeftOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
    UserOutlined
} from "@ant-design/icons";

type LoginFieldName = 'account' | 'password';

const Login: React.FC = () => {
    //hooks区域
    const [account, setAccount] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setSubmitting] = useState(false);
    const [challengeToken, setChallengeToken] = useState<string | null>(null);
    const [challengeVersion, setChallengeVersion] = useState(0);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    //回调函数区域
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target as HTMLInputElement & { name: LoginFieldName };
        if (name === 'account') {
            setAccount(value);
            return;
        }
        if (name === 'password') {
            setPassword(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!challengeToken) {
            message.warning('请先完成人机验证');
            return;
        }

        const data: UserData = {
            username: account,
            password,
            turnstileToken: challengeToken,
        };

        try {
            setSubmitting(true);
            const status: number = await dispatch(fetchToken(data));
            if (status === 200) {
                message.success('登录成功');
                navigate('/dashboard');
            }
        } catch (error) {
            const detail = (error as {response?: {data?: {message?: string}}}).response?.data?.message;
            message.error(detail || '登录失败，账号、密码或验证结果无效');
            setChallengeToken(null);
            setChallengeVersion(version => version + 1);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
        e.preventDefault();
        // 设置自定义错误提示
        message.warning(`请填写${e.currentTarget.placeholder}`);
    };

    return (
        <main className="login-page">
            <section className="login-brand" aria-label="PaperPlane 品牌介绍">
                <a className="login-back" href="/">
                    <ArrowLeftOutlined />
                    返回博客
                </a>
                <div className="login-brand-content">
                    <img className="login-logo" src="/logo.png" alt="PaperPlane" />
                    <p className="login-kicker">PaperPlane Workspace</p>
                    <h1>让每一篇文字，<br />都有清晰的航向。</h1>
                    <p className="login-intro">
                        在一个安静、专注的工作台里管理文章、图片、友链和音乐。
                    </p>
                </div>
                <div className="login-brand-footer">
                    <span>Write</span>
                    <span>Organize</span>
                    <span>Publish</span>
                </div>
            </section>

            <section className="login-panel">
                <div className="login-form-wrap">
                    <div className="login-heading">
                        <span className="login-mobile-brand">
                            <img src="/logo.png" alt="" />
                            PaperPlane
                        </span>
                        <p>欢迎回来</p>
                        <h2>登录管理后台</h2>
                        <span>使用你的管理员账号继续。</span>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <label className="login-field">
                            <span>账号</span>
                            <div className="login-input-shell">
                                <UserOutlined />
                                <input
                                    type="text"
                                    name="account"
                                    value={account}
                                    required
                                    onChange={handleChange}
                                    onInvalid={handleInvalid}
                                    autoComplete="username"
                                    placeholder="请输入管理员账号"
                                />
                            </div>
                        </label>

                        <label className="login-field">
                            <span>密码</span>
                            <div className="login-input-shell">
                                <LockOutlined />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    required
                                    value={password}
                                    onChange={handleChange}
                                    onInvalid={handleInvalid}
                                    autoComplete="current-password"
                                    placeholder="请输入密码"
                                />
                                <button
                                    className="password-toggle"
                                    type="button"
                                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                </button>
                            </div>
                        </label>

                        <LoginChallenge key={challengeVersion} onTokenChange={setChallengeToken} />

                        <button className="login-submit" type="submit" disabled={isSubmitting || !challengeToken}>
                            {isSubmitting ? '正在登录...' : '进入工作台'}
                        </button>
                    </form>

                    <p className="login-help">登录遇到问题？请检查后端服务与管理员凭据。</p>
                </div>
            </section>
        </main>
    );
};

export default Login;
