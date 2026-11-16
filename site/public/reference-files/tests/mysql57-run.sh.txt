#!/usr/bin/env bash
set -euo pipefail
test_dir="$(cd "$(dirname "$0")" && pwd)"
project="rivomesh-mysql57-test-$$"
compose=(docker compose -p "$project" -f "$test_dir/compose.yml" -f "$test_dir/mysql57-compose.yml")
cleanup() {
    status=$?
    if [ "$status" -ne 0 ]; then "${compose[@]}" logs --tail 80; fi
    "${compose[@]}" down -v --remove-orphans
}
trap cleanup EXIT
"${compose[@]}" run --rm tests
