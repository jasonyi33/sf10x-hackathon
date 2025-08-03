#!/bin/bash

echo "Running Supabase migration to rename danger to urgency..."
echo "=================================================="

# First, check if you're using local Supabase or cloud
echo "Are you using:"
echo "1) Local Supabase (supabase start)"
echo "2) Cloud Supabase"
read -p "Enter 1 or 2: " choice

if [ "$choice" = "1" ]; then
    echo -e "\nFor LOCAL Supabase, run these commands:"
    echo "cd /Users/jasonyi/sf10x-hackathon"
    echo "supabase db push"
    echo -e "\nThis will apply all pending migrations including 006_rename_danger_to_urgency.sql"
elif [ "$choice" = "2" ]; then
    echo -e "\nFor CLOUD Supabase, you have two options:"
    echo -e "\nOption A - Using Supabase CLI (recommended):"
    echo "cd /Users/jasonyi/sf10x-hackathon"
    echo "supabase link --project-ref your-project-ref"
    echo "supabase db push"
    echo -e "\nOption B - Using Supabase Dashboard:"
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of:"
    echo "   supabase/migrations/006_rename_danger_to_urgency.sql"
    echo "4. Click 'Run'"
else
    echo "Invalid choice"
    exit 1
fi

echo -e "\n⚠️  IMPORTANT: After running the migration:"
echo "1. Restart your backend server (cd backend && uvicorn main:app --reload --port 8001)"
echo "2. Restart your mobile app (cd mobile && npm start)"
echo "3. Clear any app cache if the old labels persist"

echo -e "\nThe migration will rename these columns:"
echo "- danger_score → urgency_score"
echo "- danger_override → urgency_override"
echo "- danger_weight → urgency_weight"