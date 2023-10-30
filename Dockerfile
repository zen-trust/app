FROM node:20-slim AS build
WORKDIR /app

COPY --link package.json package-lock.json /app/
COPY --link packages/code-style/package.json /app/packages/code-style/package.json
COPY --link packages/json-api/package.json /app/packages/json-api/package.json
COPY --link packages/client/package.json /app/packages/client/package.json
COPY --link packages/server/package.json /app/packages/server/package.json
RUN npm install \
      --no-update-notifier \
      --no-progress \
      --no-audit \
      --no-fund
COPY --link . .
RUN npm run --no-update-notifier --workspaces build

FROM build AS development
ENV NODE_ENV=development

RUN set -eux; \
    apt update; \
    apt install --yes --no-install-recommends \
      procps \
    ; \
    rm -rf /var/lib/apt/lists/*

CMD ["npm", "run", "dev"]

FROM node:20-slim AS production
ENV NODE_ENV=production
ENV SERVER_LISTEN_PORT=3000
ENV CLIENT_LISTEN_PORT=5371
ENV NO_UPDATE_NOTIFIER=true
WORKDIR /app

COPY --link --from=build /app/package.json /app/package-lock.json /app/
COPY --link --from=bunild /app/node_modules /app/node_modules
COPY --link --from=build /app/dist /app/dist
RUN npm ci \
      --no-update-notifier \
      --no-progress \
      --omit=dev \
      --no-audit \
      --no-fund

EXPOSE 3000
CMD ["npm", "run", "start"]
