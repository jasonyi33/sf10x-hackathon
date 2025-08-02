#!/bin/bash

# Run integration tests for the voice transcription app
# This script runs the recording flow integration tests

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."

echo "🧪 Running Integration Tests for Voice Transcription App"
echo "========================================================"
echo ""

cd "$PROJECT_DIR"

# Check if Jest is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available. Please install Node.js and npm."
    exit 1
fi

# Check if we have the test dependencies
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the correct directory?"
    exit 1
fi

echo "📋 Test Plan:"
echo "1. Recording → Upload → Transcribe → Save flow"
echo "2. Manual entry flow"
echo "3. Location capture during recording"
echo "4. High confidence auto-merge"
echo "5. Recording duration limits"
echo "6. Error handling"
echo ""

echo "🚀 Starting tests..."
echo ""

# Run the integration tests
npx jest tests/recording-flow.integration.test.tsx --verbose --detectOpenHandles

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All integration tests passed!"
    echo ""
    echo "🎉 The recording flow is working correctly:"
    echo "   ✓ Audio recording and upload"
    echo "   ✓ AI transcription and categorization"
    echo "   ✓ Duplicate detection and merging"
    echo "   ✓ Location capture"
    echo "   ✓ Manual entry alternative"
    echo "   ✓ Error handling"
    echo ""
    echo "🚀 Ready for demo!"
else
    echo ""
    echo "❌ Some tests failed. Please check the output above."
    echo ""
    echo "🔧 Common issues:"
    echo "   - Mock dependencies not properly configured"
    echo "   - Component props or interfaces changed"
    echo "   - API endpoints not mocked correctly"
    echo ""
    exit 1
fi 