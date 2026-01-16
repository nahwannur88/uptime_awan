#!/bin/bash

# Clean Old Data Script for Uptime Awan
# Removes old speed test results and monitor checks to save space

set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
DB_PATH="$PROJECT_DIR/data/uptime.db"
SPEEDTEST_RETENTION_DAYS=30
MONITOR_CHECKS_RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Uptime Awan - Clean Old Data"
echo "============================="
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database not found at $DB_PATH"
    exit 1
fi

echo "Configuration:"
echo "  Speed test retention: $SPEEDTEST_RETENTION_DAYS days"
echo "  Monitor checks retention: $MONITOR_CHECKS_RETENTION_DAYS days"
echo ""

# Get current sizes
SPEEDTEST_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM speedtest_results;")
MONITOR_CHECKS_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM monitor_checks;")
DB_SIZE_BEFORE=$(du -h "$DB_PATH" | cut -f1)

echo "Current data:"
echo "  Speed test results: $SPEEDTEST_COUNT"
echo "  Monitor checks: $MONITOR_CHECKS_COUNT"
echo "  Database size: $DB_SIZE_BEFORE"
echo ""

read -p "Continue with cleanup? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Cleaning old data..."

# Delete old speed test results
DELETED_SPEEDTEST=$(sqlite3 "$DB_PATH" "DELETE FROM speedtest_results WHERE timestamp < datetime('now', '-$SPEEDTEST_RETENTION_DAYS days'); SELECT changes();")
echo "  Deleted $DELETED_SPEEDTEST old speed test results"

# Delete old monitor checks
DELETED_CHECKS=$(sqlite3 "$DB_PATH" "DELETE FROM monitor_checks WHERE timestamp < datetime('now', '-$MONITOR_CHECKS_RETENTION_DAYS days'); SELECT changes();")
echo "  Deleted $DELETED_CHECKS old monitor checks"

# Optimize database
echo ""
echo "Optimizing database..."
sqlite3 "$DB_PATH" "VACUUM;"
sqlite3 "$DB_PATH" "ANALYZE;"

# Get new sizes
SPEEDTEST_COUNT_AFTER=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM speedtest_results;")
MONITOR_CHECKS_COUNT_AFTER=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM monitor_checks;")
DB_SIZE_AFTER=$(du -h "$DB_PATH" | cut -f1)

echo ""
echo -e "${GREEN}Cleanup complete!${NC}"
echo ""
echo "Results:"
echo "  Speed test results: $SPEEDTEST_COUNT → $SPEEDTEST_COUNT_AFTER"
echo "  Monitor checks: $MONITOR_CHECKS_COUNT → $MONITOR_CHECKS_COUNT_AFTER"
echo "  Database size: $DB_SIZE_BEFORE → $DB_SIZE_AFTER"
echo ""
echo -e "${YELLOW}Note: You may want to restart the service:${NC}"
echo "  sudo systemctl restart uptime-awan"

