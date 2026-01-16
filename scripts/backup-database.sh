#!/bin/bash

# Database Backup Script for Uptime Awan
# Creates timestamped backups of the SQLite database

set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
DB_PATH="$PROJECT_DIR/data/uptime.db"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/uptime_backup_$TIMESTAMP.db"

# Keep backups for this many days
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Uptime Awan - Database Backup"
echo "=============================="
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}Error: Database not found at $DB_PATH${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Backing up database..."
cp "$DB_PATH" "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo "  Location: $BACKUP_FILE"
    echo "  Size: $SIZE"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Clean old backups
echo ""
echo "Cleaning old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "uptime_backup_*.db" -type f -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "uptime_backup_*.db" -type f | wc -l)
echo "Backups remaining: $REMAINING"

echo ""
echo "Backup complete!"

