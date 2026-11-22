import React, { useState } from 'react';
import { Star } from '@phosphor-icons/react';

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
  starColor?: string;
  emptyColor?: string;
  showValue?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readonly = false,
  size = 24,
  starColor = 'text-amber-400',
  emptyColor = 'text-white/30',
  showValue = true,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleClick = (index: number, isHalf: boolean) => {
    if (readonly || !onChange) return;
    const newValue = isHalf ? index + 0.5 : index + 1;
    onChange(newValue);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (readonly) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isHalf = event.clientX - rect.left < rect.width / 2;
    setHoverValue(isHalf ? index + 0.5 : index + 1);
  };

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => !readonly && setHoverValue(null)}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const starRating = index + 1;
        const isFilled = displayValue >= starRating;
        const isHalf = displayValue === index + 0.5;

        return (
          <div
            key={index}
            className={`relative ${!readonly ? 'cursor-pointer transition-transform hover:scale-110' : ''}`}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const half = e.clientX - rect.left < rect.width / 2;
              handleClick(index, half);
            }}
          >
            {isHalf ? (
              <Star size={size} weight="duotone" className={starColor} />
            ) : isFilled ? (
              <Star size={size} weight="fill" className={starColor} />
            ) : (
              <Star size={size} weight="regular" className={emptyColor} />
            )}
          </div>
        );
      })}
      {showValue && (
        <span className={`ml-2 font-display font-extrabold text-sm ${starColor}`}>
          {displayValue.toFixed(1)}
        </span>
      )}
    </div>
  );
};
