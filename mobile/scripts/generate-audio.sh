#!/bin/bash

# Generate demo audio files using macOS text-to-speech
# This script creates M4A files from the demo scripts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIO_DIR="$SCRIPT_DIR/../assets/demo-audio"

echo "🎤 Generating demo audio files..."

# Create audio directory if it doesn't exist
mkdir -p "$AUDIO_DIR"

# Function to generate audio file
generate_audio() {
    local name=$1
    local text=$2
    local output_file="$AUDIO_DIR/$name.m4a"
    
    echo "📝 Generating: $name.m4a"
    echo "   Text: $text"
    
    # Use macOS say command to generate M4A file
    say -o "$output_file" -v "Alex" "$text"
    
    if [ -f "$output_file" ]; then
        echo "   ✅ Successfully created: $output_file"
    else
        echo "   ❌ Failed to create: $output_file"
    fi
    echo ""
}

# Generate the three demo audio files
generate_audio "john-market-street" "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication."

generate_audio "sarah-library" "Sarah by the library, approximately 35, 5 foot 4, 120 pounds, dark skin. Says she's in recovery, looking for shelter. Has two children staying with relatives."

generate_audio "robert-golden-gate" "Robert at Golden Gate Park. 55 years old, 5 foot 10, 200 pounds, medium skin tone. Veteran, mild substance issues. Applied for housing last week."

echo "🎉 Demo audio generation complete!"
echo "📁 Audio files created in: $AUDIO_DIR"
echo ""
echo "📋 Generated files:"
ls -la "$AUDIO_DIR"/*.m4a 2>/dev/null || echo "   No .m4a files found (may need to run manually)"
echo ""
echo "💡 To generate manually, run these commands:"
echo "   cd $AUDIO_DIR"
echo "   say -o john-market-street.m4a -v Alex 'Met John near Market Street...'"
echo "   say -o sarah-library.m4a -v Alex 'Sarah by the library...'"
echo "   say -o robert-golden-gate.m4a -v Alex 'Robert at Golden Gate Park...'" 