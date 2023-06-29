FROM node:20-alpine3.17

ARG BACKEND_WORK_DIR

WORKDIR ${BACKEND_WORK_DIR}

RUN yarn

CMD [ "yarn", "dev"]