FROM node:24.12.0-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

COPY . .
RUN pnpm tsc --noEmit

ENV HOST=0.0.0.0
ENV PORT=3333
ENV NOTES_PATH=

EXPOSE 3333

CMD ["node", "src/server.ts"]
