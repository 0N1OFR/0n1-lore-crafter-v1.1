# Supabase Environment Variables Template
# Copy this template and replace with your actual values

# ⚠️  SECURITY WARNING: Never commit real keys to version control
# This file contains PLACEHOLDER values only - replace with your actual keys

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database URL (for direct database connections if needed)
DATABASE_URL=postgresql://postgres:your_db_password@db.your-project-id.supabase.co:5432/postgres

# Instructions:
# 1. Create a new file called .env.local in your project root
# 2. Copy the variables above into .env.local 
# 3. Replace ALL placeholder values with your actual Supabase keys from:
#    Supabase Dashboard → Settings → API
# 4. Add the same variables to your Vercel/deployment environment variables
# 5. NEVER commit .env.local to Git (it's already in .gitignore)

# Where to find your keys:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to Settings → API
# 4. Copy your Project URL and API keys

# Security Notes:
# - ANON key: Safe for client-side use, has limited permissions
# - SERVICE_ROLE key: ⚠️  NEVER expose client-side! Server-side only, has full permissions
# - DATABASE_URL: Direct database access, server-side only 