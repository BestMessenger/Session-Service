FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm i
EXPOSE 7000

CMD ["node", "src/index.js"]
