#!/bin/bash

echo "🎯 Running Whisper Test..."
echo "=========================="

# Make sure we're in the backend directory
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ No .env file found!"
    echo "💡 Please create .env file with your OpenAI API key:"
    echo "   echo 'OPENAI_API_KEY=your-key-here' > .env"
    exit 1
fi

# Run the test
python3 test_whisper_quick.py

echo ""
echo "📋 Test completed!"