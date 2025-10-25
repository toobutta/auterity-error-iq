#!/bin/bash
# AutoMatrix AI Hub - SSL Certificate Setup Script
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
DOMAINS=(
    "api.autmatrix.com"
    "app.autmatrix.com"
    "relay.autmatrix.com"
    "models.autmatrix.com"
    "models-api.autmatrix.com"
    "monitoring.autmatrix.com"
)

EMAIL="admin@autmatrix.com"  # Change this to your email
SSL_DIR="./nginx/ssl"

setup_ssl_directories() {
    log_info "Setting up SSL directories..."

    for domain in "${DOMAINS[@]}"; do
        mkdir -p "$SSL_DIR/$domain"
    done

    log_success "SSL directories created"
}

generate_self_signed_certificates() {
    log_info "Generating self-signed certificates for development..."

    for domain in "${DOMAINS[@]}"; do
        log_info "Generating certificate for $domain..."

        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/$domain/privkey.pem" \
            -out "$SSL_DIR/$domain/fullchain.pem" \
            -subj "/C=US/ST=State/L=City/O=AutoMatrix/CN=$domain"

        log_success "Self-signed certificate generated for $domain"
    done
}

main() {
    log_info "AutoMatrix SSL Certificate Setup"
    echo
    echo "This script will help you set up SSL certificates for AutoMatrix AI Hub."
    echo "Choose an option:"
    echo "1. Generate self-signed certificates (for development/testing)"
    echo "2. Skip SSL setup (use HTTP only)"
    echo
    read -p "Enter your choice (1 or 2): " choice

    setup_ssl_directories

    case $choice in
        1)
            generate_self_signed_certificates
            log_success "Self-signed certificates generated successfully!"
            log_warning "These certificates are for development only and will show security warnings in browsers."
            ;;
        2)
            log_info "Skipping SSL setup. You can configure SSL later."
            ;;
        *)
            log_error "Invalid choice. Please run the script again and choose 1 or 2."
            exit 1
            ;;
    esac

    echo
    log_success "SSL setup completed! You can now start the production deployment."
}

main "$@"
