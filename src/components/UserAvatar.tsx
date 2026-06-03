import { cn } from '@/lib/utils';
import { resolveUserAvatarUrl } from '@/lib/userAvatarUrl';
import type { User } from '@/store/slices/authSlice';

type UserAvatarProps = {
    user: Pick<User, 'name' | 'avatar'>;
    className?: string;
};

function initialsFromName(name: string): string {
    return (
        name
            .trim()
            .split(/\s+/)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U'
    );
}

export function UserAvatar({ user, className }: UserAvatarProps) {
    const src = resolveUserAvatarUrl(user.avatar);
    const initials = initialsFromName(user.name);

    if (src) {
        return (
            <img
                src={src}
                alt=""
                className={cn('rounded-full object-cover bg-slate-100 dark:bg-slate-800', className)}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0',
                className,
            )}
            aria-hidden
        >
            {initials}
        </div>
    );
}
