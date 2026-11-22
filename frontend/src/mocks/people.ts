import type { Person } from '../types/movie';

export interface PersonWithRole extends Person {
  role_display: string; // e.g. "Diretora & Roteirista", "Ator"
  known_for: string; // e.g. "Speed Racer, Matrix"
  movies_count: number;
  biography: string;
  birth_date?: string;
  birth_place?: string;
  country: string; // e.g. "🇺🇸 EUA"
  followers_count: number;
  favorites_count: number;
  movie_ids: string[];
}

export const MOCK_PEOPLE: PersonWithRole[] = [
  {
    id: 501,
    name: 'Emile Hirsch',
    initials: 'EH',
    role_display: 'Ator',
    known_for: 'Speed Racer, Into the Wild, Milk',
    movies_count: 8,
    country: '🇺🇸 EUA',
    followers_count: 48,
    favorites_count: 14,
    birth_date: '13 de Março de 1985 (41 anos)',
    birth_place: 'Los Angeles, Califórnia, EUA',
    biography:
      'Emile Hirsch é um aclamado ator norte-americano conhecido por sua intensidade dramática e performances físicas marcantes. Ganhou destaque internacional ao protagonizar Into the Wild (2007) dirigido por Sean Penn, e em seguida deu vida ao icônico piloto no cultuado Speed Racer (2008) das irmãs Wachowski.',
    movie_ids: ['speed-racer'],
    profile_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 502,
    name: 'Christina Ricci',
    initials: 'CR',
    role_display: 'Atriz',
    known_for: 'Speed Racer, A Família Addams, Yellowjackets',
    movies_count: 14,
    country: '🇺🇸 EUA',
    followers_count: 92,
    favorites_count: 31,
    birth_date: '12 de Fevereiro de 1980 (46 anos)',
    birth_place: 'Santa Monica, Califórnia, EUA',
    biography:
      'Christina Ricci iniciou sua carreira no cinema ainda criança, marcando época como Wandinha Addams nos clássicos dos anos 90. Em Speed Racer (2008), interpretou Trixie com carisma eletrizante e ação arrojada, consolidando uma filmografia diversa entre produções autorais e grandes blockbusters.',
    movie_ids: ['speed-racer'],
    profile_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 503,
    name: 'Lana Wachowski',
    initials: 'LW',
    role_display: 'Diretora & Roteirista',
    known_for: 'Speed Racer, Matrix, Sense8, Cloud Atlas',
    movies_count: 9,
    country: '🇺🇸 EUA',
    followers_count: 184,
    favorites_count: 85,
    birth_date: '21 de Junho de 1965 (61 anos)',
    birth_place: 'Chicago, Illinois, EUA',
    biography:
      'Lana Wachowski é uma cineasta visionária norte-americana, responsável por revolucionar a linguagem cinematográfica moderna com a trilogia Matrix e a obra-prima hiperestilizada Speed Racer. Seu trabalho é célebre pelo uso pioneiro de efeitos visuais, profundidade temática filosófica e ritmo frenético.',
    movie_ids: ['speed-racer'],
    profile_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 504,
    name: 'Lilly Wachowski',
    initials: 'LW',
    role_display: 'Diretora & Roteirista',
    known_for: 'Speed Racer, Matrix, Bound, V de Vingança',
    movies_count: 8,
    country: '🇺🇸 EUA',
    followers_count: 172,
    favorites_count: 79,
    birth_date: '29 de Dezembro de 1967 (58 anos)',
    birth_place: 'Chicago, Illinois, EUA',
    biography:
      'Lilly Wachowski co-criou algumas das franquias e universos mais influentes da história da cultura pop mundial. Conhecida pela sensibilidade narrativa e ousadia estética, suas colaborações com Lana definiram o cinema de ação e ficção científica do século XXI.',
    movie_ids: ['speed-racer'],
    profile_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 601,
    name: 'Denis Villeneuve',
    initials: 'DV',
    role_display: 'Diretor',
    known_for: 'Duna, Blade Runner 2049, A Chegada, Sicario',
    movies_count: 11,
    country: '🇨🇦 Canadá',
    followers_count: 312,
    favorites_count: 145,
    birth_date: '03 de Outubro de 1967 (58 anos)',
    birth_place: 'Gentilly, Bécancour, Canadá',
    biography:
      'Denis Villeneuve é um dos diretores mais prestigiados do cinema contemporâneo. Mestre da atmosfera densa e da escala monumental, comandou sucessos épicos como Duna: Parte 1 e Parte 2, Blade Runner 2049 e A Chegada, acumulando dezenas de prêmios e aclamação universal.',
    movie_ids: ['dune-part-two'],
    profile_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 602,
    name: 'Tatsuki Fujimoto',
    initials: 'TF',
    role_display: 'Autor & Mangaká',
    known_for: 'Chainsaw Man, Look Back, Fire Punch, Goodbye Eri',
    movies_count: 4,
    country: '🇯🇵 Japão',
    followers_count: 245,
    favorites_count: 118,
    birth_date: '10 de Outubro de 1992 (33 anos)',
    birth_place: 'Nikaho, Akita, Japão',
    biography:
      'Tatsuki Fujimoto é um dos criadores mais originais e aclamados da cena contemporânea japonesa. Conhecido por seu estilo imprevisível, humor ácido e forte cinefilia evidente em cada quadro de Chainsaw Man e Look Back.',
    movie_ids: ['chainsaw-man'],
    profile_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 603,
    name: 'Julia Ducournau',
    initials: 'JD',
    role_display: 'Diretora & Roteirista',
    known_for: 'Raw (Grave), Titane',
    movies_count: 3,
    country: '🇫🇷 França',
    followers_count: 98,
    favorites_count: 52,
    birth_date: '18 de Novembro de 1983 (42 anos)',
    birth_place: 'Paris, França',
    biography:
      'Julia Ducournau é uma cineasta e roteirista francesa vencedora da Palma de Ouro no Festival de Cannes por Titane (2021). Seu longa de estreia, Raw (Grave), chocou e encantou o circuito de festivais ao explorar o body horror com elegância psicológica.',
    movie_ids: ['raw'],
    profile_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 604,
    name: 'Brian De Palma',
    initials: 'BP',
    role_display: 'Diretor & Roteirista',
    known_for: 'Phantom of the Paradise, Scarface, Carrie, Os Intocáveis',
    movies_count: 22,
    country: '🇺🇸 EUA',
    followers_count: 165,
    favorites_count: 67,
    birth_date: '11 de Setembro de 1940 (85 anos)',
    birth_place: 'Newark, Nova Jersey, EUA',
    biography:
      'Brian De Palma é um mestre consagrado da Nova Hollywood, famoso por planos-sequência virtuosísticos, suspense hitchcockiano e o clássico operístico cult Phantom of the Paradise (1974).',
    movie_ids: ['phantom-of-the-paradise'],
    profile_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 605,
    name: 'Dario Argento',
    initials: 'DA',
    role_display: 'Diretor',
    known_for: 'Suspiria, Opera, The Stendhal Syndrome, Prelúdio Para Matar',
    movies_count: 19,
    country: '🇮🇹 Itália',
    followers_count: 210,
    favorites_count: 94,
    birth_date: '07 de Setembro de 1940 (85 anos)',
    birth_place: 'Roma, Itália',
    biography:
      'Dario Argento é o ícone absoluto do Giallo e do terror estilizado italiano. Suas obras são marcadas por iluminação expressionista colorida, trilhas sonoras progressivas do grupo Goblin e atmosfera de pesadelo visual.',
    movie_ids: ['opera', 'the-stendhal-syndrome'],
    profile_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  },
];

export const getPersonById = (id: string | number): PersonWithRole | undefined => {
  return MOCK_PEOPLE.find((p) => p.id === Number(id) || p.name.toLowerCase() === String(id).toLowerCase());
};
