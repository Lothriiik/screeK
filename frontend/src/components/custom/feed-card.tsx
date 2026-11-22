import React, { useState } from 'react';
import { Heart, ChatCircle, Repeat, Star, DotsThree, Info, CaretRight, PaperPlaneTilt, Link as LinkIcon, EyeSlash, WarningCircle, SignIn } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CommentRow, type CommentRowProps } from './comment-row';
import { useAuthStore } from '../../stores/authStore';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useRequireAuth } from '../../hooks/useRequireAuth';

export type FeedCardType =
  | 'review'
  | 'post'
  | 'repost_only'
  | 'repost_with_comment'
  | 'rated'
  | 'watched'
  | 'session';

export interface EmbeddedMovieInfo {
  title: string;
  posterUrl: string;
  director?: string; // e.g. "Gakuryu Ishii"
  detailsLine?: string; // e.g. "Drama · 2024 · 1h45"
}

export interface QuotedReviewInfo {
  id?: string;
  name: string; // e.g. "Lothrik Junior"
  actionText?: string; // e.g. "avaliou Duna: Parte II"
  timeAgo: string; // e.g. "há 2 horas"
  rating?: number; // e.g. 5
  avatarUrl: string;
  content: string; // e.g. "Uma obra épica que supera o original..."
}

export interface SharedSessionInfo {
  title: string;
  posterUrl: string;
  ageRating?: 'L' | '10' | '12' | '14' | '16' | '18';
  detailsLine?: string; // e.g. "Drama · 2024 · 1h45"
  cinemaAndRoom?: string; // e.g. "Cinesystem Arapiraca - Sala 4"
  dateLabel?: string; // e.g. "SEX 27/03"
  time?: string; // e.g. "19:00"
  audioFormat?: string; // e.g. "DUB"
  screenFormat?: string; // e.g. "IMAX"
}

