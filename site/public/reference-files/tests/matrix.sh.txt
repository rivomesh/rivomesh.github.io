#!/usr/bin/env bash
set -euo pipefail
test_dir="$(cd "$(dirname "$0")" && pwd)"
project_dir="$(cd "$test_dir/.." && pwd)"
registry="${SYNC_MYSQL_REGISTRY:-mysql}"
for version in 8.0 8.4; do
    for suite in integration ha group; do
        printf 'Running %s tests against MySQL %s\n' "$suite" "$version"
        case "$suite" in
            integration) script=run.sh ;;
            ha) script=ha-run.sh ;;
            group) script=group-run.sh ;;
        esac
        SYNC_MYSQL_IMAGE="$registry:$version" "$test_dir/$script"
        report_dir="$project_dir/target/matrix-ha/$version/$suite"
        mkdir -p "$report_dir"
        cp "$project_dir"/sync-app/target/surefire-reports/"$suite"/TEST-*.xml "$report_dir/"
    done
done
