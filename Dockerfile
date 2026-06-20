FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install

COPY . .

RUN bun run build

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "preview", "--host", "0.0.0.0", "--port", "3000"]