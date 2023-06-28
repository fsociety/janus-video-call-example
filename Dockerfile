FROM node:20-alpine3.17

WORKDIR /app

RUN yarn

CMD [ "yarn", "start"]