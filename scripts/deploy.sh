#!/usr/bin/env sh

set -e

bun run build

cd dist

git init
git add -A
git commit -m 'New Deployment'

if [ -z "$GITHUB_TOKEN" ]; then
  exit 1
fi

git remote add origin https://x-access-token:${GITHUB_TOKEN}@github.com/Moouncat/wordle-web.git
git push -f origin master:gh-pages

cd -
