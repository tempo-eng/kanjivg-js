#!/bin/bash
# Installation script for KanjiVG data generation

echo "KanjiVG Data Generation Setup"
echo "============================="

# Check Python version
python3 --version
if [ $? -ne 0 ]; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "convert_data.py" ]; then
    echo "❌ Please run this script from the data-generation directory"
    exit 1
fi

# Check required files
echo "Checking required files..."
required_files=("kanjivg.py" "utils.py" "xmlhandler.py" "kvg-index.json" "kanji/")
for file in "${required_files[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

# Test conversion
echo ""
echo "Testing data conversion..."
python3 test-conversion.py
if [ $? -eq 0 ]; then
    echo "✅ Data conversion test passed"
else
    echo "❌ Data conversion test failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete! You can now run:"
echo "   python3 convert_data.py    # Generate all data"
echo "   python3 test-conversion.py # Test conversion"
