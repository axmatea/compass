FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node dist ./dist
USER node
ENV NODE_ENV=production
CMD ["node", "server.mjs"]
