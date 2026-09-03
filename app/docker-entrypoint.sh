#!/bin/bash

set -e

echo ""
echo "=========================================="
echo " ECWID APPLICATION"
echo "=========================================="
echo ""

# --------------------------------------------------
# MySQL runtime directory
# --------------------------------------------------

mkdir -p /run/mysqld

chown mysql:mysql /run/mysqld

# --------------------------------------------------
# Check MySQL data directory
# --------------------------------------------------

if [ ! -d "/var/lib/mysql/mysql" ]; then

    echo "Initializing MySQL database..."

    mysqld --initialize-insecure \
        --user=mysql \
        --datadir=/var/lib/mysql

fi

# --------------------------------------------------
# Start MySQL temporarily
# --------------------------------------------------

echo "Starting MySQL..."

mysqld_safe \
    --datadir=/var/lib/mysql \
    --skip-networking \
    > /var/log/mysql-startup.log 2>&1 &

MYSQL_PID=$!

# --------------------------------------------------
# Wait for MySQL
# --------------------------------------------------

echo "Waiting for MySQL..."

for i in {1..60}; do

    if mysqladmin ping --silent 2>/dev/null; then
        echo "MySQL is ready."
        break
    fi

    sleep 1

done

if ! mysqladmin ping --silent 2>/dev/null; then

    echo "ERROR: MySQL failed to start."

    cat /var/log/mysql-startup.log

    exit 1

fi

# --------------------------------------------------
# Database configuration
# --------------------------------------------------

DB_NAME="${DB_NAME:-ecwid}"
DB_USER="${DB_USER:-ecwid}"
DB_PASSWORD="${DB_PASSWORD:-ecwid_password}"

echo "Database: ${DB_NAME}"
echo "Database user: ${DB_USER}"

# --------------------------------------------------
# Create database
# --------------------------------------------------

mysql <<EOF

CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;

CREATE USER IF NOT EXISTS
    '${DB_USER}'@'localhost'
    IDENTIFIED BY '${DB_PASSWORD}';

ALTER USER
    '${DB_USER}'@'localhost'
    IDENTIFIED BY '${DB_PASSWORD}';

GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.*
    TO '${DB_USER}'@'localhost';

FLUSH PRIVILEGES;

EOF

# --------------------------------------------------
# Import SQL only once
# --------------------------------------------------

INIT_FLAG="/var/lib/mysql/.ecwid_sql_imported"

if [ ! -f "$INIT_FLAG" ]; then

    echo ""
    echo "=========================================="
    echo " Importing ecwid.sql"
    echo "=========================================="

    if [ -f "/docker-entrypoint-initdb.d/ecwid.sql" ]; then

        mysql "${DB_NAME}" \
            < /docker-entrypoint-initdb.d/ecwid.sql

        touch "$INIT_FLAG"

        echo "SQL import completed."

    else

        echo "WARNING: ecwid.sql not found."

    fi

else

    echo ""
    echo "Database already initialized."
    echo "Skipping ecwid.sql import."

fi

# --------------------------------------------------
# Stop temporary MySQL
# --------------------------------------------------

echo "Stopping temporary MySQL..."

mysqladmin shutdown || true

sleep 3

# --------------------------------------------------
# Start all services
# --------------------------------------------------

echo ""
echo "=========================================="
echo " Starting application"
echo "=========================================="
echo ""
echo "Nginx       : Port 80"
echo "Node.js     : Port 3000"
echo "Workers     : 3"
echo "Database    : MySQL"
echo ""

exec /usr/bin/supervisord -n