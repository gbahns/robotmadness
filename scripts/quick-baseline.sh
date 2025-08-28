#!/bin/bash
# Quick baseline script for production database
# Usage: DATABASE_URL="your-url" bash scripts/quick-baseline.sh

echo "🔧 Baselining production database..."
npx prisma migrate resolve --applied 000_initial
echo "✅ Done! The initial migration has been marked as applied."
echo "   You can now deploy your application."