#!/bin/bash

echo "🚀 Testing Mission Control Pro Chat Feature"
echo "========================================"

# Test 1: Check API availability
echo "1. Testing API availability..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4446/api/v1/projects)
if [ "$response" = "200" ]; then
    echo "   ✅ API is running on port 4446"
else
    echo "   ❌ API is not responding (HTTP $response)"
    exit 1
fi

# Test 2: List projects
echo "2. Testing project listing..."
projects=$(curl -s http://localhost:4446/api/v1/projects | jq -r '.projects | length')
if [ "$projects" -gt "0" ]; then
    echo "   ✅ Found $projects projects"
    curl -s http://localhost:4446/api/v1/projects | jq -r '.projects[] | "   - \(.name) (\(.id)): \(.agents | join(", "))"'
else
    echo "   ❌ No projects found"
fi

# Test 3: Test prompt submission
echo "3. Testing prompt submission..."
session_response=$(curl -s -X POST http://localhost:4446/api/v1/projects/cid/prompt \
    -H "Content-Type: application/json" \
    -d '{"prompt": "list the main files in this project"}')

session_id=$(echo "$session_response" | jq -r '.sessionId')
if [ "$session_id" != "null" ] && [ "$session_id" != "" ]; then
    echo "   ✅ Prompt submitted successfully"
    echo "   📧 Session ID: $session_id"
else
    echo "   ❌ Failed to submit prompt"
    echo "   Response: $session_response"
fi

# Test 4: Check frontend
echo "4. Testing frontend availability..."
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4444)
if [ "$frontend_response" = "200" ]; then
    echo "   ✅ Frontend is running on port 4444"
else
    echo "   ❌ Frontend is not responding (HTTP $frontend_response)"
fi

echo ""
echo "🎯 Test Summary:"
echo "   - Backend API: http://localhost:4446"
echo "   - Frontend Dev: http://localhost:4444"
echo "   - Production: http://alice.gonzaloacosta.me"
echo ""
echo "📖 How to test the chat feature:"
echo "   1. Open http://localhost:4444 in your browser"
echo "   2. Click on the CID planet (green/cyan colored)"
echo "   3. Watch the camera animate to focus on it"
echo "   4. A chat panel should slide in from the right"
echo "   5. Type a message like 'what files are in this project?'"
echo "   6. Press Enter and watch Claude Code respond in real-time"
echo ""
echo "📱 Mobile testing:"
echo "   - Chat panel becomes full-width overlay on mobile devices"
echo "   - Responsive design maintains functionality on all screen sizes"