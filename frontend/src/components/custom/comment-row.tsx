import React, { useState } from 'react';
import { Heart, ChatCircle, DotsThree } from '@phosphor-icons/react';
import { useRequireAuth } from '../../hooks/useRequireAuth';

export interface CommentRowProps {
  name: string; // e.g. "Lothrik Junior"
  handle: string; // e.g. "@lothrik"
  avatarUrl: string;
  timeAgo: string; // e.g. "2h", "21 mar 2026", "ontem"
  commentText: string;
  likesCount?: number;
  commentsCount?: number;
  isLikedInitial?: boolean;
}

export const CommentRow: React.FC<CommentRowProps> = ({
  name,
  handle,
  avatarUrl,
  timeAgo,
  commentText,
  likesCount = 42,
  commentsCount = 42,
  isLikedInitial = true,
}) => {
  const { requireAuth } = useRequireAuth();
  const [isLiked, setIsLiked] = useState(isLikedInitial);
  const [likes, setLikes] = useState(likesCount);

  const toggleLike = () => {
    requireAuth(() => {
      if (isLiked) {
        setIsLiked(false);
        setLikes((prev) => prev - 1);
      } else {
        setIsLiked(true);
        setLikes((prev) => prev + 1);
      }
    }, { message: 'Faça login para curtir comentários.' });
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
            className="w-10 h-10 sm:w-11 sm:h-11 object-cover border-2 border-foreground/40 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-foreground">{name}</span>
              <span className="text-xs font-bold text-foreground/50">{formattedHandle}</span>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-xs font-bold text-foreground/40">{timeAgo}</span>
      </div>

      {/* Comment Body Text */}
      <p className="text-xs sm:text-sm font-bold text-foreground/80 leading-relaxed">
        {commentText}
      </p>

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
