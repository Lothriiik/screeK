import React, { useState } from 'react';
import { Star, Heart, ChatCircle, DotsThree, Info } from '@phosphor-icons/react';

export interface ReviewRowProps {
  name: string; // e.g. "Lothrik Junior"
  handle: string; // e.g. "@lothrik"
  dateLabel: string; // e.g. "21 mar 2026"
  avatarUrl: string;
  rating: number; // e.g. 4 (renders 4 pink filled stars out of 5)
  reviewText: string;
  hasSpoiler?: boolean;
  likesCount?: number;
  commentsCount?: number;
  isLikedInitial?: boolean;
}

export const ReviewRow: React.FC<ReviewRowProps> = ({
  name,
  handle,
  dateLabel,
  avatarUrl,
  rating = 4,
  reviewText,
  hasSpoiler = false,
  likesCount = 42,
  commentsCount = 42,
  isLikedInitial = true,
}) => {
  const [isLiked, setIsLiked] = useState(isLikedInitial);
  const [likes, setLikes] = useState(likesCount);
  const [isRevealed, setIsRevealed] = useState(false);

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikes((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikes((prev) => prev + 1);
    }
  };

  const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`;

  return (
    <div className="w-full border-4 border-foreground/40 bg-background p-4 sm:p-5 font-display shadow-[4px_4px_0px_0px_var(--border)] text-foreground space-y-3">
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar (Square) */}
          <img
            src={avatarUrl}
            alt={name}
            className="w-11 h-11 sm:w-12 sm:h-12 object-cover border-2 border-foreground/40 shrink-0"
          />

          <div>
            <h4 className="text-sm sm:text-base font-black text-foreground leading-tight">
              {name}
            </h4>
            <span className="text-xs font-bold text-foreground/50">
              {formattedHandle} - {dateLabel}
            </span>
          </div>
        </div>

        {/* 5-Star Rating (Pink Stars) */}
        <div className="flex items-center gap-1 text-[#FF5C80]">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={18}
              weight={star <= rating ? 'fill' : 'bold'}
              className={star <= rating ? 'text-[#FF5C80]' : 'text-foreground/30'}
            />
          ))}
        </div>
      </div>

      {/* Review Content Body */}
      <div className="space-y-2">
        {hasSpoiler ? (
          <div className="space-y-2">
            {/* Spoiler Badge */}
            <div className="inline-flex items-center gap-1 border border-foreground/50 px-2 py-0.5 text-[10px] font-black text-foreground uppercase">
              <Info size={14} />
              <span>SPOILER</span>
            </div>

            {/* Blurred Review Text with persistent hint to prevent layout jump */}
            <div
              onClick={() => setIsRevealed(!isRevealed)}
              className="relative group cursor-pointer"
            >
              <p
                className={`text-xs sm:text-sm font-bold text-foreground/80 leading-relaxed transition-all ${
                  isRevealed
                    ? 'blur-none select-text'
                    : 'blur-sm select-none group-hover:blur-none group-hover:select-text'
                }`}
              >
                {reviewText}
              </p>
              <span className="block text-[10px] font-extrabold text-foreground/50 italic mt-1">
                Passe o mouse ou clique para revelar o spoiler
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-bold text-foreground/80 leading-relaxed">
            {reviewText}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-b-2 border-foreground/20" />

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4 text-xs font-black">
          {/* Like Action */}
          <button
            type="button"
            onClick={toggleLike}
            className="flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Heart
              size={18}
              weight={isLiked ? 'fill' : 'bold'}
              className={isLiked ? 'text-[#FF5C80]' : 'text-foreground/50'}
            />
            <span className={isLiked ? 'text-[#FF5C80]' : 'text-foreground/50'}>
              {likes}
            </span>
          </button>

          {/* Comment Reply Action */}
          <div className="flex items-center gap-1.5 text-foreground/50">
            <ChatCircle size={18} weight="bold" />
            <span>{commentsCount}</span>
          </div>
        </div>

        {/* More Actions Menu */}
        <button
          type="button"
          className="text-foreground/40 hover:text-foreground cursor-pointer transition-colors"
          title="Opções"
        >
          <DotsThree size={24} weight="bold" />
        </button>
      </div>
    </div>
  );
};
