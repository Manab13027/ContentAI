#!/bin/bash
cd "$(dirname "$0")"

echo "Checking dependencies..."
pip install -q -r requirements.txt

echo "Running pipeline..."
if [ -z "$1" ]; then
    python pipeline.py
else
    python pipeline.py "$@"
fi
