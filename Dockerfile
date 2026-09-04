FROM node:22

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm install

RUN npm install -g pm2

COPY backend/ ./

EXPOSE 3338
EXPOSE 3339

CMD ["pm2-runtime", "start", "index.js", "-i", "3"]