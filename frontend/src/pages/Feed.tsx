import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChatCircleText,
  Flame,
  UserCheck,
  FilmStrip,
  PaperPlaneTilt,
  Sparkle,
  SignIn
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { FeedCard, type FeedCardProps } from '../components/custom/feed-card';
import { StarRating } from '../components/custom/star-rating';
import { MOCK_FEED_ACTIVITIES, MOCK_USERS, MOCK_MOVIES } from '../mocks';
import { useAuthStore } from '../stores/authStore';
import { useAuthModalStore } from '../stores/authModalStore';

type FeedTab = 'for_you' | 'following' | 'trending';

export function Feed() {
  const { user, isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const [activeTab, setActiveTab] = useState<FeedTab>('for_you');
  const [activities, setActivities] = useState<FeedCardProps[]>(MOCK_FEED_ACTIVITIES);

  // New post state
  const [postText, setPostText] = useState('');
  const [postRating, setPostRating] = useState(0);
  const [selectedMovieId, setSelectedMovieId] = useState(MOCK_MOVIES[0].id);

  const selectedMovie = MOCK_MOVIES.find((m) => m.id === selectedMovieId) || MOCK_MOVIES[0];

  const handlePublish = () => {
    if (!postText.trim()) {
      toast.warning('Escreva uma mensagem antes de publicar.');
      return;
    }

    const newActivity: FeedCardProps = {
      id: `feed-new-${Date.now()}`,
      type: postRating > 0 ? 'review' : 'post',
      name: user?.name || user?.username || 'Você',
      handle: `@${user?.username || 'usuario'}`,
      avatarUrl: user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      timeAgo: 'agora mesmo',
      actionText: postRating > 0 ? `avaliou ${selectedMovie.title}` : `publicou uma nota sobre ${selectedMovie.title}`,
      rating: postRating > 0 ? postRating : undefined,
      content: postText,
      embeddedMovie: {
        title: selectedMovie.title,
        posterUrl: selectedMovie.poster_url,
        director: selectedMovie.directors.join(', '),
        detailsLine: `${selectedMovie.genres[0]} • ${selectedMovie.release_year} • ${selectedMovie.duration_display}`,
      },
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      isLikedInitial: false,
    };

    setActivities([newActivity, ...activities]);
    setPostText('');
    setPostRating(0);
    toast.success('Publicação compartilhada no feed!');
  };

  const displayedActivities = activities.filter((act) => {
    if (activeTab === 'trending') return act.type === 'review';
    if (activeTab === 'following') return act.handle !== '@lothrik';
    return true;
  });

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. FEED HEADER & TABS ─── */}
      <section className="bg-background page-divider px-4 sm:px-0 py-6">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ChatCircleText size={24} weight="bold" className="text-primary" />
                <span className="text-xs font-black uppercase text-foreground/60 tracking-wider">
                  Comunidade Cinéfila screeK
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase text-foreground tracking-tight">
                Feed Social
              </h1>
            </div>

            {isAuthenticated ? (
              <Link
                to="/profile"
                className="px-4 py-2 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
              >
                Meu Perfil Cinéfilo
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openModal('login')}
                className="px-4 py-2 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
              >
                <SignIn size={16} weight="bold" />
                <span>Entrar / Criar Conta</span>
              </button>
            )}
          </div>

          {/* Feed Filter Tabs */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('for_you')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'for_you'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <Sparkle size={16} weight="fill" />
              <span>Para Você</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'following'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <UserCheck size={16} weight="bold" />
              <span>Seguindo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'trending'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <Flame size={16} weight="fill" />
              <span>Reviews em Alta</span>
            </button>
          </div>

        </div>
      </section>

      {/* ─── 2. MAIN FEED LAYOUT (TIMELINE + SIDEBAR) ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Post Creator + Feed Stream */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Publisher Box or Guest Invitation Banner */}
            {isAuthenticated ? (
              <div className="bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] p-5 space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-foreground/10 pb-3">
                  <FilmStrip size={20} weight="bold" className="text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    Compartilhar Review ou Nota Cinéfila
                  </span>
                </div>

                {/* Textarea */}
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="O que você achou da sua última sessão no cinema? Escreva sua resenha ou comentário..."
                  rows={3}
                  className="w-full p-3 bg-background border-2 border-foreground/30 text-foreground font-sans text-xs sm:text-sm focus:outline-none focus:border-primary resize-none placeholder:text-foreground/40"
                />

                {/* Movie selector and star rating */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Select movie */}
                    <select
                      value={selectedMovieId}
                      onChange={(e) => setSelectedMovieId(e.target.value)}
                      aria-label="Selecionar Filme"
                      className="h-9 px-3 bg-background border-2 border-foreground/30 text-xs font-bold uppercase text-foreground focus:outline-none focus:border-primary"
                    >
                      {MOCK_MOVIES.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.release_year})
                        </option>
                      ))}
                    </select>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 bg-background border-2 border-foreground/30 px-2.5 py-1">
                      <span className="text-[10px] font-black uppercase text-foreground/50">Nota:</span>
                      <StarRating value={postRating} onChange={setPostRating} size={16} />
                    </div>
                  </div>

                  {/* Publish Button */}
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="px-5 py-2 bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider border-2 border-primary hover:bg-primary/90 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <PaperPlaneTilt size={16} weight="bold" />
                    <span>Publicar</span>
                  </button>

                </div>
              </div>
            ) : (
              <div className="bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FilmStrip size={20} weight="bold" className="text-primary" />
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      Junte-se à Comunidade screeK
                    </span>
                  </div>
                  <p className="text-xs font-sans text-foreground/70">
                    Faça login ou crie sua conta para publicar reviews, registrar filmes assistidos e interagir com outros cinéfilos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openModal('login')}
                  className="px-4 py-2 bg-primary text-primary-foreground font-black text-xs uppercase flex items-center gap-1.5 border-2 border-primary shadow-[2px_2px_0px_0px_var(--border)] hover:bg-primary/90 transition-all shrink-0 cursor-pointer"
                >
                  <SignIn size={16} weight="bold" />
                  <span>Publicar no Feed</span>
                </button>
              </div>
            )}

            {/* Activities Stream */}
            <div className="space-y-6">
              {displayedActivities.map((activity) => (
                <FeedCard key={activity.id} {...activity} />
              ))}
            </div>

          </div>

          {/* Right Column: Trending Users & Active Sessions */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Suggested Cinéfilos */}
            <div className="bg-background border-4 border-foreground/40 shadow-[4px_4px_0px_0px_var(--border)] p-5 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-foreground/20 pb-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                  Cinéfilos em Destaque
                </h3>
                <Link to="/search?tab=users" className="text-[10px] font-black uppercase text-primary hover:underline">
                  Ver Todos
                </Link>
              </div>

              <div className="space-y-3">
                {MOCK_USERS.slice(0, 4).map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 p-2 bg-muted/20 border border-foreground/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-10 h-10 object-cover border-2 border-foreground/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/users/${user.username}`}
                          className="text-xs font-black uppercase text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {user.name}
                        </Link>
                        <span className="text-[10px] text-foreground/50 font-bold block truncate">
                          @{user.username} • {user.watched_count} filmes
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/users/${user.username}`}
                      className="px-2 py-1 bg-background hover:bg-muted border border-foreground/40 text-[10px] font-black uppercase shrink-0"
                    >
                      Ver
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Hot in Theaters */}
            <div className="bg-background border-4 border-foreground/40 shadow-[4px_4px_0px_0px_var(--border)] p-5 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-foreground/20 pb-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                  Sessões Mais Comentadas
                </h3>
                <Link to="/movies?status=now_playing" className="text-[10px] font-black uppercase text-primary hover:underline">
                  Ingressos
                </Link>
              </div>

              <div className="space-y-3">
                {MOCK_MOVIES.slice(0, 3).map((m) => (
                  <Link
                    key={m.id}
                    to={`/movies/${m.id}`}
                    className="flex items-center gap-3 p-2 bg-muted/20 border border-foreground/10 hover:border-primary transition-all group"
                  >
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      className="w-10 aspect-[2/3] object-cover border border-foreground/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black uppercase text-foreground truncate group-hover:text-primary transition-colors">
                        {m.title}
                      </h4>
                      <span className="text-[10px] text-foreground/60 block">
                        ★ {m.global_rating} ({m.global_votes} reviews)
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </aside>

        </div>
      </main>

    </div>
  );
}
