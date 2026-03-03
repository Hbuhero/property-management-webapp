import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();

    const toggle = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
            {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
        </button>
    );
}

export function ThemeToggleExtended() {
    const { theme, setTheme } = useTheme();

    const options: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode }[] = [
        { value: 'light', icon: <Sun className="h-4 w-4" /> },
        { value: 'dark', icon: <Moon className="h-4 w-4" /> },
        { value: 'system', icon: <Monitor className="h-4 w-4" /> },
    ];

    return (
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            {options.map(({ value, icon }) => (
                <button
                    key={value}
                    onClick={() => setTheme(value)}
                    aria-label={`Set ${value} theme`}
                    className={`h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors ${theme === value
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
}
