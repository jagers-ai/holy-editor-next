#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)

git config core.hooksPath "$REPO_ROOT/.githooks"

echo "core.hooksPath가 $REPO_ROOT/.githooks 로 설정되었습니다."