export interface FeedCardProps {
  id?: string;
  type?: FeedCardType;
  name: string; // e.g. "Lothrik Junior"
  handle?: string; // e.g. "@lothrik"
  avatarUrl: string;
  timeAgo: string; // e.g. "há 2 horas"
  actionText?: string; // e.g. "avaliou Duna: Parte II", "assistiu Duna: Parte II", "compartilhou uma sessão"
  repostHeaderText?: string; // e.g. "repostou uma review"
  rating?: number; // e.g. 5 (renders 5 pink stars)
  hasSpoiler?: boolean;
  embeddedMovie?: EmbeddedMovieInfo;
  quotedReview?: QuotedReviewInfo;
  sharedSession?: SharedSessionInfo;
  content?: string;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  isLikedInitial?: boolean;
  showActionBar?: boolean;
  commentsList?: CommentRowProps[];
  isDetailView?: boolean;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  id = 'feed-1',
  type = 'post',
  name,
  handle,
  avatarUrl,
  timeAgo,
  actionText,
  repostHeaderText,
  rating,
  hasSpoiler = false,
  embeddedMovie,
  quotedReview,
  sharedSession,
  content,
  likesCount = 42,
  commentsCount,
  repostsCount = 42,
  isLikedInitial = true,
  showActionBar,
  commentsList = [],
  isDetailView = false,
}) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(isLikedInitial);
  const [likes, setLikes] = useState(likesCount);
  const [isReposted, setIsReposted] = useState(false);
  const [reposts, setReposts] = useState(repostsCount);
  const [showComments, setShowComments] = useState(isDetailView);
  const [showMenu, setShowMenu] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [comments, setComments] = useState<CommentRowProps[]>(
    commentsList.length > 0
      ? commentsList
      : Array.from({ length: commentsCount || 0 }, (_, i) => ({
          name: 'Cinéfilo screeK',
          handle: '@cinefilo',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          timeAgo: 'há 1 hora',
          commentText: `Comentário #${i + 1} na publicação sobre este filme.`,
          likesCount: 2,
          commentsCount: 0,
        }))
  );
  const [newCommentText, setNewCommentText] = useState('');

  const isRatedOrWatched = type === 'rated' || type === 'watched';
  const shouldShowActionBar = showActionBar !== undefined ? showActionBar : !isRatedOrWatched;

  const { user, isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const { requireAuth } = useRequireAuth();

  const toggleLike = () => {
    requireAuth(() => {
      if (isLiked) {
        setIsLiked(false);
        setLikes((prev) => prev - 1);
      } else {
        setIsLiked(true);
        setLikes((prev) => prev + 1);
        toast.success('Você curtiu esta publicação!');
      }
    }, { message: 'Faça login para curtir publicações no feed.' });
  };

  const toggleRepost = () => {
    requireAuth(() => {
      if (isReposted) {
        setIsReposted(false);
        setReposts((prev) => Math.max(0, prev - 1));
        toast.info('Repost desfeito.');
      } else {
        setIsReposted(true);
        setReposts((prev) => prev + 1);
        toast.success('Publicação repostada no seu feed!');
      }
    }, { message: 'Faça login para repostar publicações no seu perfil.' });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth(() => {
      if (!newCommentText.trim()) return;

      const newComment: CommentRowProps = {
        name: user?.name || user?.username || 'Você',
        handle: `@${user?.username || 'usuario'}`,
        avatarUrl: user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        timeAgo: 'agora mesmo',
        commentText: newCommentText.trim(),
        likesCount: 0,
        commentsCount: 0,
        isLikedInitial: false,
      };

      setComments([newComment, ...comments]);
      setNewCommentText('');
      toast.success('Comentário publicado!');
    }, { message: 'Faça login para comentar nesta publicação.' });
  };

  const cleanHandle = handle ? handle.replace('@', '') : null;
  const profileUrl = cleanHandle ? `/users/${cleanHandle}` : '/profile';
  const formattedHandle = handle ? (handle.startsWith('@') ? handle : `@${handle}`) : null;

  return (
    <div
      onClick={() => {
        if (!isDetailView) {
          navigate(`/feed/${id}`);
        }
      }}
      className={`w-full border-4 border-foreground/40 bg-background p-4 sm:p-6 font-display shadow-[6px_6px_0px_0px_var(--border)] text-foreground space-y-4 relative ${
        !isDetailView ? 'cursor-pointer hover:border-foreground/70 transition-colors' : ''
      }`}
    >
      
      {/* 0. Top Repost Header (For Repost Only) */}
      {(type === 'repost_only' || repostHeaderText) && (
        <div className="flex items-center gap-2 pb-2.5 border-b-2 border-foreground/20 text-xs font-bold text-foreground/70">
          <Repeat size={18} weight="bold" className="text-secondary" />
          <Link
            to={profileUrl}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <img
              src={avatarUrl}
              alt={name}
              className="w-6 h-6 object-cover border border-foreground/40 shrink-0"
            />
            <span className="font-black text-foreground">{name}</span>
          </Link>
          <span className="text-foreground/50">{repostHeaderText || 'repostou uma review'}</span>
        </div>
      )}

      {/* 1. Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar (Square) */}
          <Link
            to={profileUrl}
            onClick={(e) => e.stopPropagation()}
            className="hover:opacity-80 transition-opacity shrink-0"
          >
            <img
              src={avatarUrl}
              alt={name}
              className="w-11 h-11 sm:w-12 sm:h-12 object-cover border-2 border-foreground/40"
            />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap text-sm sm:text-base font-black text-foreground">
              <Link
                to={profileUrl}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-primary transition-colors truncate"
              >
                {name}
              </Link>
              {actionText ? (
                <span className="font-bold text-foreground/60 text-xs sm:text-sm">
                  {actionText}
                </span>
              ) : formattedHandle ? (
                <Link
                  to={profileUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-foreground/50 text-xs sm:text-sm hover:text-primary transition-colors"
                >
                  {formattedHandle}
                </Link>
              ) : null}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-foreground/40">
              <span>{timeAgo}</span>
              {hasSpoiler && (
                <span className="px-1.5 py-0.2 bg-destructive/10 border border-destructive/40 text-destructive text-[10px] font-black uppercase">
                  SPOILER
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Star Rating & Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Optional Star Rating (Pink Stars) */}
          {rating !== undefined && (
            <div className="flex items-center gap-0.5 text-[#FF5C80]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  weight={star <= rating ? 'fill' : 'bold'}
                  className={star <= rating ? 'text-[#FF5C80]' : 'text-foreground/30'}
                />
              ))}
            </div>
          )}

          {/* 3 Dots Options Button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-foreground/50 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Mais opções"
            >
              <DotsThree size={22} weight="bold" />
            </button>

            {/* Brutalist 3-dots Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-8 z-30 w-48 bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_var(--border)] p-1 space-y-0.5 text-xs font-bold font-display">
                {!isDetailView && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      navigate(`/feed/${id}`);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <CaretRight size={14} weight="bold" />
                    <span>Ver Post Destacado</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    navigator.clipboard?.writeText(`${window.location.origin}/feed/${id}`);
                    toast.success('Link do post copiado para a área de transferência!');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LinkIcon size={14} weight="bold" />
                  <span>Copiar Link do Post</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    toast.info(`Você silenciou as postagens de @${cleanHandle || name}`);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer transition-colors text-foreground/70"
                >
                  <EyeSlash size={14} weight="bold" />
                  <span>Silenciar @{cleanHandle || 'usuario'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    toast.warning('Publicação reportada para a moderação.');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive flex items-center gap-2 cursor-pointer transition-colors border-t border-foreground/10"
                >
                  <WarningCircle size={14} weight="bold" />
                  <span>Denunciar Publicação</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Reposter's / Shared Comment Text (with Spoiler toggle if present) */}
      {content && (
        <div className="space-y-1.5">
          {hasSpoiler ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSpoilerRevealed(!spoilerRevealed);
              }}
              className="p-3 bg-foreground/5 border border-dashed border-foreground/30 cursor-pointer group hover:bg-foreground/10 transition-colors"
            >
              <p
                className={`text-xs sm:text-sm font-bold text-foreground/85 leading-relaxed font-sans transition-all ${
                  spoilerRevealed
                    ? 'blur-none select-text'
                    : 'blur-sm select-none group-hover:blur-none group-hover:select-text'
                }`}
              >
                {content}
              </p>
              <span className="block text-[10px] font-extrabold text-foreground/50 italic mt-1.5">
                Passe o mouse ou clique para revelar o spoiler
              </span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-bold text-foreground/90 leading-relaxed font-sans">
              {content}
            </p>
          )}
        </div>
      )}

      {/* 3. Shared Session Card Box (For Repost Session) */}
      {sharedSession && (
        <div className="p-3.5 sm:p-4 border-2 border-foreground/30 bg-muted/20 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Poster Container with Age Rating */}
          <div className="relative shrink-0 w-20 aspect-[2/3] border-2 border-foreground/40 overflow-hidden">
            <img
              src={sharedSession.posterUrl}
              alt={sharedSession.title}
              className="w-full h-full object-cover"
            />
            {sharedSession.ageRating && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-[#34A853] text-white flex items-center justify-center text-[9px] font-black">
                {sharedSession.ageRating}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between min-w-0 flex-1 space-y-2 w-full">
            <div>
              <h4 className="text-sm sm:text-base font-black uppercase text-foreground leading-tight truncate">
                {sharedSession.title}
              </h4>
              {sharedSession.detailsLine && (
                <p className="text-[11px] font-bold text-foreground/50 mt-0.5">
                  {sharedSession.detailsLine}
                </p>
              )}
              {sharedSession.cinemaAndRoom && (
                <p className="text-[11px] font-bold text-foreground/80 mt-0.5">
                  {sharedSession.cinemaAndRoom}
                </p>
              )}

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {sharedSession.dateLabel && (
                  <span className="bg-[#6A1B4D] text-white px-2 py-0.5 text-[10px] font-black uppercase">
                    {sharedSession.dateLabel}
                  </span>
                )}
                {sharedSession.time && (
                  <span className="border border-foreground/40 text-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase">
                    {sharedSession.time}
                  </span>
                )}
                {sharedSession.audioFormat && (
                  <span className="border border-foreground/40 text-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase">
                    {sharedSession.audioFormat}
                  </span>
                )}
                {sharedSession.screenFormat && (
                  <span className="border border-foreground/40 text-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase">
                    {sharedSession.screenFormat}
                  </span>
                )}
              </div>
            </div>

            <Link
              to="/checkout/seats"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-black text-secondary hover:underline cursor-pointer pt-1"
            >
              <span>Garantir lugar nesta sessão</span>
              <CaretRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      )}

      {/* 4. Embedded Quoted Review Box (Quote Repost / Retweet) */}
      {quotedReview && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            const targetId = quotedReview.id || 'feed-1';
            navigate(`/feed/${targetId}`);
          }}
          className="p-3.5 sm:p-4 border-2 border-foreground/30 bg-muted/20 space-y-2 cursor-pointer hover:border-primary/60 hover:bg-muted/40 transition-all group"
          title="Clique para abrir a review citada"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={quotedReview.avatarUrl}
                alt={quotedReview.name}
                className="w-8 h-8 object-cover border border-foreground/40 shrink-0"
              />
              <div className="text-xs">
                <span className="font-black text-foreground group-hover:text-primary transition-colors">{quotedReview.name}</span>
                {quotedReview.actionText && (
                  <span className="font-bold text-foreground/60 ml-1">{quotedReview.actionText}</span>
                )}
                <span className="block text-[10px] font-bold text-foreground/40">{quotedReview.timeAgo}</span>
              </div>
            </div>

            {quotedReview.rating !== undefined && (
              <div className="flex items-center gap-0.5 text-[#FF5C80]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    weight={star <= quotedReview.rating! ? 'fill' : 'bold'}
                    className={star <= quotedReview.rating! ? 'text-[#FF5C80]' : 'text-foreground/30'}
                  />
                ))}
              </div>
            )}
          </div>

          <p className="text-xs font-bold text-foreground/75 leading-relaxed line-clamp-2 group-hover:text-foreground transition-colors">
            {quotedReview.content}
          </p>
        </div>
      )}

      {/* 5. Embedded Movie Box (For Standard Review, Rated, Watched) */}
      {embeddedMovie && (
        <div className="p-3 sm:p-4 border-2 border-foreground/30 bg-muted/20 flex gap-3.5 items-center">
          <img
            src={embeddedMovie.posterUrl}
            alt={embeddedMovie.title}
            className="w-14 sm:w-16 aspect-[2/3] object-cover border-2 border-foreground/40 shrink-0"
          />
          <div className="flex flex-col justify-between min-w-0 flex-1 space-y-1">
            <div>
              <h4 className="text-sm sm:text-base font-black uppercase text-foreground leading-tight truncate">
                {embeddedMovie.title}
              </h4>
              {embeddedMovie.director && (
                <p className="text-xs font-bold text-secondary mt-0.5">
                  Dir. {embeddedMovie.director}
                </p>
              )}
              {embeddedMovie.detailsLine && (
                <p className="text-[11px] font-bold text-foreground/50 mt-0.5">
                  {embeddedMovie.detailsLine}
                </p>
              )}
            </div>

            <Link
              to={`/movies`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-foreground/70 hover:text-primary cursor-pointer w-fit"
            >
              <Info size={14} />
              <span>Ver Detalhes do Filme</span>
            </Link>
          </div>
        </div>
      )}

      {/* 6. Divider & Bottom Action Bar (Only rendered if shouldShowActionBar is true) */}
      {shouldShowActionBar && (
        <>
          <div className="border-b-2 border-foreground/20" />
          <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-6 text-xs font-black">
              {/* Like Action */}
              <button
                type="button"
                onClick={toggleLike}
                className="flex items-center gap-1.5 cursor-pointer transition-colors group"
                title="Curtir"
              >
                <Heart
                  size={19}
                  weight={isLiked ? 'fill' : 'bold'}
                  className={isLiked ? 'text-[#FF5C80]' : 'text-foreground/50 group-hover:text-[#FF5C80]'}
                />
                <span className={isLiked ? 'text-[#FF5C80]' : 'text-foreground/60'}>
                  {likes}
                </span>
              </button>

              {/* Comment Action */}
              <button
                type="button"
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${
                  showComments ? 'text-primary' : 'text-foreground/60 hover:text-primary'
                }`}
                title="Comentários"
              >
                <ChatCircle size={19} weight="bold" />
                <span>{comments.length}</span>
              </button>

              {/* Repost Action */}
              <button
                type="button"
                onClick={toggleRepost}
                className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${
                  isReposted ? 'text-[#34A853]' : 'text-foreground/60 hover:text-[#34A853]'
                }`}
                title="Repostar no feed"
              >
                <Repeat size={19} weight="bold" />
                <span>{reposts}</span>
              </button>
            </div>

            {/* Quick Link to Detail */}
            {!isDetailView && (
              <Link
                to={`/feed/${id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-black uppercase text-foreground/50 hover:text-primary flex items-center gap-1 transition-colors"
              >
                <span>Destacar</span>
                <CaretRight size={13} weight="bold" />
              </Link>
            )}
          </div>
        </>
      )}

      {/* 7. Interactive Comments Thread Drawer / Expansion */}
      {showComments && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="pt-3 border-t-2 border-foreground/10 space-y-4 animate-in fade-in-50 duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-foreground/60">
              Comentários ({comments.length})
            </span>
          </div>

          {/* New Comment Input Box or Guest Responder CTA */}
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Escreva uma resposta para esta publicação..."
                className="flex-1 px-3 py-2 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground focus:outline-none focus:border-primary placeholder:text-foreground/40"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground font-black text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
              >
                <PaperPlaneTilt size={14} weight="bold" />
                <span className="hidden sm:inline">Responder</span>
              </button>
            </form>
          ) : (
            <div className="p-3 bg-muted/40 border-2 border-foreground/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <span className="text-xs font-sans text-foreground/75">
                Faça login ou crie sua conta para responder a esta publicação.
              </span>
              <button
                type="button"
                onClick={() => openModal('login')}
                className="px-3 py-1.5 bg-primary text-primary-foreground font-black text-xs uppercase flex items-center gap-1.5 border border-primary shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
              >
                <SignIn size={14} weight="bold" />
                <span>Entrar para Responder</span>
              </button>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-xs font-sans text-foreground/50 italic py-2">
              Seja a primeira pessoa a comentar nesta resenha.
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((cmt, idx) => (
                <CommentRow
                  key={idx}
                  name={cmt.name}
                  handle={cmt.handle}
                  avatarUrl={cmt.avatarUrl}
                  timeAgo={cmt.timeAgo}
                  commentText={cmt.commentText}
                  likesCount={cmt.likesCount}
                  commentsCount={cmt.commentsCount}
                  isLikedInitial={cmt.isLikedInitial}
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

