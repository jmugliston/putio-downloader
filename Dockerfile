FROM node:lts-alpine as build

WORKDIR /app

ENV NODE_ENV production
ENV SERVICE Template

RUN apk add dumb-init

COPY --chown=node:node package.json .
COPY --chown=node:node package-lock.json .
COPY --chown=node:node src ./src

RUN npm install

USER node

CMD ["dumb-init", "npm", "start"]