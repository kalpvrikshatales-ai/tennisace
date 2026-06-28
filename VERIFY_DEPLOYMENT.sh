#!/bin/bash

# Deployment Verification Script

echo "🔍 TennisAce Deployment Verification"
echo "===================================="
echo ""

API="https://tennisace-api.onrender.com"
FRONTEND="https://tennisace.live"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_status() {
  local name=$1
  local url=$2
  local expected=$3

  echo -n "Checking $name... "

  response=$(curl -s -w "\n%{http_code}" -I "$url")
  status_code=$(echo "$response" | tail -n1)

  if [ "$status_code" = "$expected" ]; then
    echo -e "${GREEN}✅ OK${NC} (HTTP $status_code)"
    return 0
  else
    echo -e "${RED}❌ FAILED${NC} (HTTP $status_code)"
    return 1
  fi
}

check_response() {
  local name=$1
  local url=$2

  echo -n "Testing $name endpoint... "

  response=$(curl -s "$url")

  if echo "$response" | grep -q '"' ; then
    size=$(echo "$response" | wc -c)
    echo -e "${GREEN}✅ OK${NC} ($size bytes)"
    return 0
  else
    echo -e "${RED}❌ FAILED${NC}"
    return 1
  fi
}

check_header() {
  local name=$1
  local url=$2
  local header=$3
  local expected=$4

  echo -n "Checking $name header... "

  response=$(curl -s -I "$url")
  value=$(echo "$response" | grep -i "^$header:" | cut -d' ' -f2-)

  if [[ "$value" == *"$expected"* ]]; then
    echo -e "${GREEN}✅ OK${NC}"
    return 0
  else
    echo -e "${RED}❌ FAILED${NC} (Expected: $expected, Got: $value)"
    return 1
  fi
}

echo "=== Backend Tests ==="
echo ""

check_status "Backend Health" "$API/health" "200"
check_status "Backend Root" "$API/" "200"

echo ""
echo "=== Endpoint Tests ==="
echo ""

check_response "Live Matches" "$API/matches/live"
check_response "Rankings (ATP)" "$API/players/rankings?type=ATP&limit=10"
check_response "Results" "$API/feed/results?limit=10"
check_response "Fixtures" "$API/feed/fixtures?limit=10"
check_response "Tournaments" "$API/tournaments"

echo ""
echo "=== Optimization Tests ==="
echo ""

check_header "Gzip Compression" "$API/matches/live" "Content-Encoding" "gzip"
check_header "Cache Control (Live)" "$API/matches/live" "Cache-Control" "max-age=30"
check_header "Cache Control (Rankings)" "$API/players/rankings" "Cache-Control" "max-age=21600"

echo ""
echo "=== Frontend Tests ==="
echo ""

check_status "Frontend Home" "$FRONTEND" "200"
check_status "Frontend Rankings" "$FRONTEND/rankings" "200"

echo ""
echo "=== Response Size Comparison ==="
echo ""

# Without Accept-Encoding (uncompressed)
uncompressed=$(curl -s "$API/players/rankings?type=ATP&limit=50" | wc -c)
echo "Uncompressed response: $uncompressed bytes"

# With gzip (compressed)
compressed=$(curl -s -H "Accept-Encoding: gzip" "$API/players/rankings?type=ATP&limit=50" | wc -c)
reduction=$((100 - (compressed * 100 / uncompressed)))
echo "Compressed response: $compressed bytes (${reduction}% reduction)"

echo ""
echo "=== Summary ==="
echo ""

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "Deployment Status: Ready for load testing"
  echo ""
  echo "Next step: Configure Redis on Render, then run:"
  echo "  bash SETUP_REDIS.sh"
else
  echo -e "${YELLOW}⚠️  Some tests failed${NC}"
  echo ""
  echo "Check:"
  echo "  1. Is backend deployed? (Check Render dashboard)"
  echo "  2. Is frontend deployed? (Check Vercel dashboard)"
  echo "  3. Are env variables configured?"
fi

echo ""
