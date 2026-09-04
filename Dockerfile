FROM node:22

WORKDIR /app/backend

# Copy package files first for Docker layer caching
COPY backend/package*.json ./

# Install application dependencies
RUN npm install

# Install PM2
RUN npm install -g pm2

# Copy backend application
COPY backend/ ./

# Node.js application port
EXPOSE 3010

# Start 3 PM2 cluster workers
CMD ["pm2-runtime", "start", "index.js", "-i", "3"]