FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# --------------------------------------------------
# System packages
# --------------------------------------------------

RUN apt-get update && apt-get install -y \
    nginx \
    mysql-server \
    supervisor \
    curl \
    ca-certificates \
    bash \
    procps \
    net-tools \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------
# Application directories
# --------------------------------------------------

WORKDIR /app

# --------------------------------------------------
# Backend
# --------------------------------------------------

COPY backend /app/backend

WORKDIR /app/backend

# Install production dependencies
RUN if [ -f package-lock.json ]; then \
        npm ci --omit=dev; \
    else \
        npm install --omit=dev; \
    fi

# --------------------------------------------------
# Frontend
# --------------------------------------------------

COPY frontend /var/www/html

# --------------------------------------------------
# SQL
# --------------------------------------------------

COPY ecwid.sql /docker-entrypoint-initdb.d/ecwid.sql

# --------------------------------------------------
# Nginx
# --------------------------------------------------

COPY nginx.conf /etc/nginx/sites-available/default

# Remove default nginx config if necessary
RUN rm -f /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# --------------------------------------------------
# Supervisor
# --------------------------------------------------

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# --------------------------------------------------
# Startup script
# --------------------------------------------------

COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

# --------------------------------------------------
# Port
# --------------------------------------------------

EXPOSE 80

CMD ["/docker-entrypoint.sh"]