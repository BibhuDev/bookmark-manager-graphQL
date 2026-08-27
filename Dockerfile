# 1. Base stage for dependencies & Prisma generation
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy schema and generate Prisma Client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy the rest of the application source
COPY tsconfig.json ./
COPY src ./src

# Set production environment
ENV NODE_ENV=production
EXPOSE 4000

# Start GraphQL Yoga server
CMD ["bun", "run", "src/index.ts"]