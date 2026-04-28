#!/bin/bash

aws s3 sync ./dist s3://wotstat.info \
  --cache-control "max-age=3600, public" \
  --endpoint-url=https://storage.yandexcloud.net/ \
  --delete \
  --profile=wotstat

aws s3 cp \
  s3://wotstat.info/index.html s3://wotstat.info/index.html \
  --cache-control "public, max-age=300" \
  --endpoint-url=https://storage.yandexcloud.net/ \
  --profile=wotstat

