#!/bin/bash

# Quick Setup Script for Redis on Render

echo "🚀 TennisAce Redis Configuration Script"
echo "========================================"
echo ""

# Check if user is authenticated with Render
echo "Step 1: Authenticating with Render..."
echo "Please visit: https://dashboard.render.com/login"
echo ""

# Get the service URL
echo "Step 2: Getting Render Service Details..."
read -p "Enter your Render Backend Service ID (found in URL): " SERVICE_ID

if [ -z "$SERVICE_ID" ]; then
  echo "❌ Service ID is required"
  exit 1
fi

echo ""
echo "Step 3: Upstash Redis Setup"
echo "Option A (Recommended): Create free Upstash Redis"
echo "  1. Go to https://upstash.com/docs/redis/features/react"
echo "  2. Sign up (free tier includes Redis)"
echo "  3. Create a new Redis database"
echo "  4. Copy the REST URL: redis://default:<password>@<host>:<port>"
echo ""
echo "Option B: Use existing Redis URL"
echo ""

read -p "Enter your Redis URL (redis://...): " REDIS_URL

if [ -z "$REDIS_URL" ]; then
  echo "❌ Redis URL is required"
  exit 1
fi

# Validate URL format
if [[ ! $REDIS_URL =~ ^redis:// ]]; then
  echo "❌ Invalid Redis URL format. Should start with 'redis://'"
  exit 1
fi

echo ""
echo "✅ Configuration prepared:"
echo "  Service: $SERVICE_ID"
echo "  Redis URL: ${REDIS_URL:0:20}..."
echo ""

echo "Step 4: Update Render Environment"
echo "  1. Go to: https://dashboard.render.com/services/$SERVICE_ID"
echo "  2. Click 'Environment' tab"
echo "  3. Add environment variable:"
echo "     Variable: UPSTASH_REDIS_URL"
echo "     Value: $REDIS_URL"
echo "  4. Click 'Save'"
echo "  5. Wait for deployment (2-5 minutes)"
echo ""

read -p "Have you added the environment variable? (y/n): " confirmed

if [ "$confirmed" != "y" ]; then
  echo "❌ Skipped environment variable setup"
  exit 1
fi

echo ""
echo "Step 5: Verify Redis Connection"
sleep 5

echo "  Testing backend health..."
HEALTH=$(curl -s https://tennisace-api.onrender.com/health)

if [[ $HEALTH == *"ok"* ]]; then
  echo "✅ Backend is running"
else
  echo "⚠️  Backend might still be deploying. Check in 1-2 minutes."
fi

echo ""
echo "Step 6: Test Redis Caching"
echo "  Testing rankings endpoint (should use cache)..."
curl -s https://tennisace-api.onrender.com/players/rankings?type=ATP&limit=10 | head -c 200
echo ""
echo ""

echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Wait 5 minutes for deployment to complete"
echo "  2. Run: ./load_test.sh"
echo "  3. Monitor performance at: https://app.sentry.io/"
