#!/bin/bash

# scripts/check-travelline.sh

LOG_FILE="/var/www/lovelifestyle/logs/travelline-cron.log"
LAST_SYNC=$(tail -100 ${LOG_FILE} | grep "RUN SUMMARY" | tail -1)

if [ -z "$LAST_SYNC" ]; then
    echo "⚠️  Синхронизация не выполнялась!"
    exit 1
fi

echo "✅ Последняя синхронизация:"
echo "$LAST_SYNC"