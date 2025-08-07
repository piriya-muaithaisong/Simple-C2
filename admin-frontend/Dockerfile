FROM node:18-alpine

WORKDIR /app

COPY package*.json npm-shrinkwrap.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "build"]