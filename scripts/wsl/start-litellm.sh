#!/usr/bin/env bash
# MissionControl - repository-supplied LiteLLM bridge launcher (port 4000).
#
# Per-machine LiteLLM setup is discoverable, never hard-coded:
#   NIM_ENV        optional file to source  (default: ~/nim.env if it exists)
#   LITELLM_BIN    litellm executable       (default: ~/litenv/bin/litellm, else `litellm` on PATH)
#   LITELLM_CONFIG config yaml              (default: ~/litellm.yaml)
set -euo pipefail

if [ -z "${NIM_ENV:-}" ] && [ -f "$HOME/nim.env" ]; then
    NIM_ENV="$HOME/nim.env"
fi
if [ -n "${NIM_ENV:-}" ]; then
    if [ ! -f "$NIM_ENV" ]; then
        echo "start-litellm.sh: NIM_ENV file not found: $NIM_ENV" >&2
        exit 1
    fi
    set -a
    . "$NIM_ENV"
    set +a
fi

if [ -z "${LITELLM_BIN:-}" ] && [ -x "$HOME/litenv/bin/litellm" ]; then
    LITELLM_BIN="$HOME/litenv/bin/litellm"
fi
LITELLM_BIN="${LITELLM_BIN:-litellm}"

LITELLM_CONFIG="${LITELLM_CONFIG:-$HOME/litellm.yaml}"
if [ ! -f "$LITELLM_CONFIG" ]; then
    echo "start-litellm.sh: config not found: $LITELLM_CONFIG (set LITELLM_CONFIG to your litellm yaml)" >&2
    exit 1
fi

exec "$LITELLM_BIN" --config "$LITELLM_CONFIG" --host 127.0.0.1 --port 4000