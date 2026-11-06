#!/bin/sh
set -eu
npx --no-install tsc --noEmit "$@"
