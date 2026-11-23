# Build context: repository root (npm workspaces share one lockfile).
FROM node:26.13.1-bookworm-slim

WORKDIR /opt/workspace
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/cms/package.json apps/cms/
RUN npm ci --workspace apps/cms --workspace packages/shared --include=dev

COPY packages/shared packages/shared
COPY apps/cms apps/cms
RUN npm run build --workspace packages/shared && npm run build --workspace apps/cms

WORKDIR /opt/workspace/apps/cms
ENV DATABASE_CLIENT=sqlite \
    DATABASE_FILENAME=data/data.db \
    SECRETS_FILE=/opt/workspace/apps/cms/data/secrets.env
VOLUME /opt/workspace/apps/cms/data
EXPOSE 1337

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
