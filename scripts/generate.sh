#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# 1. Prepare build folder
rm -rf build
mkdir -p build

# 2. Run webpack to build and copy assets into dist/
echo "Running webpack..."
npm run build

# 3. Generate zip from dist/
echo "Packaging extension..."
cd dist
zip -r ../build/geminify.zip .
cd ..

echo "Build complete! File at: build/geminify.zip"

