#!/bin/bash

# Verification script to ensure chartjs-node-canvas package name is correct everywhere

echo "=========================================="
echo "Verifying chartjs-node-canvas package name"
echo "=========================================="
echo ""

ERRORS=0

# Check package.json
echo "1. Checking package.json..."
if grep -q '"chartjs-node-canvas"' package.json; then
    echo "   ✅ package.json: CORRECT"
else
    if grep -q '"chart\.js-node-canvas"' package.json; then
        echo "   ❌ package.json: INCORRECT (has chart.js-node-canvas)"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ⚠️  package.json: Package not found"
    fi
fi

# Check server/services/email.js
echo "2. Checking server/services/email.js..."
if grep -q "require('chartjs-node-canvas')" server/services/email.js || grep -q 'require("chartjs-node-canvas")' server/services/email.js; then
    echo "   ✅ server/services/email.js: CORRECT"
else
    if grep -q "require('chart\.js-node-canvas')" server/services/email.js || grep -q 'require("chart\.js-node-canvas")' server/services/email.js; then
        echo "   ❌ server/services/email.js: INCORRECT (has chart.js-node-canvas)"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ⚠️  server/services/email.js: Package not found"
    fi
fi

# Check if package is installed
echo "3. Checking if package is installed..."
if [ -d "node_modules/chartjs-node-canvas" ]; then
    echo "   ✅ Package installed correctly"
elif [ -d "node_modules/chart.js-node-canvas" ]; then
    echo "   ❌ Wrong package installed (chart.js-node-canvas)"
    ERRORS=$((ERRORS + 1))
else
    echo "   ⚠️  Package not installed (run npm install)"
fi

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Package name is correct."
    exit 0
else
    echo "❌ Found $ERRORS error(s). Please fix them."
    echo ""
    echo "To fix automatically, run:"
    echo "  ./scripts/fix-package-name.sh"
    exit 1
fi
