#!/bin/sh
set -eu
npx --no-install playwright install chromium
exec npx --no-install playwright test "$@"
