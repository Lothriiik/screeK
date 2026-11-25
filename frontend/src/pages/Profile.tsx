import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  BookmarksSimple,
  Heart,
  MapPin,
  CalendarBlank,
  Gear,
  ShareNetwork,
  Eye,
  ChatCircle,
  Plus,
  ChartBar,
  Ticket
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MovieCard } from '../components/custom/movie-card';
import { ProfileReviewCard } from '../components/custom/profile-review-card';
import { FeedCard } from '../components/custom/feed-card';
import { MOCK_USERS, MOCK_MOVIES } from '../mocks';
import { MOCK_FEED_ACTIVITIES } from '../mocks/feed';
import { MOCK_CINEMA_PASSPORT } from '../mocks/cinema-passport';
import { MOCK_MOVIE_LISTS } from '../mocks/lists';
import { CinemaPassportCard } from '../components/custom/cinema-passport-card';
import { MovieListCard } from '../components/custom/movie-list-card';
import { ProfileSessionDiary } from '../components/custom/profile-session-diary';
import { SectionHeading } from '../components/custom/section-heading';

type ProfileTab = 'diary' | 'posts' | 'watched' | 'passport' | 'reviews' | 'lists';

export function Profile() {
  const { username } = useParams<{ username: string }>();

  // Load user by username param, or fallback to main profile user
  const user = (username ? MOCK_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase()) : undefined) || MOCK_USERS[0];
  const isOwnProfile = !username || username.toLowerCase() === 'lothrik' || username.toLowerCase() === 'uander';

  const [activeTab, setActiveTab] = useState<ProfileTab>('diary');
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);

  // Favorite 4 movies (Letterboxd style)
  const favoriteMovies = useMemo(() => {
    const ids = user.favorite_movie_ids || ['speed-racer', 'chainsaw-man', 'raw', 'phantom-of-the-paradise'];
    return ids.map((id) => MOCK_MOVIES.find((m) => m.id === id)).filter(Boolean);
  }, [user]);

  // Watched movies
  const watchedMovies = MOCK_MOVIES.slice(0, 8);
  const userMovieLists = MOCK_MOVIE_LISTS.filter(
    (list) => list.author_username.toLowerCase() === user.username.toLowerCase()
  );

  // Feed posts for this user
  const userPosts = useMemo(() => {
    const posts = MOCK_FEED_ACTIVITIES.filter((p) => {
      const handleClean = p.handle?.replace('@', '').toLowerCase();
      return handleClean === user.username.toLowerCase() || p.name.toLowerCase() === user.name.toLowerCase();
    });

    if (posts.length === 0) {
      // Fallback: Show user's activity card
      return [
        {
          id: `feed-user-${user.id}`,
          type: 'review' as const,
          name: user.name,
          handle: `@${user.username}`,
          avatarUrl: user.avatar_url,
          timeAgo: 'há 2 horas',
          actionText: 'avaliou Speed Racer',
          rating: 5,
          content: 'Speed Racer continua a maior aula de cinema pop maximalista do século! A experiência no IMAX é incomparável.',
          embeddedMovie: {
            title: 'Speed Racer',
            posterUrl: MOCK_MOVIES[0].poster_url,
            director: 'Lana & Lilly Wachowski',
            detailsLine: 'Ação • 2008 • 2h15',
          },
          likesCount: 38,
          commentsCount: 6,
          repostsCount: 3,
          isLikedInitial: true,
        },
      ];
    }
    return posts;
  }, [user]);

  const handleFollowToggle = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      toast.success(next ? `Você começou a seguir @${user.username}!` : `Você deixou de seguir @${user.username}`);
      return next;
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link do perfil copiado para a área de transferência!');
    }
  };

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. USER PROFILE HEADER ─── */}
      <section className="bg-background px-4 sm:px-0 py-8">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-foreground shadow-[4px_4px_0px_0px_var(--border)] overflow-hidden shrink-0 bg-muted">
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {user.name}
                  </h1>
                  <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-0.5 border border-primary/30">
                    PRO CINÉFILO
                  </span>
                </div>

                <span className="text-xs font-mono font-bold text-foreground/50 block">
                  @{user.username}
                </span>

                {user.location && (
                  <div className="flex items-center gap-1.5 text-xs text-foreground/70 font-sans">
                    <MapPin size={14} weight="bold" className="text-primary shrink-0" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              {isOwnProfile ? (
                <>
                  <Link
                    to="/feed"
                    className="px-4 py-2 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={16} weight="bold" />
                    <span>Novo Post no Feed</span>
                  </Link>

                  <Link
                    to="/profile/settings"
                    className="px-4 py-2 bg-background hover:bg-muted border-2 border-foreground text-foreground font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Gear size={16} weight="bold" />
                    <span>Editar</span>
                  </Link>
                  <Link
                    to="/profile/stats"
                    className="flex items-center gap-1.5 border-2 border-foreground bg-background px-4 py-2 text-xs font-black uppercase tracking-wider text-foreground shadow-[2px_2px_0px_0px_var(--border)] transition-colors hover:bg-muted"
                  >
                    <ChartBar size={16} weight="bold" />
                    <span>Estatísticas</span>
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  className={`px-5 py-2 font-black text-xs uppercase tracking-wider border-2 shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
                    isFollowing
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-foreground hover:bg-muted'
                  }`}
                >
                  <Heart size={16} weight={isFollowing ? 'fill' : 'regular'} />
                  <span>{isFollowing ? 'Seguindo' : 'Seguir'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="p-2 border-2 border-foreground/40 hover:bg-muted text-foreground cursor-pointer shadow-[2px_2px_0px_0px_var(--border)]"
                title="Compartilhar Perfil"
              >
                <ShareNetwork size={18} weight="bold" />
              </button>
            </div>

          </div>

          {/* User Bio */}
          {user.bio && (
            <p className="font-sans text-xs sm:text-sm text-foreground/80 max-w-3xl leading-relaxed border-l-4 border-primary pl-3">
              "{user.bio}"
            </p>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 ">
            {[
              { label: 'Filmes Assistidos', value: user.watched_count || 142 },
              { label: 'Reviews Postadas', value: user.reviews_count || 34 },
              { label: 'Listas Criadas', value: user.lists_count || 4 },
              { label: 'Seguidores', value: user.followers_count || 215 },
              { label: 'Seguindo', value: user.following_count || 180 },
            ].map((st) => (
              <div key={st.label} className="p-3 bg-muted/20 border border-foreground/20 text-center space-y-0.5">
                <span className="font-display text-xl font-black text-foreground block">
                  {st.value}
                </span>
                <span className="text-[10px] font-black uppercase text-foreground/60 tracking-wider block">
                  {st.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── 2. FAVORITE 4 MOVIES (LETTERBOXD ROW) ─── */}
      <section className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 pt-4 space-y-4">
        <SectionHeading title="Filmes Favoritos" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {favoriteMovies.map((movie) => movie && (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              posterUrl={movie.poster_url}
              rating={movie.global_rating}
              duration={movie.duration_display}
              genre={movie.genres[0] || 'DRAMA'}
              ageRating={movie.age_rating}
              tagType="none"
              linkTo={`/movies/${movie.id}`}
            />
          ))}
        </div>
      </section>

      {/* ─── 3. TABS & PROFILE CONTENT ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 pt-10 space-y-6">
        
        {/* Tab Controls Bar */}
        <div className="flex items-center gap-2 border-b-2 border-foreground/20 pb-2 overflow-x-auto scrollbar-none">
          
          <button
            type="button"
            onClick={() => setActiveTab('diary')}
            className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
              activeTab === 'diary'
                ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            <CalendarBlank size={16} weight="bold" />
            <span>Diário</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
              activeTab === 'posts'
                ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            <ChatCircle size={16} weight="bold" />
            <span>Posts do Feed ({userPosts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('watched')}
            className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
              activeTab === 'watched'
                ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            <Eye size={16} weight="bold" />
            <span>Assistidos ({watchedMovies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            <Star size={16} weight="bold" />
            <span>Reviews</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('passport')}
            className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
              activeTab === 'passport'
                ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            <Ticket size={16} weight="bold" />
            <span>Passaporte ({MOCK_CINEMA_PASSPORT.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lists')}
            className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
              activeTab === 'lists'
                ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            <BookmarksSimple size={16} weight="bold" />
            <span>Listas ({userMovieLists.length})</span>
          </button>
        </div>

        {/* ─── TAB CONTENT 1: DIARY / LOGS ─── */}
        {activeTab === 'diary' && (
          <ProfileSessionDiary entries={[
            { movie: MOCK_MOVIES[0], watchedAt: '2026-08-20', rating: 5.0, liked: true, rewatch: false, hasReview: true },
            { movie: MOCK_MOVIES[1], watchedAt: '2026-08-15', rating: 4.8, liked: true, rewatch: false, hasReview: true },
            { movie: MOCK_MOVIES[4], watchedAt: '2026-08-02', rating: 4.5, liked: false, rewatch: true, hasReview: false },
          ]} />
        )}
        {/* ─── TAB CONTENT 2: POSTS & FEED (CONECTADO COM O FEED SOCIAL) ─── */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="space-y-5">
              {userPosts.map((post) => (
                <FeedCard key={post.id} {...post} />
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 3: WATCHED MOVIES GRID ─── */}
        {activeTab === 'watched' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {watchedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                posterUrl={movie.poster_url}
                rating={movie.global_rating}
                duration={movie.duration_display}
                genre={movie.genres[0] || 'DRAMA'}
                ageRating={movie.age_rating}
                tagType="none"
                linkTo={`/movies/${movie.id}`}
              />
            ))}
          </div>
        )}

        {/* ─── TAB CONTENT 4: REVIEWS ─── */}
        {activeTab === 'passport' && (
          <section className="space-y-6">
            <div className="grid grid-cols-2 items-start gap-4 md:grid-cols-3 xl:grid-cols-4">
              {MOCK_CINEMA_PASSPORT.map((ticket) => (
                <CinemaPassportCard
                  key={ticket.id}
                  {...ticket}
                  palette="poster"
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <ProfileReviewCard
              dateLabel="Hoje"
              movie={MOCK_MOVIES[0]}
              rating={5}
              reviewText="Uma das maiores experiências audiovisuais da história do cinema! A trilha sonora e o ritmo de corrida na Casa Cristo 5000 não deixam você respirar por um segundo."
              likesCount={64}
              commentsCount={12}
            />
            <ProfileReviewCard
              dateLabel="15 AGO"
              movie={MOCK_MOVIES[1]}
              rating={4}
              hasSpoiler={true}
              reviewText="A cena do confronto no porto e a revelação do passado da Reze trazem uma carga emocional devastadora que supera até o mangá original."
              likesCount={42}
              commentsCount={7}
            />
          </div>
        )}

        {/* ─── TAB CONTENT 5: LISTS ─── */}
        {activeTab === 'lists' && (
          <div className="space-y-4">
            {userMovieLists.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {userMovieLists.map((list) => <MovieListCard key={list.id} list={list} showAuthor={false} />)}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-foreground/60">Este perfil ainda não publicou listas.</p>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
