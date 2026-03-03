interface CircularProgressProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    isDark?: boolean;
    type?: 'full' | 'semi';
    color?: string;
}

export function CircularProgress({
    value,
    size = 80,
    strokeWidth = 8,
    isDark = true,
    type = 'full',
    color = 'text-primary-400'
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const isSemi = type === 'semi';
    const offset = circumference - (value / 100) * (isSemi ? circumference / 2 : circumference);

    return (
        <div className="relative flex items-center justify-center font-mono" style={{ width: size, height: isSemi ? size / 1.8 : size }}>
            <svg
                width={size}
                height={size}
                className={`transform ${isSemi ? '' : '-rotate-90'}`}
                style={{ transform: isSemi ? 'rotate(-180deg)' : undefined }}
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className={`opacity-10 ${isDark ? 'text-white' : 'text-black'}`}
                    strokeDasharray={isSemi ? `${circumference / 2} ${circumference}` : ''}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className={`${color} transition-all duration-1000 ease-out`}
                    strokeDasharray={circumference}
                    strokeDashoffset={isSemi ? offset + (circumference / 2) : offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className={`absolute font-black text-sm ${isSemi ? 'bottom-1' : ''}`}>
                {value}%
            </div>
        </div>
    );
}
