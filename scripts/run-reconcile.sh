#!/bin/bash

# scripts/run-reconcile.sh
# Cron wrapper for the full Travelline reconciliation.
# Runs in dry-run mode by default; pass --apply to actually apply changes.
#
# Cron example (daily at 04:00, apply mode):
#   0 4 * * * /var/www/lovelifestyle/scripts/run-reconcile.sh --apply >> /var/www/lovelifestyle/logs/travelline-reconcile.log 2>&1

LOCKFILE="/tmp/travelline-reconcile.lock"
LOGFILE="/var/www/lovelifestyle/logs/travelline-reconcile.log"
APPLY_FLAG="${1:-}"  # pass --apply as first argument

# Prevent concurrent runs
if [ -e "${LOCKFILE}" ] && kill -0 "$(cat ${LOCKFILE})" 2>/dev/null; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') WARNING: reconcile already running, skipping" >> "${LOGFILE}"
    exit 1
fi

echo $$ > "${LOCKFILE}"
trap "rm -f ${LOCKFILE}" EXIT

echo "$(date '+%Y-%m-%d %H:%M:%S') Starting reconcile (mode: ${APPLY_FLAG:-dry-run})..." >> "${LOGFILE}"

cd /var/www/lovelifestyle
flock -n "${LOCKFILE}" /usr/bin/node scripts/reconcile-travelline.js ${APPLY_FLAG} >> "${LOGFILE}" 2>&1
EXIT_CODE=$?

echo "$(date '+%Y-%m-%d %H:%M:%S') Reconcile finished (exit: ${EXIT_CODE})" >> "${LOGFILE}"
exit ${EXIT_CODE}
