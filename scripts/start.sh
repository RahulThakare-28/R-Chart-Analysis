#!/bin/bash

# ============================================
# ChartScanAI - Main Entry Point Script
# ============================================
# Usage: ./scripts/start.sh [dev|prod|docker]
#
# This is the SINGLE COMMAND to run the entire project
# All apps start in parallel using Turbo orchestration
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ChartScanAI"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default mode
MODE="${1:-dev}"

# ============================================
# Helper Functions
# ============================================

print_header() {
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        echo "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version must be 18 or higher. Current: $(node -v)"
        exit 1
    fi

    print_success "Node.js $(node -v) detected"
}

check_dependencies() {
    print_info "Checking dependencies..."

    if [ ! -d "$ROOT_DIR/node_modules" ]; then
        print_info "node_modules not found. Running npm install..."
        cd "$ROOT_DIR"
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
}

check_env_files() {
    print_info "Checking environment files..."

    if [ ! -f "$ROOT_DIR/.env.$MODE" ]; then
        if [ ! -f "$ROOT_DIR/.env.example" ]; then
            print_error ".env.example not found"
            exit 1
        fi

        print_info "Creating .env.$MODE from .env.example..."
        cp "$ROOT_DIR/config/.env.example" "$ROOT_DIR/.env.$MODE"
        print_success ".env.$MODE created. Please update with your API keys!"
    fi

    if [ ! -f "$ROOT_DIR/config/api-keys.json" ]; then
        if [ ! -f "$ROOT_DIR/config/api-keys.example.json" ]; then
            print_error "api-keys.example.json not found"
            exit 1
        fi

        print_info "Creating config/api-keys.json from template..."
        cp "$ROOT_DIR/config/api-keys.example.json" "$ROOT_DIR/config/api-keys.json"
        print_success "config/api-keys.json created. Please update with your API keys!"
    fi
}

setup_database() {
    print_info "Setting up database..."

    DB_TYPE=$(grep "^DB_TYPE" "$ROOT_DIR/.env.$MODE" | cut -d'=' -f2)

    if [ "$DB_TYPE" = "sqlite" ]; then
        print_info "Using SQLite (local database)"
        mkdir -p "$ROOT_DIR/data"
        print_success "SQLite ready"
    else
        print_info "Using PostgreSQL"
        print_info "Make sure PostgreSQL is running at the configured host"
    fi
}

# ============================================
# Mode-Specific Functions
# ============================================

run_dev() {
    print_header "Starting ChartScanAI in DEVELOPMENT mode"

    export NODE_ENV=development

    print_info "Loading environment from .env.development..."
    cd "$ROOT_DIR"

    print_info "Starting all services in parallel..."
    print_info "
    🚀 Services starting:
       - API Server (port 3000)
       - WebSocket Server (port 3001)
       - Frontend Dev Server (port 5173)
       - Database: Check .env.development

    💡 Tips:
       - API Documentation: http://localhost:3000/api/docs
       - Frontend: http://localhost:5173
       - WebSocket: ws://localhost:3001
       - API: http://localhost:3000

    Press Ctrl+C to stop all services
    "

    npm run dev
}

run_prod() {
    print_header "Starting ChartScanAI in PRODUCTION mode"

    export NODE_ENV=production

    print_info "Building all apps..."
    cd "$ROOT_DIR"
    npm run build

    if [ $? -ne 0 ]; then
        print_error "Build failed"
        exit 1
    fi

    print_success "Build completed"
    print_info "Starting services..."
    npm run start:prod 2>/dev/null || npm run prod 2>/dev/null || {
        print_error "Production start script not found. Using dev mode for now..."
        run_dev
    }
}

run_docker() {
    print_header "Starting ChartScanAI with Docker"

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    print_success "Docker detected"

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi

    print_success "Docker Compose detected"

    cd "$ROOT_DIR/docker"
    print_info "Starting Docker stack..."
    docker-compose up -d

    print_success "Docker stack started"
    print_info "
    Services running:
    - API: http://localhost:3000
    - WebSocket: ws://localhost:3001
    - Frontend: http://localhost:5173
    - PostgreSQL: localhost:5432
    - Redis: localhost:6379

    View logs:
    docker-compose logs -f

    Stop services:
    docker-compose down
    "
}

# ============================================
# Main Execution
# ============================================

main() {
    print_header "$PROJECT_NAME - Startup Script"

    print_info "Mode: $MODE"
    echo ""

    # Pre-flight checks
    check_node
    check_dependencies
    check_env_files
    setup_database

    echo ""

    # Run based on mode
    case "$MODE" in
        dev)
            run_dev
            ;;
        prod|production)
            run_prod
            ;;
        docker)
            run_docker
            ;;
        *)
            print_error "Unknown mode: $MODE"
            echo "Usage: $0 [dev|prod|docker]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
