-- Database schema for the Billobattlezone project

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments Table
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches Table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    tournament_id INT REFERENCES tournaments(id),
    player1_id INT REFERENCES users(id),
    player2_id INT REFERENCES users(id),
    match_time TIMESTAMP NOT NULL,
    result VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit Factory Table
CREATE TABLE credit_factory (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    credits INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telegram Users Table
CREATE TABLE telegram_users (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    telegram_id VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Statistics Table
CREATE TABLE statistics (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    matches_played INT DEFAULT 0,
    tournaments_won INT DEFAULT 0,
    credits_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance on foreign key columns
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX idx_statistics_user_id ON statistics(user_id);


