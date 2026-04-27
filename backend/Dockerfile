# Build from repo root: docker build -f backend/Dockerfile .

# Stage 1: Build admin SPA (requires admin/ to exist — see Plan 2)
FROM node:24-alpine AS admin-build
WORKDIR /admin
COPY admin/package*.json ./
RUN npm ci
COPY admin .
ARG VITE_API_URL=https://api.finnslandzunge.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Build NestJS backend
FROM node:24-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend .
RUN npm run build

# Stage 3: Production image
FROM node:24-alpine
WORKDIR /app
COPY --from=backend-build --chown=node:node /app/dist ./dist
COPY --from=backend-build --chown=node:node /app/node_modules ./node_modules
COPY --from=admin-build --chown=node:node /admin/dist ./public/admin
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/guestbook || exit 1
USER node
CMD ["node", "dist/main"]
