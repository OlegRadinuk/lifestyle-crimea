#!/bin/bash
BACKUP_DIR=/var/www/lovelifestyle/backups/uploads
UPLOADS_DIR=/var/www/lovelifestyle/uploads
DATE=$(date +%Y-%m-%d)

mkdir -p "$BACKUP_DIR"

# Create compressed archive
tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" -C "$UPLOADS_DIR" . 2>/dev/null
echo "$(date): uploads backup created: uploads-$DATE.tar.gz ($(du -sh $BACKUP_DIR/uploads-$DATE.tar.gz | cut -f1))"

# Rotate: keep last 7 days
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +7 -delete
echo "$(date): rotation done"
