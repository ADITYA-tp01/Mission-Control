#!/usr/bin/env bash
# MissionControl - repository-supplied TrueForge launcher.
#
# Runs from the repo checkout, so a clean clone works without any
# per-developer home scripts. Reads OPENAI_API_KEY from the repo's .env
# (created by setup) unless OPENAI_API_KEY is already exported.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ -f "$REPO_DIR/.env" ]; then
    set -a
    . "$REPO_DIR/.env"
    set +a
fi

export OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://integrate.api.nvidia.com/v1}"

if [ -d "$HOME/.local/node/bin" ]; then
    export PATH="$HOME/.local/node/bin:$PATH"
fi

cd "$HOME"
export HOST=0.0.0.0
export PORT=8790
exec npx -y @truefoundry/trueforge