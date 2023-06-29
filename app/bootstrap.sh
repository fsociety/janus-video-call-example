#!/bin/bash

yarn

if [ "$ENVIRONMENT" = "prod" ]; then
  yarn build:prod && tail -f /dev/null
else
  yarn serve
fi
