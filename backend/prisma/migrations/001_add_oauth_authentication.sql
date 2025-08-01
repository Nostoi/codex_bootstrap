-- OAuth2 Authentication Schema Migration
-- Adds support for Google and Microsoft OAuth providers with secure session management

-- OAuth provider information for users
CREATE TABLE oauth_providers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
    provider_id TEXT NOT NULL, -- OAuth provider's user ID
    email TEXT NOT NULL,
    access_token TEXT, -- Will be encrypted at application level
    refresh_token TEXT, -- Will be encrypted at application level  
    token_expiry TIMESTAMP WITH TIME ZONE,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Foreign key to users
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    UNIQUE(provider, provider_id),
    UNIQUE(provider, user_id) -- One provider per user
);

-- User session management with JWT tokens
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    access_token TEXT NOT NULL, -- JWT for API access
    refresh_token TEXT NOT NULL, -- For token rotation
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Session metadata
    user_agent TEXT,
    ip_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Foreign key to users
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Token blacklisting for immediate revocation
CREATE TABLE blacklisted_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    token_id TEXT UNIQUE NOT NULL, -- JWT 'jti' claim
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_oauth_providers_user_id ON oauth_providers(user_id);
CREATE INDEX idx_oauth_providers_provider ON oauth_providers(provider);
CREATE INDEX idx_oauth_providers_email ON oauth_providers(email);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

CREATE INDEX idx_blacklisted_tokens_token_id ON blacklisted_tokens(token_id);
CREATE INDEX idx_blacklisted_tokens_expires_at ON blacklisted_tokens(expires_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_oauth_providers_updated_at
    BEFORE UPDATE ON oauth_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Remove expired blacklisted tokens
    DELETE FROM blacklisted_tokens 
    WHERE expires_at < now();
    
    -- Deactivate expired sessions
    UPDATE user_sessions 
    SET is_active = false 
    WHERE expires_at < now() AND is_active = true;
    
    -- Remove old inactive sessions (older than 90 days)
    DELETE FROM user_sessions 
    WHERE is_active = false 
    AND updated_at < now() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- This should be run manually or via a scheduled task if pg_cron is not available
-- SELECT cron.schedule('cleanup-auth-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

COMMENT ON TABLE oauth_providers IS 'OAuth provider information for users supporting Google and Microsoft authentication';
COMMENT ON TABLE user_sessions IS 'User session management with JWT tokens and refresh token rotation';
COMMENT ON TABLE blacklisted_tokens IS 'Blacklisted JWT tokens for immediate revocation capability';
