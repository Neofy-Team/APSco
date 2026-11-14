FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/package.json
RUN npm ci
COPY api api
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/api/package.json ./api/package.json
COPY --from=build --chown=node:node /app/api/dist ./api/dist
COPY --from=build --chown=node:node /app/api/scripts ./api/scripts
COPY --from=build --chown=node:node /app/api/src/database/migrations ./api/src/database/migrations
USER node
WORKDIR /app/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
