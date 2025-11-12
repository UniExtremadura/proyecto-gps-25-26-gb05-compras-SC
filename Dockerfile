FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./

RUN npm i --quiet

COPY . .

RUN npm run build
RUN npm prune --production

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main.js"]