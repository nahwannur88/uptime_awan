#!/bin/bash

# Automatic fix script for chartjs-node-canvas package name

echo "=========================================="
echo "Fixing chartjs-node-canvas package name"
echo "=========================================="
echo ""

# Fix package.json
if [ -f "package.json" ]; then
    echo "1. Fixing package.json..."
    sed -i.bak 's/"chart\.js-node-canvas"/"chartjs-node-canvas"/g' package.json
    if grep -q '"chartjs-node-canvas"' package.json; then
        echo "   ✅ package.json fixed"
    else
        echo "   ⚠️  package.json: No changes needed or file not found"
    fi
else
    echo "   ⚠️  package.json not found"
fi

# Fix server/services/email.js
if [ -f "server/services/email.js" ]; then
    echo "2. Fixing server/services/email.js..."
    sed -i.bak "s/require('chart\.js-node-canvas')/require('chartjs-node-canvas')/g" server/services/email.js
    sed -i.bak 's/require("chart\.js-node-canvas")/require("chartjs-node-canvas")/g' server/services/email.js
    if grep -q "require('chartjs-node-canvas')" server/services/email.js || grep -q 'require("chartjs-node-canvas")' server/services/email.js; then
        echo "   ✅ server/services/email.js fixed"
    else
        echo "   ⚠️  server/services/email.js: No changes needed"
    fi
else
    echo "   ⚠️  server/services/email.js not found"
fi

# Clean up backup files
echo "3. Cleaning up backup files..."
find . -name "*.bak" -type f -delete 2>/dev/null
echo "   ✅ Backup files removed"

echo ""
echo "=========================================="
echo "✅ Fix complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm install (if package.json was changed)"
echo "2. Run: ./scripts/verify-package-name.sh (to verify)"
echo ""
