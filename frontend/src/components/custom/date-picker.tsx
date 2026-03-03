import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
    isDark?: boolean;
    label?: string;
    onDateSelect?: (date: Date) => void;
}

export function DatePicker({ isDark = true, label, onDateSelect }: DatePickerProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDateClick = (day: number) => {
        const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(selected);
        onDateSelect?.(selected);
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return day === selectedDate.getDate() &&
            currentDate.getMonth() === selectedDate.getMonth() &&
            currentDate.getFullYear() === selectedDate.getFullYear();
    };

    return (
        <div className="w-full max-w-xs">
            {label && (
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">
                    {label}
                </label>
            )}
            <div className={`border-4 ${isDark ? 'border-white/20 bg-surface-dark-900' : 'border-black/20 bg-surface-light-50'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-2 border-b-4 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                    <button
                        onClick={handlePrevMonth}
                        className={`p-1 border-4 transition-all ${isDark
                            ? 'border-white/20 hover:border-primary-400 hover:bg-primary-400/10'
                            : 'border-black/20 hover:border-primary-400 hover:bg-primary-400/10'
                            }`}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="text-sm font-black uppercase tracking-tight">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className={`p-1 border-4 transition-all ${isDark
                            ? 'border-white/20 hover:border-primary-400 hover:bg-primary-400/10'
                            : 'border-black/20 hover:border-primary-400 hover:bg-primary-400/10'
                            }`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Days of week */}
                <div className={`grid grid-cols-7 border-b-4 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                    {daysOfWeek.map((day) => (
                        <div
                            key={day}
                            className={`p-1.5 text-center text-[10px] font-black uppercase tracking-widest opacity-40 border-r-4 last:border-r-0 ${isDark ? 'border-white/20' : 'border-black/20'}`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                        <div
                            key={`empty-start-${index}`}
                            className={`aspect-square border-r-4 border-b-4 last:border-r-0 ${isDark ? 'border-white/20' : 'border-black/20'}`}
                        />
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1;
                        return (
                            <button
                                key={day}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    aspect-square p-1 text-xs font-bold border-r-4 border-b-4 last:border-r-0 transition-all
                                    ${isDark ? 'border-white/20' : 'border-black/20'}
                                    ${isSelected(day)
                                        ? 'bg-primary-400 text-white'
                                        : isToday(day)
                                            ? isDark
                                                ? 'bg-white/10 hover:bg-white/20'
                                                : 'bg-black/10 hover:bg-black/20'
                                            : isDark
                                                ? 'hover:bg-white/10'
                                                : 'hover:bg-black/10'
                                    }
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}

                    {/* Empty cells to fill remaining space (always 6 rows = 42 cells total) */}
                    {Array.from({ length: 42 - (startingDayOfWeek + daysInMonth) }).map((_, index) => (
                        <div
                            key={`empty-end-${index}`}
                            className={`aspect-square border-r-4 border-b-4 last:border-r-0 ${isDark ? 'border-white/20' : 'border-black/20'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
