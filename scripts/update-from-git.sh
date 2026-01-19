#!/bin/bash

# Update Uptime Awan from Git and Reinstall Dependencies
# This script pulls latest changes and reinstalls npm packages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=========================================="
echo "Uptime Awan - Update from Git"
echo "=========================================="
echo ""

# Check if git repository exists
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not a git repository${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}Current branch: ${CURRENT_BRANCH}${NC}"
echo ""

# Step 1: Check for uncommitted changes
echo -e "${YELLOW}Step 1: Checking for uncommitted changes...${NC}"
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Do you want to stash them? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stashing changes..."
        git stash
        STASHED=true
    else
        echo -e "${RED}Aborting. Please commit or stash your changes first.${NC}"
        exit 1
    fi
else
    STASHED=false
fi

# Step 2: Pull latest changes
echo ""
echo -e "${YELLOW}Step 2: Pulling latest changes from git...${NC}"
if git pull origin "$CURRENT_BRANCH"; then
    echo -e "${GREEN}✓ Successfully pulled latest changes${NC}"
else
    echo -e "${RED}✗ Failed to pull changes${NC}"
    if [ "$STASHED" = true ]; then
        echo "Restoring stashed changes..."
        git stash pop
    fi
    exit 1
fi

# Step 3: Check if package.json changed
echo ""
echo -e "${YELLOW}Step 3: Checking for dependency changes...${NC}"
PACKAGE_JSON_CHANGED=false
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    PACKAGE_JSON_CHANGED=true
    echo -e "${BLUE}package.json has changed - dependencies need to be reinstalled${NC}"
fi

if git diff HEAD@{1} HEAD --name-only | grep -q "client/package.json"; then
    CLIENT_PACKAGE_JSON_CHANGED=true
    echo -e "${BLUE}client/package.json has changed - client dependencies need to be reinstalled${NC}"
fi

# Step 4: Reinstall server dependencies
echo ""
echo -e "${YELLOW}Step 4: Reinstalling server dependencies...${NC}"
if [ "$PACKAGE_JSON_CHANGED" = true ] || [ "$1" = "--force" ]; then
    echo "Removing old node_modules and package-lock.json..."
    rm -rf node_modules
    rm -f package-lock.json
    
    echo "Installing dependencies (this may take a few minutes)..."
    if npm install; then
        echo -e "${GREEN}✓ Server dependencies installed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to install server dependencies${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}Skipping (package.json unchanged, use --force to reinstall)${NC}"
fi

# Step 5: Reinstall client dependencies
echo ""
echo -e "${YELLOW}Step 5: Reinstalling client dependencies...${NC}"
cd client

if [ "$CLIENT_PACKAGE_JSON_CHANGED" = true ] || [ "$1" = "--force" ]; then
    echo "Removing old node_modules and package-lock.json..."
    rm -rf node_modules
    rm -f package-lock.json
    
    echo "Installing dependencies (this may take a few minutes)..."
    if npm install; then
        echo -e "${GREEN}✓ Client dependencies installed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to install client dependencies${NC}"
        cd ..
        exit 1
    fi
else
    echo -e "${BLUE}Skipping (client/package.json unchanged, use --force to reinstall)${NC}"
fi

cd ..

# Step 6: Rebuild client (if in production)
echo ""
if [ "$NODE_ENV" = "production" ] || [ "$1" = "--build" ]; then
    echo -e "${YELLOW}Step 6: Rebuilding client application...${NC}"
    cd client
    if npm run build; then
        echo -e "${GREEN}✓ Client application rebuilt successfully${NC}"
    else
        echo -e "${RED}✗ Failed to rebuild client application${NC}"
        cd ..
        exit 1
    fi
    cd ..
else
    echo -e "${BLUE}Skipping client build (not in production mode, use --build to force)${NC}"
fi

# Step 7: Fix database tables (if needed)
echo ""
echo -e "${YELLOW}Step 7: Verifying database tables...${NC}"
if [ -f "scripts/fix-tables-node.js" ]; then
    if node scripts/fix-tables-node.js > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database tables verified${NC}"
    else
        echo -e "${YELLOW}⚠ Database tables may need fixing (non-critical)${NC}"
    fi
else
    echo -e "${BLUE}Skipping (fix-tables-node.js not found)${NC}"
fi

# Step 8: Restore stashed changes (if any)
if [ "$STASHED" = true ]; then
    echo ""
    echo -e "${YELLOW}Restoring stashed changes...${NC}"
    if git stash pop; then
        echo -e "${GREEN}✓ Stashed changes restored${NC}"
    else
        echo -e "${YELLOW}⚠ There were conflicts when restoring stashed changes${NC}"
        echo "Please resolve them manually with: git stash list"
    fi
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}Update Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart the service:"
echo "   ${BLUE}sudo systemctl restart uptime-awan${NC}"
echo ""
echo "2. Check service status:"
echo "   ${BLUE}sudo systemctl status uptime-awan${NC}"
echo ""
echo "3. View logs:"
echo "   ${BLUE}sudo journalctl -u uptime-awan -f${NC}"
echo ""
