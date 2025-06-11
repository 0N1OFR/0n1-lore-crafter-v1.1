# Supabase Environment Variables
# Add these to your .env.local file:

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hmjwqbpzwffraztmrlpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtandxYnB6d2ZmcmF6dG1ybHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTA2MTgsImV4cCI6MjA2NDk4NjYxOH0.lhLX7rkF1KaKi4_-omX-lHvu0iTn9-lr5UPnsZwoLK8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtandxYnB6d2ZmcmF6dG1ybHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQxMDYxOCwiZXhwIjoyMDY0OTg2NjE4fQ.UjbEB5RshckfOGBx7AAXaoZQ_ZZdYLCfX_PrxvLKezw

# Database URL (for direct database connections if needed)
DATABASE_URL=postgresql://postgres:your_db_password@db.hmjwqbpzwffraztmrlpl.supabase.co:5432/postgres

# Instructions:
# 1. Copy these variables to your .env.local file
# 2. Get your ANON key from Supabase Dashboard → Settings → API
# 3. Add the same variables to your Vercel environment variables
# 4. Never commit these to Git (they're in .gitignore)

# Security Notes:
# - ANON key: Safe for client-side use, has limited permissions
# - SERVICE_ROLE key: Server-side only, has full permissions
# - DATABASE_URL: Direct database access, server-side only 