import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChatCircleText,
  ShareNetwork,
  Sparkle,
  CaretRight
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { FeedCard } from '../components/custom/feed-card';
import { MOCK_FEED_ACTIVITIES } from '../mocks/feed';

export function FeedDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const post = MOCK_FEED_ACTIVITIES.find((p) => p.id === id) || MOCK_FEED_ACTIVITIES[0];
  const relatedPosts = MOCK_FEED_ACTIVITIES.filter((p) => p.id !== post.id).slice(0, 3);

  useEffect(() => {
    if (post) {
      document.title = `Post de ${post.name} | screeK`;
    }
  }, [post]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link da publicação copiado para a área de transferência!');
  };

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. TOP HEADER & BREADCRUMB ─── */}
      <section className="bg-background px-4 sm:px-0 py-6">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-4">
          
          {/* Back & Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-card hover:bg-muted border-2 border-foreground/40 text-foreground text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Voltar ao Feed</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-card hover:bg-muted border-2 border-foreground/40 text-foreground text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <ShareNetwork size={16} weight="bold" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ChatCircleText size={20} weight="bold" className="text-secondary" />
              <span className="text-xs font-black uppercase text-foreground/60 tracking-wider">
                Discussão Cinéfila • screeK Social
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
              Publicação de {post.name}
            </h1>
          </div>

        </div>
      </section>

      {/* ─── 2. MAIN POST CONTENT & COMMENTS ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8 space-y-8">
        
        {/* Highlighted Main Post Card with Expanded Comment Thread */}
        <FeedCard
          id={post.id}
          type={post.type}
          name={post.name}
          handle={post.handle}
          avatarUrl={post.avatarUrl}
          timeAgo={post.timeAgo}
          actionText={post.actionText}
          repostHeaderText={post.repostHeaderText}
          rating={post.rating}
          hasSpoiler={post.hasSpoiler}
          embeddedMovie={post.embeddedMovie}
          quotedReview={post.quotedReview}
          sharedSession={post.sharedSession}
          content={post.content}
          likesCount={post.likesCount}
          commentsCount={post.commentsCount}
          repostsCount={post.repostsCount}
          isLikedInitial={post.isLikedInitial}
          commentsList={post.commentsList}
          isDetailView={true}
        />

        {/* More Community Posts */}
        <section className="space-y-4 pt-6 border-t-2 border-foreground/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkle size={18} weight="fill" className="text-primary" />
              <h2 className="text-sm font-black uppercase text-foreground">
                Outras Atividades na Comunidade
              </h2>
            </div>
            <Link
              to="/feed"
              className="text-xs font-bold uppercase text-foreground/60 hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>Ver Feed Completo</span>
              <CaretRight size={12} weight="bold" />
            </Link>
          </div>

          <div className="space-y-4">
            {relatedPosts.map((rel) => (
              <FeedCard
                key={rel.id}
                id={rel.id}
                type={rel.type}
                name={rel.name}
                handle={rel.handle}
                avatarUrl={rel.avatarUrl}
                timeAgo={rel.timeAgo}
                actionText={rel.actionText}
                repostHeaderText={rel.repostHeaderText}
                rating={rel.rating}
                hasSpoiler={rel.hasSpoiler}
                embeddedMovie={rel.embeddedMovie}
                quotedReview={rel.quotedReview}
                sharedSession={rel.sharedSession}
                content={rel.content}
                likesCount={rel.likesCount}
                commentsCount={rel.commentsCount}
                repostsCount={rel.repostsCount}
                isLikedInitial={rel.isLikedInitial}
                commentsList={rel.commentsList}
              />
            ))}
          </div>
        </section>

      </main>

    </div>
  );
}
