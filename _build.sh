#!/bin/bash

# Remove package-lock.json if it exists
rm -f package-lock.json

# Install dependencies with specific flags
npm install --no-optional --no-audit --no-fund

# Try to install the Linux rollup dependency specifically
npm install @rollup/rollup-linux-x64-gnu --no-save || echo "Could not install Linux rollup dependency, continuing..."

# Run the build
npm run build 