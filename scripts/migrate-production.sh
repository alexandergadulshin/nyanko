#!/bin/bash

# Production Migration Script for Supabase
# Run this script to set up your database tables in Supabase

echo "🚀 Setting up production database with Supabase..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set your Supabase connection string:"
    echo "export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres'"
    exit 1
fi

echo "✅ DATABASE_URL found"

# Generate and run migrations
echo "📝 Generating database migrations..."
pnpm db:generate

echo "🔄 Running migrations to Supabase..."
pnpm db:migrate

echo "✅ Database setup complete!"
echo ""
echo "Your tables have been created in Supabase:"
echo "- anime-web_user"
echo "- anime-web_session" 
echo "- anime-web_account"
echo "- anime-web_verification"
echo "- anime-web_anime_list"
echo "- anime-web_favorites"
echo "- anime-web_post"
echo ""
echo "🎉 Ready for production deployment!"