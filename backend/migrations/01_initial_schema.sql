-- Initial Schema for Cine-Pass (Exported from GORM models)
-- Date: 2026-04-01

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'USER',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    overview TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    release_date DATE,
    vote_average FLOAT,
    runtime INTEGER,
    status VARCHAR(50),
    tagline TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

CREATE TABLE IF NOT EXISTS cinemas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    cinema_id INTEGER REFERENCES cinemas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    type VARCHAR(50) DEFAULT 'STANDARD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    row VARCHAR(10) NOT NULL,
    number INTEGER NOT NULL,
    type VARCHAR(50) DEFAULT 'STANDARD',
    pos_x INTEGER,
    pos_y INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id),
    room_id INTEGER REFERENCES rooms(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price INTEGER NOT NULL,
    session_type VARCHAR(50),
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    total_amount INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tx_payment_id ON transactions(payment_id);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id),
    seat_id INTEGER REFERENCES seats(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20),
    price_paid INTEGER,
    qr_code TEXT UNIQUE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    movie_id INTEGER REFERENCES movies(id),
    rating FLOAT CHECK (rating >= 0 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlists (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS daily_cinema_stats (
    date DATE,
    cinema_id INTEGER REFERENCES cinemas(id),
    total_revenue INTEGER,
    tickets_sold INTEGER,
    occupancy_rate FLOAT,
    PRIMARY KEY (date, cinema_id)
);

CREATE TABLE IF NOT EXISTS daily_movie_stats (
    date DATE,
    movie_id INTEGER REFERENCES movies(id),
    total_revenue INTEGER,
    tickets_sold INTEGER,
    PRIMARY KEY (date, movie_id)
);
