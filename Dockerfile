FROM node:22

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --include=optional

RUN npm install -g pm2

COPY . .

EXPOSE 3338
EXPOSE 3339

CMD ["pm2-runtime", "start", "index.js", "-i", "3"]