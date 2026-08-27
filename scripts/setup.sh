#!/bin/bash
# MissionControl - One-command setup (Linux/macOS)
set -e

echo "========================================="
echo "  MissionControl - DevOps Incident Response Agent"
echo "  Setup Script"
echo "========================================="
echo ""

echo "[1/6] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Error: docker is required. Install Docker Desktop."; exit 1; }
if command -v node >/dev/null 2>&1; then echo "  - Node: $(node --version)"; else echo "Error: node 18+ is required."; exit 1; fi
PYTHON_BIN="$(command -v python3 || command -v python)"
[ -n "$PYTHON_BIN" ] || { echo "Error: python 3.10+ is required."; exit 1; }
echo "  - Python: $($PYTHON_BIN --version)"

# Detect Docker Compose (v2 plugin or legacy standalone); both must be 2.x.
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  if docker-compose version 2>&1 | grep -q "v2"; then
    DOCKER_COMPOSE="docker-compose"
  else
    echo "Error: docker-compose (legacy) found but is not v2; install 'docker compose' plugin."; exit 1
  fi
else
  echo "Error: docker compose v2 is required."; exit 1
fi
echo "  - Compose: $DOCKER_COMPOSE"
echo ""

echo "[2/6] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  Created .env from .env.example"
    echo "  IMPORTANT: edit .env and add your OPENAI_API_KEY before starting TrueForge."
else
    echo "  .env already exists"
fi
echo ""

echo "[3/6] Building and starting demo infrastructure + MCP server..."
$DOCKER_COMPOSE up -d --build postgres redis demo-infra-mcp
sleep 5
curl -fs http://localhost:8001/health >/dev/null && echo "  MCP server healthy at http://localhost:8000/mcp (API on :8001)" \
  || echo "  WARNING: MCP server not responding yet - check 'docker compose logs demo-infra-mcp'"
echo ""

echo "[4/6] Installing dashboard dependencies..."
(cd apps/dashboard && npm install)
echo "  Dashboard dependencies installed"
echo ""

echo "[5/6] Building and starting the dashboard (background)..."
(cd apps/dashboard && npm run build)
(cd apps/dashboard && nohup npm run dev >/tmp/missioncontrol-dashboard.log 2>&1 &)
sleep 5
echo "  Dashboard built and starting on http://localhost:3001 (log: /tmp/missioncontrol-dashboard.log)"
echo ""

echo "[6/6] Starting TrueForge agent runtime..."
echo "  Run in a separate terminal:"
echo ""
echo "      npx @truefoundry/trueforge"
echo ""
echo "  Then in the TrueForge UI (http://localhost:3000):"
echo "    a. Connect your model provider (OpenAI key from .env)"
echo "    b. Add an MCP server -> URL: http://localhost:8000/mcp"
echo "    c. Create an agent named 'missioncontrol' using agent/system-prompt.md"
echo "       as the system prompt and agent/skills/incident-response/SKILL.md"
echo "       as a skill. Require approval for rollback_deploy / restart_service."
echo ""

echo "========================================="
echo "  MissionControl is ready!"
echo "========================================="
echo ""
echo "  TrueForge UI:   http://localhost:3000   (after 'npx @truefoundry/trueforge')"
echo "  Dashboard:      http://localhost:3001"
echo "  MCP endpoint:   http://localhost:8000/mcp"
echo "  REST API:       http://localhost:8001"
echo ""
