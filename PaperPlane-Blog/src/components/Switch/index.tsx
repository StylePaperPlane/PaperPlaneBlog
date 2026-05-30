import './index.css'

interface SwitchProps {
    handleModeSwitch: () => void,
    isDarkMode: boolean
}

const Switch = ({ handleModeSwitch, isDarkMode }: SwitchProps) => {
    const handleClick = () => {
        const nextIsDarkMode = !isDarkMode;
        handleModeSwitch();
        window.dispatchEvent(new CustomEvent('theme-mode-change', {
            detail: { isDarkMode: nextIsDarkMode }
        }));
    };

    return (
        <button
            type="button"
            className={`themeToggle ${isDarkMode ? 'isDark' : ''}`}
            onClick={handleClick}
            aria-label={isDarkMode ? '切换浅色模式' : '切换深色模式'}
            aria-pressed={isDarkMode}
        >
            <span className="themeToggle__track">
                <span className="themeToggle__sun" />
                <span className="themeToggle__moon" />
                <span className="themeToggle__thumb" />
            </span>
        </button>
    )
}

export default Switch
