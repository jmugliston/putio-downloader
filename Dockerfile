FROM node:lts-alpine

WORKDIR /app

ENV NODE_ENV production
ENV SERVICE Template

RUN npm install npm@latest -g
RUN apk add dumb-init

COPY --chown=node:node package.json package-lock.json ./
RUN npm install --no-optional && npm cache clean --force
COPY --chown=node:node src ./src

USER node

CMD ["dumb-init", "npm", "start"]