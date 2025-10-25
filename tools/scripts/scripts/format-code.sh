#!/bin/bash
# Format Python code with Black and isort

echo "🎨 Formatting Python code..."
cd backend

# Check if tools are installed
if ! command -v black &> /dev/null; then
    echo "⚠️  Black not installed. Installing..."
    pip3 install black
fi

if ! command -v isort &> /dev/null; then
    echo "⚠️  isort not installed. Installing..."
    pip3 install isort
fi

if ! command -v flake8 &> /dev/null; then
    echo "⚠️  flake8 not installed. Installing..."
    pip3 install flake8
fi

# Format code
black .
isort .
flake8 . --max-line-length=88
echo "✅ Code formatting complete"
