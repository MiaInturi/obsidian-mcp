FROM node:24.12.0-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

COPY . .
RUN yarn tsc --noEmit

EXPOSE 3333

CMD ["node", "src/server.ts"]
