import React from 'react';
import { Link } from 'react-router-dom';
import {
  CaretRight,
  ChatCircle,
  FilmStrip,
  Heart,
  ListBullets,
  Star,
  Users,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../stores/authStore';
import { MOCK_MOVIES } from '../../mocks';
import { MOCK_FEED_ACTIVITIES } from '../../mocks/feed';
import { MOCK_MOVIE_LISTS } from '../../mocks/lists';
import { MOCK_USERS } from '../../mocks/users';
import { MovieListCard } from './movie-list-card';
import { SectionHeading } from './section-heading';

export const CommunitySection: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  const reviews = MOCK_FEED_ACTIVITIES.filter((a) => a.type === 'review').slice(0, 3);
  const popularLists = MOCK_MOVIE_LISTS.slice(0, 4);
  const featuredUsers = MOCK_USERS.slice(0, 4);

  return (
    <div className="space-y-12 font-display">
      {/* 1. "Faça Parte" Callout (se não autenticado) — mesma linguagem brutalista do site */}
      {!isAuthenticated && (
        <div className="bg-background border-4 border-foreground/40 p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--border)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-foreground/30 pb-3 gap-3">
            <div>
              <span className="inline-block bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-widest mb-2">
                FAÇA PARTE DO SCREEK
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-primary">
                Guarde seus filmes. Descubra os próximos.
              </h2>
              <p className="text-xs sm:text-sm font-sans font-medium max-w-2xl text-foreground/75 mt-1">
                Catálogo cinematográfico, sessões em cartaz e comunidade cinéfila reunidos no mesmo lugar.
              </p>
            </div>

            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-foreground px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--border)] transition-all shrink-0 self-start sm:self-auto"
            >
              <span>Criar Conta</span>
              <CaretRight size={13} weight="bold" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-background border-2 border-foreground/40 space-y-1.5">
              <FilmStrip size={22} weight="bold" className="text-primary" />
              <h3 className="font-extrabold text-xs sm:text-sm uppercase text-foreground">
                Registre seus filmes
              </h3>
              <p className="text-xs font-sans text-foreground/70 leading-relaxed">
                Marque o que assistiu, monte seu diário e compartilhe com amigos.
              </p>
            </div>

            <div className="p-4 bg-background border-2 border-foreground/40 space-y-1.5">
              <Star size={22} weight="bold" className="text-primary" />
              <h3 className="font-extrabold text-xs sm:text-sm uppercase text-foreground">
                Avalie e escreva
              </h3>
              <p className="text-xs font-sans text-foreground/70 leading-relaxed">
                Dê notas, elabore resenhas e debata cada cena com cinéfilos.
              </p>
            </div>

            <div className="p-4 bg-background border-2 border-foreground/40 space-y-1.5">
              <ListBullets size={22} weight="bold" className="text-primary" />
              <h3 className="font-extrabold text-xs sm:text-sm uppercase text-foreground">
                Crie suas listas
              </h3>
              <p className="text-xs font-sans text-foreground/70 leading-relaxed">
                Organize seleções temáticas com tags, rankings e capas exclusivas.
              </p>
            </div>

            <div className="p-4 bg-background border-2 border-foreground/40 space-y-1.5">
              <Users size={22} weight="bold" className="text-primary" />
              <h3 className="font-extrabold text-xs sm:text-sm uppercase text-foreground">
                Acompanhe a comunidade
              </h3>
              <p className="text-xs font-sans text-foreground/70 leading-relaxed">
                Siga diretores, atores e usuários e veja o que está em alta.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Grid de Conteúdo: Análises Populares da Semana + Listas Populares */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Esquerda: Análises Populares da Semana (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <SectionHeading level="h2" titleClassName="text-xl sm:text-2xl font-black uppercase tracking-tight text-primary" title={<>Análises Populares da Semana</>} titleAction={<Link
                to="/feed"
                className="text-xs sm:text-sm font-black uppercase text-foreground/80 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Ver Todas</span>
                <CaretRight size={12} weight="bold" className="self-center" />
              </Link>} />

          <div className="space-y-4">
            {reviews.map((rev) => {
              const matchedMovie = MOCK_MOVIES.find(
                (m) => m.title.toLowerCase() === rev.embeddedMovie?.title.toLowerCase()
              );
              const releaseYear =
                matchedMovie?.release_year ||
                rev.embeddedMovie?.detailsLine?.split('·')[1]?.trim() ||
                rev.embeddedMovie?.detailsLine?.split('•')[1]?.trim();

              return (
                <Link
                  key={rev.id}
                  to={`/feed/${rev.id}`}
                  className="group block p-4 bg-background border-4 border-foreground/40 hover:border-primary shadow-[4px_4px_0px_0px_var(--border)] transition-all hover:-translate-y-0.5"
                >
                  <div className="flex gap-4">
                    {/* Poster (mesma borda do MovieCard / FeedCard) */}
                    {rev.embeddedMovie?.posterUrl && (
                      <div className="shrink-0 w-16 sm:w-20 aspect-[2/3] border-2 border-foreground/40 bg-foreground/10 overflow-hidden">
                        <img
                          src={rev.embeddedMovie.posterUrl}
                          alt={rev.embeddedMovie.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Conteúdo da Análise */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                      <div className="space-y-1.5">
                        {/* Autor + Estrelas */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={rev.avatarUrl}
                              alt={rev.name}
                              className="w-7 h-7 object-cover border-2 border-foreground/40 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs sm:text-sm font-black text-foreground truncate">
                                  {rev.name}
                                </span>
                                <span className="text-[11px] font-bold text-foreground/50 truncate">
                                  {rev.handle}
                                </span>
                              </div>
                              <span className="block text-[10px] font-bold text-foreground/40">
                                {rev.timeAgo}
                              </span>
                            </div>
                          </div>

                          {rev.rating !== undefined && (
                            <div className="flex items-center gap-0.5 text-secondary shrink-0">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  weight={star <= rev.rating! ? 'fill' : 'bold'}
                                  className={
                                    star <= rev.rating! ? 'text-secondary' : 'text-foreground/25'
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Filme analisado */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-xs sm:text-sm uppercase text-foreground group-hover:text-primary transition-colors">
                            {rev.embeddedMovie?.title}
                          </h3>
                          {releaseYear && (
                            <span className="border border-foreground/40 bg-foreground/10 px-1.5 py-0.5 text-[10px] font-extrabold text-foreground uppercase">
                              {releaseYear}
                            </span>
                          )}
                        </div>

                        {/* Texto */}
                        <p className="text-xs font-sans font-medium text-foreground/80 line-clamp-2 leading-relaxed">
                          {rev.content}
                        </p>
                      </div>

                      {/* Rodapé de interações */}
                      <div className="flex items-center justify-between border-t-2 border-foreground/20 pt-2 text-xs font-black">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-secondary">
                            <Heart size={15} weight="fill" />
                            <span>{rev.likesCount}</span>
                          </span>
                          <span className="flex items-center gap-1 text-foreground/60">
                            <ChatCircle size={15} weight="bold" />
                            <span>{rev.commentsCount}</span>
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-foreground/60 group-hover:text-primary flex items-center gap-1 transition-colors">
                          Ler análise
                          <CaretRight size={11} weight="bold" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Listas Populares + Cinéfilos em Destaque (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Listas Populares */}
          <div className="space-y-4">
            <SectionHeading level="h2" titleClassName="text-xl sm:text-2xl font-black uppercase tracking-tight text-primary" title={<>Listas Populares</>} titleAction={<Link
                  to="/lists"
                  className="text-xs sm:text-sm font-black uppercase text-foreground/80 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Ver Todas</span>
                  <CaretRight size={12} weight="bold" className="self-center" />
                </Link>} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {popularLists.map((list) => <MovieListCard key={list.id} list={list} />)}
            </div>
          </div>

          {/* Cinéfilos em Destaque */}
          <div className="space-y-4">
            <SectionHeading level="h3" titleClassName="text-lg sm:text-xl font-black uppercase tracking-tight text-primary" title={<>Cinéfilos em Destaque</>} titleAction={<Link
                  to="/search"
                  className="text-xs font-black uppercase text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>Explorar</span>
                  <CaretRight size={12} weight="bold" className="self-center" />
                </Link>} />

            <div className="p-4 bg-background border-4 border-foreground/40 shadow-[4px_4px_0px_0px_var(--border)] space-y-3">
              {featuredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 pb-2.5 last:pb-0 border-b border-foreground/15 last:border-b-0"
                >
                  <Link
                    to={`/users/${user.username}`}
                    className="flex items-center gap-2.5 group min-w-0"
                  >
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-9 w-9 object-cover border-2 border-foreground/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-extrabold uppercase text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {user.name}
                      </p>
                      <p className="text-[10px] font-bold text-foreground/55">
                        {user.watched_count} filmes assistidos
                      </p>
                    </div>
                  </Link>

                  <Link
                    to={`/users/${user.username}`}
                    className="text-[10px] font-black uppercase px-2.5 py-1 border-2 border-foreground bg-foreground/80 text-background hover:bg-primary transition-all shadow-[2px_2px_0px_0px_var(--border)] shrink-0"
                  >
                    Ver Perfil
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
