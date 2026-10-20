-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'player'
);

-- Create game_status enum type
DO $$ BEGIN
    CREATE TYPE game_status AS ENUM ('active', 'finished');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_score INTEGER DEFAULT 0,
    status game_status NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent seeding
DO $$
DECLARE
    slayman1_id UUID;
    Big_Ajuin_id UUID;
    Sanguinius_id UUID;
    Wooly_Ruler_id UUID;
    admin_id UUID;
BEGIN
    -- Insert dummy users if they don't exist
    -- Note: admin password is 'admin123'
    INSERT INTO users (username, password_hash, role) VALUES 
    ('slayman1', 'dummyhash1', 'player'),
    ('Big_Ajuin', 'dummyhash2', 'player'),
    ('Sanguinius', 'dummyhash3', 'player'),
    ('Wooly_Ruler', 'dummyhash3', 'player'),
    ('admin', '$2a$10$zEng5cHBYKweDqQzBNfqjuz/uOQ/gv1Ig39ACPqk/ohvOXQ6p9bHG', 'admin') 
    ON CONFLICT (username) DO NOTHING;

    -- Get IDs
    SELECT id INTO slayman1_id FROM users WHERE username = 'slayman1';
    SELECT id INTO Big_Ajuin_id FROM users WHERE username = 'Big_Ajuin';
    SELECT id INTO Sanguinius_id FROM users WHERE username = 'Sanguinius';
    SELECT id INTO Wooly_Ruler_id FROM users WHERE username = 'Wooly_Ruler';
    SELECT id INTO admin_id FROM users WHERE username = 'admin';

    -- Insert dummy games if games table is empty
    IF NOT EXISTS (SELECT 1 FROM games) THEN
        INSERT INTO games (user_id, current_score, status) VALUES 
        (slayman1_id, 9, 'finished'),
        (Big_Ajuin_id, 6, 'finished'),
        (Sanguinius_id, 3, 'finished'),
        (Wooly_Ruler_id, 5, 'finished');
    END IF;
END $$;

-- Grant privileges to rps_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rps_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rps_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rps_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rps_user;
