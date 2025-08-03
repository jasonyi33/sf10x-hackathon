#!/bin/bash
# Set Railway environment variables

echo "Setting Railway environment variables..."

# Read from .env file
source .env

# Set all required variables
railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
railway variables set SUPABASE_URL="$SUPABASE_URL"
railway variables set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
railway variables set SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"

echo "✅ Environment variables set!"
echo "🚀 Redeploying..."
railway up

echo "✅ Done! Your app should now have all environment variables."