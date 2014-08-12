#!/usr/bin/env bash
set -e

info() { echo "$0: $1"; }
build() { info "Peforming $1 build"; }

# Only build on non-forks
[[ "TRAVIS_REPO_SLUG" == "eHealthAfrica/sense-ebola-dashboard" ]] || exit 1

if [[ "$TRAVIS_TAG" ]]; then
  build "release"
  grunt build:prod
else
  build "snapshot"
  grunt build
fi
