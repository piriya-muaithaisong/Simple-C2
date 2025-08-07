FROM node:18-alpine

WORKDIR /app

COPY package*.json npm-shrinkwrap.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/admin-frontend/build

EXPOSE 8080

CMD ["node", "server.js"]