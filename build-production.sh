#!/bin/bash
# Production build script that excludes migration scripts

# Temporarily rename scripts folder to prevent TypeScript compilation
if [ -d "scripts" ]; then
  mv scripts scripts.bak
fi

# Run the build
npm run build

# Restore scripts folder
if [ -d "scripts.bak" ]; then
  mv scripts.bak scripts
fi