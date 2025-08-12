-- Insert a test user for API testing
INSERT INTO users (id, name, email, "createdAt", "updatedAt") 
VALUES ('user1', 'Test User', 'test@example.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
