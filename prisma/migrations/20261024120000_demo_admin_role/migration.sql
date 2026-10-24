-- Read-only role for the public demo admin; requireAdmin() keeps accepting only ADMIN.
ALTER TYPE "UserRole" ADD VALUE 'DEMO_ADMIN';
