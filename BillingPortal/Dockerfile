FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY server.mjs ./
COPY index.html ./
COPY src ./src
COPY assets ./assets

ENV PORT=3000
ENV API_BASE_URL=http://localhost:5000

EXPOSE 3000

CMD ["node", "server.mjs"]
