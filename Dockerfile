# CiveHub Drive Service — File management, uploads, welcome PDF.
# Multi-stage: build in Alpine, run production dist + node_modules.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
ENV STORAGE_ROOT=/app/uploads
EXPOSE 3015
CMD ["node", "dist/main.js"]
