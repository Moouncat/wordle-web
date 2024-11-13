#!/usr/bin/env sh

set -e

bun run build

cd dist

git init
git add -A
git commit -m 'New Deployment'
git push -f git@github.com:Moouncat/wordle-web.git master:gh-pages

cd -