#!/bin/sh
set -eu
export TZ=UTC
export JEST_JUNIT_OUTPUT_DIR=reports/test
export JEST_JUNIT_OUTPUT_NAME=junit.xml
npm run check:locales
npx --no-install jest --ci --reporters=default --reporters=jest-junit
