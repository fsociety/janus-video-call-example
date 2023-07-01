#!/bin/bash

yarn

if [ "$ENVIRONMENT" = "prod" ]; then
  yarn start
else
  yarn dev
fi
