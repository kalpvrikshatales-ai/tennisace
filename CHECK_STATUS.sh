#!/bin/bash

echo "🔍 TennisAce Deployment Status Check"
echo "===================================="
echo ""

# Frontend
echo "Frontend (Vercel):"
vercel_status=$(curl -s -o /dev/null -w "%{http_code}" https://tennisace.live 2>/dev/null)
if [ "$vercel_status" == "200" ] || [ "$vercel_status" == "308" ]; then
  echo "✅ Live at https://tennisace.live"
else
  echo "⏳ Still deploying (HTTP $vercel_status)..."
fi

echo ""

# Backend
echo "Backend (Render):"
backend_urls=(
  "https://tennisace-api.onrender.com/health"
  "https://tennisace.onrender.com/health"
  "https://api.tennisace.live/health"
)

backend_ok=0
for url in "${backend_urls[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  if [ "$status" == "200" ]; then
    echo "✅ Live at $url"
    backend_ok=1
    break
  fi
done

if [ $backend_ok -eq 0 ]; then
  echo "⏳ Still deploying..."
  echo "   Check Render dashboard: https://dashboard.render.com"
fi

echo ""
echo "Last commits:"
git log --oneline | head -3

echo ""
echo "Waiting for deployment? Check these dashboards:"
echo "  Vercel:  https://vercel.com/dashboard"
echo "  Render:  https://dashboard.render.com"
echo "  GitHub:  https://github.com/kalpvrikshatales-ai/tennisace/deployments"
