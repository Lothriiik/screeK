import type { FeedCardProps } from '../components/custom/feed-card';
import type { CommentRowProps } from '../components/custom/comment-row';
import posterAngelDust from '../assets/posters/29389-angel-dust-0-1000-0-1500-crop.jpg';
import posterChainsawMan from '../assets/posters/1102673-chainsaw-man-the-movie-reze-arc-0-1000-0-1500-crop.jpg';
import posterDune from '../assets/posters/6vblWscFAbIm9V5CwHC7IImgAq9-0-1000-0-1500-crop.jpg';
import posterRaw from '../assets/posters/327974-raw-0-1000-0-1500-crop.jpg';
import posterPhantom from '../assets/posters/34615-phantom-of-the-paradise-0-1000-0-1500-crop.jpg';

export interface FeedPostDetail extends FeedCardProps {
  commentsList?: CommentRowProps[];
}

export const MOCK_FEED_ACTIVITIES: FeedPostDetail[] = [
  // 1. Review with Comment (Standard Review Film Row)
  {
    id: 'feed-1',
    type: 'review',
    name: 'Beatriz Lima',
    handle: '@beatrizl',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    timeAgo: 'há 15 minutos',
    actionText: 'avaliou Speed Racer',
    rating: 5,
    content:
      'Uma das maiores experiências audiovisuais da história do cinema! A trilha sonora e o ritmo de corrida na Casa Cristo 5000 não deixam você respirar por um segundo. As Wachowski estavam 20 anos no futuro.',
    embeddedMovie: {
      title: 'Speed Racer',
      posterUrl: posterAngelDust,
      director: 'Lana & Lilly Wachowski',
      detailsLine: 'Ação • 2008 • 2h15',
    },
    likesCount: 64,
    commentsCount: 2,
    repostsCount: 5,
    isLikedInitial: true,
    commentsList: [
      {
        name: 'Lothrik Junior',
        handle: '@lothrik',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        timeAgo: 'há 10 min',
        commentText: 'A montagem paralela da corrida final com o flashback do Rex Racer é cinema absoluto!',
        likesCount: 14,
        commentsCount: 2,
        isLikedInitial: true,
      },
      {
        name: 'Clara Miranda',
        handle: '@claramiranda',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        timeAgo: 'há 5 min',
        commentText: 'Totalmente incompreendido em 2008. Hoje em dia é consagrado obra-prima cult.',
        likesCount: 9,
        commentsCount: 0,
        isLikedInitial: false,
      },
    ],
  },

  // 2. Review Film Row with Spoiler
  {
    id: 'feed-2-spoiler',
    type: 'review',
    name: 'Henrique Farias',
    handle: '@henriquef',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    timeAgo: 'há 45 minutos',
    actionText: 'avaliou Chainsaw Man – Reze Arc',
    rating: 5,
    hasSpoiler: true,
    content:
      '[CONTÉM SPOILER] A cena do confronto no porto e a revelação do passado da Reze trazem uma carga emocional devastadora que supera até o mangá. O desfecho na cafeteria foi de partir o coração.',
    embeddedMovie: {
      title: 'Chainsaw Man – Reze Arc',
      posterUrl: posterChainsawMan,
      director: 'Tatsuya Yoshihara',
      detailsLine: 'Animação • 2025 • 1h39',
    },
    likesCount: 52,
    commentsCount: 1,
    repostsCount: 4,
    isLikedInitial: false,
    commentsList: [
      {
        name: 'Beatriz Lima',
        handle: '@beatrizl',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        timeAgo: 'há 20 min',
        commentText: 'Chorei muito nessa cena do porto. A direção de arte foi impecável.',
        likesCount: 8,
        commentsCount: 1,
        isLikedInitial: true,
      },
    ],
  },

  // 3. Repost Session (Shared Upcoming Ticket / Room / Date / Badges)
  {
    id: 'feed-3',
    type: 'session',
    name: 'Lothrik Junior',
    handle: '@lothrik',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    timeAgo: 'há 1 hora',
    actionText: 'garantiu ingresso para uma sessão',
    content: 'Bora colar galera! Comprei poltrona C8 no IMAX do Bourbon pra sábado à noite. Quem mais vai?',
    sharedSession: {
      title: 'Chainsaw Man – Reze Arc',
      posterUrl: posterChainsawMan,
      ageRating: '16',
      detailsLine: 'Animação • 2025 • 1h39',
      cinemaAndRoom: 'Cinemark Bourbon Shopping • Sala 4',
      dateLabel: 'SÁB 22/08',
      time: '20:15',
      audioFormat: 'LEG',
      screenFormat: 'IMAX',
    },
    likesCount: 29,
    commentsCount: 1,
    repostsCount: 2,
    isLikedInitial: false,
    commentsList: [
      {
        name: 'Marcos Vinícius',
        handle: '@marcos_cinema',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        timeAgo: 'há 40 min',
        commentText: 'Peguei a C9 do seu lado! Nos vemos lá.',
        likesCount: 5,
        commentsCount: 0,
        isLikedInitial: true,
      },
    ],
  },

  // 4. Feed Cards - Review Repost with Comment (Quote Repost)
  {
    id: 'feed-4',
    type: 'repost_with_comment',
    name: 'Marcos Vinícius',
    handle: '@marcos_cinema',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    timeAgo: 'há 2 horas',
    actionText: 'comentou no repost',
    content: 'Brian De Palma em seu estado mais puro e barroco! Phantom of the Paradise precisa ser redescoberto por todo mundo.',
    quotedReview: {
      id: 'feed-1',
      name: 'Beatriz Lima',
      actionText: 'avaliou Phantom of the Paradise',
      timeAgo: 'ontem',
      rating: 4.5,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      content: 'A trilha sonora do Paul Williams é um primor do rock progressivo glam dos anos 70.',
    },
    embeddedMovie: {
      title: 'Phantom of the Paradise',
      posterUrl: posterPhantom,
      director: 'Brian De Palma',
      detailsLine: 'Musical • 1974 • 1h32',
    },
    likesCount: 31,
    commentsCount: 0,
    repostsCount: 3,
    isLikedInitial: false,
  },

  // 5. Feed Cards - Review Repost Only (Straight Retweet)
  {
    id: 'feed-5-repost-only',
    type: 'repost_only',
    name: 'Camila Rocha',
    handle: '@camilacine',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    timeAgo: 'há 3 horas',
    repostHeaderText: 'repostou uma review de @gabriels',
    rating: 5,
    content:
      'A escala sonora de Duna II no cinema é algo que não se repete tão cedo. Cada segundo da sequência dos vermes de areia arrepia até a alma.',
    embeddedMovie: {
      title: 'Duna: Parte 2',
      posterUrl: posterDune,
      director: 'Denis Villeneuve',
      detailsLine: 'Sci-Fi • 2024 • 2h46',
    },
    likesCount: 88,
    commentsCount: 0,
    repostsCount: 9,
    isLikedInitial: true,
  },

  // 6. Feed Cards - Rated (User rated a film)
  {
    id: 'feed-6-rated',
    type: 'rated',
    name: 'Lothrik Junior',
    handle: '@lothrik',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    timeAgo: 'há 5 horas',
    actionText: 'deu nota para Raw (Grave)',
    rating: 4.5,
    embeddedMovie: {
      title: 'Raw (Grave)',
      posterUrl: posterRaw,
      director: 'Julia Ducournau',
      detailsLine: 'Terror • 2016 • 1h39',
    },
    likesCount: 18,
    commentsCount: 0,
    repostsCount: 1,
    isLikedInitial: false,
  },

  // 7. Feed Cards - Watched (User logged film into diary)
  {
    id: 'feed-7-watched',
    type: 'watched',
    name: 'Gabriel Souza',
    handle: '@gabriels',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    timeAgo: 'há 7 horas',
    actionText: 'marcou como assistido no Diário',
    embeddedMovie: {
      title: 'Raw (Grave)',
      posterUrl: posterRaw,
      director: 'Julia Ducournau',
      detailsLine: 'Terror • 2016 • 1h39',
    },
    likesCount: 25,
    commentsCount: 0,
    repostsCount: 0,
    isLikedInitial: true,
  },
];
