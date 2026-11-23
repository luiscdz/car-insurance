# Build context: repository root (npm workspaces share one lockfile).
FROM node:26.13.1-bookworm-slim AS build

WORKDIR /opt/workspace

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/web --workspace packages/shared

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build --workspace packages/shared && npm run build --workspace apps/web

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /opt/workspace/apps/web/dist/web/browser /usr/share/nginx/html
EXPOSE 80
