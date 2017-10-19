FROM node:latest

WORKDIR /app

COPY db messages package*.json watchlist .

RUN npm install --production

EXPOSE 80
ENTRYPOINT [ "node", "index.js" ]
