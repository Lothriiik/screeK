import React, { useState } from 'react';

// ============================================================================
// 1. UserCard (Card Vertical com Avatar, Bio, Estatísticas e Botão de Seguir)
// ============================================================================
export interface UserCardProps {
  id?: string;
  name: string; // e.g. "Lothrik Junior"
  handle: string; // e.g. "@lothrik"
  avatarUrl: string;
  bio?: string; // e.g. "Cinéfilo. Fã de ficção científica."
  followersCount?: number; // e.g. 284
  moviesCount?: number; // e.g. 284
  isFollowingInitial?: boolean;
  onFollowToggle?: (isFollowing: boolean) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  name,
  handle,
  avatarUrl,
  bio = 'Cinéfilo. Fã de ficção científica.',
  followersCount = 284,
  moviesCount = 284,
  isFollowingInitial = false,
  onFollowToggle,
}) => {
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial);

  const handleToggle = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    if (onFollowToggle) onFollowToggle(nextState);
  };

  return (
    <div className="w-full min-w-0 max-w-[260px] bg-background border-4 border-foreground/40 p-3 flex flex-col items-center text-center font-display shadow-[4px_4px_0px_0px_var(--border)] text-foreground">
      {/* Avatar (Square) */}
      <img
        src={avatarUrl}
        alt={name}
        className="w-14 h-14 object-cover border-2 border-foreground/40 shrink-0 mb-3"
      />

      {/* User Name & Handle */}
      <h3 className="text-sm sm:text-base font-black text-foreground leading-tight">
        {name}
      </h3>
      <span className="text-xs font-bold text-foreground/50 mb-2">
        {handle.startsWith('@') ? handle : `@${handle}`}
      </span>

      {/* Bio */}
      {bio && (
        <p className="text-[11px] font-bold text-foreground/70 leading-tight mb-3 px-1 line-clamp-3 min-h-[42px] break-words">
          {bio}
        </p>
      )}

      {/* Stats Row */}
      <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t-2 border-foreground/20">
        <div>
          <span className="block text-sm font-black text-[#6A1B4D]">{followersCount}</span>
          <span className="text-[10px] font-bold text-foreground/50">seguidores</span>
        </div>
        <div>
          <span className="block text-sm font-black text-[#6A1B4D]">{moviesCount}</span>
          <span className="text-[10px] font-bold text-foreground/50">filmes</span>
        </div>
      </div>

      {/* Follow Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full mt-3 py-2 text-xs font-black uppercase tracking-wider border-2 border-transparent cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] transition-all ${
          isFollowing
            ? 'bg-[#594242] hover:bg-[#6D5353] text-white'
            : 'bg-[#6A1B4D] hover:bg-[#80205D] text-white'
        }`}
      >
        {isFollowing ? 'Seguindo' : 'Seguir'}
      </button>
    </div>
  );
};

// ============================================================================
// 2. UserRow (Linha Horizontal com Avatar, Info e Botão de Seguir)
// ============================================================================
export interface UserRowProps {
  id?: string;
  name: string; // e.g. "Lothrik Junior"
  handle: string; // e.g. "@lothrik"
  watchedCount?: number; // e.g. 540
  avatarUrl: string;
  isFollowingInitial?: boolean;
  onFollowToggle?: (isFollowing: boolean) => void;
}

export const UserRow: React.FC<UserRowProps> = ({
  name,
  handle,
  watchedCount = 540,
  avatarUrl,
  isFollowingInitial = false,
  onFollowToggle,
}) => {
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial);

  const handleToggle = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    if (onFollowToggle) onFollowToggle(nextState);
  };

  const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`;

  return (
    <div className="w-full max-w-[500px] bg-background border-4 border-foreground/40 p-3.5 sm:p-4 flex items-center justify-between font-display shadow-[4px_4px_0px_0px_var(--border)] text-foreground">
      {/* Left Avatar & Info */}
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={avatarUrl}
          alt={name}
          className="w-11 h-11 sm:w-12 sm:h-12 object-cover border-2 border-foreground/40 shrink-0"
        />

        <div className="min-w-0">
          <h4 className="text-sm font-black text-foreground truncate">{name}</h4>
          <p className="text-xs font-bold text-foreground/50 truncate">
            {formattedHandle} - {watchedCount} assistidos
          </p>
        </div>
      </div>

      {/* Right Follow Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`px-5 sm:px-6 py-2 text-xs font-black uppercase tracking-wider border-2 border-transparent cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] transition-all shrink-0 ml-3 ${
          isFollowing
            ? 'bg-[#594242] hover:bg-[#6D5353] text-white'
            : 'bg-[#6A1B4D] hover:bg-[#80205D] text-white'
        }`}
      >
        {isFollowing ? 'Seguindo' : 'Seguir'}
      </button>
    </div>
  );
};
