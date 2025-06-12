# 🗄️ Supabase Setup Instructions

This guide will help you set up Supabase for the 0N1 Lore Crafter application.

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and pnpm installed
- The 0N1 Lore Crafter project cloned locally

## 🚀 Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `0n1-lore-crafter`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## 🔧 Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)
   - **Service role key** (starts with `eyJ`) - **Keep this secret!**

## 📝 Step 3: Set Up Environment Variables

1. In your project root, create a `.env.local` file:

```bash
# OpenSea API
OPENSEA_API_KEY=your_opensea_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI API (for AI features)
OPENAI_API_KEY=your_openai_api_key_here
```

2. Replace the placeholder values with your actual credentials

## 🗃️ Step 4: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` from your project
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create:
- `souls` table for storing character souls
- `nft_metadata` table for caching NFT data
- Proper indexes and constraints
- Row Level Security (RLS) policies

## 🔒 Step 5: Configure Row Level Security

The schema automatically sets up RLS policies:

- **Souls table**: 
  - Anyone can read souls (public viewing)
  - Users can only modify souls for their own wallet address
- **NFT Metadata table**:
  - Anyone can read metadata (public viewing)
  - Only authenticated users can modify metadata

## 🧪 Step 6: Test the Connection

1. Start your development server:
```bash
pnpm run dev
```

2. Open your browser and navigate to `http://localhost:3000`
3. Connect your wallet
4. Try creating a soul - it should now save to Supabase instead of localStorage

## 📊 Step 7: Monitor Your Database

1. Go to **Table Editor** in Supabase to view your data
2. Use **Logs** to monitor database activity
3. Check **Authentication** if you plan to add user auth later

## 🔄 Migration from localStorage

The new system automatically handles the transition:

- **Old localStorage data**: Still accessible via legacy functions (with deprecation warnings)
- **New Supabase data**: All new souls are saved to the database
- **Gradual migration**: Users can manually recreate souls to move them to Supabase

## 🛠️ Troubleshooting

### Connection Issues
- Verify your environment variables are correct
- Check that your Supabase project is active
- Ensure your API keys have the right permissions

### Database Errors
- Check the Supabase logs for detailed error messages
- Verify the schema was applied correctly
- Make sure RLS policies allow your operations

### Performance Issues
- Monitor your database usage in the Supabase dashboard
- Consider adding indexes for frequently queried fields
- Use the built-in caching for NFT metadata

## 🎯 Next Steps

With Supabase set up, you now have:

- ✅ **Persistent soul storage** across devices and sessions
- ✅ **Real-time data sync** between users
- ✅ **Scalable database** that grows with your app
- ✅ **Built-in backup and recovery**
- ✅ **Advanced querying capabilities**

Your 0N1 Lore Crafter is now ready for production use! 🚀 