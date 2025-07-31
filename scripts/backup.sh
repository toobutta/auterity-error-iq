#!/bin/bash

# Database backup script for production
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR=${BACKUP_DIR:-./backups}
POSTGRES_CONTAINER=${POSTGRES_CONTAINER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-workflow_engine}
POSTGRES_USER=${POSTGRES_USER:-postgres}
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/workflow_engine_backup_$TIMESTAMP.sql"

echo -e "${GREEN}Starting database backup...${NC}"

# Create database backup
if docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"; then
    echo -e "${GREEN}✓ Database backup created: $BACKUP_FILE${NC}"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup compressed: ${BACKUP_FILE}.gz${NC}"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo -e "${GREEN}Backup size: $BACKUP_SIZE${NC}"
else
    echo -e "${RED}✗ Database backup failed${NC}"
    exit 1
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up backups older than $RETENTION_DAYS days...${NC}"
find "$BACKUP_DIR" -name "workflow_engine_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo -e "${YELLOW}Available backups:${NC}"
ls -lh "$BACKUP_DIR"/workflow_engine_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo -e "${GREEN}Backup process completed successfully!${NC}"