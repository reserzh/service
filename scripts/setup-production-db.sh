#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# FieldService Pro — Production Database Setup
#
# Pushes the Drizzle schema and seeds demo data into a production database.
#
# Usage:
#   # With a .env file (reads DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
#   ./scripts/setup-production-db.sh --env apps/back/.env.production
#
#   # With inline env vars
#   DATABASE_URL="postgresql://..." NEXT_PUBLIC_SUPABASE_URL="https://..." \
#     NEXT_PUBLIC_SUPABASE_ANON_KEY="..." SUPABASE_SERVICE_ROLE_KEY="..." \
#     ./scripts/setup-production-db.sh
#
#   # Schema only (skip seeding)
#   ./scripts/setup-production-db.sh --env apps/back/.env.production --schema-only
#
#   # Seed only (schema already exists)
#   ./scripts/setup-production-db.sh --env apps/back/.env.production --seed-only
#
#   # Use the dev seed instead of the production seed
#   ./scripts/setup-production-db.sh --env apps/back/.env.local --dev-seed
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACK_DIR="$ROOT_DIR/apps/back"

SCHEMA_ONLY=false
SEED_ONLY=false
DEV_SEED=false
ENV_FILE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENV_FILE="$2"
      shift 2
      ;;
    --schema-only)
      SCHEMA_ONLY=true
      shift
      ;;
    --seed-only)
      SEED_ONLY=true
      shift
      ;;
    --dev-seed)
      DEV_SEED=true
      shift
      ;;
    -h|--help)
      head -20 "$0" | tail -17
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Load env file if provided
if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    # Try relative to ROOT_DIR
    if [[ -f "$ROOT_DIR/$ENV_FILE" ]]; then
      ENV_FILE="$ROOT_DIR/$ENV_FILE"
    else
      echo "Error: env file not found: $ENV_FILE"
      exit 1
    fi
  fi
  echo "Loading env from: $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# Validate required env vars
MISSING=()
[[ -z "${DATABASE_URL:-}" ]] && MISSING+=("DATABASE_URL")

if [[ "$SCHEMA_ONLY" == false ]]; then
  [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && MISSING+=("SUPABASE_SERVICE_ROLE_KEY")
  [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}${SUPABASE_URL:-}" ]] && MISSING+=("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL")
  if [[ "$DEV_SEED" == false ]]; then
    [[ -z "${TENANT_NAME:-}" ]] && MISSING+=("TENANT_NAME")
    [[ -z "${TENANT_SLUG:-}" ]] && MISSING+=("TENANT_SLUG")
    [[ -z "${TENANT_EMAIL:-}" ]] && MISSING+=("TENANT_EMAIL")
    [[ -z "${ADMIN_EMAIL:-}" ]] && MISSING+=("ADMIN_EMAIL")
    [[ -z "${ADMIN_PASSWORD:-}" ]] && MISSING+=("ADMIN_PASSWORD")
  fi
fi

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "Error: Missing required environment variables:"
  for var in "${MISSING[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Set them inline or use --env <file>"
  exit 1
fi

# Mask the DB URL for display
MASKED_URL=$(echo "$DATABASE_URL" | sed -E 's|(://[^:]+:)[^@]+(@)|\1****\2|')
echo ""
echo "========================================="
echo "  FieldService Pro — DB Setup"
echo "========================================="
SUPABASE_DISPLAY="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-n/a}}"
echo "  Database:  $MASKED_URL"
echo "  Supabase:  $SUPABASE_DISPLAY"
echo "  Schema:    $([ "$SEED_ONLY" == true ] && echo "skip" || echo "push")"
echo "  Seed:      $([ "$SCHEMA_ONLY" == true ] && echo "skip" || echo "run")"
echo "========================================="
echo ""

read -rp "Continue? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

cd "$BACK_DIR"

# Resolve binaries — hoisted node_modules live at the repo root
DRIZZLE_KIT="$ROOT_DIR/node_modules/.bin/drizzle-kit"
TSX="$ROOT_DIR/node_modules/.bin/tsx"

# Step 1: Push schema
if [[ "$SEED_ONLY" == false ]]; then
  echo ""
  echo "--- Pushing schema to database ---"
  "$DRIZZLE_KIT" push --force
  echo "Schema push complete."
fi

# Step 2: Seed data
if [[ "$SCHEMA_ONLY" == false ]]; then
  echo ""
  if [[ "$DEV_SEED" == true ]]; then
    echo "--- Seeding database (dev) ---"
    "$TSX" src/lib/db/seed.ts
  else
    echo "--- Seeding database (production) ---"
    "$TSX" src/lib/db/seed-production.ts
  fi
fi

echo ""
echo "========================================="
echo "  Setup complete!"
echo "========================================="
