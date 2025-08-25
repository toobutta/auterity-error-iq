#!/bin/bash
# AutoMatrix AI Hub - Backup Script
# Generated: 2025-01-31

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"
VOLUME_BACKUP_DIR="$BACKUP_DIR/volumes_$TIMESTAMP"

# Source environment variables
if [ -f ".env.production" ]; then
    set -a
    source .env.production
    set +a
else
    log_error "Production environment file not found!"
    exit 1
fi

create_backup_directory() {
    log_info "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$VOLUME_BACKUP_DIR"
    log_success "Backup directory created: $BACKUP_DIR"
}

backup_database() {
    log_info "Backing up PostgreSQL database..."

    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --clean --if-exists --create > "$DB_BACKUP_FILE"

    # Compress the backup
    gzip "$DB_BACKUP_FILE"

    log_success "Database backup completed: ${DB_BACKUP_FILE}.gz"
}

backup_volumes() {
    log_info "Backing up Docker volumes..."

    # List of volumes to backup
    VOLUMES=(
        "postgres_data"
        "redis_data"
        "grafana_data"
        "prometheus_data"
        "neuroweaver_models"
    )

    for volume in "${VOLUMES[@]}"; do
        log_info "Backing up volume: $volume"

        docker run --rm \
            -v "${PWD##*/}_${volume}:/source:ro" \
            -v "$PWD/$VOLUME_BACKUP_DIR:/backup" \
            alpine:latest \
            tar czf "/backup/${volume}.tar.gz" -C /source .

        log_success "Volume backup completed: ${volume}.tar.gz"
    done
}

backup_configuration() {
    log_info "Backing up configuration files..."

    # Create config backup directory
    CONFIG_BACKUP_DIR="$VOLUME_BACKUP_DIR/config"
    mkdir -p "$CONFIG_BACKUP_DIR"

    # Backup important configuration files
    cp .env.production "$CONFIG_BACKUP_DIR/"
    cp docker-compose.prod.yml "$CONFIG_BACKUP_DIR/"
    cp -r nginx/ "$CONFIG_BACKUP_DIR/" 2>/dev/null || true
    cp -r monitoring/ "$CONFIG_BACKUP_DIR/" 2>/dev/null || true

    log_success "Configuration backup completed"
}

create_backup_manifest() {
    log_info "Creating backup manifest..."

    MANIFEST_FILE="$BACKUP_DIR/backup_manifest_$TIMESTAMP.txt"

    cat > "$MANIFEST_FILE" << EOF
AutoMatrix AI Hub Backup Manifest
Generated: $(date)
Backup Directory: $VOLUME_BACKUP_DIR
Database Backup: ${DB_BACKUP_FILE}.gz

Files included in this backup:
$(find "$VOLUME_BACKUP_DIR" -type f -exec basename {} \; | sort)

Database Info:
- Database: $POSTGRES_DB
- User: $POSTGRES_USER
- Backup Size: $(du -h "${DB_BACKUP_FILE}.gz" | cut -f1)

Volume Backups:
$(find "$VOLUME_BACKUP_DIR" -name "*.tar.gz" -exec basename {} \; | sort)

Total Backup Size: $(du -sh "$VOLUME_BACKUP_DIR" | cut -f1)

Restore Instructions:
1. Stop all services: docker-compose -f docker-compose.prod.yml down
2. Restore database: gunzip -c ${DB_BACKUP_FILE}.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
3. Restore volumes: Extract .tar.gz files to respective Docker volumes
4. Start services: docker-compose -f docker-compose.prod.yml up -d
EOF

    log_success "Backup manifest created: $MANIFEST_FILE"
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 7 days)..."

    # Remove backups older than 7 days
    find "$BACKUP_DIR" -name "database_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "volumes_*" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    find "$BACKUP_DIR" -name "backup_manifest_*.txt" -mtime +7 -delete 2>/dev/null || true

    log_success "Old backups cleaned up"
}

main() {
    log_info "Starting AutoMatrix AI Hub backup..."

    create_backup_directory
    backup_database
    backup_volumes
    backup_configuration
    create_backup_manifest
    cleanup_old_backups

    echo
    log_success "🎉 Backup completed successfully!"
    echo "Backup location: $VOLUME_BACKUP_DIR"
    echo "Database backup: ${DB_BACKUP_FILE}.gz"
    echo "Manifest file: $BACKUP_DIR/backup_manifest_$TIMESTAMP.txt"
    echo
    echo "To restore from this backup:"
    echo "1. ./scripts/restore.sh $TIMESTAMP"
    echo "2. Or follow instructions in the manifest file"
}

main "$@"
