var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/config.ts
var config_exports = {};
__export(config_exports, {
  default: () => config_default,
  getPublicBaseUrl: () => getPublicBaseUrl,
  isOidcConfigured: () => isOidcConfigured,
  parseOidcScopes: () => parseOidcScopes
});
import { existsSync as existsSync2 } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import envPaths from "env-paths";
function getEnv(key, options) {
  const value = process.env[key];
  if (value !== void 0) {
    return value;
  }
  if (options?.defaultValue !== void 0) {
    return options.defaultValue;
  }
  if (options?.required) {
    throw new Error(`Environment variable ${key} is required but was not specified.`);
  }
  return void 0;
}
function randomAlphanumeric(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}
function parsePort(raw) {
  if (raw === void 0 || raw.trim() === "") {
    return DEFAULT_PORT;
  }
  const port2 = Number(raw);
  if (!Number.isInteger(port2) || port2 < 1 || port2 > 65535) {
    throw new Error(`Environment variable PORT must be an integer between 1 and 65535, got "${raw}"`);
  }
  return port2;
}
function parseOidcScopes(raw) {
  const scopes = raw.split(",").map((part) => part.trim()).filter((part) => part.length > 0);
  if (scopes.length === 0) {
    throw new Error("OIDC_SCOPES must contain at least one scope.");
  }
  return scopes;
}
function parsePositiveInt(options) {
  const { envKey, raw, defaultValue } = options;
  if (raw === void 0 || raw.trim() === "") {
    return defaultValue;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Environment variable ${envKey} must be a positive integer, got "${raw}"`);
  }
  return value;
}
function parseBoolean(options) {
  const { envKey, raw, defaultValue } = options;
  if (raw === void 0 || raw.trim() === "") {
    return defaultValue;
  }
  const value = raw.trim().toLowerCase();
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`Environment variable ${envKey} must be "true" or "false", got "${raw}"`);
}
function resolveDefaultFrontendDir() {
  const packaged = path.join(PACKAGE_ROOT, "dist", "_frontend");
  if (existsSync2(path.join(packaged, "index.html"))) {
    return packaged;
  }
  return path.join(PACKAGE_ROOT, "..", "frontend", "dist");
}
function resolveFrontendDir() {
  const override = getEnv("FRONTEND_DIR");
  if (override !== void 0 && override.trim() !== "") {
    return path.resolve(override);
  }
  return resolveDefaultFrontendDir();
}
function resolveOptionalPathEnv(envKey) {
  const override = getEnv(envKey);
  if (override === void 0 || override.trim() === "") {
    return void 0;
  }
  return path.resolve(override);
}
function resolveSqlitePath() {
  const override = getEnv("SQLITE_PATH");
  if (override !== void 0 && override.trim() !== "") {
    return path.resolve(override);
  }
  const paths = envPaths(ENV_PATHS_APP_NAME, { suffix: "" });
  return path.join(paths.data, "db", "db.sqlite");
}
function resolveLocalSandboxRootParent() {
  return path.join(envPaths(ENV_PATHS_APP_NAME, { suffix: "" }).data, "sandboxes");
}
function resolveCodeModeSocketParent() {
  return path.join(os.tmpdir(), "tf_cms");
}
function resolveRedisUrl() {
  const raw = getEnv("REDIS_URL", { defaultValue: DEFAULT_REDIS_URL }) ?? DEFAULT_REDIS_URL;
  if (raw.trim() === "") {
    throw new Error("Environment variable REDIS_URL must be non-empty when STANDALONE=false.");
  }
  return raw;
}
function resolvePostgresDatabaseUrl() {
  const postgresUser = getEnv("POSTGRES_USER", { defaultValue: DEFAULT_POSTGRES_USER }) ?? DEFAULT_POSTGRES_USER;
  const postgresPassword = getEnv("POSTGRES_PASSWORD", { defaultValue: DEFAULT_POSTGRES_PASSWORD }) ?? DEFAULT_POSTGRES_PASSWORD;
  const postgresDb = getEnv("POSTGRES_DB", { defaultValue: DEFAULT_POSTGRES_DB }) ?? DEFAULT_POSTGRES_DB;
  const postgresHost = getEnv("POSTGRES_HOST", { defaultValue: DEFAULT_POSTGRES_HOST }) ?? DEFAULT_POSTGRES_HOST;
  const postgresPort = parsePositiveInt({
    envKey: "POSTGRES_PORT",
    raw: getEnv("POSTGRES_PORT"),
    defaultValue: DEFAULT_POSTGRES_PORT
  });
  if (postgresUser.trim() === "" || postgresPassword.trim() === "" || postgresDb.trim() === "" || postgresHost.trim() === "") {
    throw new Error(
      "POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, and POSTGRES_HOST must be non-empty when STANDALONE=false."
    );
  }
  return buildPostgresConnectionString({
    user: postgresUser,
    password: postgresPassword,
    host: postgresHost,
    port: postgresPort,
    database: postgresDb
  });
}
function buildPostgresConnectionString(parts) {
  return `postgres://${encodeURIComponent(parts.user)}:${encodeURIComponent(parts.password)}@${parts.host}:${String(parts.port)}/${encodeURIComponent(parts.database)}`;
}
function resolveOIDCConfig() {
  const issuerUrl = getEnv("OIDC_ISSUER_URL");
  const clientId = getEnv("OIDC_CLIENT_ID");
  const clientSecret = getEnv("OIDC_CLIENT_SECRET");
  if (!issuerUrl && !clientId && !clientSecret) {
    return void 0;
  }
  if (!issuerUrl || !clientId || !clientSecret) {
    throw new Error(
      "OIDC_ISSUER_URL, OIDC_CLIENT_ID, and OIDC_CLIENT_SECRET must all be set together, or all left unset (unset = fixed local admin identity, no IdP)."
    );
  }
  return {
    OIDC_ISSUER_URL: issuerUrl,
    OIDC_CLIENT_ID: clientId,
    OIDC_CLIENT_SECRET: clientSecret,
    OIDC_USER_REFERENCE_CLAIM: getEnv("OIDC_USER_REFERENCE_CLAIM", { defaultValue: DEFAULT_OIDC_USER_REFERENCE_CLAIM }) ?? DEFAULT_OIDC_USER_REFERENCE_CLAIM,
    OIDC_USER_ROLE_CLAIM: getEnv("OIDC_USER_ROLE_CLAIM", { defaultValue: DEFAULT_OIDC_USER_ROLE_CLAIM }) ?? DEFAULT_OIDC_USER_ROLE_CLAIM,
    OIDC_ADMIN_ROLE_VALUE: getEnv("OIDC_ADMIN_ROLE_VALUE", { defaultValue: DEFAULT_OIDC_ADMIN_ROLE_VALUE }) ?? DEFAULT_OIDC_ADMIN_ROLE_VALUE,
    OIDC_SCOPES: parseOidcScopes(getEnv("OIDC_SCOPES", { defaultValue: DEFAULT_OIDC_SCOPES }) ?? DEFAULT_OIDC_SCOPES)
  };
}
function isOidcConfigured(value) {
  return !value.STANDALONE && value.OIDC !== void 0;
}
function getPublicBaseUrl(config = configuration) {
  if (config.STANDALONE) {
    return `http://localhost:${String(config.PORT)}`;
  }
  if (config.PUBLIC_BASE_URL === "") {
    throw new Error("PUBLIC_BASE_URL is required for OIDC callbacks but was empty");
  }
  return config.PUBLIC_BASE_URL;
}
var DEFAULT_PORT, DEFAULT_HOST, DEFAULT_MAX_REQUEST_BODY_BYTES, PACKAGE_ROOT, LOCAL_EXECUTOR_ID, ENV_PATHS_APP_NAME, DEFAULT_POSTGRES_USER, DEFAULT_POSTGRES_PASSWORD, DEFAULT_POSTGRES_DB, DEFAULT_POSTGRES_HOST, DEFAULT_POSTGRES_PORT, DEFAULT_REDIS_URL, DEFAULT_OIDC_USER_REFERENCE_CLAIM, DEFAULT_OIDC_USER_ROLE_CLAIM, DEFAULT_OIDC_ADMIN_ROLE_VALUE, DEFAULT_OIDC_SCOPES, serverExecutionTimeoutSeconds, standalone, port, host, shared, configuration, config_default;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    DEFAULT_PORT = 8790;
    DEFAULT_HOST = "localhost";
    DEFAULT_MAX_REQUEST_BODY_BYTES = 30 * 1024 * 1024;
    PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    LOCAL_EXECUTOR_ID = "local";
    ENV_PATHS_APP_NAME = "trueforge";
    DEFAULT_POSTGRES_USER = "trueforge";
    DEFAULT_POSTGRES_PASSWORD = "trueforge";
    DEFAULT_POSTGRES_DB = "trueforge";
    DEFAULT_POSTGRES_HOST = "localhost";
    DEFAULT_POSTGRES_PORT = 5432;
    DEFAULT_REDIS_URL = "redis://localhost:6379";
    DEFAULT_OIDC_USER_REFERENCE_CLAIM = "sub";
    DEFAULT_OIDC_USER_ROLE_CLAIM = "groups";
    DEFAULT_OIDC_ADMIN_ROLE_VALUE = "admin";
    DEFAULT_OIDC_SCOPES = "openid,profile,email";
    serverExecutionTimeoutSeconds = parsePositiveInt({
      envKey: "SERVER_EXECUTION_TIMEOUT_SECONDS",
      raw: getEnv("SERVER_EXECUTION_TIMEOUT_SECONDS"),
      defaultValue: 600
    });
    standalone = parseBoolean({
      envKey: "STANDALONE",
      raw: getEnv("STANDALONE"),
      defaultValue: true
    });
    port = parsePort(getEnv("PORT"));
    host = getEnv("HOST", { defaultValue: DEFAULT_HOST }) ?? DEFAULT_HOST;
    shared = {
      LOG_LEVEL: getEnv("LOG_LEVEL", { defaultValue: "info" }) ?? "info",
      NODE_ENV: getEnv("NODE_ENV"),
      PORT: port,
      HOST: host,
      EXECUTOR_ID: standalone ? LOCAL_EXECUTOR_ID : randomAlphanumeric(6),
      MODEL_CATALOG_PATH: resolveOptionalPathEnv("MODEL_CATALOG_PATH"),
      MCP_CATALOG_PATH: resolveOptionalPathEnv("MCP_CATALOG_PATH"),
      SKILL_CATALOG_PATH: resolveOptionalPathEnv("SKILL_CATALOG_PATH"),
      SANDBOX_CATALOG_PATH: resolveOptionalPathEnv("SANDBOX_CATALOG_PATH"),
      FRONTEND_DIR: resolveFrontendDir(),
      MCP_REQUEST_TIMEOUT_MS: parsePositiveInt({
        envKey: "MCP_REQUEST_TIMEOUT_MS",
        raw: getEnv("MCP_REQUEST_TIMEOUT_MS"),
        defaultValue: 4 * 60 * 1e3
      }),
      MCP_CONNECT_TIMEOUT_MS: parsePositiveInt({
        envKey: "MCP_CONNECT_TIMEOUT_MS",
        raw: getEnv("MCP_CONNECT_TIMEOUT_MS"),
        defaultValue: 30 * 1e3
      }),
      MCP_DCR_OAUTH_CLIENT_NAME: getEnv("MCP_DCR_OAUTH_CLIENT_NAME", { defaultValue: "truefoundry-harness" }) ?? "truefoundry-harness",
      SANDBOX_FILE_MAX_BYTES_FOR_DOWNLOAD: parsePositiveInt({
        envKey: "SANDBOX_FILE_MAX_BYTES_FOR_DOWNLOAD",
        raw: getEnv("SANDBOX_FILE_MAX_BYTES_FOR_DOWNLOAD"),
        defaultValue: 20971520
      }),
      MAX_REQUEST_BODY_BYTES: parsePositiveInt({
        envKey: "MAX_REQUEST_BODY_BYTES",
        raw: getEnv("MAX_REQUEST_BODY_BYTES"),
        defaultValue: DEFAULT_MAX_REQUEST_BODY_BYTES
      }),
      GRACEFUL_TIMEOUT_SECONDS: parsePositiveInt({
        envKey: "GRACEFUL_TIMEOUT_SECONDS",
        raw: getEnv("GRACEFUL_TIMEOUT_SECONDS"),
        defaultValue: 30
      }),
      SERVER_EXECUTION_TIMEOUT_SECONDS: serverExecutionTimeoutSeconds,
      TURN_STREAM_TTL_SECONDS: parsePositiveInt({
        envKey: "TURN_STREAM_TTL_SECONDS",
        raw: getEnv("TURN_STREAM_TTL_SECONDS"),
        defaultValue: serverExecutionTimeoutSeconds + 300
      }),
      TURN_STREAM_POST_COMPLETION_TTL_SECONDS: parsePositiveInt({
        envKey: "TURN_STREAM_POST_COMPLETION_TTL_SECONDS",
        raw: getEnv("TURN_STREAM_POST_COMPLETION_TTL_SECONDS"),
        defaultValue: 300
      }),
      TURN_SUBSCRIBE_TIMEOUT_MS: parsePositiveInt({
        envKey: "TURN_SUBSCRIBE_TIMEOUT_MS",
        raw: getEnv("TURN_SUBSCRIBE_TIMEOUT_MS"),
        defaultValue: 6e5
      }),
      REDIS_REQUEST_REPLY_TIMEOUT_MS: parsePositiveInt({
        envKey: "REDIS_REQUEST_REPLY_TIMEOUT_MS",
        raw: getEnv("REDIS_REQUEST_REPLY_TIMEOUT_MS"),
        defaultValue: 6e4
      }),
      REDIS_REQUEST_REPLY_HEARTBEAT_INTERVAL_MS: parsePositiveInt({
        envKey: "REDIS_REQUEST_REPLY_HEARTBEAT_INTERVAL_MS",
        raw: getEnv("REDIS_REQUEST_REPLY_HEARTBEAT_INTERVAL_MS"),
        defaultValue: 5e3
      }),
      REDIS_REQUEST_REPLY_REPLY_TTL_MS: parsePositiveInt({
        envKey: "REDIS_REQUEST_REPLY_REPLY_TTL_MS",
        raw: getEnv("REDIS_REQUEST_REPLY_REPLY_TTL_MS"),
        defaultValue: 12e4
      }),
      REDIS_REQUEST_REPLY_POLL_INTERVAL_MS: parsePositiveInt({
        envKey: "REDIS_REQUEST_REPLY_POLL_INTERVAL_MS",
        raw: getEnv("REDIS_REQUEST_REPLY_POLL_INTERVAL_MS"),
        defaultValue: 500
      })
    };
    configuration = standalone ? {
      ...shared,
      STANDALONE: true,
      SQLITE_PATH: resolveSqlitePath(),
      LOCAL_SANDBOX_ROOT_PARENT: resolveLocalSandboxRootParent(),
      CODE_MODE_SOCKET_PARENT: resolveCodeModeSocketParent()
    } : {
      ...shared,
      STANDALONE: false,
      PUBLIC_BASE_URL: getEnv("PUBLIC_BASE_URL", { defaultValue: "" }) ?? "",
      DATABASE_URL: resolvePostgresDatabaseUrl(),
      DATABASE_POOL_MAX: parsePositiveInt({
        envKey: "DATABASE_POOL_MAX",
        raw: getEnv("DATABASE_POOL_MAX"),
        defaultValue: 10
      }),
      POSTGRES_STATEMENT_TIMEOUT_MS: parsePositiveInt({
        envKey: "POSTGRES_STATEMENT_TIMEOUT_MS",
        raw: getEnv("POSTGRES_STATEMENT_TIMEOUT_MS"),
        defaultValue: 6e4
      }),
      POSTGRES_IDLE_IN_TRANSACTION_SESSION_TIMEOUT_MS: parsePositiveInt({
        envKey: "POSTGRES_IDLE_IN_TRANSACTION_SESSION_TIMEOUT_MS",
        raw: getEnv("POSTGRES_IDLE_IN_TRANSACTION_SESSION_TIMEOUT_MS"),
        defaultValue: 6e4
      }),
      REDIS_URL: resolveRedisUrl(),
      OIDC: resolveOIDCConfig()
    };
    config_default = configuration;
  }
});

// src/db/agentStore.ts
import { AgentSpecSchema } from "@truefoundry/trueforge-core/agent-session";
function parseStoredAgentSpec(manifest) {
  return AgentSpecSchema.parse(manifest);
}
var AgentNameConflictError;
var init_agentStore = __esm({
  "src/db/agentStore.ts"() {
    "use strict";
    AgentNameConflictError = class extends Error {
      tenant_id;
      agent_name;
      constructor({ tenant_id, name }, options) {
        super(`Agent name already exists: ${name}`, options);
        this.name = "AgentNameConflictError";
        this.tenant_id = tenant_id;
        this.agent_name = name;
      }
    };
  }
});

// src/sandbox/local/sandboxScripts.gen.ts
var sandboxScripts;
var init_sandboxScripts_gen = __esm({
  "src/sandbox/local/sandboxScripts.gen.ts"() {
    "use strict";
    sandboxScripts = {
      mcpClientLocal: `#!/usr/bin/env python3
"""Code Mode UDS client \u2014 same public surface as product mcp_client.py, stdlib only.

Authoritative reference (do not diverge on API/CLI/policy semantics):
  packages/trueforge-core/src/core/sandbox/scripts/mcp_client.py

Inlined into TypeScript via scripts/generate-local-sandbox-scripts.mjs
(src/sandbox/local/sandboxScripts.gen.ts), same pattern as core sandboxScripts.
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import logging
import os
import socket
import sys
import time
from pathlib import Path
from typing import Any, TypedDict

logger = logging.getLogger(__name__)

MAX_MESSAGE_BYTES = 64 * 1024 * 1024
_TOOLS_CACHE_TTL_SECONDS = 600


class _ServerConfig(TypedDict):
    allowed_tools: list[str]


_inflight_list_tools: dict[str, asyncio.Task[list[dict[str, Any]]]] = {}

_raw_servers = os.environ.get("TFY_MCP_SERVERS")
_servers_map: dict[str, _ServerConfig] = (
    json.loads(base64.b64decode(_raw_servers).decode()) if _raw_servers else {}
)
_enable_agent_approvals = os.environ.get("TFY_ENABLE_AGENT_APPROVALS", "true").lower() == "true"


def _sock_path() -> str:
    path = os.environ.get("TFY_MCP_SOCK")
    if not path:
        raise RuntimeError("TFY_MCP_SOCK is not set")
    return path


def _request_timeout() -> float:
    return float(os.environ.get("TFY_CM_REQUEST_TIMEOUT_SECONDS", "60"))


def _check_tool_allowed(server: str, tool_name: str) -> None:
    server_config = _servers_map.get(server)
    if server_config is None:
        raise RuntimeError(f"Access denied: MCP server '{server}' is not available for this agent") from None
    server_tools = server_config.get("allowed_tools") or []
    if len(server_tools) > 0 and tool_name not in server_tools:
        raise RuntimeError(f"Access denied: tool '{tool_name}' is not enabled on server '{server}'") from None


def _cache_path(server: str) -> Path:
    return Path(__file__).parent / f"{server}.tools.json"


def _read_tools_cache(server: str) -> list[dict[str, Any]] | None:
    p = _cache_path(server)
    if not p.exists():
        return None
    try:
        raw = json.loads(p.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            raise ValueError("cache root must be object")
        fetched_at = raw.get("fetched_at")
        tools = raw.get("tools")
        if not isinstance(fetched_at, (int, float)) or not isinstance(tools, list):
            raise ValueError("cache shape invalid")
        if time.time() - float(fetched_at) > _TOOLS_CACHE_TTL_SECONDS:
            p.unlink(missing_ok=True)
            return None
        return [t for t in tools if isinstance(t, dict)]
    except Exception:
        logger.exception("_read_tools_cache")
        p.unlink(missing_ok=True)
        return None


def _write_tools_cache(server: str, tools: list[dict[str, Any]]) -> None:
    try:
        payload = {"fetched_at": time.time(), "tools": tools}
        _cache_path(server).write_text(json.dumps(payload), encoding="utf-8")
    except Exception:
        logger.exception("_write_tools_cache")


def _read_message(sock: socket.socket) -> Any:
    body = b""
    while True:
        chunk = sock.recv(65536)
        if not chunk:
            break
        body += chunk
        if len(body) > MAX_MESSAGE_BYTES:
            raise RuntimeError(f"message exceeds max {MAX_MESSAGE_BYTES} bytes")
    return json.loads(body.decode("utf-8"))


def _write_message(sock: socket.socket, value: Any) -> None:
    sock.sendall(json.dumps(value).encode("utf-8"))


def _uds_request_sync(payload: dict[str, Any]) -> Any:
    """Connect \u2192 JSON request \u2192 write-close \u2192 JSON reply (no request_id)."""
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    try:
        sock.settimeout(_request_timeout())
        sock.connect(_sock_path())
        _write_message(sock, payload)
        sock.shutdown(socket.SHUT_WR)
        reply = _read_message(sock)
    finally:
        sock.close()
    if not isinstance(reply, dict):
        raise RuntimeError(f"Code Mode reply is not an object: {reply!r}")
    ok = reply.get("ok")
    if ok is not True:
        source = reply.get("source", "internal")
        error = reply.get("error", "unknown error")
        if source == "caller":
            raise RuntimeError(f"Invalid MCP request: {error}")
        if source == "transport":
            raise RuntimeError(f"Code Mode transport error: {error}")
        raise RuntimeError(f"Internal MCP error: {error}")
    return reply.get("result")


async def _uds_request(payload: dict[str, Any]) -> Any:
    return await asyncio.to_thread(_uds_request_sync, payload)


async def _fetch_tools(server: str) -> list[dict[str, Any]]:
    result = await _uds_request({"op": "list_tools", "server": server})
    if not isinstance(result, dict):
        raise RuntimeError(f"list_tools '{server}' returned unexpected shape: {result!r}") from None
    tools = result.get("tools", [])
    if not isinstance(tools, list):
        raise RuntimeError(f"list_tools '{server}' tools is not a list: {tools!r}") from None
    return [t for t in tools if isinstance(t, dict)]


async def _fetch_and_cache_tools(server: str) -> list[dict[str, Any]]:
    tools = await _fetch_tools(server)
    _write_tools_cache(server, tools)
    return tools


async def _get_tools(server: str) -> list[dict[str, Any]]:
    cached = _read_tools_cache(server)
    if cached is not None:
        return cached
    task = _inflight_list_tools.get(server)
    if task is None:
        task = asyncio.create_task(_fetch_and_cache_tools(server))
        _inflight_list_tools[server] = task
        task.add_done_callback(lambda _t: _inflight_list_tools.pop(server, None))
    return await task


async def _get_tool(server: str, tool_name: str) -> dict[str, Any] | None:
    for t in await _get_tools(server):
        if t.get("name") == tool_name:
            return t
    return None


def _is_destructive(tool: dict[str, Any]) -> bool:
    annotations = tool.get("annotations")
    if annotations is None:
        return False
    if not isinstance(annotations, dict):
        return False
    destructive = annotations.get("destructiveHint")
    read_only = annotations.get("readOnlyHint")
    return bool(destructive) or (not read_only and read_only is not None)


async def _ensure_non_destructive(server: str, tool_name: str) -> None:
    tool = await _get_tool(server, tool_name)
    if tool is None:
        raise RuntimeError(f"Tool '{tool_name}' not found on MCP server '{server}'") from None
    if _is_destructive(tool):
        raise RuntimeError(
            f"Tool '{tool_name}' on MCP server '{server}' is destructive and cannot be called in Code Mode; "
            f"call it directly so it can go through the user approval flow"
        ) from None


def _project_call_tool_result(server: str, tool: str, result: Any) -> Any:
    """Project an MCP-wire CallToolResult-shaped object into the user-facing Python value."""
    if not isinstance(result, dict):
        raise RuntimeError(f"call_tool reply for '{server}/{tool}' is malformed: expected object") from None

    if result.get("isError"):
        content = result.get("content")
        text_parts: list[str] = []
        if isinstance(content, list):
            for c in content:
                if isinstance(c, dict) and c.get("type") == "text":
                    text = c.get("text")
                    if isinstance(text, str) and text:
                        text_parts.append(text)
        msg = "; ".join(text_parts) if text_parts else "tool returned an error"
        raise RuntimeError(f"MCP tool error (server={server}, tool={tool}): {msg}") from None

    if result.get("structuredContent") is not None:
        return result["structuredContent"]

    content = result.get("content")
    if isinstance(content, list) and len(content) == 1:
        first = content[0]
        if isinstance(first, dict) and first.get("type") == "text":
            text = first.get("text")
            if isinstance(text, str) and text:
                try:
                    return json.loads(text)
                except Exception:
                    pass
    if isinstance(content, list) and content:
        return content
    return None


async def call_tool(server: str, tool: str, body: dict[str, Any]) -> Any:
    _check_tool_allowed(server, tool)
    if _enable_agent_approvals:
        await _ensure_non_destructive(server, tool)

    raw = await _uds_request(
        {
            "op": "call_tool",
            "server": server,
            "tool": tool,
            "arguments": body,
        },
    )
    return _project_call_tool_result(server, tool, raw)


_USAGE = "mcp_client_local.py call-tool <server> <tool> <args-json>"


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="mcp_client_local.py", usage=_USAGE)
    sub = parser.add_subparsers(dest="cmd", required=True)

    call_tool_p = sub.add_parser("call-tool", help="Invoke an MCP tool")
    call_tool_p.add_argument("server")
    call_tool_p.add_argument("tool")
    call_tool_p.add_argument("args_json", metavar="args-json", type=json.loads)

    return parser


async def _main() -> None:
    args = _build_arg_parser().parse_args()
    try:
        if args.cmd == "call-tool":
            result = await call_tool(args.server, args.tool, args.args_json)
            print(json.dumps(result, default=str))
    except RuntimeError as e:
        sys.exit(str(e))


if __name__ == "__main__":
    asyncio.run(_main())
`
    };
  }
});

// src/sandbox/local/schemas/jsonMessage.ts
import { z as z5 } from "zod";
var JsonMessageValueSchema;
var init_jsonMessage = __esm({
  "src/sandbox/local/schemas/jsonMessage.ts"() {
    "use strict";
    JsonMessageValueSchema = z5.json();
  }
});

// src/sandbox/local/core/frame.ts
function encodeJsonMessage(value) {
  return Buffer.from(JSON.stringify(value), "utf8");
}
var MAX_MESSAGE_BYTES, JsonMessageReader;
var init_frame = __esm({
  "src/sandbox/local/core/frame.ts"() {
    "use strict";
    init_jsonMessage();
    MAX_MESSAGE_BYTES = 64 * 1024 * 1024;
    JsonMessageReader = class {
      #buffer = Buffer.alloc(0);
      #maxBytes;
      constructor(options = {}) {
        this.#maxBytes = options.maxBytes ?? MAX_MESSAGE_BYTES;
      }
      push(chunk) {
        if (this.#buffer.length + chunk.length > this.#maxBytes) {
          throw new Error(`message exceeds max ${String(this.#maxBytes)} bytes`);
        }
        this.#buffer = Buffer.concat([this.#buffer, chunk]);
      }
      finish() {
        try {
          return JsonMessageValueSchema.parse(JSON.parse(this.#buffer.toString("utf8")));
        } catch (error) {
          throw new Error("invalid JSON message", { cause: error });
        }
      }
    };
  }
});

// src/sandbox/local/core/CodeModeUdsTransport.ts
import { CodeModeRequestSchema, validateNoPathTraversal } from "@truefoundry/trueforge-core/core";
import { chmodSync, existsSync as existsSync3, realpathSync, statSync } from "fs";
import { chmod, mkdir as mkdir2, rm as rm2, symlink, unlink, writeFile } from "fs/promises";
import { createServer } from "net";
import { dirname, isAbsolute, join, resolve } from "path";
import { ulid } from "ulid";
function assertCodeModeSocketParentPath(path7) {
  if (!isAbsolute(path7)) {
    throw new Error("codeModeSocketParentPath must be an absolute path");
  }
  validateNoPathTraversal(path7);
  const resolved = resolve(path7);
  if (!existsSync3(resolved) || !statSync(resolved).isDirectory()) {
    throw new Error("codeModeSocketParentPath must be an existing directory");
  }
  const real = realpathSync(resolved);
  const bytes = Buffer.byteLength(real);
  if (bytes > MAX_CODE_MODE_SOCKET_PARENT_BYTES) {
    throw new Error(
      `codeModeSocketParentPath (${real}) must be at most ${String(MAX_CODE_MODE_SOCKET_PARENT_BYTES)} bytes (got ${String(bytes)})`
    );
  }
  chmodSync(real, CODE_MODE_SOCKET_PARENT_MODE);
  const mode = statSync(real).mode & 511;
  if (mode !== CODE_MODE_SOCKET_PARENT_MODE) {
    throw new Error(`codeModeSocketParentPath must be mode 0700 after chmod (got 0o${mode.toString(8)})`);
  }
  return real;
}
async function probeCodeModeUnixSocket(parentPath) {
  const realParent = assertCodeModeSocketParentPath(parentPath);
  const sockPath = join(realParent, ulid().toLowerCase());
  await unlink(sockPath).catch(() => void 0);
  const server = createServer();
  try {
    await new Promise((resolveListen, reject) => {
      server.once("error", reject);
      server.listen(sockPath, () => {
        server.off("error", reject);
        resolveListen();
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`listen ${sockPath} (${String(Buffer.byteLength(sockPath))} bytes): ${message}`, { cause: error });
  } finally {
    await new Promise((resolveClose) => {
      server.close(() => {
        resolveClose();
      });
    });
    await unlink(sockPath).catch(() => void 0);
  }
  return { sockPath };
}
var MAX_CODE_MODE_SOCKET_PARENT_BYTES, CODE_MODE_SOCKET_PARENT_MODE, CODE_MODE_SOCKET_MODE, CodeModeUdsTransport;
var init_CodeModeUdsTransport = __esm({
  "src/sandbox/local/core/CodeModeUdsTransport.ts"() {
    "use strict";
    init_sandboxScripts_gen();
    init_frame();
    MAX_CODE_MODE_SOCKET_PARENT_BYTES = 65;
    CODE_MODE_SOCKET_PARENT_MODE = 448;
    CODE_MODE_SOCKET_MODE = 384;
    CodeModeUdsTransport = class {
      codeModeSocketParentPath;
      maxMessageBytes;
      onProtocolError;
      clientRemotePath;
      sessionPromise;
      server;
      sockPath;
      dispatcher;
      cachedEnv;
      constructor(options) {
        this.codeModeSocketParentPath = assertCodeModeSocketParentPath(options.codeModeSocketParentPath);
        this.maxMessageBytes = options.maxMessageBytes ?? MAX_MESSAGE_BYTES;
        this.onProtocolError = options.onProtocolError;
        this.clientRemotePath = options.clientRemotePath;
      }
      getClientInstall(params) {
        return {
          content: sandboxScripts.mcpClientLocal,
          remotePath: this.clientRemotePath(params.sandboxId)
        };
      }
      start(params) {
        this.dispatcher = params.codeModeDispatcher;
        this.sessionPromise ??= this.listenSession(params).catch((e) => {
          this.sessionPromise = void 0;
          this.cachedEnv = void 0;
          throw e;
        });
        return this.sessionPromise;
      }
      async stop() {
        const pending = this.sessionPromise;
        this.sessionPromise = void 0;
        this.cachedEnv = void 0;
        if (pending !== void 0) {
          try {
            await pending;
          } catch {
          }
        }
        const server = this.server;
        const sockPath = this.sockPath;
        this.server = void 0;
        this.sockPath = void 0;
        if (server !== void 0) {
          await new Promise((resolveClose) => {
            server.close(() => {
              resolveClose();
            });
          });
        }
        if (sockPath !== void 0) {
          await unlink(sockPath).catch(() => void 0);
        }
      }
      async listenSession(params) {
        if (this.server !== void 0 && this.cachedEnv !== void 0) {
          return { env: this.cachedEnv };
        }
        assertCodeModeSocketParentPath(this.codeModeSocketParentPath);
        const sockPath = join(this.codeModeSocketParentPath, ulid().toLowerCase());
        await unlink(sockPath).catch(() => void 0);
        const server = createServer({ allowHalfOpen: true });
        try {
          await new Promise((resolveListen, reject) => {
            server.once("error", reject);
            server.listen(sockPath, () => {
              server.off("error", reject);
              resolveListen();
            });
          });
          await chmod(sockPath, CODE_MODE_SOCKET_MODE);
        } catch (error) {
          server.close();
          await unlink(sockPath).catch(() => void 0);
          throw error;
        }
        this.server = server;
        this.sockPath = sockPath;
        server.on("connection", (socket) => {
          this.handleConnection(socket);
        });
        const env = {
          TFY_MCP_SOCK: sockPath,
          TFY_CM_REQUEST_TIMEOUT_SECONDS: String(params.requestTimeoutSeconds)
        };
        this.cachedEnv = env;
        return { env };
      }
      handleConnection(socket) {
        const reader = new JsonMessageReader({ maxBytes: this.maxMessageBytes });
        let settled = false;
        socket.on("error", () => void 0);
        const fail = (message) => {
          if (settled) {
            return;
          }
          settled = true;
          this.onProtocolError?.(message);
          socket.destroy();
        };
        socket.on("data", (chunk) => {
          try {
            reader.push(chunk);
          } catch (error) {
            fail(error instanceof Error ? error.message : String(error));
          }
        });
        socket.on("end", () => {
          if (settled) {
            return;
          }
          settled = true;
          void this.dispatchConnection(socket, reader).catch((error) => {
            this.onProtocolError?.(error instanceof Error ? error.message : String(error));
            socket.destroy();
          });
        });
      }
      async dispatchConnection(socket, reader) {
        let request;
        try {
          const parsed = CodeModeRequestSchema.safeParse(reader.finish());
          if (!parsed.success) {
            const reply2 = {
              ok: false,
              error: "Malformed Code Mode request",
              source: "caller"
            };
            socket.write(encodeJsonMessage(reply2));
            socket.end();
            return;
          }
          request = parsed.data;
        } catch (error) {
          this.onProtocolError?.(error instanceof Error ? error.message : String(error));
          socket.destroy();
          return;
        }
        const dispatcher = this.dispatcher;
        if (dispatcher === void 0) {
          const reply2 = {
            ok: false,
            error: "Code Mode dispatcher is not configured",
            source: "internal"
          };
          socket.write(encodeJsonMessage(reply2));
          socket.end();
          return;
        }
        const reply = await dispatcher.dispatch({ request, traceCarrier: {} });
        try {
          socket.write(encodeJsonMessage(reply));
        } finally {
          socket.end();
        }
      }
    };
  }
});

// src/sandbox/local/core/hostRun.ts
import { getDefaultWritePaths, SandboxManager } from "@anthropic-ai/sandbox-runtime";
import { execFile, spawn } from "child_process";
import { randomUUID } from "crypto";
import { realpathSync as realpathSync2 } from "fs";
import { mkdir as mkdir3, rm as rm3 } from "fs/promises";
import { createRequire } from "module";
import { dirname as dirname2, isAbsolute as isAbsolute2, join as join2 } from "path";
import { promisify } from "util";
function codeModeSocketParentAllow() {
  return codeModeSocketParentPath === void 0 ? [] : [codeModeSocketParentPath];
}
function requireActivePlatform() {
  if (activePlatform === void 0) {
    throw new Error("SRT platform is not set; call initSrt({ platform }) first");
  }
  return activePlatform;
}
function commandPath(platform) {
  return COMMAND_PATH_BY_PLATFORM[platform];
}
function sandboxVenvPath(sandboxRootPath) {
  return join2(sandboxRootPath, SANDBOX_VENV_DIR);
}
function allowedNetworkDomains() {
  return [...LOCAL_SANDBOX_ALLOWED_DOMAINS];
}
function darwinSandboxNetworkShellPreamble() {
  return [
    'if [ -n "${HTTP_PROXY:-}" ]; then export HTTP_PROXY="${HTTP_PROXY//localhost/127.0.0.1}"; fi',
    'if [ -n "${HTTPS_PROXY:-}" ]; then export HTTPS_PROXY="${HTTPS_PROXY//localhost/127.0.0.1}"; fi',
    'if [ -n "${http_proxy:-}" ]; then export http_proxy="${http_proxy//localhost/127.0.0.1}"; fi',
    'if [ -n "${https_proxy:-}" ]; then export https_proxy="${https_proxy//localhost/127.0.0.1}"; fi',
    'if [ -n "${ALL_PROXY:-}" ]; then export ALL_PROXY="${ALL_PROXY//localhost/127.0.0.1}"; fi',
    'if [ -n "${all_proxy:-}" ]; then export all_proxy="${all_proxy//localhost/127.0.0.1}"; fi',
    'if [ -n "${GRPC_PROXY:-}" ]; then export GRPC_PROXY="${GRPC_PROXY//localhost/127.0.0.1}"; fi',
    'if [ -n "${grpc_proxy:-}" ]; then export grpc_proxy="${grpc_proxy//localhost/127.0.0.1}"; fi'
  ].join("; ");
}
function wrapSandboxCommand(params) {
  if (params.platform !== "darwin") {
    return params.command;
  }
  return `${darwinSandboxNetworkShellPreamble()}; ${params.command}`;
}
function srtHostBinaryNames(platform) {
  return SRT_HOST_BINARIES_BY_PLATFORM[platform];
}
async function checkSrtHostDependencies() {
  const result = await SandboxManager.checkDependenciesAsync();
  return { errors: [...result.errors], warnings: [...result.warnings] };
}
async function resolveCommandOnHost(params) {
  if (!/^[A-Za-z0-9._+-]+$/.test(params.name)) {
    throw new Error(`invalid command name for resolveCommandOnHost: ${params.name}`);
  }
  const pathEnv = params.pathEnv !== void 0 && params.pathEnv.length > 0 ? params.pathEnv : commandPath(params.platform);
  try {
    const { stdout } = await execFileAsync("/bin/sh", ["-c", `command -v -- ${params.name}`], {
      env: { PATH: pathEnv },
      encoding: "utf8"
    });
    const resolved = stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
    if (resolved === void 0 || resolved.length === 0 || !isAbsolute2(resolved)) {
      return void 0;
    }
    return resolved;
  } catch {
    return void 0;
  }
}
async function resolvePythonExecutableOnHost(params) {
  if (!isAbsolute2(params.commandPath)) {
    return void 0;
  }
  try {
    const { stdout } = await execFileAsync(params.commandPath, ["-c", "import sys; print(sys.executable)"], {
      encoding: "utf8",
      timeout: 5e3
    });
    const executable = stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
    if (executable === void 0 || executable.length === 0 || !isAbsolute2(executable)) {
      return void 0;
    }
    return realpathSync2(executable);
  } catch {
    return void 0;
  }
}
function denySharedDefaultWritePaths() {
  return getDefaultWritePaths().filter((path7) => !path7.startsWith("/dev/"));
}
function platformAllowRead(platform) {
  return [...ALLOW_READ_BY_PLATFORM[platform]];
}
function filesystemPolicy(params) {
  return {
    allowWrite: [params.sandboxRootPath],
    denyWrite: denySharedDefaultWritePaths(),
    denyRead: ["/"],
    allowRead: [params.sandboxRootPath, ...codeModeSocketParentAllow(), ...platformAllowRead(params.platform)]
  };
}
function commandEnv(params) {
  const tmp = join2(params.sandboxRootPath, ".tmp");
  const home = join2(params.sandboxRootPath, ".home");
  const venvDir = sandboxVenvPath(params.sandboxRootPath);
  const locked = {
    HOME: home,
    TMPDIR: tmp,
    TMP: tmp,
    TEMP: tmp,
    VIRTUAL_ENV: venvDir,
    // Cwd-relative layout dirs (not host-absolute). Absolute paths under
    // `Application Support` break PATH lookup (`mcp-client: command not found`).
    PATH: `${join2(SANDBOX_VENV_DIR, "bin")}:mcp-client/bin:${commandPath(params.platform)}`
  };
  return {
    ...params.extra,
    ...locked
  };
}
function sessionFilesystem(platform) {
  const allowWrite = [];
  return {
    allowWrite,
    denyWrite: denySharedDefaultWritePaths(),
    denyRead: ["/"],
    allowRead: [...platformAllowRead(platform), ...codeModeSocketParentAllow()]
  };
}
function sessionNetwork(params) {
  const allowedDomains = allowedNetworkDomains();
  const deniedDomains = [];
  if (params.platform === "linux") {
    return {
      allowedDomains,
      deniedDomains,
      allowAllUnixSockets: true
    };
  }
  return {
    allowedDomains,
    deniedDomains,
    allowAllUnixSockets: false,
    allowUnixSockets: params.unixSockets ?? []
  };
}
function darwinUnixSocketPaths() {
  return [...darwinUnixSocketSandboxRoots, ...codeModeSocketParentAllow()];
}
function syncDarwinUnixSockets() {
  if (SandboxManager.getConfig() === void 0) {
    return;
  }
  const platform = requireActivePlatform();
  if (platform !== "darwin") {
    return;
  }
  SandboxManager.updateConfig(buildSessionConfig(platform));
}
function buildSessionConfig(platform) {
  return {
    network: sessionNetwork({ platform, unixSockets: darwinUnixSocketPaths() }),
    filesystem: sessionFilesystem(platform)
  };
}
async function createSandbox(sandboxRootPath) {
  await mkdir3(sandboxRootPath, { recursive: true, mode: 448 });
  await mkdir3(join2(sandboxRootPath, ".tmp"), { recursive: true, mode: 448 });
  await mkdir3(join2(sandboxRootPath, ".home"), { recursive: true, mode: 448 });
  const realRoot = realpathSync2(sandboxRootPath);
  darwinUnixSocketSandboxRoots.add(realRoot);
  syncDarwinUnixSockets();
  return realRoot;
}
async function removeSandbox(sandboxRootPath) {
  darwinUnixSocketSandboxRoots.delete(sandboxRootPath);
  syncDarwinUnixSockets();
  await rm3(sandboxRootPath, { recursive: true, force: true });
}
async function initSrt(params) {
  activePlatform = params.platform;
  codeModeSocketParentPath = params.codeModeSocketParentPath === void 0 ? void 0 : realpathSync2(params.codeModeSocketParentPath);
  await SandboxManager.initialize(buildSessionConfig(params.platform));
}
async function resetSrt() {
  codeModeSocketParentPath = void 0;
  activePlatform = void 0;
  await SandboxManager.reset();
}
function isSrtInitialized() {
  return activePlatform !== void 0 && SandboxManager.getConfig() !== void 0;
}
function killExecTree(child) {
  if (!child) {
    return;
  }
  const pid = child.pid;
  if (pid !== void 0 && process.platform !== "win32") {
    try {
      process.kill(-pid, "SIGKILL");
      return;
    } catch {
    }
  }
  if (!child.killed) {
    child.kill("SIGKILL");
  }
}
async function runSupervisorSession(params) {
  const {
    sandboxRootPath,
    command: rawCommand,
    shell,
    platform,
    cwd = sandboxRootPath,
    env,
    stdin,
    onChildSpawn,
    timeoutMs
  } = params;
  const command = wrapSandboxCommand({ platform, command: rawCommand });
  const wrap = await SandboxManager.wrapWithSandboxArgv(
    command,
    shell,
    {
      filesystem: filesystemPolicy({ sandboxRootPath, platform }),
      network: {
        allowedDomains: allowedNetworkDomains(),
        deniedDomains: []
      }
    },
    void 0,
    sandboxRootPath,
    { commandId: randomUUID(), commandText: command }
  );
  const [argv0, ...argvRest] = wrap.argv;
  if (argv0 === void 0) {
    throw new Error("wrapWithSandboxArgv returned empty argv");
  }
  const childEnv = {
    ...commandEnv({ sandboxRootPath, platform, ...env === void 0 ? {} : { extra: env } })
  };
  const child = spawn(argv0, argvRest, {
    cwd,
    env: childEnv,
    shell: false,
    // Detached process groups break stdin forwarding for upload (`cat` via pipe) under Jest.
    detached: stdin === void 0 && process.platform !== "win32",
    stdio: [stdin === void 0 ? "ignore" : "pipe", "pipe", "pipe"]
  });
  if (child.pid !== void 0) {
    onChildSpawn?.(child.pid);
  }
  if (stdin !== void 0) {
    const stdinStream = child.stdin;
    if (stdinStream === null) {
      killExecTree(child);
      SandboxManager.cleanupAfterCommand();
      throw new Error("stdin unavailable for sandboxed command");
    }
    stdinStream.on("error", () => void 0);
    await new Promise((resolve3, reject) => {
      stdinStream.end(stdin, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve3();
        }
      });
    });
  }
  let stdoutText = "";
  let stderrText = "";
  let bufferedOutput = 0;
  let protocolError;
  let timedOut = false;
  let closed = false;
  const ignoreStreamError = (stream) => {
    stream?.on("error", () => void 0);
  };
  const appendOutput = (stream, chunk) => {
    bufferedOutput += chunk.length;
    if (bufferedOutput > MAX_OUTPUT_BYTES) {
      protocolError = `buffered output exceeded ${String(MAX_OUTPUT_BYTES)} bytes`;
      killExecTree(child);
      return;
    }
    const text = chunk.toString("utf8");
    if (stream === "stdout") {
      stdoutText += text;
    } else {
      stderrText += text;
    }
  };
  ignoreStreamError(child.stdout);
  ignoreStreamError(child.stderr);
  child.stdout?.on("data", (chunk) => {
    appendOutput("stdout", chunk);
  });
  child.stderr?.on("data", (chunk) => {
    appendOutput("stderr", chunk);
  });
  return await new Promise((resolve3, reject) => {
    const timer = setTimeout(() => {
      timedOut = true;
      killExecTree(child);
    }, timeoutMs);
    child.on("error", (error) => {
      if (closed) {
        return;
      }
      closed = true;
      clearTimeout(timer);
      SandboxManager.cleanupAfterCommand();
      reject(error);
    });
    child.on("close", (code) => {
      if (closed) {
        return;
      }
      closed = true;
      clearTimeout(timer);
      SandboxManager.cleanupAfterCommand();
      resolve3({
        stdoutText,
        stderrText,
        exitCode: typeof code === "number" ? code : timedOut ? 1 : 0,
        protocolError,
        timedOut,
        childPid: child.pid
      });
    });
  });
}
var execFileAsync, SRT_VENDOR, MAX_OUTPUT_BYTES, activePlatform, codeModeSocketParentPath, COMMAND_PATH_BY_PLATFORM, SANDBOX_VENV_DIR, LOCAL_SANDBOX_ALLOWED_DOMAINS, SRT_HOST_BINARIES_BY_PLATFORM, ALLOW_READ_BY_PLATFORM, darwinUnixSocketSandboxRoots;
var init_hostRun = __esm({
  "src/sandbox/local/core/hostRun.ts"() {
    "use strict";
    execFileAsync = promisify(execFile);
    SRT_VENDOR = join2(
      dirname2(createRequire(import.meta.url).resolve("@anthropic-ai/sandbox-runtime/package.json")),
      "vendor"
    );
    MAX_OUTPUT_BYTES = 14 * 1024 * 1024;
    COMMAND_PATH_BY_PLATFORM = {
      // On macOS, prefer Homebrew ahead of `/usr/bin` shims (those need Xcode select
      // paths that we intentionally do not allow-read).
      darwin: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
      linux: "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
    };
    SANDBOX_VENV_DIR = ".venv";
    LOCAL_SANDBOX_ALLOWED_DOMAINS = [
      "pypi.org",
      "*.pypi.org",
      "pythonhosted.org",
      "files.pythonhosted.org",
      "*.pythonhosted.org",
      "github.com",
      "api.github.com",
      "codeload.github.com",
      "*.github.com",
      "githubusercontent.com",
      "raw.githubusercontent.com",
      "objects.githubusercontent.com",
      "*.githubusercontent.com"
    ];
    SRT_HOST_BINARIES_BY_PLATFORM = {
      linux: ["bwrap", "socat", "rg"],
      darwin: []
    };
    ALLOW_READ_BY_PLATFORM = {
      darwin: [
        "/opt/homebrew/bin",
        "/usr/local",
        "/usr/bin",
        "/bin",
        "/usr/sbin",
        "/sbin",
        "/usr/lib",
        "/System/Library",
        "/Library",
        "/private/var/db/dyld",
        "/private/var/select",
        "/opt/homebrew",
        "/dev",
        // Darwin `/etc` is a symlink to `/private/etc`. SRT refuses that realpath as
        // "outside boundary" and keeps `(subpath "/etc")`. Seatbelt still checks the
        // resolved path, so Apple LibreSSL's fopen(`/private/etc/ssl/openssl.cnf`)
        // needs `/private/etc` listed too. Do not use a `[/]etc/**` glob: SRT treats
        // that as cwd-relative (`path.isAbsolute('[/]…')` is false).
        "/etc",
        "/private/etc"
      ],
      linux: [
        "/usr/bin",
        "/bin",
        "/usr/sbin",
        "/sbin",
        "/lib",
        "/lib64",
        "/usr/lib",
        "/usr/lib64",
        "/usr/local",
        "/etc",
        "/dev",
        "/proc",
        "/sys",
        SRT_VENDOR
      ]
    };
    darwinUnixSocketSandboxRoots = /* @__PURE__ */ new Set();
  }
});

// src/sandbox/local/schemas/xferFileInfo.ts
import { z as z6 } from "zod";
var XferFileInfoSchema;
var init_xferFileInfo = __esm({
  "src/sandbox/local/schemas/xferFileInfo.ts"() {
    "use strict";
    XferFileInfoSchema = z6.object({
      size: z6.number(),
      isDir: z6.boolean()
    });
  }
});

// src/sandbox/local/provider/LocalSandboxProvider.ts
var LocalSandboxProvider_exports = {};
__export(LocalSandboxProvider_exports, {
  LocalSandboxProvider: () => LocalSandboxProvider,
  formatLocalSandboxSupportReason: () => formatLocalSandboxSupportReason,
  localSandboxUploadCommand: () => localSandboxUploadCommand
});
import {
  absolutizeRelativeExecEnv,
  SandboxFileNotFoundError,
  SandboxFileTooLargeError,
  SandboxNotAvailableError,
  SandboxPathIsDirectoryError,
  shellEscape,
  validateNoPathTraversal as validateNoPathTraversal2
} from "@truefoundry/trueforge-core/core";
import { execFile as execFile2 } from "child_process";
import { existsSync as existsSync4, realpathSync as realpathSync3, statSync as statSync2 } from "fs";
import { mkdir as mkdir4, mkdtemp, rm as rm4 } from "fs/promises";
import { tmpdir } from "os";
import { dirname as dirname3, isAbsolute as isAbsolute3, join as join3, relative, resolve as resolve2, sep } from "path";
import { promisify as promisify2 } from "util";
import { ulid as ulid2 } from "ulid";
function formatLocalSandboxSupportReason(params) {
  const details = params.attempts.map(formatLocalSandboxSupportAttempt).join("; ");
  return details.length === 0 ? params.summary : `${params.summary}: ${details}`;
}
function formatLocalSandboxSupportAttempt(attempt) {
  if (attempt.resolved === void 0) {
    return attempt.kind === "host" ? `${attempt.name}: not on PATH` : `${attempt.name}: not on sandbox PATH`;
  }
  const parts = [`${attempt.name}: resolved=${attempt.resolved}`];
  if (attempt.executable !== void 0 && attempt.executable !== attempt.resolved) {
    parts.push(`executable=${attempt.executable}`);
  }
  if (attempt.protocolError !== void 0) {
    parts.push(`protocolError=${attempt.protocolError}`);
  }
  if (attempt.exitCode !== void 0) {
    parts.push(`exit=${String(attempt.exitCode)}`);
  }
  if (attempt.timedOut === true) {
    parts.push("timedOut");
  }
  if (attempt.stderr !== void 0 && attempt.stderr.length > 0) {
    parts.push(`stderr=${JSON.stringify(attempt.stderr)}`);
  }
  if (attempt.stdout !== void 0 && attempt.stdout.length > 0) {
    parts.push(`stdout=${JSON.stringify(attempt.stdout)}`);
  }
  return parts.join(" ");
}
function probeAttemptFromSession(params) {
  return {
    kind: params.kind,
    name: params.name,
    resolved: params.resolved,
    ...params.executable === void 0 ? {} : { executable: params.executable },
    exitCode: params.session.exitCode,
    stdout: params.session.stdoutText,
    stderr: params.session.stderrText,
    ...params.session.protocolError === void 0 ? {} : { protocolError: params.session.protocolError },
    timedOut: params.session.timedOut
  };
}
function unsupported(params) {
  return {
    supported: false,
    reason: params.reason,
    ...params.platform === void 0 ? {} : { platform: params.platform },
    ...params.attempts === void 0 ? {} : { attempts: params.attempts }
  };
}
function toSandboxRelativePath(params) {
  const rel = relative(params.sandboxRootPath, params.absolutePath);
  return rel === "" ? "." : rel;
}
function isStrictDescendant(params) {
  const rel = relative(params.ancestor, params.descendant);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute3(rel);
}
function execFileErrorDetail(error) {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const parts = [error.message];
  if ("stderr" in error && typeof error.stderr === "string" && error.stderr.length > 0) {
    parts.push(error.stderr);
  }
  if ("stdout" in error && typeof error.stdout === "string" && error.stdout.length > 0) {
    parts.push(error.stdout);
  }
  return parts.join(" ");
}
function sessionFailDetail(session) {
  return [session.protocolError, session.stderrText, session.stdoutText].filter((part) => part !== void 0 && part.length > 0).join(" ");
}
function localSandboxUploadCommand(remotePath) {
  const parent = dirname3(remotePath);
  return [
    `mkdir -p ${shellEscape(parent)}`,
    `{ chmod u+w ${shellEscape(remotePath)} 2>/dev/null || true; }`,
    `/bin/cat > ${shellEscape(remotePath)}`
  ].join(" && ");
}
var execFileAsync2, DEFAULT_EXEC_TIMEOUT_SECONDS, DEFAULT_FILE_MAX_BYTES, SUPPORT_PROBE_TIMEOUT_MS, VENV_CREATE_TIMEOUT_MS, VENV_PIP_TIMEOUT_MS, VENV_PYDANTIC_PIN, SHELL_CANDIDATES, PYTHON_CANDIDATES, LocalSandboxProvider;
var init_LocalSandboxProvider = __esm({
  "src/sandbox/local/provider/LocalSandboxProvider.ts"() {
    "use strict";
    init_CodeModeUdsTransport();
    init_hostRun();
    init_xferFileInfo();
    execFileAsync2 = promisify2(execFile2);
    DEFAULT_EXEC_TIMEOUT_SECONDS = 60;
    DEFAULT_FILE_MAX_BYTES = 10 * 1024 * 1024;
    SUPPORT_PROBE_TIMEOUT_MS = 5e3;
    VENV_CREATE_TIMEOUT_MS = 6e4;
    VENV_PIP_TIMEOUT_MS = 12e4;
    VENV_PYDANTIC_PIN = "pydantic>=2.0.0,<3.0.0";
    SHELL_CANDIDATES = ["bash", "sh"];
    PYTHON_CANDIDATES = ["python3", "python"];
    LocalSandboxProvider = class _LocalSandboxProvider {
      type = "local";
      sandboxRootPathParent;
      codeModeSocketParentPath;
      support;
      fileMaxBytesForDownload;
      defaultExecTimeoutSeconds;
      srtInitialized = false;
      logger;
      /** Local SRT has no image build step — always ready. */
      static readyBuild = {
        status: "ready",
        reason: null,
        metadata: null
      };
      /**
       * Probe whether this host can run LocalSandboxProvider
       * (OS + Code Mode UDS listen + SRT host binaries + in-sandbox shell + Python 3).
       * On success, returns platform/shell/python to pass into the constructor as `support`.
       */
      static async isSupported(params) {
        if (process.platform !== "darwin" && process.platform !== "linux") {
          return unsupported({
            reason: `LocalSandboxProvider supports macOS and Linux only (got ${process.platform})`
          });
        }
        const platform = process.platform;
        let createdSocketParent;
        const socketParentPath = params?.codeModeSocketParentPath;
        try {
          const parentPath = socketParentPath ?? await mkdtemp(join3("/tmp", "tfc-"));
          if (socketParentPath === void 0) {
            createdSocketParent = parentPath;
          }
          try {
            await probeCodeModeUnixSocket(parentPath);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return unsupported({
              platform,
              attempts: [{ kind: "socket", name: "uds", resolved: parentPath, protocolError: message }],
              reason: `Code Mode UDS listen failed: ${message}`
            });
          }
        } finally {
          if (createdSocketParent !== void 0) {
            await rm4(createdSocketParent, { recursive: true, force: true });
          }
        }
        const hostPath = process.env["PATH"];
        const hostAttempts = [];
        for (const name of srtHostBinaryNames(platform)) {
          const resolved = await resolveCommandOnHost({
            platform,
            name,
            ...hostPath === void 0 || hostPath.length === 0 ? {} : { pathEnv: hostPath }
          });
          hostAttempts.push({ kind: "host", name, resolved });
        }
        if (hostAttempts.some((attempt) => attempt.resolved === void 0)) {
          const required = srtHostBinaryNames(platform).join(", ");
          return unsupported({
            platform,
            attempts: hostAttempts,
            reason: formatLocalSandboxSupportReason({
              summary: `SRT host dependencies missing (${platform}: ${required})`,
              attempts: hostAttempts
            })
          });
        }
        const srtDeps = await checkSrtHostDependencies();
        if (srtDeps.errors.length > 0) {
          return unsupported({
            platform,
            attempts: hostAttempts.length === 0 ? void 0 : hostAttempts,
            reason: `SRT host dependencies failed: ${srtDeps.errors.join("; ")}`
          });
        }
        const alreadyInitialized = isSrtInitialized();
        let probeRoot;
        const attempts = [...hostAttempts];
        const pythonAttempts = [];
        try {
          if (!alreadyInitialized) {
            await initSrt({
              platform,
              ...socketParentPath === void 0 ? {} : { codeModeSocketParentPath: socketParentPath }
            });
          }
          probeRoot = await createSandbox(await mkdtemp(join3(tmpdir(), "tfy-local-sandbox-support-")));
          let shell;
          for (const name of SHELL_CANDIDATES) {
            const resolved = await resolveCommandOnHost({ platform, name });
            if (resolved === void 0) {
              attempts.push({ kind: "shell", name, resolved: void 0 });
              continue;
            }
            const probe = await runSupervisorSession({
              sandboxRootPath: probeRoot,
              platform,
              shell: resolved,
              command: "echo shell-ok",
              timeoutMs: SUPPORT_PROBE_TIMEOUT_MS
            });
            const attempt = probeAttemptFromSession({ kind: "shell", name, resolved, session: probe });
            if (probe.protocolError === void 0 && probe.exitCode === 0 && probe.stdoutText.includes("shell-ok")) {
              shell = resolved;
              break;
            }
            attempts.push(attempt);
          }
          if (shell === void 0) {
            return unsupported({
              platform,
              attempts,
              reason: formatLocalSandboxSupportReason({
                summary: "No usable shell in sandbox (bash or sh via command -v)",
                attempts
              })
            });
          }
          let python;
          for (const name of PYTHON_CANDIDATES) {
            const resolved = await resolveCommandOnHost({ platform, name });
            if (resolved === void 0) {
              pythonAttempts.push({ kind: "python", name, resolved: void 0 });
              continue;
            }
            const executable = await resolvePythonExecutableOnHost({ commandPath: resolved }) ?? resolved;
            const probe = await runSupervisorSession({
              sandboxRootPath: probeRoot,
              platform,
              shell,
              command: `${shellEscape(executable)} -c ${shellEscape(
                "import sys; raise SystemExit(0 if sys.version_info[0] == 3 else 1)"
              )}`,
              timeoutMs: SUPPORT_PROBE_TIMEOUT_MS
            });
            const attempt = probeAttemptFromSession({
              kind: "python",
              name,
              resolved,
              executable,
              session: probe
            });
            if (probe.protocolError === void 0 && probe.exitCode === 0) {
              python = executable;
              break;
            }
            pythonAttempts.push(attempt);
          }
          if (python === void 0) {
            return unsupported({
              platform,
              attempts: pythonAttempts,
              reason: formatLocalSandboxSupportReason({
                summary: "No usable Python 3 interpreter in sandbox (python3 or python via command -v)",
                attempts: pythonAttempts
              })
            });
          }
          return { supported: true, platform, shell, python };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const seen = [...attempts, ...pythonAttempts];
          return unsupported({
            platform,
            attempts: seen.length === 0 ? void 0 : seen,
            reason: seen.length === 0 ? message : `${message}: ${formatLocalSandboxSupportReason({ summary: "probe aborted", attempts: seen })}`
          });
        } finally {
          if (probeRoot !== void 0) {
            await removeSandbox(probeRoot);
          }
          if (!alreadyInitialized) {
            await resetSrt();
          }
        }
      }
      constructor(options) {
        if (!options.support.supported) {
          throw new Error(`LocalSandboxProvider is not supported: ${options.support.reason}`);
        }
        if (!isAbsolute3(options.sandboxRootPathParent)) {
          throw new Error("sandboxRootPathParent must be an absolute path");
        }
        validateNoPathTraversal2(options.sandboxRootPathParent);
        const resolvedParent = resolve2(options.sandboxRootPathParent);
        this.sandboxRootPathParent = existsSync4(resolvedParent) && statSync2(resolvedParent).isDirectory() ? realpathSync3(resolvedParent) : resolvedParent;
        this.codeModeSocketParentPath = assertCodeModeSocketParentPath(options.codeModeSocketParentPath);
        this.support = options.support;
        this.fileMaxBytesForDownload = options.fileMaxBytesForDownload ?? DEFAULT_FILE_MAX_BYTES;
        this.defaultExecTimeoutSeconds = options.defaultExecTimeoutSeconds ?? DEFAULT_EXEC_TIMEOUT_SECONDS;
        this.logger = options.logger.child({ module: "LocalSandboxProvider" });
      }
      pythonC(code, relPath) {
        return `${this.support.python} -c ${shellEscape(code)} ${shellEscape(relPath)}`;
      }
      statCommand(relPath) {
        const code = [
          "import json, os, sys",
          "p = sys.argv[1]",
          "st = os.stat(p)",
          'print(json.dumps({"size": st.st_size, "isDir": os.path.isdir(p)}))'
        ].join("\n");
        return this.pythonC(code, relPath);
      }
      base64EncodeCommand(relPath) {
        const code = [
          "import base64, sys",
          "p = sys.argv[1]",
          'sys.stdout.write(base64.b64encode(open(p, "rb").read()).decode("ascii"))'
        ].join("\n");
        return this.pythonC(code, relPath);
      }
      buildImage() {
        return Promise.resolve(_LocalSandboxProvider.readyBuild);
      }
      getImageBuildStatus() {
        return Promise.resolve(_LocalSandboxProvider.readyBuild);
      }
      async ensureSrt() {
        if (this.srtInitialized) {
          return;
        }
        await initSrt({
          platform: this.support.platform,
          codeModeSocketParentPath: this.codeModeSocketParentPath
        });
        this.srtInitialized = true;
      }
      /** Missing, non-directory, or not a child of this provider's parent → recreate path in Sandbox. */
      ensureSandboxRoot(sandboxRootPath) {
        if (!isAbsolute3(sandboxRootPath)) {
          throw new SandboxNotAvailableError(sandboxRootPath);
        }
        const resolved = resolve2(sandboxRootPath);
        if (!existsSync4(resolved) || !statSync2(resolved).isDirectory()) {
          throw new SandboxNotAvailableError(sandboxRootPath);
        }
        const parentReal = existsSync4(this.sandboxRootPathParent) ? realpathSync3(this.sandboxRootPathParent) : this.sandboxRootPathParent;
        const realRoot = realpathSync3(resolved);
        if (!isStrictDescendant({ ancestor: parentReal, descendant: realRoot })) {
          throw new SandboxNotAvailableError(sandboxRootPath);
        }
      }
      /**
       * Host `python -m venv` (stdlib only), then sandboxed pip for pydantic.
       * Idempotent: skip create when `.venv/bin/python` exists; skip pip when import works.
       */
      async ensureVenv(sandboxRootPath) {
        const venvDir = join3(sandboxRootPath, SANDBOX_VENV_DIR);
        const venvPython = join3(venvDir, "bin", "python");
        if (!existsSync4(venvPython)) {
          try {
            await execFileAsync2(this.support.python, ["-m", "venv", venvDir], { timeout: VENV_CREATE_TIMEOUT_MS });
          } catch (error) {
            throw new Error(`Failed to create sandbox ${SANDBOX_VENV_DIR}: ${execFileErrorDetail(error)}`, {
              cause: error
            });
          }
        }
        const relPython = join3(SANDBOX_VENV_DIR, "bin", "python");
        const relPip = join3(SANDBOX_VENV_DIR, "bin", "pip");
        const check = await runSupervisorSession({
          sandboxRootPath,
          platform: this.support.platform,
          shell: this.support.shell,
          command: `${shellEscape(relPython)} -c ${shellEscape("import pydantic")}`,
          timeoutMs: SUPPORT_PROBE_TIMEOUT_MS
        });
        if (check.protocolError !== void 0) {
          throw new Error(`Sandbox venv pydantic check failed: ${check.protocolError}`);
        }
        if (check.exitCode === 0) {
          return;
        }
        const install = await runSupervisorSession({
          sandboxRootPath,
          platform: this.support.platform,
          shell: this.support.shell,
          command: `${shellEscape(relPip)} install --trusted-host pypi.org --trusted-host files.pythonhosted.org ${shellEscape(VENV_PYDANTIC_PIN)}`,
          timeoutMs: VENV_PIP_TIMEOUT_MS
        });
        if (install.protocolError !== void 0 || install.exitCode !== 0 || install.timedOut) {
          throw new Error(
            `Failed to pip install ${VENV_PYDANTIC_PIN} into sandbox ${SANDBOX_VENV_DIR}: ${sessionFailDetail(install)}`
          );
        }
      }
      resolveInSandboxRoot(sandboxRootPath, userPath) {
        validateNoPathTraversal2(userPath);
        const resolved = userPath.startsWith("/") ? resolve2(userPath) : resolve2(sandboxRootPath, userPath);
        const root = resolve2(sandboxRootPath);
        if (resolved !== root && !resolved.startsWith(root + sep)) {
          throw new SandboxFileNotFoundError(userPath);
        }
        return resolved;
      }
      async runSandboxCommand(params) {
        const session = await runSupervisorSession({
          sandboxRootPath: params.sandboxRootPath,
          platform: this.support.platform,
          shell: this.support.shell,
          command: params.command,
          ...params.stdin === void 0 ? {} : { stdin: params.stdin },
          timeoutMs: this.defaultExecTimeoutSeconds * 1e3
        });
        if (session.protocolError !== void 0) {
          throw new Error(session.protocolError);
        }
        return {
          exitCode: session.exitCode,
          stdoutText: session.stdoutText,
          stderrText: session.stderrText
        };
      }
      async getFileInfo(params) {
        const result = await this.runSandboxCommand({
          sandboxRootPath: params.sandboxRootPath,
          command: this.statCommand(params.relPath)
        });
        if (result.exitCode !== 0) {
          throw new SandboxFileNotFoundError(params.userPath);
        }
        return XferFileInfoSchema.parse(JSON.parse(result.stdoutText.trim()));
      }
      async createSandbox() {
        await this.ensureSrt();
        const sandboxId = await createSandbox(join3(this.sandboxRootPathParent, ulid2().toLowerCase()));
        this.logger.info("LocalSandboxProvider created sandbox", {
          sandboxId,
          shell: this.support.shell,
          python: this.support.python
        });
        await mkdir4(join3(sandboxId, this.getToolResultDumpDir()), { recursive: true, mode: 448 });
        await mkdir4(join3(sandboxId, this.getFileUploadsDir()), { recursive: true, mode: 448 });
        await mkdir4(join3(sandboxId, this.getSkillsDir()), { recursive: true, mode: 448 });
        await this.ensureVenv(sandboxId);
        return { sandboxId };
      }
      async exec(params) {
        this.ensureSandboxRoot(params.sandboxId);
        try {
          await this.ensureSrt();
          await this.ensureVenv(params.sandboxId);
          const sandboxRootPath = params.sandboxId;
          const cwd = params.cwd === void 0 || params.cwd === "" ? sandboxRootPath : this.resolveInSandboxRoot(sandboxRootPath, params.cwd);
          const timeoutSeconds = params.timeoutSeconds ?? this.defaultExecTimeoutSeconds;
          const env = params.env === void 0 ? void 0 : absolutizeRelativeExecEnv({ root: sandboxRootPath, env: params.env });
          const session = await runSupervisorSession({
            sandboxRootPath,
            platform: this.support.platform,
            shell: this.support.shell,
            command: params.command,
            cwd,
            ...env === void 0 ? {} : { env },
            timeoutMs: timeoutSeconds * 1e3
          });
          if (session.protocolError !== void 0) {
            return { success: false, error: session.protocolError };
          }
          const result = session.stdoutText + (session.stderrText ? session.stderrText : "");
          return {
            success: true,
            response: { exitCode: session.exitCode, result }
          };
        } catch (error) {
          if (error instanceof SandboxNotAvailableError) {
            throw error;
          }
          const message = error instanceof Error ? error.message : String(error);
          return { success: false, error: message };
        }
      }
      getAdditionalInstructions() {
        return [
          "SANDBOX RULES:",
          `- Platform: ${this.support.platform}.`,
          `- Commands run under the sandbox shell: ${this.support.shell}.`,
          "- A Python virtualenv lives at .venv. `python` and `pip` on PATH are that environment; packages you `pip install` persist in this sandbox.",
          "- uploads, skills, and tool-results live in the sandbox working directory.",
          "- ALL file creation and writes MUST stay within the sandbox working directory.",
          "- The Agent must NOT write outside the working directory (including host home and /tmp)."
        ].join("\n");
      }
      // Cwd-relative: SRT cwd is the sandbox root. Init mkdir/ln and the agent prompt must not use
      // host-absolute paths — those contain spaces under macOS Application Support and lose quoting.
      //   uploads, skills, tool-results, git_downloader.py, .git-credentials, .venv
      //   mcp-client/mcp_client.py
      getToolResultDumpDir() {
        return "tool-results";
      }
      getGitCredentialsPath() {
        return ".git-credentials";
      }
      getFileUploadsDir() {
        return "uploads";
      }
      getSkillsDir() {
        return "skills";
      }
      getGitDownloaderPath() {
        return "git_downloader.py";
      }
      async downloadFile(params) {
        this.ensureSandboxRoot(params.sandboxId);
        await this.ensureSrt();
        await this.ensureVenv(params.sandboxId);
        const sandboxRootPath = params.sandboxId;
        const absolutePath = this.resolveInSandboxRoot(sandboxRootPath, params.path);
        const relPath = toSandboxRelativePath({ sandboxRootPath, absolutePath });
        const info = await this.getFileInfo({ sandboxRootPath, relPath, userPath: params.path });
        if (info.isDir) {
          throw new SandboxPathIsDirectoryError(params.path);
        }
        if (info.size > this.fileMaxBytesForDownload) {
          throw new SandboxFileTooLargeError(params.path, info.size, this.fileMaxBytesForDownload);
        }
        const result = await this.runSandboxCommand({
          sandboxRootPath,
          command: this.base64EncodeCommand(relPath)
        });
        if (result.exitCode !== 0) {
          throw new SandboxFileNotFoundError(params.path);
        }
        const buf = Buffer.from(result.stdoutText.trim(), "base64");
        if (buf.length > this.fileMaxBytesForDownload) {
          throw new SandboxFileTooLargeError(params.path, buf.length, this.fileMaxBytesForDownload);
        }
        return buf;
      }
      /** Payload on stdin so large uploads stay off argv. */
      async uploadFile(params) {
        this.ensureSandboxRoot(params.sandboxId);
        await this.ensureSrt();
        await this.ensureVenv(params.sandboxId);
        if (params.content.length > this.fileMaxBytesForDownload) {
          throw new SandboxFileTooLargeError(params.remotePath, params.content.length, this.fileMaxBytesForDownload);
        }
        const sandboxRootPath = params.sandboxId;
        const absolutePath = this.resolveInSandboxRoot(sandboxRootPath, params.remotePath);
        const remotePath = toSandboxRelativePath({ sandboxRootPath, absolutePath });
        const result = await this.runSandboxCommand({
          sandboxRootPath,
          command: localSandboxUploadCommand(remotePath),
          stdin: params.content
        });
        if (result.exitCode !== 0) {
          const detail = [result.stderrText, result.stdoutText].filter((part) => part.length > 0).join(" ");
          throw new Error(
            detail.length > 0 ? `upload ${params.remotePath} failed (exit ${String(result.exitCode)}): ${detail}` : `upload ${params.remotePath} failed (exit ${String(result.exitCode)})`
          );
        }
      }
      createCodeModeTransport() {
        return new CodeModeUdsTransport({
          codeModeSocketParentPath: this.codeModeSocketParentPath,
          clientRemotePath: () => join3("mcp-client", "mcp_client.py")
        });
      }
      /** Reset process-scoped SRT for this provider. */
      async dispose() {
        if (this.srtInitialized) {
          await resetSrt();
          this.srtInitialized = false;
        }
      }
    };
  }
});

// src/db/mcpServerStore.ts
function toStoredOAuthToken(token) {
  return {
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expires_at: token.expiresAt,
    scope: token.scope
  };
}
function fromStoredOAuthToken(stored) {
  return {
    accessToken: stored.access_token,
    refreshToken: stored.refresh_token,
    expiresAt: stored.expires_at,
    scope: stored.scope
  };
}
function toStoredOAuthClientRecord(record) {
  return {
    server: {
      authorization_endpoint: record.server.authorizationEndpoint,
      token_endpoint: record.server.tokenEndpoint,
      code_challenge_methods_supported: record.server.codeChallengeMethodsSupported
    },
    client: {
      client_id: record.client.clientId,
      client_secret: record.client.clientSecret
    }
  };
}
function fromStoredOAuthClientRecord(params) {
  return {
    server: {
      authorizationEndpoint: params.server.authorization_endpoint,
      tokenEndpoint: params.server.token_endpoint,
      codeChallengeMethodsSupported: params.server.code_challenge_methods_supported
    },
    client: {
      clientId: params.client.client_id,
      clientSecret: params.client.client_secret
    }
  };
}
function toStoredOAuthPendingAuthorizationData(pending) {
  return {
    mcp_server_url: pending.mcpServerUrl,
    code_verifier: pending.codeVerifier,
    return_to: pending.returnTo
  };
}
function fromStoredOAuthPendingAuthorizationData(stored) {
  return {
    mcpServerUrl: stored.mcp_server_url,
    codeVerifier: stored.code_verifier,
    returnTo: stored.return_to
  };
}
var McpServerNameConflictError, PENDING_AUTHORIZATION_TTL_MS;
var init_mcpServerStore = __esm({
  "src/db/mcpServerStore.ts"() {
    "use strict";
    McpServerNameConflictError = class extends Error {
      tenant_id;
      server_name;
      constructor({ tenant_id, name }, options) {
        super(`MCP server name already exists: ${name}`, options);
        this.name = "McpServerNameConflictError";
        this.tenant_id = tenant_id;
        this.server_name = name;
      }
    };
    PENDING_AUTHORIZATION_TTL_MS = 10 * 60 * 1e3;
  }
});

// src/db/modelProviderStore.ts
function flattenProviderModels(records) {
  return records.flatMap(
    (record) => record.manifest.models.map((model) => ({
      name: `${record.name}/${model.name}`,
      model_id: model.model_id,
      provider: { name: record.name },
      properties: model.properties
    }))
  );
}
var ModelProviderNameConflictError;
var init_modelProviderStore = __esm({
  "src/db/modelProviderStore.ts"() {
    "use strict";
    ModelProviderNameConflictError = class extends Error {
      tenant_id;
      provider_name;
      constructor({ tenant_id, name }, options) {
        super(`Model provider name already exists: ${name}`, options);
        this.name = "ModelProviderNameConflictError";
        this.tenant_id = tenant_id;
        this.provider_name = name;
      }
    };
  }
});

// src/db/skillStore.ts
var SkillNameConflictError;
var init_skillStore = __esm({
  "src/db/skillStore.ts"() {
    "use strict";
    SkillNameConflictError = class extends Error {
      tenant_id;
      skill_name;
      constructor({ tenant_id, name }, options) {
        super(`Skill name already exists: ${name}`, options);
        this.name = "SkillNameConflictError";
        this.tenant_id = tenant_id;
        this.skill_name = name;
      }
    };
  }
});

// src/db/sqlite/client.ts
var client_exports = {};
__export(client_exports, {
  createSqliteDb: () => createSqliteDb,
  isUniqueViolation: () => isUniqueViolation
});
import Database from "better-sqlite3";
import {
  CompiledQuery,
  Kysely,
  ParseJSONResultsPlugin,
  SqliteAdapter,
  SqliteDriver,
  SqliteIntrospector,
  SqliteQueryCompiler
} from "kysely";
function applyPragmas(database) {
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  database.pragma("synchronous = NORMAL");
  database.pragma("foreign_keys = ON");
  database.pragma("temp_store = MEMORY");
  database.pragma("cache_size = -10240");
}
function shouldParseJsonResultColumn(_value, jsonPath) {
  const match = /^\$\[\d+\]\."([^"]+)"$/.exec(jsonPath);
  const column = match?.[1];
  return column !== void 0 && JSON_RESULT_COLUMNS.has(column);
}
function createSqliteDb(filename) {
  const database = new Database(filename);
  applyPragmas(database);
  return new Kysely({
    dialect: new ImmediateSqliteDialect(database),
    // Parse only projected JSON columns once; never re-parse nested string values.
    plugins: [new ParseJSONResultsPlugin({ shouldParse: shouldParseJsonResultColumn })]
  });
}
function isUniqueViolation(err) {
  if (typeof err !== "object" || err === null || !("code" in err)) {
    return false;
  }
  const code = err.code;
  return code === "SQLITE_CONSTRAINT_UNIQUE" || code === "SQLITE_CONSTRAINT_PRIMARYKEY";
}
var ImmediateSqliteDriver, ImmediateSqliteDialect, JSON_RESULT_COLUMNS;
var init_client = __esm({
  "src/db/sqlite/client.ts"() {
    "use strict";
    ImmediateSqliteDriver = class {
      #inner;
      constructor(database) {
        this.#inner = new SqliteDriver({ database });
      }
      init() {
        return this.#inner.init();
      }
      acquireConnection() {
        return this.#inner.acquireConnection();
      }
      async beginTransaction(connection, settings) {
        const begin = settings.accessMode === "read write" ? "begin immediate" : "begin";
        await connection.executeQuery(CompiledQuery.raw(begin));
      }
      commitTransaction(connection) {
        return this.#inner.commitTransaction(connection);
      }
      rollbackTransaction(connection) {
        return this.#inner.rollbackTransaction(connection);
      }
      savepoint(connection, savepointName, compileQuery) {
        return this.#inner.savepoint(connection, savepointName, compileQuery);
      }
      rollbackToSavepoint(connection, savepointName, compileQuery) {
        return this.#inner.rollbackToSavepoint(connection, savepointName, compileQuery);
      }
      releaseSavepoint(connection, savepointName, compileQuery) {
        return this.#inner.releaseSavepoint(connection, savepointName, compileQuery);
      }
      releaseConnection() {
        return this.#inner.releaseConnection();
      }
      destroy() {
        return this.#inner.destroy();
      }
    };
    ImmediateSqliteDialect = class {
      #database;
      constructor(database) {
        this.#database = database;
      }
      createDriver() {
        return new ImmediateSqliteDriver(this.#database);
      }
      createQueryCompiler() {
        return new SqliteQueryCompiler();
      }
      createAdapter() {
        return new SqliteAdapter();
      }
      createIntrospector(db) {
        return new SqliteIntrospector(db);
      }
    };
    JSON_RESULT_COLUMNS = /* @__PURE__ */ new Set([
      "agent_spec",
      "custom",
      "ancestor_ids",
      "input",
      "state",
      "checkpoint",
      "agent_info",
      "current_context_usage",
      "body",
      "capability_state",
      "turn_checkpoint",
      "turn_state",
      "thread_checkpoint",
      "event",
      "manifest",
      "build_metadata",
      "oauth_server",
      "oauth_client",
      "token",
      "auth_data"
    ]);
  }
});

// src/db/migrateSqlite.ts
var migrateSqlite_exports = {};
__export(migrateSqlite_exports, {
  migrateSqliteToLatest: () => migrateSqliteToLatest
});
import { promises as fs2 } from "fs";
import path4 from "path";
import { FileMigrationProvider, Migrator } from "kysely/migration";
async function migrateSqliteToLatest(db) {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs: fs2,
      path: path4,
      migrationFolder: path4.join(import.meta.dirname, "sqlite", "migrations")
    })
  });
  const { error, results } = await migrator.migrateToLatest();
  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });
  if (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("failed to migrate", { cause: error });
  }
}
var init_migrateSqlite = __esm({
  "src/db/migrateSqlite.ts"() {
    "use strict";
  }
});

// src/db/sqlite/sqlExpressions.ts
import { sql } from "kysely";
function jsonbBind(value) {
  return sql`jsonb(${JSON.stringify(value)})`;
}
function jsonbSet(column, path7, value) {
  return sql`jsonb_set(${column}, ${path7}, ${jsonbBind(value)})`;
}
function jsonText(column) {
  return sql`json(${column})`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function isoMsAgo(ms) {
  return new Date(Date.now() - ms).toISOString();
}
var init_sqlExpressions = __esm({
  "src/db/sqlite/sqlExpressions.ts"() {
    "use strict";
  }
});

// src/db/sqlite/session-store/sqlExpressions.ts
function sortedByAppendId(rows) {
  return [...rows].sort((a, b) => a.append_id - b.append_id);
}
var init_sqlExpressions2 = __esm({
  "src/db/sqlite/session-store/sqlExpressions.ts"() {
    "use strict";
  }
});

// src/db/sqlite/session-store/queries/turns.ts
import "@truefoundry/trueforge-core/agent-session/schemas/turn";
import { assertCreateTurnThreadDelta } from "@truefoundry/trueforge-core/agent-session/store/assertCreateTurnThreadDelta";
import {
  PreviousTurnRunningError,
  SessionNotFoundError,
  SessionStoreConflictError as SessionStoreConflictError3,
  SessionStoreInvariantError as SessionStoreInvariantError2,
  SessionStoreNotFoundError as SessionStoreNotFoundError3,
  TurnAlreadyExistsError,
  TurnNotFoundError as TurnNotFoundError2,
  TurnNotRunningError
} from "@truefoundry/trueforge-core/agent-session/store/SessionStoreErrors";
import { getEmptyCurrentContextUsage } from "@truefoundry/trueforge-core/core/runtime/contextUsage";
import { sql as sql2 } from "kysely";
function isEmptyCustomRecord(value) {
  return Object.keys(value).length === 0;
}
function parseTurnCustom(value) {
  if (value === null) {
    return null;
  }
  if (!isEmptyCustomRecord(value)) {
    throw new SessionStoreInvariantError2("non-empty turn custom is not supported");
  }
  return value;
}
function terminalTurnState(state, turn_id) {
  switch (state.status) {
    case "running":
      throw new SessionStoreInvariantError2(`expected terminal state for turn ${turn_id}, got running`);
    case "done":
    case "cancelled":
    case "error":
      return state;
  }
}
async function loadTurnState(db, keys) {
  const row = await db.selectFrom("turn").select([jsonText(sql2.ref("state")).as("state")]).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).executeTakeFirst();
  return row?.state;
}
async function classifyTurnFenceWriteFailure(db, keys) {
  const state = await loadTurnState(db, keys);
  if (!state) {
    throw new TurnNotFoundError2(keys.turn_id);
  }
  throw new TurnNotRunningError(keys.turn_id, terminalTurnState(state, keys.turn_id));
}
async function classifyTurnThreadWriteFailure(db, keys, thread_id) {
  const state = await loadTurnState(db, keys);
  if (!state) {
    throw new TurnNotFoundError2(keys.turn_id);
  }
  if (state.status !== "running") {
    throw new TurnNotRunningError(keys.turn_id, terminalTurnState(state, keys.turn_id));
  }
  throw new SessionStoreInvariantError2(`thread ${thread_id} not found in turn ${keys.turn_id}`);
}
async function assertTurnRunning(db, keys) {
  const state = await loadTurnState(db, keys);
  if (!state) {
    throw new TurnNotFoundError2(keys.turn_id);
  }
  if (state.status !== "running") {
    throw new TurnNotRunningError(keys.turn_id, terminalTurnState(state, keys.turn_id));
  }
}
async function assembleTurnRecord(db, args) {
  const turn = await db.selectFrom("turn").select([
    "session_id",
    "turn_id",
    "first_turn_id",
    "previous_turn_id",
    jsonText(sql2.ref("ancestor_ids")).as("ancestor_ids"),
    jsonText(sql2.ref("input")).as("input"),
    jsonText(sql2.ref("state")).as("state"),
    jsonText(sql2.ref("checkpoint")).as("checkpoint"),
    jsonText(sql2.ref("custom")).as("custom"),
    "created_at",
    "updated_at"
  ]).where("session_id", "=", args.session_id).where("turn_id", "=", args.turn_id).executeTakeFirst();
  if (!turn) {
    return void 0;
  }
  const contextRows = await db.selectFrom("turn_thread as tt").leftJoin(
    "turn_thread_context as ttc",
    (join5) => join5.on("ttc.session_id", "=", args.session_id).on("ttc.turn_id", "=", args.turn_id).onRef("ttc.thread_id", "=", "tt.thread_id")
  ).leftJoin(
    "thread_context_log as l",
    (join5) => join5.on("l.session_id", "=", args.session_id).onRef("l.thread_id", "=", "tt.thread_id").onRef("l.append_id", "=", "ttc.append_id")
  ).select([
    "tt.thread_id",
    jsonText(sql2.ref("tt.checkpoint")).as("checkpoint"),
    jsonText(sql2.ref("tt.agent_info")).as("agent_info"),
    jsonText(sql2.ref("tt.current_context_usage")).as("current_context_usage"),
    jsonText(sql2.ref("l.body")).as("body"),
    "ttc.pos"
  ]).where("tt.session_id", "=", args.session_id).where("tt.turn_id", "=", args.turn_id).orderBy("tt.thread_id").orderBy("ttc.pos").execute();
  const capabilityRows = await db.selectFrom("thread_capability_state").select([
    "thread_id",
    sql2`json(jsonb_group_object(key, json(state)))`.as("capability_state")
  ]).where("session_id", "=", args.session_id).where("turn_id", "=", args.turn_id).groupBy("thread_id").execute();
  const capabilityByThread = /* @__PURE__ */ new Map();
  for (const row of capabilityRows) {
    if (row.capability_state !== null) {
      capabilityByThread.set(row.thread_id, row.capability_state);
    }
  }
  const threads = {};
  const orderedBodies = /* @__PURE__ */ new Map();
  const threadMeta = /* @__PURE__ */ new Map();
  for (const row of contextRows) {
    if (!threadMeta.has(row.thread_id)) {
      threadMeta.set(row.thread_id, {
        checkpoint: row.checkpoint,
        agent_info: row.agent_info,
        current_context_usage: row.current_context_usage
      });
      orderedBodies.set(row.thread_id, []);
    }
    if (row.body !== null) {
      const bodies = orderedBodies.get(row.thread_id);
      if (bodies !== void 0) {
        bodies.push(row.body);
      }
    }
  }
  for (const [threadId, meta] of threadMeta) {
    const context = orderedBodies.get(threadId) ?? [];
    const capability_state = capabilityByThread.get(threadId) ?? null;
    const snap = {
      thread_id: threadId,
      context,
      current_context_usage: meta.current_context_usage,
      parent: meta.checkpoint.parent,
      agent_info: meta.agent_info,
      completion: meta.checkpoint.completion,
      capability_state
    };
    threads[threadId] = snap;
  }
  const checkpoint = turn.checkpoint;
  const snapshot = {
    threads,
    mcp_servers: checkpoint.mcp_servers,
    sandbox_info: checkpoint.sandbox_info
  };
  return {
    turn_id: turn.turn_id,
    session_id: turn.session_id,
    first_turn_id: turn.first_turn_id,
    ancestor_ids: turn.ancestor_ids,
    previous_turn_id: turn.previous_turn_id,
    state: turn.state,
    input: turn.input,
    snapshot,
    created_at: new Date(turn.created_at),
    updated_at: new Date(turn.updated_at),
    custom: parseTurnCustom(turn.custom)
  };
}
async function createTurn(db, input) {
  try {
    await db.transaction().execute(async (trx) => {
      const locked = await trx.selectFrom("session").select(["last_turn_id"]).where("session_id", "=", input.session_id).executeTakeFirst();
      if (!locked) {
        throw new SessionNotFoundError(input.session_id);
      }
      let sessionUpdate = trx.updateTable("session").set({
        last_turn_id: input.turn.turn_id,
        updated_at: nowIso(),
        last_activity_timestamp_ms: input.last_activity_timestamp_ms
      }).where("session_id", "=", input.session_id);
      if (input.update_session_title_if_not_exist !== null) {
        const titleValue = input.update_session_title_if_not_exist;
        sessionUpdate = sessionUpdate.set({
          title: sql2`COALESCE(title, ${titleValue})`
        });
      }
      await sessionUpdate.execute();
      const prevTurnId = input.turn.previous_turn_id;
      let prevCheckpoint = null;
      const prevThreadRows = [];
      if (prevTurnId != null) {
        const prevRows = await trx.selectFrom("turn as t").leftJoin(
          "turn_thread as tt",
          (join5) => join5.onRef("tt.session_id", "=", "t.session_id").onRef("tt.turn_id", "=", "t.turn_id")
        ).leftJoin(
          db.selectFrom("turn_thread_context").select(["thread_id", "turn_id", sql2`MAX(pos)`.as("max_pos")]).where("session_id", "=", input.session_id).where("turn_id", "=", prevTurnId).groupBy(["thread_id", "turn_id"]).as("tc_agg"),
          (join5) => join5.onRef("tc_agg.thread_id", "=", "tt.thread_id").onRef("tc_agg.turn_id", "=", "tt.turn_id")
        ).select([
          jsonText(sql2.ref("t.checkpoint")).as("turn_checkpoint"),
          jsonText(sql2.ref("t.state")).as("turn_state"),
          "tt.thread_id",
          jsonText(sql2.ref("tt.checkpoint")).as("thread_checkpoint"),
          jsonText(sql2.ref("tt.agent_info")).as("agent_info"),
          jsonText(sql2.ref("tt.current_context_usage")).as("current_context_usage"),
          "tc_agg.max_pos"
        ]).where("t.session_id", "=", input.session_id).where("t.turn_id", "=", prevTurnId).execute();
        const first = prevRows[0];
        if (first !== void 0) {
          if (first.turn_state.status === "running") {
            throw new PreviousTurnRunningError(prevTurnId);
          }
          prevCheckpoint = first.turn_checkpoint;
          for (const row of prevRows) {
            if (row.thread_id === null) {
              continue;
            }
            if (row.thread_checkpoint === null || row.current_context_usage === null) {
              throw new SessionStoreInvariantError2(`previous turn_thread row for ${row.thread_id} is incomplete`);
            }
            prevThreadRows.push({
              thread_id: row.thread_id,
              checkpoint: row.thread_checkpoint,
              agent_info: row.agent_info,
              current_context_usage: row.current_context_usage,
              context_pos_max: row.max_pos ?? 0
            });
          }
        }
      }
      assertCreateTurnThreadDelta({
        previousThreadIds: new Set(prevThreadRows.map((r) => r.thread_id)),
        new_threads: input.new_threads,
        new_context_appends: input.new_context_appends,
        capability_states: input.capability_states
      });
      const checkpoint = {
        mcp_servers: input.mcp_servers ?? prevCheckpoint?.mcp_servers ?? null,
        sandbox_info: input.sandbox_info ?? prevCheckpoint?.sandbox_info ?? null
      };
      const now2 = nowIso();
      const turnCustom = input.turn.custom ?? null;
      await trx.insertInto("turn").values({
        session_id: input.session_id,
        turn_id: input.turn.turn_id,
        first_turn_id: input.turn.first_turn_id,
        previous_turn_id: input.turn.previous_turn_id ?? null,
        ancestor_ids: jsonbBind(input.turn.ancestor_ids),
        input: jsonbBind(input.turn.input),
        state: jsonbBind(input.turn.state),
        checkpoint: jsonbBind(checkpoint),
        custom: turnCustom !== null ? jsonbBind(turnCustom) : null,
        created_at: now2,
        updated_at: now2
      }).execute();
      const logRows = [];
      for (const append of input.new_context_appends) {
        for (const body of append.context) {
          logRows.push({
            session_id: input.session_id,
            thread_id: append.thread_id,
            turn_id: input.turn.turn_id,
            body: jsonbBind(body),
            created_at: now2
          });
        }
      }
      const newIdsByThread = /* @__PURE__ */ new Map();
      if (logRows.length > 0) {
        const inserted = await trx.insertInto("thread_context_log").values(logRows).returning(["thread_id", "append_id"]).execute();
        for (const row of sortedByAppendId(inserted)) {
          const list = newIdsByThread.get(row.thread_id);
          if (list === void 0) {
            newIdsByThread.set(row.thread_id, [row.append_id]);
          } else {
            list.push(row.append_id);
          }
        }
      }
      const appendUsageByThread = /* @__PURE__ */ new Map();
      for (const append of input.new_context_appends) {
        if (append.current_context_usage !== null) {
          appendUsageByThread.set(append.thread_id, append.current_context_usage);
        }
      }
      const turnThreadRows = [];
      const turnThreadContextRows = [];
      for (const parent of prevThreadRows) {
        const usage = appendUsageByThread.get(parent.thread_id) ?? parent.current_context_usage;
        turnThreadRows.push({
          session_id: input.session_id,
          turn_id: input.turn.turn_id,
          thread_id: parent.thread_id,
          checkpoint: jsonbBind(parent.checkpoint),
          agent_info: parent.agent_info !== null ? jsonbBind(parent.agent_info) : null,
          current_context_usage: jsonbBind(usage),
          updated_at: now2
        });
      }
      if (prevTurnId != null && prevThreadRows.length > 0) {
        const parentContextRows = await trx.selectFrom("turn_thread_context").select(["thread_id", "pos", "append_id"]).where("session_id", "=", input.session_id).where("turn_id", "=", prevTurnId).where(
          "thread_id",
          "in",
          prevThreadRows.map((r) => r.thread_id)
        ).orderBy("thread_id").orderBy("pos").execute();
        for (const cr of parentContextRows) {
          turnThreadContextRows.push({
            session_id: input.session_id,
            turn_id: input.turn.turn_id,
            thread_id: cr.thread_id,
            pos: cr.pos,
            append_id: cr.append_id
          });
        }
      }
      for (const parent of prevThreadRows) {
        const newIds = newIdsByThread.get(parent.thread_id) ?? [];
        const basePos = parent.context_pos_max;
        for (let i = 0; i < newIds.length; i++) {
          const appendId = newIds[i];
          if (appendId !== void 0) {
            turnThreadContextRows.push({
              session_id: input.session_id,
              turn_id: input.turn.turn_id,
              thread_id: parent.thread_id,
              pos: basePos + i + 1,
              append_id: appendId
            });
          }
        }
      }
      for (const nt of input.new_threads) {
        const newIds = newIdsByThread.get(nt.thread_id) ?? [];
        const usage = appendUsageByThread.get(nt.thread_id) ?? getEmptyCurrentContextUsage();
        const threadCheckpoint = {
          parent: nt.parent,
          completion: null
        };
        turnThreadRows.push({
          session_id: input.session_id,
          turn_id: input.turn.turn_id,
          thread_id: nt.thread_id,
          checkpoint: jsonbBind(threadCheckpoint),
          agent_info: nt.agent_info !== null ? jsonbBind(nt.agent_info) : null,
          current_context_usage: jsonbBind(usage),
          updated_at: now2
        });
        for (let i = 0; i < newIds.length; i++) {
          const appendId = newIds[i];
          if (appendId !== void 0) {
            turnThreadContextRows.push({
              session_id: input.session_id,
              turn_id: input.turn.turn_id,
              thread_id: nt.thread_id,
              pos: i + 1,
              append_id: appendId
            });
          }
        }
      }
      if (turnThreadRows.length > 0) {
        await trx.insertInto("turn_thread").values(turnThreadRows).execute();
      }
      if (turnThreadContextRows.length > 0) {
        await trx.insertInto("turn_thread_context").values(turnThreadContextRows).execute();
      }
      const capabilityStateRows = [];
      for (const capability of input.capability_states) {
        if (capability.capability_state === null) {
          continue;
        }
        for (const [key, state] of Object.entries(capability.capability_state)) {
          capabilityStateRows.push({
            session_id: input.session_id,
            turn_id: input.turn.turn_id,
            thread_id: capability.thread_id,
            key,
            state: state !== null ? jsonbBind(state) : null,
            updated_at: now2
          });
        }
      }
      if (capabilityStateRows.length > 0) {
        await trx.insertInto("thread_capability_state").values(capabilityStateRows).execute();
      }
    });
  } catch (err) {
    if (err instanceof SessionStoreNotFoundError3 || err instanceof SessionStoreConflictError3) {
      throw err;
    }
    if (isUniqueViolation(err)) {
      throw new TurnAlreadyExistsError(input.turn.turn_id, { cause: err });
    }
    throw err;
  }
}
async function freezeAndGetTurn(db, input) {
  return await db.transaction().execute(async (trx) => {
    const cancelledState = {
      status: "cancelled",
      reason: input.reason,
      completed_at: nowIso()
    };
    const updateResult = await trx.updateTable("turn").set({
      state: jsonbBind(cancelledState),
      updated_at: nowIso()
    }).where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).where(sql2`state->>'status' = 'running'`).executeTakeFirst();
    if (Number(updateResult.numUpdatedRows) > 0) {
      await trx.insertInto("session_event").values({
        session_id: input.session_id,
        turn_id: input.turn_id,
        event_id: input.turn_done_event.id,
        event: jsonbBind(input.turn_done_event),
        created_at: input.turn_done_event.created_at
      }).execute();
    }
    const record = await assembleTurnRecord(trx, input);
    if (!record) {
      throw new TurnNotFoundError2(input.turn_id);
    }
    return record;
  });
}
async function getTurn(db, input) {
  return db.transaction().setAccessMode("read only").execute((trx) => assembleTurnRecord(trx, input));
}
async function listTurns(db, input) {
  const rows = await db.selectFrom("turn").select([
    "session_id",
    "turn_id",
    "first_turn_id",
    "previous_turn_id",
    jsonText(sql2.ref("ancestor_ids")).as("ancestor_ids"),
    jsonText(sql2.ref("input")).as("input"),
    jsonText(sql2.ref("state")).as("state"),
    jsonText(sql2.ref("custom")).as("custom"),
    "created_at",
    "updated_at"
  ]).where("session_id", "=", input.session_id).orderBy("created_at", "asc").orderBy("turn_id", "asc").limit(input.limit + 1).offset(input.offset).execute();
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const turns = page.map((row) => ({
    turn_id: row.turn_id,
    session_id: row.session_id,
    first_turn_id: row.first_turn_id,
    ancestor_ids: row.ancestor_ids,
    previous_turn_id: row.previous_turn_id,
    state: row.state,
    input: row.input,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    custom: parseTurnCustom(row.custom)
  }));
  return {
    turns,
    next_offset: hasMore ? input.offset + input.limit : null
  };
}
async function updateTurnState(db, input) {
  await db.transaction().execute(async (trx) => {
    const result = await trx.updateTable("turn").set({
      state: jsonbBind(input.state),
      updated_at: nowIso()
    }).where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).where(sql2`state->>'status' = 'running'`).executeTakeFirst();
    const numUpdated = Number(result.numUpdatedRows);
    if (numUpdated === 0) {
      const existing = await trx.selectFrom("turn").select([jsonText(sql2.ref("state")).as("state")]).where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).executeTakeFirst();
      if (!existing) {
        throw new TurnNotFoundError2(input.turn_id);
      }
      throw new TurnNotRunningError(input.turn_id, terminalTurnState(existing.state, input.turn_id));
    }
    await trx.insertInto("session_event").values({
      session_id: input.session_id,
      turn_id: input.turn_id,
      event_id: input.turn_done_event.id,
      event: jsonbBind(input.turn_done_event),
      created_at: input.turn_done_event.created_at
    }).execute();
  });
}
var init_turns = __esm({
  "src/db/sqlite/session-store/queries/turns.ts"() {
    "use strict";
    init_client();
    init_sqlExpressions();
    init_sqlExpressions2();
  }
});

// src/db/sqlite/session-store/queries/capabilities.ts
import { sql as sql3 } from "kysely";
async function patchThreadCapabilityState(db, input) {
  await db.transaction().execute(async (trx) => {
    const fenceRow = await trx.selectFrom("turn").select(sql3`1`.as("one")).where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).where(sql3`state->>'status' = 'running'`).executeTakeFirst();
    if (!fenceRow) {
      await classifyTurnFenceWriteFailure(trx, input);
    }
    const now2 = nowIso();
    const stateValue = input.state !== null ? jsonbBind(input.state) : null;
    await trx.insertInto("thread_capability_state").values({
      session_id: input.session_id,
      turn_id: input.turn_id,
      thread_id: input.thread_id,
      key: input.key,
      state: stateValue,
      updated_at: now2
    }).onConflict(
      (oc) => oc.columns(["session_id", "turn_id", "thread_id", "key"]).doUpdateSet({
        state: sql3`excluded.state`,
        updated_at: sql3`excluded.updated_at`
      })
    ).execute();
  });
}
var init_capabilities = __esm({
  "src/db/sqlite/session-store/queries/capabilities.ts"() {
    "use strict";
    init_sqlExpressions();
    init_turns();
  }
});

// src/db/sqlite/session-store/queries/events.ts
import {
  decodeOffsetPageToken,
  paginateOffsetRows
} from "@truefoundry/trueforge-core/agent-session/store/OffsetPageToken";
import {
  decodeSessionEventPageToken,
  paginateSessionEventRows
} from "@truefoundry/trueforge-core/agent-session/store/SessionEventPageToken";
import {
  SessionNotFoundError as SessionNotFoundError2,
  TurnNotFoundError as TurnNotFoundError3
} from "@truefoundry/trueforge-core/agent-session/store/SessionStoreErrors";
import { sql as sql4 } from "kysely";
async function appendToEvents(db, input) {
  if (input.events.length === 0) {
    return;
  }
  const keys = {
    session_id: input.session_id,
    turn_id: input.turn_id
  };
  await db.transaction().execute(async (trx) => {
    const fenceRow = await trx.selectFrom("turn").select(sql4`1`.as("one")).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where(sql4`state->>'status' = 'running'`).executeTakeFirst();
    if (!fenceRow) {
      await classifyTurnFenceWriteFailure(trx, keys);
    }
    const eventRows = input.events.map((event) => ({
      session_id: input.session_id,
      turn_id: input.turn_id,
      event_id: event.id,
      event: jsonbBind(event),
      created_at: event.created_at
    }));
    await trx.insertInto("session_event").values(eventRows).execute();
  });
}
async function listTurnEvents(db, input) {
  const offset = decodeOffsetPageToken(input.page_token);
  const limit = input.limit;
  const eventOrder = input.order === "desc" ? "desc" : "asc";
  const rows = await db.selectFrom("turn as t").leftJoin(
    (eb) => eb.selectFrom("session_event").select(["session_id", "turn_id", "event_id", jsonText(sql4.ref("event")).as("event")]).where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).orderBy("event_id", eventOrder).limit(limit + 1).offset(offset).as("e"),
    (join5) => join5.onRef("e.session_id", "=", "t.session_id").onRef("e.turn_id", "=", "t.turn_id")
  ).select(["t.turn_id", "e.event"]).where("t.session_id", "=", input.session_id).where("t.turn_id", "=", input.turn_id).orderBy("e.event_id", eventOrder).execute();
  if (rows.length === 0) {
    throw new TurnNotFoundError3(input.turn_id);
  }
  const events = [];
  for (const row of rows) {
    if (row.event !== null) {
      events.push(row.event);
    }
  }
  return paginateOffsetRows(events, limit, offset);
}
async function resolveAncestorChain(db, sessionId, anchor) {
  const chain = [...anchor.ancestor_ids, anchor.turn_id];
  const seen = new Set(chain);
  let oldestId = chain[0];
  while (oldestId && oldestId !== anchor.turn_id) {
    const oldest = await db.selectFrom("turn").select([jsonText(sql4.ref("ancestor_ids")).as("ancestor_ids")]).where("session_id", "=", sessionId).where("turn_id", "=", oldestId).executeTakeFirst();
    if (!oldest) {
      break;
    }
    const older = oldest.ancestor_ids.filter((id) => !seen.has(id));
    if (older.length === 0) {
      break;
    }
    chain.unshift(...older);
    for (const id of older) {
      seen.add(id);
    }
    oldestId = older[0];
  }
  return chain;
}
async function listSessionEvents(db, input) {
  const limit = input.limit;
  const session = await db.selectFrom("session").select("last_turn_id").where("session_id", "=", input.session_id).executeTakeFirst();
  if (!session) {
    throw new SessionNotFoundError2(input.session_id);
  }
  const decodedCursor = input.page_token === void 0 ? void 0 : decodeSessionEventPageToken(input.page_token);
  const lastTurnId = decodedCursor?.last_turn_id ?? input.last_turn_id ?? session.last_turn_id;
  if (lastTurnId === null) {
    return { data: [], pagination: { limit } };
  }
  const cursor = {
    last_turn_id: lastTurnId,
    offset: decodedCursor?.offset ?? 0
  };
  const anchor = await db.selectFrom("turn").select(["turn_id", jsonText(sql4.ref("ancestor_ids")).as("ancestor_ids")]).where("session_id", "=", input.session_id).where("turn_id", "=", cursor.last_turn_id).executeTakeFirst();
  if (!anchor) {
    throw new TurnNotFoundError3(cursor.last_turn_id);
  }
  const chainIds = await resolveAncestorChain(db, input.session_id, {
    turn_id: anchor.turn_id,
    ancestor_ids: anchor.ancestor_ids
  });
  const chainJson = JSON.stringify(chainIds);
  const rows = await db.selectFrom(sql4`json_each(${chainJson})`.as("c")).innerJoin(
    "session_event as e",
    (join5) => join5.on("e.session_id", "=", input.session_id).on(sql4`e.turn_id = c.value`)
  ).select([sql4`c.value`.as("turn_id"), jsonText(sql4.ref("e.event")).as("event")]).orderBy(sql4`c.key`, "desc").orderBy("e.event_id", "desc").limit(limit + 1).offset(cursor.offset).execute();
  return paginateSessionEventRows(rows, limit, cursor);
}
var init_events = __esm({
  "src/db/sqlite/session-store/queries/events.ts"() {
    "use strict";
    init_sqlExpressions();
    init_turns();
  }
});

// src/db/sessionAgentColumns.ts
import { AgentSpecSchema as AgentSpecSchema4 } from "@truefoundry/trueforge-core/agent-session";
function sessionAgentToColumns(agent) {
  if (agent.type === "reference") {
    return { agent_id: agent.id, agent_name: agent.name, agent_spec: null };
  }
  return { agent_id: null, agent_name: null, agent_spec: agent.spec };
}
function sessionAgentFromColumns(input) {
  if (input.agent_id !== null && input.agent_spec === null) {
    return { type: "reference", id: input.agent_id, name: input.agent_name };
  }
  if (input.agent_id === null && input.agent_spec !== null) {
    return { type: "inline", spec: AgentSpecSchema4.parse(input.agent_spec) };
  }
  throw new Error(
    `Session ${input.session_id} has invalid agent binding (exactly one of agent_id or agent_spec required)`
  );
}
var init_sessionAgentColumns = __esm({
  "src/db/sessionAgentColumns.ts"() {
    "use strict";
  }
});

// src/db/sqlite/session-store/queries/sessions.ts
import {
  decodeSessionListPageToken,
  paginateSessionListRows
} from "@truefoundry/trueforge-core/agent-session/store/SessionListPageToken";
import {
  SessionAlreadyExistsError,
  SessionNotFoundError as SessionNotFoundError3,
  SessionStoreInvariantError as SessionStoreInvariantError3
} from "@truefoundry/trueforge-core/agent-session/store/SessionStoreErrors";
import { sql as sql5 } from "kysely";
function isEmptyCustomRecord2(value) {
  return Object.keys(value).length === 0;
}
function parseSessionCustom(value) {
  if (value === null) {
    return null;
  }
  if (!isEmptyCustomRecord2(value)) {
    throw new SessionStoreInvariantError3("non-empty session custom is not supported");
  }
  return value;
}
function mapRowToSessionRecord(row) {
  return {
    tenant_id: row.tenant_id,
    session_id: row.session_id,
    created_by: row.created_by,
    agent: sessionAgentFromColumns({
      session_id: row.session_id,
      agent_id: row.agent_id,
      agent_name: row.agent_name,
      agent_spec: row.agent_spec
    }),
    title: row.title,
    last_turn_id: row.last_turn_id,
    custom: parseSessionCustom(row.custom),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    last_activity_timestamp_ms: row.last_activity_timestamp_ms
  };
}
function sessionSelectColumns() {
  return [
    "tenant_id",
    "session_id",
    "created_by",
    "agent_id",
    "agent_name",
    jsonText(sql5.ref("agent_spec")).as("agent_spec"),
    "title",
    "last_turn_id",
    jsonText(sql5.ref("custom")).as("custom"),
    "created_at",
    "updated_at",
    "last_activity_timestamp_ms"
  ];
}
async function createSession(db, input) {
  const columns = sessionAgentToColumns(input.agent);
  const now2 = nowIso();
  try {
    await db.insertInto("session").values({
      tenant_id: input.tenant_id,
      session_id: input.session_id,
      created_by: input.created_by,
      agent_id: columns.agent_id,
      agent_name: columns.agent_name,
      agent_spec: columns.agent_spec !== null ? jsonbBind(columns.agent_spec) : null,
      title: null,
      custom: input.custom !== null ? jsonbBind(input.custom) : null,
      created_at: now2,
      updated_at: now2,
      last_activity_timestamp_ms: Date.now()
    }).execute();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new SessionAlreadyExistsError(input.session_id, { cause: error });
    }
    throw error;
  }
}
async function deleteSession(db, input) {
  await db.deleteFrom("session").where("tenant_id", "=", input.tenant_id).where("session_id", "=", input.session_id).execute();
}
async function getSession(db, input) {
  const row = await db.selectFrom("session").select(sessionSelectColumns).where("tenant_id", "=", input.tenant_id).where("session_id", "=", input.session_id).executeTakeFirst();
  if (row === void 0) {
    return void 0;
  }
  return mapRowToSessionRecord(row);
}
async function updateSession(db, input) {
  const agent = input.agent;
  const title = input.title;
  if (agent !== void 0) {
    const existing = await getSession(db, { tenant_id: input.tenant_id, session_id: input.session_id });
    if (existing === void 0) {
      throw new SessionNotFoundError3(input.session_id);
    }
    if (existing.agent.type === "reference") {
      throw new SessionStoreInvariantError3(`Session ${input.session_id} is named; agent cannot be updated`);
    }
  }
  let qb = db.updateTable("session").set({
    updated_at: nowIso(),
    last_activity_timestamp_ms: Date.now()
  }).where("tenant_id", "=", input.tenant_id).where("session_id", "=", input.session_id);
  if (agent !== void 0) {
    qb = qb.set({ agent_spec: jsonbBind(agent.spec) });
  }
  if (title !== void 0) {
    qb = qb.set({ title });
  }
  const result = await qb.executeTakeFirst();
  const numUpdatedRows = Number(result.numUpdatedRows);
  if (numUpdatedRows === 0) {
    throw new SessionNotFoundError3(input.session_id);
  }
}
async function listSessions(db, input) {
  const limit = input.limit;
  const order = input.order ?? "desc";
  const cursor = decodeSessionListPageToken(input.page_token);
  let query = db.selectFrom("session").select(sessionSelectColumns).where("tenant_id", "=", input.tenant_id);
  if (input.agent_id !== void 0) {
    query = query.where("agent_id", "=", input.agent_id);
  }
  if (input.created_by !== void 0) {
    query = query.where("created_by", "=", input.created_by);
  }
  if (input.start_timestamp !== void 0) {
    query = query.where("created_at", ">=", input.start_timestamp.toISOString());
  }
  if (input.end_timestamp !== void 0) {
    query = query.where("created_at", "<=", input.end_timestamp.toISOString());
  }
  if (cursor) {
    const cursorUpdatedAt = cursor.updated_at;
    const sessionId = cursor.session_id;
    if (order === "asc") {
      query = query.where(
        (eb) => eb.or([
          eb("updated_at", ">", cursorUpdatedAt),
          eb.and([eb("updated_at", "=", cursorUpdatedAt), eb("session_id", ">", sessionId)])
        ])
      );
    } else {
      query = query.where(
        (eb) => eb.or([
          eb("updated_at", "<", cursorUpdatedAt),
          eb.and([eb("updated_at", "=", cursorUpdatedAt), eb("session_id", "<", sessionId)])
        ])
      );
    }
  }
  if (order === "asc") {
    query = query.orderBy("updated_at", "asc").orderBy("session_id", "asc");
  } else {
    query = query.orderBy("updated_at", "desc").orderBy("session_id", "desc");
  }
  const rows = await query.limit(limit + 1).execute();
  const { data: pageRows, pagination } = paginateSessionListRows(rows, limit, (row) => row.updated_at);
  return { data: pageRows.map(mapRowToSessionRecord), pagination };
}
var init_sessions = __esm({
  "src/db/sqlite/session-store/queries/sessions.ts"() {
    "use strict";
    init_sessionAgentColumns();
    init_client();
    init_sqlExpressions();
  }
});

// src/db/sqlite/session-store/queries/threads.ts
import { sql as sql6 } from "kysely";
async function addThreads(db, input) {
  await db.transaction().execute(async (trx) => {
    await assertTurnRunning(trx, {
      session_id: input.session_id,
      turn_id: input.turn_id
    });
    const now2 = nowIso();
    const logRows = [];
    const capabilityStateRows = [];
    const turnThreadPlans = [];
    for (const thread of input.threads) {
      const threadCheckpoint = {
        parent: thread.parent ?? null,
        completion: thread.completion ?? null
      };
      turnThreadPlans.push({
        thread_id: thread.thread_id,
        checkpoint: threadCheckpoint,
        agent_info: thread.agent_info != null ? jsonbBind(thread.agent_info) : null,
        current_context_usage: thread.current_context_usage
      });
      for (const body of thread.context) {
        logRows.push({
          session_id: input.session_id,
          thread_id: thread.thread_id,
          turn_id: input.turn_id,
          body: jsonbBind(body),
          created_at: now2
        });
      }
      const capabilityState = thread.capability_state;
      if (capabilityState != null) {
        for (const key of Object.keys(capabilityState)) {
          const state = capabilityState[key];
          if (state === void 0) {
            throw new Error(
              `capability_state['${key}'] for thread '${thread.thread_id}' is undefined \u2014 undefined is banned from capability state`
            );
          }
          capabilityStateRows.push({
            session_id: input.session_id,
            turn_id: input.turn_id,
            thread_id: thread.thread_id,
            key,
            state: state !== null ? jsonbBind(state) : null,
            updated_at: now2
          });
        }
      }
    }
    const newIdsByThread = /* @__PURE__ */ new Map();
    if (logRows.length > 0) {
      const inserted = await trx.insertInto("thread_context_log").values(logRows).returning(["thread_id", "append_id"]).execute();
      for (const row of sortedByAppendId(inserted)) {
        const list = newIdsByThread.get(row.thread_id);
        if (list === void 0) {
          newIdsByThread.set(row.thread_id, [row.append_id]);
        } else {
          list.push(row.append_id);
        }
      }
    }
    const turnThreadRows = turnThreadPlans.map((plan) => ({
      session_id: input.session_id,
      turn_id: input.turn_id,
      thread_id: plan.thread_id,
      checkpoint: jsonbBind(plan.checkpoint),
      agent_info: plan.agent_info,
      current_context_usage: jsonbBind(plan.current_context_usage),
      updated_at: now2
    }));
    if (turnThreadRows.length > 0) {
      await trx.insertInto("turn_thread").values(turnThreadRows).execute();
    }
    const contextMappingRows = [];
    for (const plan of turnThreadPlans) {
      const newIds = newIdsByThread.get(plan.thread_id) ?? [];
      for (let i = 0; i < newIds.length; i++) {
        const appendId = newIds[i];
        if (appendId !== void 0) {
          contextMappingRows.push({
            session_id: input.session_id,
            turn_id: input.turn_id,
            thread_id: plan.thread_id,
            pos: i + 1,
            append_id: appendId
          });
        }
      }
    }
    if (contextMappingRows.length > 0) {
      await trx.insertInto("turn_thread_context").values(contextMappingRows).execute();
    }
    if (capabilityStateRows.length > 0) {
      await trx.insertInto("thread_capability_state").values(capabilityStateRows).execute();
    }
  });
}
async function removeThreads(db, input) {
  if (input.thread_ids.length === 0) {
    return;
  }
  await db.transaction().execute(async (trx) => {
    await assertTurnRunning(trx, {
      session_id: input.session_id,
      turn_id: input.turn_id
    });
    await trx.deleteFrom("turn_thread_context").where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).where("thread_id", "in", input.thread_ids).execute();
    await trx.deleteFrom("turn_thread").where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).where("thread_id", "in", input.thread_ids).execute();
    await trx.deleteFrom("thread_capability_state").where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).where("thread_id", "in", input.thread_ids).execute();
  });
}
async function getNextPos(db, keys, thread_id) {
  const maxRow = await db.selectFrom("turn_thread_context").select([sql6`MAX(pos)`.as("max_pos")]).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where("thread_id", "=", thread_id).executeTakeFirst();
  return (maxRow?.max_pos ?? 0) + 1;
}
function completionPatchExpr(completion) {
  if (completion === null) {
    return sql6`checkpoint`;
  }
  return jsonbSet(sql6.ref("checkpoint"), "$.completion", completion);
}
function usageSetExpr(usage) {
  if (usage === null) {
    return sql6`current_context_usage`;
  }
  return sql6`coalesce(${jsonbBind(usage)}, current_context_usage)`;
}
async function fencedTurnThreadContextUpdate(db, args) {
  const { keys, thread_id, context, replace_array } = args;
  await db.transaction().execute(async (trx) => {
    await assertTurnRunning(trx, keys);
    const now2 = nowIso();
    if (replace_array) {
      await trx.deleteFrom("turn_thread_context").where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where("thread_id", "=", thread_id).execute();
    }
    if (context.length > 0) {
      const logRows = context.map((body) => ({
        session_id: keys.session_id,
        thread_id,
        turn_id: keys.turn_id,
        body: jsonbBind(body),
        created_at: now2
      }));
      const inserted = await trx.insertInto("thread_context_log").values(logRows).returning(["append_id"]).execute();
      let nextPos = replace_array ? 1 : await getNextPos(trx, keys, thread_id);
      const contextMappingRows = [];
      for (const row of sortedByAppendId(inserted)) {
        contextMappingRows.push({
          session_id: keys.session_id,
          turn_id: keys.turn_id,
          thread_id,
          pos: nextPos,
          append_id: row.append_id
        });
        nextPos++;
      }
      if (contextMappingRows.length > 0) {
        await trx.insertInto("turn_thread_context").values(contextMappingRows).execute();
      }
    }
    const usageExpr = args.usage_unconditional !== null ? jsonbBind(args.usage_unconditional) : usageSetExpr(args.current_context_usage);
    const updateResult = await trx.updateTable("turn_thread").set({
      checkpoint: completionPatchExpr(args.completion),
      current_context_usage: usageExpr,
      updated_at: now2
    }).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where("thread_id", "=", thread_id).executeTakeFirst();
    if (Number(updateResult.numUpdatedRows) === 0) {
      await classifyTurnThreadWriteFailure(trx, keys, thread_id);
    }
  });
}
async function appendToThreadContext(db, input) {
  await fencedTurnThreadContextUpdate(db, {
    keys: {
      session_id: input.session_id,
      turn_id: input.turn_id
    },
    thread_id: input.thread_id,
    context: input.context,
    replace_array: false,
    current_context_usage: input.current_context_usage,
    completion: input.completion,
    usage_unconditional: null
  });
}
async function overwriteThreadContext(db, input) {
  await fencedTurnThreadContextUpdate(db, {
    keys: {
      session_id: input.session_id,
      turn_id: input.turn_id
    },
    thread_id: input.event.thread_id,
    context: input.event.context,
    replace_array: true,
    current_context_usage: null,
    completion: null,
    usage_unconditional: input.event.current_context_usage
  });
}
async function patchMCPServers(db, input) {
  const serversById = {};
  for (const server of input.mcp_servers) {
    serversById[server.id] = server;
  }
  const keys = {
    session_id: input.session_id,
    turn_id: input.turn_id
  };
  const patchJson = JSON.stringify(serversById);
  const result = await db.updateTable("turn").set({
    checkpoint: sql6`jsonb_set(
        checkpoint,
        '$.mcp_servers',
        coalesce((
          SELECT jsonb_group_object(key, jsonb(value))
          FROM (
            SELECT key, value
            FROM json_each(
              CASE WHEN json_type(checkpoint, '$.mcp_servers') = 'object'
                   THEN json(jsonb_extract(checkpoint, '$.mcp_servers'))
                   ELSE '{}' END
            )
            WHERE key NOT IN (SELECT key FROM json_each(${patchJson}))
            UNION ALL
            SELECT key, value FROM json_each(${patchJson})
          )
        ), jsonb('{}'))
      )`,
    updated_at: nowIso()
  }).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where(sql6`state->>'status' = 'running'`).executeTakeFirst();
  if (Number(result.numUpdatedRows) === 0) {
    await classifyTurnFenceWriteFailure(db, keys);
  }
}
async function patchSandboxInfo(db, input) {
  const keys = {
    session_id: input.session_id,
    turn_id: input.turn_id
  };
  const result = await db.updateTable("turn").set({
    checkpoint: jsonbSet(sql6.ref("checkpoint"), "$.sandbox_info", input.sandbox_info),
    updated_at: nowIso()
  }).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where(sql6`state->>'status' = 'running'`).executeTakeFirst();
  if (Number(result.numUpdatedRows) === 0) {
    await classifyTurnFenceWriteFailure(db, keys);
  }
}
var init_threads = __esm({
  "src/db/sqlite/session-store/queries/threads.ts"() {
    "use strict";
    init_sqlExpressions();
    init_sqlExpressions2();
    init_turns();
  }
});

// src/db/sqlite/session-store/SqliteSessionStore.ts
var SqliteSessionStore_exports = {};
__export(SqliteSessionStore_exports, {
  SqliteSessionStore: () => SqliteSessionStore
});
import {
  decodeOffsetPageToken as decodeOffsetPageToken2,
  encodeOffsetPageToken
} from "@truefoundry/trueforge-core/agent-session/store/OffsetPageToken";
var SqliteSessionStore;
var init_SqliteSessionStore = __esm({
  "src/db/sqlite/session-store/SqliteSessionStore.ts"() {
    "use strict";
    init_capabilities();
    init_events();
    init_sessions();
    init_threads();
    init_turns();
    SqliteSessionStore = class {
      constructor(db) {
        this.db = db;
      }
      db;
      createSession(input) {
        return createSession(this.db, input);
      }
      deleteSession(input) {
        return deleteSession(this.db, input);
      }
      getSession(input) {
        return getSession(this.db, input);
      }
      updateSession(input) {
        return updateSession(this.db, input);
      }
      async listSessions(input) {
        const result = await listSessions(this.db, input);
        return {
          data: result.data,
          pagination: {
            limit: input.limit,
            ...result.pagination
          }
        };
      }
      async createTurn(input) {
        await createTurn(this.db, {
          session_id: input.turn.session_id,
          turn: {
            turn_id: input.turn.turn_id,
            first_turn_id: input.turn.first_turn_id,
            previous_turn_id: input.turn.previous_turn_id,
            ancestor_ids: input.turn.ancestor_ids,
            input: input.turn.input,
            state: input.turn.state,
            custom: input.turn.custom
          },
          new_threads: input.new_threads.map((thread) => ({
            thread_id: thread.thread_id,
            parent: thread.parent,
            agent_info: thread.agent_info
          })),
          new_context_appends: input.new_context_appends,
          capability_states: input.capability_states,
          last_activity_timestamp_ms: Date.now(),
          update_session_title_if_not_exist: input.update_session_title_if_not_exist,
          mcp_servers: null,
          sandbox_info: null
        });
      }
      freezeAndGetTurn(input) {
        return freezeAndGetTurn(this.db, input);
      }
      getTurn(input) {
        return getTurn(this.db, input);
      }
      async listTurns(input) {
        const offset = decodeOffsetPageToken2(input.page_token);
        const result = await listTurns(this.db, {
          session_id: input.session_id,
          limit: input.limit,
          offset
        });
        const pagination = { limit: input.limit };
        if (result.next_offset !== null) {
          pagination.next_page_token = encodeOffsetPageToken(result.next_offset);
        }
        if (offset > 0) {
          pagination.previous_page_token = encodeOffsetPageToken(Math.max(0, offset - input.limit));
        }
        return { data: result.turns, pagination };
      }
      updateTurnState(input) {
        return updateTurnState(this.db, input);
      }
      appendToEvents(input) {
        return appendToEvents(this.db, input);
      }
      addThreads(input) {
        return addThreads(this.db, input);
      }
      removeThreads(input) {
        return removeThreads(this.db, input);
      }
      appendToThreadContext(input) {
        return appendToThreadContext(this.db, input);
      }
      overwriteThreadContext(input) {
        return overwriteThreadContext(this.db, input);
      }
      patchMCPServers(input) {
        return patchMCPServers(this.db, input);
      }
      patchSandboxInfo(input) {
        return patchSandboxInfo(this.db, input);
      }
      patchThreadCapabilityState(input) {
        return patchThreadCapabilityState(this.db, input);
      }
      listTurnEvents(input) {
        return listTurnEvents(this.db, input);
      }
      listSessionEvents(input) {
        return listSessionEvents(this.db, input);
      }
    };
  }
});

// src/db/sqlite/model-provider-store/SqliteModelProviderStore.ts
var SqliteModelProviderStore_exports = {};
__export(SqliteModelProviderStore_exports, {
  SqliteModelProviderStore: () => SqliteModelProviderStore
});
function recordColumns(eb) {
  return [
    "tenant_id",
    "name",
    jsonText(eb.ref("manifest")).as("manifest"),
    "created_at",
    "updated_at"
  ];
}
var SqliteModelProviderStore;
var init_SqliteModelProviderStore = __esm({
  "src/db/sqlite/model-provider-store/SqliteModelProviderStore.ts"() {
    "use strict";
    init_modelProviderStore();
    init_client();
    init_sqlExpressions();
    SqliteModelProviderStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async listProviders(tenantId, transaction) {
        const db = transaction ?? this.#db;
        return await db.selectFrom("model_provider").select(recordColumns).where("tenant_id", "=", tenantId).orderBy("name").execute();
      }
      async getProvider(input, transaction) {
        const db = transaction ?? this.#db;
        return await db.selectFrom("model_provider").select(recordColumns).where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).executeTakeFirst();
      }
      /**
       * SQLite has no row-level FOR UPDATE; the required write transaction (BEGIN IMMEDIATE)
       * serializes concurrent writers so RMW of secrets stays consistent.
       */
      async getProviderForUpdate(input, transaction) {
        return await transaction.selectFrom("model_provider").select(recordColumns).where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).executeTakeFirst();
      }
      async createProvider(input, transaction) {
        const db = transaction ?? this.#db;
        const timestamp = nowIso();
        try {
          return await db.insertInto("model_provider").values({
            tenant_id: input.tenant_id,
            name: input.name,
            manifest: jsonbBind(input.manifest),
            created_at: timestamp,
            updated_at: timestamp
          }).returning(recordColumns).executeTakeFirstOrThrow();
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new ModelProviderNameConflictError({ tenant_id: input.tenant_id, name: input.name }, { cause: error });
          }
          throw error;
        }
      }
      async upsertProvider(input, transaction) {
        const db = transaction ?? this.#db;
        const timestamp = nowIso();
        return await db.insertInto("model_provider").values({
          tenant_id: input.tenant_id,
          name: input.name,
          manifest: jsonbBind(input.manifest),
          created_at: timestamp,
          updated_at: timestamp
        }).onConflict(
          (oc) => oc.columns(["tenant_id", "name"]).doUpdateSet({
            manifest: jsonbBind(input.manifest),
            updated_at: timestamp
          })
        ).returning(recordColumns).executeTakeFirstOrThrow();
      }
      async listModels(tenantId, transaction) {
        return flattenProviderModels(await this.listProviders(tenantId, transaction));
      }
    };
  }
});

// src/db/sqlite/mcp-server-store/SqliteMcpServerStore.ts
var SqliteMcpServerStore_exports = {};
__export(SqliteMcpServerStore_exports, {
  SqliteMcpServerStore: () => SqliteMcpServerStore
});
import { ulid as ulid5 } from "ulid";
function recordColumns2(eb) {
  return [
    "id",
    "tenant_id",
    "name",
    jsonText(eb.ref("manifest")).as("manifest"),
    "created_at",
    "updated_at"
  ];
}
var SqliteMcpServerStore;
var init_SqliteMcpServerStore = __esm({
  "src/db/sqlite/mcp-server-store/SqliteMcpServerStore.ts"() {
    "use strict";
    init_mcpServerStore();
    init_client();
    init_sqlExpressions();
    SqliteMcpServerStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async listServers(input, transaction) {
        if (input.names?.length === 0) {
          return [];
        }
        const db = transaction ?? this.#db;
        let query = db.selectFrom("mcp_server").select(recordColumns2).where("tenant_id", "=", input.tenant_id);
        if (input.names !== void 0) {
          query = query.where("name", "in", [...input.names]);
        }
        return await query.orderBy("name").execute();
      }
      async getServer(input, transaction) {
        const db = transaction ?? this.#db;
        return await db.selectFrom("mcp_server").select(recordColumns2).where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).executeTakeFirst();
      }
      /**
       * SQLite has no row-level FOR UPDATE; the required write transaction (BEGIN IMMEDIATE)
       * serializes concurrent writers so RMW of header secrets stays consistent.
       */
      async getServerForUpdate(input, transaction) {
        return await transaction.selectFrom("mcp_server").select(recordColumns2).where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).executeTakeFirst();
      }
      async createServer(input, transaction) {
        const db = transaction ?? this.#db;
        const timestamp = nowIso();
        try {
          return await db.insertInto("mcp_server").values({
            id: ulid5(),
            tenant_id: input.tenant_id,
            name: input.name,
            manifest: jsonbBind(input.manifest),
            oauth_server: null,
            oauth_client: null,
            created_at: timestamp,
            updated_at: timestamp
          }).returning(recordColumns2).executeTakeFirstOrThrow();
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new McpServerNameConflictError({ tenant_id: input.tenant_id, name: input.name }, { cause: error });
          }
          throw error;
        }
      }
      async upsertServer(input, transaction) {
        const db = transaction ?? this.#db;
        const timestamp = nowIso();
        return await db.insertInto("mcp_server").values({
          id: ulid5(),
          tenant_id: input.tenant_id,
          name: input.name,
          manifest: jsonbBind(input.manifest),
          oauth_server: null,
          oauth_client: null,
          created_at: timestamp,
          updated_at: timestamp
        }).onConflict(
          (oc) => oc.columns(["tenant_id", "name"]).doUpdateSet({
            manifest: jsonbBind(input.manifest),
            updated_at: timestamp
          })
        ).returning(recordColumns2).executeTakeFirstOrThrow();
      }
      async getClient(params, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.selectFrom("mcp_server").select((eb) => [
          jsonText(eb.ref("oauth_server")).as("oauth_server"),
          jsonText(eb.ref("oauth_client")).as("oauth_client")
        ]).where("id", "=", params.id).executeTakeFirst();
        if (row?.oauth_server == null || row.oauth_client == null) {
          return void 0;
        }
        return fromStoredOAuthClientRecord({ server: row.oauth_server, client: row.oauth_client });
      }
      async saveClient(params, transaction) {
        const db = transaction ?? this.#db;
        const stored = toStoredOAuthClientRecord(params.record);
        await db.updateTable("mcp_server").set({
          oauth_server: jsonbBind(stored.server),
          oauth_client: jsonbBind(stored.client)
        }).where("id", "=", params.id).execute();
      }
      async deleteClient(params, transaction) {
        const db = transaction ?? this.#db;
        await db.updateTable("mcp_server").set({
          oauth_server: null,
          oauth_client: null
        }).where("id", "=", params.id).execute();
      }
    };
  }
});

// src/db/sqlite/token-store/queries/pendingAuthorization.ts
import { sql as sql7 } from "kysely";
async function savePendingAuthorization(db, pending) {
  const authData = toStoredOAuthPendingAuthorizationData(pending);
  await db.insertInto("oauth_pending_authorization").values({
    id: pending.state,
    oauth_server_id: pending.id,
    user_id: pending.userRef,
    auth_data: jsonbBind(authData),
    created_at: nowIso()
  }).execute();
}
async function consumePendingAuthorization(db, params) {
  const row = await db.deleteFrom("oauth_pending_authorization").where("id", "=", params.state).where("created_at", ">", isoMsAgo(PENDING_AUTHORIZATION_TTL_MS)).returning([
    "id",
    "oauth_server_id",
    "user_id",
    jsonText(sql7.ref("auth_data")).as("auth_data")
  ]).executeTakeFirst();
  if (row === void 0) {
    return void 0;
  }
  return {
    state: row.id,
    id: row.oauth_server_id,
    userRef: row.user_id,
    ...fromStoredOAuthPendingAuthorizationData(row.auth_data)
  };
}
async function deletePendingAuthorizationsForServer(db, params) {
  await db.deleteFrom("oauth_pending_authorization").where("oauth_server_id", "=", params.id).execute();
}
var init_pendingAuthorization = __esm({
  "src/db/sqlite/token-store/queries/pendingAuthorization.ts"() {
    "use strict";
    init_mcpServerStore();
    init_sqlExpressions();
  }
});

// src/db/sqlite/token-store/queries/token.ts
import { sql as sql8 } from "kysely";
async function saveToken(db, params) {
  await db.insertInto("oauth_token").values({
    oauth_server_id: params.id,
    user_id: params.userRef,
    token: jsonbBind(params.token),
    updated_at: nowIso()
  }).onConflict(
    (oc) => oc.columns(["oauth_server_id", "user_id"]).doUpdateSet({
      token: sql8`excluded.token`,
      updated_at: sql8`excluded.updated_at`
    })
  ).execute();
}
async function getToken(db, params) {
  const row = await db.selectFrom("oauth_token").select(jsonText(sql8.ref("token")).as("token")).where("oauth_server_id", "=", params.id).where("user_id", "=", params.userRef).executeTakeFirst();
  return row === void 0 ? void 0 : row.token;
}
async function getTokens(db, params) {
  if (params.ids.length === 0) {
    return /* @__PURE__ */ new Map();
  }
  const rows = await db.selectFrom("oauth_token").select(["oauth_server_id", jsonText(sql8.ref("token")).as("token")]).where("oauth_server_id", "in", params.ids).where("user_id", "=", params.userRef).execute();
  return new Map(rows.map((row) => [row.oauth_server_id, row.token]));
}
async function deleteToken(db, params) {
  await db.deleteFrom("oauth_token").where("oauth_server_id", "=", params.id).where("user_id", "=", params.userRef).execute();
}
async function deleteTokensForServer(db, params) {
  await db.deleteFrom("oauth_token").where("oauth_server_id", "=", params.id).execute();
}
var init_token = __esm({
  "src/db/sqlite/token-store/queries/token.ts"() {
    "use strict";
    init_sqlExpressions();
  }
});

// src/db/sqlite/token-store/SqliteOAuthTokenStore.ts
var SqliteOAuthTokenStore_exports = {};
__export(SqliteOAuthTokenStore_exports, {
  SqliteOAuthTokenStore: () => SqliteOAuthTokenStore
});
var SqliteOAuthTokenStore;
var init_SqliteOAuthTokenStore = __esm({
  "src/db/sqlite/token-store/SqliteOAuthTokenStore.ts"() {
    "use strict";
    init_mcpServerStore();
    init_pendingAuthorization();
    init_token();
    SqliteOAuthTokenStore = class {
      constructor(db) {
        this.db = db;
      }
      db;
      savePendingAuthorization(pending, transaction) {
        return savePendingAuthorization(transaction ?? this.db, pending);
      }
      consumePendingAuthorization(params, transaction) {
        return consumePendingAuthorization(transaction ?? this.db, params);
      }
      saveToken(params, transaction) {
        return saveToken(transaction ?? this.db, {
          id: params.id,
          userRef: params.userRef,
          token: toStoredOAuthToken(params.token)
        });
      }
      async getToken(params, transaction) {
        const stored = await getToken(transaction ?? this.db, params);
        return stored === void 0 ? void 0 : fromStoredOAuthToken(stored);
      }
      async getTokens(params, transaction) {
        const stored = await getTokens(transaction ?? this.db, params);
        return new Map([...stored].map(([id, token]) => [id, fromStoredOAuthToken(token)]));
      }
      deleteToken(params, transaction) {
        return deleteToken(transaction ?? this.db, params);
      }
      deleteTokensForServer(params, transaction) {
        return deleteTokensForServer(transaction ?? this.db, params);
      }
      deletePendingAuthorizationsForServer(params, transaction) {
        return deletePendingAuthorizationsForServer(transaction ?? this.db, params);
      }
    };
  }
});

// src/db/sqlite/skill-store/SqliteSkillStore.ts
var SqliteSkillStore_exports = {};
__export(SqliteSkillStore_exports, {
  SqliteSkillStore: () => SqliteSkillStore
});
function recordColumns3(eb) {
  return [
    "tenant_id",
    "name",
    jsonText(eb.ref("manifest")).as("manifest"),
    "created_at",
    "updated_at"
  ];
}
var SqliteSkillStore;
var init_SqliteSkillStore = __esm({
  "src/db/sqlite/skill-store/SqliteSkillStore.ts"() {
    "use strict";
    init_skillStore();
    init_client();
    init_sqlExpressions();
    SqliteSkillStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async listSkills(input, transaction) {
        if (input.names?.length === 0) {
          return [];
        }
        const db = transaction ?? this.#db;
        let query = db.selectFrom("skill").select(recordColumns3).where("tenant_id", "=", input.tenant_id);
        if (input.names !== void 0) {
          query = query.where("name", "in", [...input.names]);
        }
        return await query.orderBy("name").execute();
      }
      async getSkill(input, transaction) {
        const db = transaction ?? this.#db;
        return await db.selectFrom("skill").select(recordColumns3).where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).executeTakeFirst();
      }
      async createSkill(input, transaction) {
        const db = transaction ?? this.#db;
        const timestamp = nowIso();
        try {
          return await db.insertInto("skill").values({
            tenant_id: input.tenant_id,
            name: input.name,
            manifest: jsonbBind(input.manifest),
            created_at: timestamp,
            updated_at: timestamp
          }).returning(recordColumns3).executeTakeFirstOrThrow();
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new SkillNameConflictError({ tenant_id: input.tenant_id, name: input.name }, { cause: error });
          }
          throw error;
        }
      }
      async upsertSkill(input, transaction) {
        const db = transaction ?? this.#db;
        const timestamp = nowIso();
        return await db.insertInto("skill").values({
          tenant_id: input.tenant_id,
          name: input.name,
          manifest: jsonbBind(input.manifest),
          created_at: timestamp,
          updated_at: timestamp
        }).onConflict(
          (oc) => oc.columns(["tenant_id", "name"]).doUpdateSet({
            manifest: jsonbBind(input.manifest),
            updated_at: timestamp
          })
        ).returning(recordColumns3).executeTakeFirstOrThrow();
      }
    };
  }
});

// src/db/sqlite/sandbox-provider-store/SqliteSandboxProviderStore.ts
var SqliteSandboxProviderStore_exports = {};
__export(SqliteSandboxProviderStore_exports, {
  SqliteSandboxProviderStore: () => SqliteSandboxProviderStore
});
function recordColumns4(eb) {
  return [
    "tenant_id",
    jsonText(eb.ref("manifest")).as("manifest"),
    "status",
    "status_reason",
    jsonText(eb.ref("build_metadata")).as("build_metadata"),
    "created_at",
    "updated_at"
  ];
}
var SqliteSandboxProviderStore;
var init_SqliteSandboxProviderStore = __esm({
  "src/db/sqlite/sandbox-provider-store/SqliteSandboxProviderStore.ts"() {
    "use strict";
    init_sqlExpressions();
    SqliteSandboxProviderStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async getSandboxProvider(tenantId, transaction) {
        const db = transaction ?? this.#db;
        return await db.selectFrom("sandbox_provider").select(recordColumns4).where("tenant_id", "=", tenantId).executeTakeFirst();
      }
      /**
       * SQLite has no row-level FOR UPDATE; the required write transaction (BEGIN IMMEDIATE)
       * serializes concurrent writers so RMW of secrets stays consistent.
       */
      async getSandboxProviderForUpdate(tenantId, transaction) {
        return await transaction.selectFrom("sandbox_provider").select(recordColumns4).where("tenant_id", "=", tenantId).executeTakeFirst();
      }
      async upsertSandboxProvider(input, transaction) {
        const db = transaction ?? this.#db;
        const timestamp = nowIso();
        return await db.insertInto("sandbox_provider").values({
          tenant_id: input.tenant_id,
          manifest: jsonbBind(input.manifest),
          status: input.status,
          status_reason: input.status_reason,
          build_metadata: input.build_metadata !== null ? jsonbBind(input.build_metadata) : null,
          created_at: timestamp,
          updated_at: timestamp
        }).onConflict(
          (oc) => oc.columns(["tenant_id"]).doUpdateSet({
            manifest: jsonbBind(input.manifest),
            status: input.status,
            status_reason: input.status_reason,
            build_metadata: input.build_metadata !== null ? jsonbBind(input.build_metadata) : null,
            updated_at: timestamp
          })
        ).returning(recordColumns4).executeTakeFirstOrThrow();
      }
      async updateSandboxStatus(input, transaction) {
        const db = transaction ?? this.#db;
        return await db.updateTable("sandbox_provider").set({
          status: input.status,
          status_reason: input.status_reason,
          build_metadata: input.build_metadata !== null ? jsonbBind(input.build_metadata) : null,
          updated_at: nowIso()
        }).where("tenant_id", "=", input.tenant_id).returning(recordColumns4).executeTakeFirst();
      }
    };
  }
});

// src/db/sqlite/agent-store/SqliteAgentStore.ts
var SqliteAgentStore_exports = {};
__export(SqliteAgentStore_exports, {
  SqliteAgentStore: () => SqliteAgentStore
});
import { ulid as ulid6 } from "ulid";
function recordColumns5(eb) {
  return [
    "id",
    "tenant_id",
    "name",
    jsonText(eb.ref("manifest")).as("manifest"),
    "created_at",
    "updated_at"
  ];
}
function toRecord(row) {
  return { ...row, manifest: parseStoredAgentSpec(row.manifest) };
}
var SqliteAgentStore;
var init_SqliteAgentStore = __esm({
  "src/db/sqlite/agent-store/SqliteAgentStore.ts"() {
    "use strict";
    init_agentStore();
    init_client();
    init_sqlExpressions();
    SqliteAgentStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async listAgents(tenantId, transaction) {
        const db = transaction ?? this.#db;
        const rows = await db.selectFrom("agent").select(recordColumns5).where("tenant_id", "=", tenantId).orderBy("name").execute();
        return rows.map(toRecord);
      }
      async getAgent(input, transaction) {
        const db = transaction ?? this.#db;
        let query = db.selectFrom("agent").select(recordColumns5).where("tenant_id", "=", input.tenant_id);
        if ("id" in input) {
          query = query.where("id", "=", input.id);
        } else {
          query = query.where("name", "=", input.name);
        }
        const row = await query.executeTakeFirst();
        return row === void 0 ? void 0 : toRecord(row);
      }
      async createAgent(input, transaction) {
        const db = transaction ?? this.#db;
        const timestamp = nowIso();
        try {
          const row = await db.insertInto("agent").values({
            id: ulid6().toLowerCase(),
            tenant_id: input.tenant_id,
            name: input.name,
            manifest: jsonbBind(input.manifest),
            created_at: timestamp,
            updated_at: timestamp
          }).returning(recordColumns5).executeTakeFirstOrThrow();
          return toRecord(row);
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new AgentNameConflictError({ tenant_id: input.tenant_id, name: input.name }, { cause: error });
          }
          throw error;
        }
      }
      async updateAgent(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.updateTable("agent").set({
          manifest: jsonbBind(input.manifest),
          updated_at: nowIso()
        }).where("tenant_id", "=", input.tenant_id).where("id", "=", input.id).returning(recordColumns5).executeTakeFirst();
        return row === void 0 ? void 0 : toRecord(row);
      }
      async deleteAgent(input, transaction) {
        const db = transaction ?? this.#db;
        await db.deleteFrom("agent").where("tenant_id", "=", input.tenant_id).where("id", "=", input.id).execute();
      }
    };
  }
});

// src/db/postgres/client.ts
var client_exports2 = {};
__export(client_exports2, {
  createDb: () => createDb,
  isPgErrorCode: () => isPgErrorCode,
  isUniqueViolation: () => isUniqueViolation2
});
import { Kysely as Kysely2, PostgresDialect } from "kysely";
import pg, { Pool } from "pg";
function parseInt8Array(value) {
  if (value === "{}" || value === "") {
    return [];
  }
  return value.slice(1, -1).split(",").map((element) => Number(element));
}
function configurePgTypeParsers() {
  pg.types.setTypeParser(INT8_OID, Number);
  setTypeParserByOid(1016, parseInt8Array);
}
function createDb(options) {
  const { connectionString, poolMax, statementTimeoutMs, idleInTransactionSessionTimeoutMs } = options;
  configurePgTypeParsers();
  return new Kysely2({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
        max: poolMax,
        statement_timeout: statementTimeoutMs,
        idle_in_transaction_session_timeout: idleInTransactionSessionTimeoutMs
      })
    })
  });
}
function isPgErrorCode(err, code) {
  if (typeof err !== "object" || err === null || !("code" in err)) {
    return false;
  }
  return err.code === code;
}
function isUniqueViolation2(err) {
  return isPgErrorCode(err, "23505");
}
var INT8_OID, setTypeParserByOid;
var init_client2 = __esm({
  "src/db/postgres/client.ts"() {
    "use strict";
    INT8_OID = 20;
    setTypeParserByOid = pg.types.setTypeParser.bind(
      pg.types
    );
  }
});

// src/db/migratePostgres.ts
var migratePostgres_exports = {};
__export(migratePostgres_exports, {
  migrateToLatest: () => migrateToLatest
});
import { promises as fs3 } from "fs";
import path5 from "path";
import { FileMigrationProvider as FileMigrationProvider2, Migrator as Migrator2 } from "kysely/migration";
async function migrateToLatest(db) {
  const migrator = new Migrator2({
    db,
    provider: new FileMigrationProvider2({
      fs: fs3,
      path: path5,
      migrationFolder: path5.join(import.meta.dirname, "postgres", "migrations")
    })
  });
  const { error, results } = await migrator.migrateToLatest();
  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });
  if (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("failed to migrate", { cause: error });
  }
}
var init_migratePostgres = __esm({
  "src/db/migratePostgres.ts"() {
    "use strict";
  }
});

// src/runtime/redis.ts
var redis_exports = {};
__export(redis_exports, {
  connectRedis: () => connectRedis
});
import { extractErrorLogFields as extractErrorLogFields8 } from "@truefoundry/trueforge-core/core";
import { createClient } from "redis";
async function connectRedis(input) {
  const client = createClient({ url: input.url });
  client.on("error", (error) => {
    input.logger.error("[Redis] Client error", extractErrorLogFields8(error));
  });
  await client.connect();
  return client;
}
var init_redis = __esm({
  "src/runtime/redis.ts"() {
    "use strict";
  }
});

// src/db/postgres/sqlExpressions.ts
import { sql as sql9 } from "kysely";
function json(value) {
  return sql9`${JSON.stringify(value)}::jsonb`;
}
function jsonbSet2(target, path7, newValue) {
  return sql9`jsonb_set(${target}, ${path7}, ${newValue})`;
}
function now() {
  return sql9`now()`;
}
function nowMinusMs(ms) {
  return sql9`now() - ${ms}::double precision * interval '1 millisecond'`;
}
var init_sqlExpressions3 = __esm({
  "src/db/postgres/sqlExpressions.ts"() {
    "use strict";
  }
});

// src/db/postgres/session-store/sqlExpressions.ts
import { sql as sql10 } from "kysely";
function values(records, alias) {
  const first = records[0];
  if (first === void 0) {
    throw new Error("values() requires at least one record");
  }
  const keys = Object.keys(first);
  const valueTuples = sql10.join(records.map((r) => sql10`(${sql10.join(keys.map((k) => r[k]))})`));
  const wrappedAlias = sql10.ref(alias);
  const wrappedColumns = sql10.join(keys.map((key) => sql10.ref(key)));
  const aliasSql = sql10`${wrappedAlias}(${wrappedColumns})`;
  return sql10`(values ${valueTuples})`.as(aliasSql);
}
function unnestWithOrdinality(ids, alias) {
  const wrappedAlias = sql10.ref(alias);
  const aliasSql = sql10`${wrappedAlias}(turn_id, pos)`;
  return sql10`unnest(${ids}::text[]) WITH ORDINALITY`.as(aliasSql);
}
function lateralUnnestBigintArrayWithOrdinality(arrayExpr, alias) {
  const wrappedAlias = sql10.ref(alias);
  const aliasSql = sql10`${wrappedAlias}(append_id, pos)`;
  return sql10`LATERAL unnest(${arrayExpr}) WITH ORDINALITY`.as(aliasSql);
}
var init_sqlExpressions4 = __esm({
  "src/db/postgres/session-store/sqlExpressions.ts"() {
    "use strict";
  }
});

// src/db/postgres/session-store/queries/turns.ts
import "@truefoundry/trueforge-core/agent-session/schemas/turn";
import { assertCreateTurnThreadDelta as assertCreateTurnThreadDelta2 } from "@truefoundry/trueforge-core/agent-session/store/assertCreateTurnThreadDelta";
import {
  PreviousTurnRunningError as PreviousTurnRunningError2,
  SessionNotFoundError as SessionNotFoundError4,
  SessionStoreConflictError as SessionStoreConflictError4,
  SessionStoreInvariantError as SessionStoreInvariantError4,
  SessionStoreNotFoundError as SessionStoreNotFoundError4,
  TurnAlreadyExistsError as TurnAlreadyExistsError2,
  TurnNotFoundError as TurnNotFoundError4,
  TurnNotRunningError as TurnNotRunningError2
} from "@truefoundry/trueforge-core/agent-session/store/SessionStoreErrors";
import { getEmptyCurrentContextUsage as getEmptyCurrentContextUsage2 } from "@truefoundry/trueforge-core/core/runtime/contextUsage";
import { sql as sql11 } from "kysely";
function isEmptyCustomRecord3(value) {
  return Object.keys(value).length === 0;
}
function parseTurnCustom2(value) {
  if (value === null) {
    return null;
  }
  if (!isEmptyCustomRecord3(value)) {
    throw new SessionStoreInvariantError4("non-empty turn custom is not supported");
  }
  return value;
}
function terminalTurnState2(state, turn_id) {
  switch (state.status) {
    case "running":
      throw new SessionStoreInvariantError4(`expected terminal state for turn ${turn_id}, got running`);
    case "done":
    case "cancelled":
    case "error":
      return state;
  }
}
function turnRunningFence(db, keys) {
  return db.selectFrom("turn").select(sql11`1`.as("one")).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where(sql11`state->>'status'`, "=", "running").forShare();
}
async function classifyTurnFenceWriteFailure2(db, keys) {
  const row = await db.selectFrom("turn").select("state").where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).executeTakeFirst();
  if (!row) {
    throw new TurnNotFoundError4(keys.turn_id);
  }
  throw new TurnNotRunningError2(keys.turn_id, terminalTurnState2(row.state, keys.turn_id));
}
async function classifyTurnThreadWriteFailure2(db, keys, thread_id) {
  const row = await db.selectFrom("turn").select("state").where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).executeTakeFirst();
  if (!row) {
    throw new TurnNotFoundError4(keys.turn_id);
  }
  if (row.state.status !== "running") {
    throw new TurnNotRunningError2(keys.turn_id, terminalTurnState2(row.state, keys.turn_id));
  }
  throw new SessionStoreInvariantError4(`thread ${thread_id} not found in turn ${keys.turn_id}`);
}
async function assertTurnRunning2(db, keys) {
  const row = await db.selectFrom("turn").select("state").where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).forShare().executeTakeFirst();
  if (!row) {
    throw new TurnNotFoundError4(keys.turn_id);
  }
  if (row.state.status !== "running") {
    throw new TurnNotRunningError2(keys.turn_id, terminalTurnState2(row.state, keys.turn_id));
  }
}
async function assembleTurnRecord2(db, args) {
  const turn = await db.selectFrom("turn").selectAll().where("session_id", "=", args.session_id).where("turn_id", "=", args.turn_id).executeTakeFirst();
  if (!turn) {
    return void 0;
  }
  const contextRows = await db.selectFrom("turn_thread as tt").leftJoin(lateralUnnestBigintArrayWithOrdinality(sql11`tt.context_ids`, "c"), (join5) => join5.onTrue()).leftJoin(
    "thread_context_log as l",
    (join5) => join5.on("l.session_id", "=", args.session_id).onRef("l.thread_id", "=", "tt.thread_id").onRef("l.append_id", "=", "c.append_id")
  ).select(["tt.thread_id", "tt.checkpoint", "tt.agent_info", "tt.current_context_usage", "l.body", "c.pos"]).where("tt.session_id", "=", args.session_id).where("tt.turn_id", "=", args.turn_id).orderBy("tt.thread_id").orderBy("c.pos").execute();
  const capabilityRows = await db.selectFrom("thread_capability_state").select(["thread_id", sql11`jsonb_object_agg(key, state)`.as("capability_state")]).where("session_id", "=", args.session_id).where("turn_id", "=", args.turn_id).groupBy("thread_id").execute();
  const capabilityByThread = /* @__PURE__ */ new Map();
  for (const row of capabilityRows) {
    if (row.capability_state !== null) {
      capabilityByThread.set(row.thread_id, row.capability_state);
    }
  }
  const threads = {};
  const orderedBodies = /* @__PURE__ */ new Map();
  const threadMeta = /* @__PURE__ */ new Map();
  for (const row of contextRows) {
    if (!threadMeta.has(row.thread_id)) {
      threadMeta.set(row.thread_id, {
        checkpoint: row.checkpoint,
        agent_info: row.agent_info,
        current_context_usage: row.current_context_usage
      });
      orderedBodies.set(row.thread_id, []);
    }
    if (row.body !== null) {
      const bodies = orderedBodies.get(row.thread_id);
      if (bodies !== void 0) {
        bodies.push(row.body);
      }
    }
  }
  for (const [threadId, meta] of threadMeta) {
    const context = orderedBodies.get(threadId) ?? [];
    const capability_state = capabilityByThread.get(threadId) ?? null;
    const snap = {
      thread_id: threadId,
      context,
      current_context_usage: meta.current_context_usage,
      parent: meta.checkpoint.parent,
      agent_info: meta.agent_info,
      completion: meta.checkpoint.completion,
      capability_state
    };
    threads[threadId] = snap;
  }
  const checkpoint = turn.checkpoint;
  const snapshot = {
    threads,
    mcp_servers: checkpoint.mcp_servers,
    sandbox_info: checkpoint.sandbox_info
  };
  return {
    turn_id: turn.turn_id,
    session_id: turn.session_id,
    first_turn_id: turn.first_turn_id,
    ancestor_ids: turn.ancestor_ids,
    previous_turn_id: turn.previous_turn_id,
    state: turn.state,
    input: turn.input,
    snapshot,
    created_at: turn.created_at,
    updated_at: turn.updated_at,
    custom: parseTurnCustom2(turn.custom)
  };
}
async function createTurn2(db, input) {
  try {
    await db.transaction().execute(async (trx) => {
      const locked = await trx.selectFrom("session").select(["last_turn_id"]).where("session_id", "=", input.session_id).forUpdate().executeTakeFirst();
      if (!locked) {
        throw new SessionNotFoundError4(input.session_id);
      }
      await trx.updateTable("session").set({
        last_turn_id: input.turn.turn_id,
        updated_at: sql11`now()`,
        last_activity_timestamp_ms: input.last_activity_timestamp_ms,
        ...input.update_session_title_if_not_exist !== null ? {
          title: sql11`COALESCE(title, ${input.update_session_title_if_not_exist})`
        } : {}
      }).where("session_id", "=", input.session_id).execute();
      const prevTurnId = input.turn.previous_turn_id;
      let prevCheckpoint = null;
      const prevThreadRows = [];
      if (prevTurnId != null) {
        const prevRows = await trx.selectFrom("turn as t").leftJoin(
          "turn_thread as tt",
          (join5) => join5.onRef("tt.session_id", "=", "t.session_id").onRef("tt.turn_id", "=", "t.turn_id")
        ).select([
          "t.checkpoint as turn_checkpoint",
          "t.state as turn_state",
          "tt.thread_id",
          "tt.checkpoint as thread_checkpoint",
          "tt.agent_info",
          "tt.current_context_usage",
          "tt.context_ids"
        ]).where("t.session_id", "=", input.session_id).where("t.turn_id", "=", prevTurnId).execute();
        const first = prevRows[0];
        if (first !== void 0) {
          if (first.turn_state.status === "running") {
            throw new PreviousTurnRunningError2(prevTurnId);
          }
          prevCheckpoint = first.turn_checkpoint;
          for (const row of prevRows) {
            if (row.thread_id === null) {
              continue;
            }
            if (row.thread_checkpoint === null || row.current_context_usage === null || row.context_ids === null) {
              throw new SessionStoreInvariantError4(`previous turn_thread row for ${row.thread_id} is incomplete`);
            }
            prevThreadRows.push({
              thread_id: row.thread_id,
              checkpoint: row.thread_checkpoint,
              agent_info: row.agent_info,
              current_context_usage: row.current_context_usage,
              context_ids: row.context_ids
            });
          }
        }
      }
      assertCreateTurnThreadDelta2({
        previousThreadIds: new Set(prevThreadRows.map((r) => r.thread_id)),
        new_threads: input.new_threads,
        new_context_appends: input.new_context_appends,
        capability_states: input.capability_states
      });
      const checkpoint = {
        mcp_servers: input.mcp_servers ?? prevCheckpoint?.mcp_servers ?? null,
        sandbox_info: input.sandbox_info ?? prevCheckpoint?.sandbox_info ?? null
      };
      const now2 = /* @__PURE__ */ new Date();
      const turnCustom = input.turn.custom ?? null;
      const turnValues = {
        session_id: input.session_id,
        turn_id: input.turn.turn_id,
        first_turn_id: input.turn.first_turn_id,
        previous_turn_id: input.turn.previous_turn_id ?? null,
        ancestor_ids: input.turn.ancestor_ids,
        input: json(input.turn.input),
        state: input.turn.state,
        checkpoint,
        custom: turnCustom !== null ? json(turnCustom) : null,
        created_at: now2,
        updated_at: now2
      };
      await trx.insertInto("turn").values(turnValues).execute();
      const logRows = [];
      for (const append of input.new_context_appends) {
        for (const body of append.context) {
          logRows.push({
            session_id: input.session_id,
            thread_id: append.thread_id,
            turn_id: input.turn.turn_id,
            body: json(body),
            created_at: now2
          });
        }
      }
      const newIdsByThread = /* @__PURE__ */ new Map();
      if (logRows.length > 0) {
        const inserted = await trx.insertInto("thread_context_log").values(logRows).returning(["thread_id", "append_id"]).execute();
        for (const row of inserted) {
          const list = newIdsByThread.get(row.thread_id);
          if (list === void 0) {
            newIdsByThread.set(row.thread_id, [row.append_id]);
          } else {
            list.push(row.append_id);
          }
        }
      }
      const appendUsageByThread = /* @__PURE__ */ new Map();
      for (const append of input.new_context_appends) {
        if (append.current_context_usage !== null) {
          appendUsageByThread.set(append.thread_id, append.current_context_usage);
        }
      }
      const turnThreadRows = [];
      for (const parent of prevThreadRows) {
        const newIds = newIdsByThread.get(parent.thread_id) ?? [];
        const usage = appendUsageByThread.get(parent.thread_id) ?? parent.current_context_usage;
        turnThreadRows.push({
          session_id: input.session_id,
          turn_id: input.turn.turn_id,
          thread_id: parent.thread_id,
          checkpoint: parent.checkpoint,
          agent_info: parent.agent_info !== null ? json(parent.agent_info) : null,
          current_context_usage: usage,
          context_ids: parent.context_ids.concat(newIds),
          updated_at: now2
        });
      }
      for (const nt of input.new_threads) {
        const newIds = newIdsByThread.get(nt.thread_id) ?? [];
        const usage = appendUsageByThread.get(nt.thread_id) ?? getEmptyCurrentContextUsage2();
        const threadCheckpoint = {
          parent: nt.parent,
          completion: null
        };
        turnThreadRows.push({
          session_id: input.session_id,
          turn_id: input.turn.turn_id,
          thread_id: nt.thread_id,
          checkpoint: threadCheckpoint,
          agent_info: nt.agent_info !== null ? json(nt.agent_info) : null,
          current_context_usage: usage,
          context_ids: newIds,
          updated_at: now2
        });
      }
      if (turnThreadRows.length > 0) {
        await trx.insertInto("turn_thread").values(turnThreadRows).execute();
      }
      const capabilityStateRows = [];
      for (const capability of input.capability_states) {
        if (capability.capability_state === null) {
          continue;
        }
        for (const [key, state] of Object.entries(capability.capability_state)) {
          capabilityStateRows.push({
            session_id: input.session_id,
            turn_id: input.turn.turn_id,
            thread_id: capability.thread_id,
            key,
            state: json(state),
            updated_at: now2
          });
        }
      }
      if (capabilityStateRows.length > 0) {
        await trx.insertInto("thread_capability_state").values(capabilityStateRows).execute();
      }
    });
  } catch (err) {
    if (err instanceof SessionStoreNotFoundError4 || err instanceof SessionStoreConflictError4) {
      throw err;
    }
    if (isUniqueViolation2(err)) {
      throw new TurnAlreadyExistsError2(input.turn.turn_id, { cause: err });
    }
    throw err;
  }
}
async function freezeAndGetTurn2(db, input) {
  return await db.transaction().execute(async (trx) => {
    const cancelledState = {
      status: "cancelled",
      reason: input.reason,
      completed_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const updateResult = await trx.updateTable("turn").set({
      state: cancelledState,
      updated_at: sql11`now()`
    }).where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).where(sql11`state->>'status' = 'running'`).executeTakeFirst();
    if (Number(updateResult.numUpdatedRows) > 0) {
      await trx.insertInto("session_event").values({
        session_id: input.session_id,
        turn_id: input.turn_id,
        event_id: input.turn_done_event.id,
        event: json(input.turn_done_event),
        created_at: new Date(input.turn_done_event.created_at)
      }).execute();
    }
    const record = await assembleTurnRecord2(trx, input);
    if (!record) {
      throw new TurnNotFoundError4(input.turn_id);
    }
    return record;
  });
}
async function getTurn2(db, input) {
  return await db.transaction().setIsolationLevel("repeatable read").execute(async (trx) => {
    return assembleTurnRecord2(trx, input);
  });
}
async function listTurns2(db, input) {
  const rows = await db.selectFrom("turn").selectAll().where("session_id", "=", input.session_id).orderBy("created_at", "asc").orderBy("turn_id", "asc").limit(input.limit + 1).offset(input.offset).execute();
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const turns = page.map((row) => ({
    turn_id: row.turn_id,
    session_id: row.session_id,
    first_turn_id: row.first_turn_id,
    ancestor_ids: row.ancestor_ids,
    previous_turn_id: row.previous_turn_id,
    state: row.state,
    input: row.input,
    created_at: row.created_at,
    updated_at: row.updated_at,
    custom: parseTurnCustom2(row.custom)
  }));
  return {
    turns,
    next_offset: hasMore ? input.offset + input.limit : null
  };
}
async function updateTurnState2(db, input) {
  await db.transaction().execute(async (trx) => {
    const result = await trx.updateTable("turn").set({
      state: input.state,
      updated_at: sql11`now()`
    }).where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).where(sql11`state->>'status' = 'running'`).executeTakeFirst();
    const numUpdated = Number(result.numUpdatedRows);
    if (numUpdated === 0) {
      const existing = await trx.selectFrom("turn").select("state").where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).executeTakeFirst();
      if (!existing) {
        throw new TurnNotFoundError4(input.turn_id);
      }
      throw new TurnNotRunningError2(input.turn_id, terminalTurnState2(existing.state, input.turn_id));
    }
    await trx.insertInto("session_event").values({
      session_id: input.session_id,
      turn_id: input.turn_id,
      event_id: input.turn_done_event.id,
      event: json(input.turn_done_event),
      created_at: new Date(input.turn_done_event.created_at)
    }).execute();
  });
}
var init_turns2 = __esm({
  "src/db/postgres/session-store/queries/turns.ts"() {
    "use strict";
    init_client2();
    init_sqlExpressions3();
    init_sqlExpressions4();
  }
});

// src/db/postgres/session-store/queries/capabilities.ts
import { sql as sql12 } from "kysely";
async function patchThreadCapabilityState2(db, input) {
  const keys = {
    session_id: input.session_id,
    turn_id: input.turn_id
  };
  const rows = await db.with("turn_fence", (qb) => turnRunningFence(qb, keys)).insertInto("thread_capability_state").columns(["session_id", "turn_id", "thread_id", "key", "state", "updated_at"]).expression(
    (eb) => eb.selectFrom(values([{ one: 1 }], "src")).select([
      sql12`${input.session_id}`.as("session_id"),
      sql12`${input.turn_id}`.as("turn_id"),
      sql12`${input.thread_id}`.as("thread_id"),
      sql12`${input.key}`.as("key"),
      json(input.state).as("state"),
      sql12`now()`.as("updated_at")
    ]).where((wb) => wb.exists(wb.selectFrom("turn_fence").select(sql12`1`.as("one"))))
  ).onConflict(
    (oc) => oc.columns(["session_id", "turn_id", "thread_id", "key"]).doUpdateSet({
      state: sql12`excluded.state`,
      updated_at: sql12`now()`
    })
  ).returning("thread_id").execute();
  if (rows.length === 0) {
    await classifyTurnFenceWriteFailure2(db, keys);
  }
}
var init_capabilities2 = __esm({
  "src/db/postgres/session-store/queries/capabilities.ts"() {
    "use strict";
    init_sqlExpressions3();
    init_sqlExpressions4();
    init_turns2();
  }
});

// src/db/postgres/session-store/queries/events.ts
import {
  decodeOffsetPageToken as decodeOffsetPageToken3,
  paginateOffsetRows as paginateOffsetRows2
} from "@truefoundry/trueforge-core/agent-session/store/OffsetPageToken";
import {
  decodeSessionEventPageToken as decodeSessionEventPageToken2,
  paginateSessionEventRows as paginateSessionEventRows2
} from "@truefoundry/trueforge-core/agent-session/store/SessionEventPageToken";
import {
  SessionNotFoundError as SessionNotFoundError5,
  TurnNotFoundError as TurnNotFoundError5
} from "@truefoundry/trueforge-core/agent-session/store/SessionStoreErrors";
import { sql as sql13 } from "kysely";
async function appendToEvents2(db, input) {
  if (input.events.length === 0) {
    return;
  }
  const keys = {
    session_id: input.session_id,
    turn_id: input.turn_id
  };
  const eventRows = input.events.map((event) => ({
    event_id: event.id,
    event: json(event),
    // VALUES parameters default to text; cast the event's required timestamp.
    created_at: sql13`${event.created_at}::timestamptz`
  }));
  const inserted = await db.with("turn_fence", (qb) => turnRunningFence(qb, keys)).insertInto("session_event").columns(["session_id", "turn_id", "event_id", "event", "created_at"]).expression(
    (eb) => eb.selectFrom(values(eventRows, "ev")).select([
      sql13`${input.session_id}`.as("session_id"),
      sql13`${input.turn_id}`.as("turn_id"),
      "ev.event_id",
      "ev.event",
      "ev.created_at"
    ]).where((wb) => wb.exists(wb.selectFrom("turn_fence").select(sql13`1`.as("one"))))
  ).returning("event_id").execute();
  if (inserted.length === 0) {
    await classifyTurnFenceWriteFailure2(db, keys);
  }
}
async function listTurnEvents2(db, input) {
  const offset = decodeOffsetPageToken3(input.page_token);
  const limit = input.limit;
  const eventOrder = input.order === "desc" ? "desc" : "asc";
  const rows = await db.selectFrom("turn as t").leftJoin(
    (eb) => eb.selectFrom("session_event").select(["session_id", "turn_id", "event_id", "event"]).where("session_id", "=", input.session_id).where("turn_id", "=", input.turn_id).orderBy("event_id", eventOrder).limit(limit + 1).offset(offset).as("e"),
    (join5) => join5.onRef("e.session_id", "=", "t.session_id").onRef("e.turn_id", "=", "t.turn_id")
  ).select(["t.turn_id", "e.event"]).where("t.session_id", "=", input.session_id).where("t.turn_id", "=", input.turn_id).orderBy("e.event_id", eventOrder).execute();
  if (rows.length === 0) {
    throw new TurnNotFoundError5(input.turn_id);
  }
  const events = [];
  for (const row of rows) {
    if (row.event !== null) {
      events.push(row.event);
    }
  }
  return paginateOffsetRows2(events, limit, offset);
}
async function listSessionEvents2(db, input) {
  const limit = input.limit;
  const session = await db.selectFrom("session").select("last_turn_id").where("session_id", "=", input.session_id).executeTakeFirst();
  if (!session) {
    throw new SessionNotFoundError5(input.session_id);
  }
  const decodedCursor = input.page_token === void 0 ? void 0 : decodeSessionEventPageToken2(input.page_token);
  const lastTurnId = decodedCursor?.last_turn_id ?? input.last_turn_id ?? session.last_turn_id;
  if (lastTurnId === null) {
    return { data: [], pagination: { limit } };
  }
  const cursor = {
    last_turn_id: lastTurnId,
    offset: decodedCursor?.offset ?? 0
  };
  const anchor = await db.selectFrom("turn").select(["turn_id", "ancestor_ids"]).where("session_id", "=", input.session_id).where("turn_id", "=", cursor.last_turn_id).executeTakeFirst();
  if (!anchor) {
    throw new TurnNotFoundError5(cursor.last_turn_id);
  }
  const chainIds = await resolveAncestorChain2(db, input.session_id, anchor);
  const rows = await db.selectFrom(unnestWithOrdinality(chainIds, "c")).innerJoin(
    "session_event as e",
    (join5) => join5.on("e.session_id", "=", input.session_id).onRef("e.turn_id", "=", "c.turn_id")
  ).select(["e.turn_id as turn_id", "e.event as event"]).orderBy("c.pos", "desc").orderBy("e.event_id", "desc").limit(limit + 1).offset(cursor.offset).execute();
  return paginateSessionEventRows2(rows, limit, cursor);
}
async function resolveAncestorChain2(db, sessionId, anchor) {
  const chain = [...anchor.ancestor_ids, anchor.turn_id];
  const seen = new Set(chain);
  let oldestId = chain[0];
  while (oldestId && oldestId !== anchor.turn_id) {
    const oldest = await db.selectFrom("turn").select(["ancestor_ids"]).where("session_id", "=", sessionId).where("turn_id", "=", oldestId).executeTakeFirst();
    if (!oldest) {
      break;
    }
    const older = oldest.ancestor_ids.filter((id) => !seen.has(id));
    if (older.length === 0) {
      break;
    }
    chain.unshift(...older);
    for (const id of older) {
      seen.add(id);
    }
    oldestId = older[0];
  }
  return chain;
}
var init_events2 = __esm({
  "src/db/postgres/session-store/queries/events.ts"() {
    "use strict";
    init_sqlExpressions3();
    init_sqlExpressions4();
    init_turns2();
  }
});

// src/db/postgres/session-store/queries/sessions.ts
import {
  decodeSessionListPageToken as decodeSessionListPageToken2,
  paginateSessionListRows as paginateSessionListRows2
} from "@truefoundry/trueforge-core/agent-session/store/SessionListPageToken";
import {
  SessionAlreadyExistsError as SessionAlreadyExistsError2,
  SessionNotFoundError as SessionNotFoundError6,
  SessionStoreInvariantError as SessionStoreInvariantError5
} from "@truefoundry/trueforge-core/agent-session/store/SessionStoreErrors";
import { sql as sql14 } from "kysely";
function isPgUniqueViolation(error) {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if (!("code" in error)) {
    return false;
  }
  return error.code === "23505";
}
function isEmptyCustomRecord4(value) {
  return Object.keys(value).length === 0;
}
function parseSessionCustom2(value) {
  if (value === null) {
    return null;
  }
  if (!isEmptyCustomRecord4(value)) {
    throw new SessionStoreInvariantError5("non-empty session custom is not supported");
  }
  return value;
}
function mapRowToSessionRecord2(row) {
  return {
    tenant_id: row.tenant_id,
    session_id: row.session_id,
    created_by: row.created_by,
    agent: sessionAgentFromColumns({
      session_id: row.session_id,
      agent_id: row.agent_id,
      agent_name: row.agent_name,
      agent_spec: row.agent_spec
    }),
    title: row.title,
    last_turn_id: row.last_turn_id,
    custom: parseSessionCustom2(row.custom),
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_activity_timestamp_ms: row.last_activity_timestamp_ms
  };
}
async function createSession2(db, input) {
  const columns = sessionAgentToColumns(input.agent);
  const nowMs = Date.now();
  try {
    await db.insertInto("session").values({
      tenant_id: input.tenant_id,
      session_id: input.session_id,
      created_by: input.created_by,
      agent_id: columns.agent_id,
      agent_name: columns.agent_name,
      agent_spec: columns.agent_spec !== null ? json(columns.agent_spec) : null,
      title: null,
      custom: input.custom !== null ? json(input.custom) : null,
      created_at: new Date(nowMs),
      updated_at: new Date(nowMs),
      last_activity_timestamp_ms: nowMs
    }).execute();
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      throw new SessionAlreadyExistsError2(input.session_id, { cause: error });
    }
    throw error;
  }
}
async function deleteSession2(db, input) {
  await db.deleteFrom("session").where("tenant_id", "=", input.tenant_id).where("session_id", "=", input.session_id).execute();
}
async function getSession2(db, input) {
  const row = await db.selectFrom("session").selectAll().where("tenant_id", "=", input.tenant_id).where("session_id", "=", input.session_id).executeTakeFirst();
  if (row === void 0) {
    return void 0;
  }
  return mapRowToSessionRecord2(row);
}
async function updateSession2(db, input) {
  const agent = input.agent;
  const title = input.title;
  if (agent !== void 0) {
    const existing = await getSession2(db, { tenant_id: input.tenant_id, session_id: input.session_id });
    if (existing === void 0) {
      throw new SessionNotFoundError6(input.session_id);
    }
    if (existing.agent.type === "reference") {
      throw new SessionStoreInvariantError5(`Session ${input.session_id} is named; agent cannot be updated`);
    }
  }
  const result = await db.updateTable("session").set({
    updated_at: sql14`now()`,
    last_activity_timestamp_ms: Date.now()
  }).$if(agent !== void 0, (qb) => {
    if (agent === void 0) {
      return qb;
    }
    return qb.set({ agent_spec: json(agent.spec) });
  }).$if(title !== void 0, (qb) => {
    if (title === void 0) {
      return qb;
    }
    return qb.set({ title });
  }).where("tenant_id", "=", input.tenant_id).where("session_id", "=", input.session_id).executeTakeFirst();
  const numUpdatedRows = Number(result.numUpdatedRows);
  if (numUpdatedRows === 0) {
    throw new SessionNotFoundError6(input.session_id);
  }
}
async function listSessions2(db, input) {
  const limit = input.limit;
  const order = input.order ?? "desc";
  const cursor = decodeSessionListPageToken2(input.page_token);
  let query = db.selectFrom("session").selectAll().select(
    sql14`to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`.as("updated_at_cursor")
  ).where("tenant_id", "=", input.tenant_id);
  if (input.agent_id !== void 0) {
    query = query.where("agent_id", "=", input.agent_id);
  }
  if (input.created_by !== void 0) {
    query = query.where("created_by", "=", input.created_by);
  }
  if (input.start_timestamp !== void 0) {
    query = query.where("created_at", ">=", input.start_timestamp);
  }
  if (input.end_timestamp !== void 0) {
    query = query.where("created_at", "<=", input.end_timestamp);
  }
  if (cursor) {
    const sessionId = cursor.session_id;
    const cursorUpdatedAt = sql14`${cursor.updated_at}::timestamptz`;
    if (order === "asc") {
      query = query.where(
        (eb) => eb.or([
          eb("updated_at", ">", cursorUpdatedAt),
          eb.and([eb("updated_at", "=", cursorUpdatedAt), eb("session_id", ">", sessionId)])
        ])
      );
    } else {
      query = query.where(
        (eb) => eb.or([
          eb("updated_at", "<", cursorUpdatedAt),
          eb.and([eb("updated_at", "=", cursorUpdatedAt), eb("session_id", "<", sessionId)])
        ])
      );
    }
  }
  if (order === "asc") {
    query = query.orderBy("updated_at", "asc").orderBy("session_id", "asc");
  } else {
    query = query.orderBy("updated_at", "desc").orderBy("session_id", "desc");
  }
  const rows = await query.limit(limit + 1).execute();
  const { data: pageRows, pagination } = paginateSessionListRows2(rows, limit, (row) => row.updated_at_cursor);
  return { data: pageRows.map(mapRowToSessionRecord2), pagination };
}
var init_sessions2 = __esm({
  "src/db/postgres/session-store/queries/sessions.ts"() {
    "use strict";
    init_sessionAgentColumns();
    init_sqlExpressions3();
  }
});

// src/db/postgres/session-store/queries/threads.ts
import { sql as sql15 } from "kysely";
async function addThreads2(db, input) {
  await db.transaction().execute(async (trx) => {
    await assertTurnRunning2(trx, {
      session_id: input.session_id,
      turn_id: input.turn_id
    });
    const now2 = /* @__PURE__ */ new Date();
    const logRows = [];
    const capabilityStateRows = [];
    const turnThreadPlans = [];
    for (const thread of input.threads) {
      const threadCheckpoint = {
        parent: thread.parent ?? null,
        completion: thread.completion ?? null
      };
      turnThreadPlans.push({
        thread_id: thread.thread_id,
        checkpoint: threadCheckpoint,
        agent_info: thread.agent_info != null ? json(thread.agent_info) : null,
        current_context_usage: thread.current_context_usage
      });
      for (const body of thread.context) {
        logRows.push({
          session_id: input.session_id,
          thread_id: thread.thread_id,
          turn_id: input.turn_id,
          body: json(body),
          created_at: now2
        });
      }
      const capabilityState = thread.capability_state;
      if (capabilityState != null) {
        for (const key of Object.keys(capabilityState)) {
          const state = capabilityState[key];
          if (state === void 0) {
            throw new Error(
              `capability_state['${key}'] for thread '${thread.thread_id}' is undefined \u2014 undefined is banned from capability state`
            );
          }
          capabilityStateRows.push({
            session_id: input.session_id,
            turn_id: input.turn_id,
            thread_id: thread.thread_id,
            key,
            state: json(state),
            updated_at: sql15`now()`
          });
        }
      }
    }
    const newIdsByThread = /* @__PURE__ */ new Map();
    if (logRows.length > 0) {
      const inserted = await trx.insertInto("thread_context_log").values(logRows).returning(["thread_id", "append_id"]).execute();
      for (const row of inserted) {
        const list = newIdsByThread.get(row.thread_id);
        if (list === void 0) {
          newIdsByThread.set(row.thread_id, [row.append_id]);
        } else {
          list.push(row.append_id);
        }
      }
    }
    const turnThreadRows = turnThreadPlans.map((plan) => ({
      session_id: input.session_id,
      turn_id: input.turn_id,
      thread_id: plan.thread_id,
      checkpoint: plan.checkpoint,
      agent_info: plan.agent_info,
      current_context_usage: plan.current_context_usage,
      context_ids: newIdsByThread.get(plan.thread_id) ?? [],
      updated_at: now2
    }));
    if (turnThreadRows.length > 0) {
      await trx.insertInto("turn_thread").values(turnThreadRows).execute();
    }
    if (capabilityStateRows.length > 0) {
      await trx.insertInto("thread_capability_state").values(capabilityStateRows).execute();
    }
  });
}
async function removeThreads2(db, input) {
  if (input.thread_ids.length === 0) {
    return;
  }
  const keys = {
    session_id: input.session_id,
    turn_id: input.turn_id
  };
  const onFence = sql15`EXISTS (SELECT 1 FROM turn_fence)`;
  const fence = await db.with("turn_fence", (qb) => turnRunningFence(qb, keys)).with(
    "del_cap",
    (qb) => qb.deleteFrom("thread_capability_state").where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where("thread_id", "in", input.thread_ids).where(onFence)
  ).with(
    "del_tt",
    (qb) => qb.deleteFrom("turn_thread").where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where("thread_id", "in", input.thread_ids).where(onFence)
  ).selectFrom("turn_fence").select("one").executeTakeFirst();
  if (fence === void 0) {
    await classifyTurnFenceWriteFailure2(db, keys);
  }
}
function completionPatchExpr2(completion) {
  if (completion === null) {
    return sql15`checkpoint`;
  }
  return jsonbSet2(sql15`checkpoint`, sql15`'{completion}'`, json(completion));
}
function usageSetExpr2(usage) {
  if (usage === null) {
    return sql15`current_context_usage`;
  }
  return sql15`coalesce(${json(usage)}, current_context_usage)`;
}
async function fencedTurnThreadContextUpdate2(db, args) {
  const { keys, thread_id, context, replace_array } = args;
  if (context.length === 0) {
    const emptyResult = await db.with("turn_fence", (qb) => turnRunningFence(qb, keys)).updateTable("turn_thread").set({
      context_ids: replace_array ? sql15`'{}'::bigint[]` : sql15`context_ids`,
      current_context_usage: args.usage_unconditional ?? usageSetExpr2(args.current_context_usage),
      checkpoint: completionPatchExpr2(args.completion),
      updated_at: sql15`now()`
    }).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where("thread_id", "=", thread_id).where(sql15`EXISTS (SELECT 1 FROM turn_fence)`).executeTakeFirst();
    if (Number(emptyResult.numUpdatedRows) === 0) {
      await classifyTurnThreadWriteFailure2(db, keys, thread_id);
    }
    return;
  }
  const bodyRows = context.map((body, index) => ({
    ord: sql15`${index + 1}::int`,
    body: json(body)
  }));
  const arrayExpr = replace_array ? sql15`coalesce((SELECT array_agg(append_id ORDER BY append_id) FROM new_rows), '{}'::bigint[])` : sql15`context_ids || coalesce((SELECT array_agg(append_id ORDER BY append_id) FROM new_rows), '{}'::bigint[])`;
  const result = await db.with("turn_fence", (qb) => turnRunningFence(qb, keys)).with(
    "new_rows",
    (qb) => qb.insertInto("thread_context_log").columns(["session_id", "thread_id", "turn_id", "body", "created_at"]).expression(
      (eb) => eb.selectFrom(values(bodyRows, "b")).select([
        sql15`${keys.session_id}`.as("session_id"),
        sql15`${thread_id}`.as("thread_id"),
        sql15`${keys.turn_id}`.as("turn_id"),
        "b.body",
        sql15`now()`.as("created_at")
      ]).where((wb) => wb.exists(wb.selectFrom("turn_fence").select(sql15`1`.as("one")))).orderBy("b.ord")
    ).returning("append_id")
  ).updateTable("turn_thread").set({
    context_ids: arrayExpr,
    current_context_usage: args.usage_unconditional ?? usageSetExpr2(args.current_context_usage),
    checkpoint: completionPatchExpr2(args.completion),
    updated_at: sql15`now()`
  }).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where("thread_id", "=", thread_id).where(sql15`EXISTS (SELECT 1 FROM turn_fence)`).executeTakeFirst();
  if (Number(result.numUpdatedRows) === 0) {
    await classifyTurnThreadWriteFailure2(db, keys, thread_id);
  }
}
async function appendToThreadContext2(db, input) {
  await fencedTurnThreadContextUpdate2(db, {
    keys: {
      session_id: input.session_id,
      turn_id: input.turn_id
    },
    thread_id: input.thread_id,
    context: input.context,
    replace_array: false,
    current_context_usage: input.current_context_usage,
    completion: input.completion,
    usage_unconditional: null
  });
}
async function overwriteThreadContext2(db, input) {
  await fencedTurnThreadContextUpdate2(db, {
    keys: {
      session_id: input.session_id,
      turn_id: input.turn_id
    },
    thread_id: input.event.thread_id,
    context: input.event.context,
    replace_array: true,
    current_context_usage: null,
    completion: null,
    usage_unconditional: input.event.current_context_usage
  });
}
async function patchMCPServers2(db, input) {
  const serversById = {};
  for (const server of input.mcp_servers) {
    serversById[server.id] = server;
  }
  const keys = {
    session_id: input.session_id,
    turn_id: input.turn_id
  };
  const result = await db.updateTable("turn").set(
    sql15`checkpoint['mcp_servers']`,
    sql15`(CASE WHEN jsonb_typeof(checkpoint->'mcp_servers') = 'object'
            THEN checkpoint->'mcp_servers'
            ELSE '{}'::jsonb END) || ${json(serversById)}`
  ).set({ updated_at: sql15`now()` }).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where(sql15`state->>'status' = 'running'`).executeTakeFirst();
  if (Number(result.numUpdatedRows) === 0) {
    await classifyTurnFenceWriteFailure2(db, keys);
  }
}
async function patchSandboxInfo2(db, input) {
  const keys = {
    session_id: input.session_id,
    turn_id: input.turn_id
  };
  const result = await db.updateTable("turn").set(sql15`checkpoint['sandbox_info']`, json(input.sandbox_info)).set({ updated_at: sql15`now()` }).where("session_id", "=", keys.session_id).where("turn_id", "=", keys.turn_id).where(sql15`state->>'status' = 'running'`).executeTakeFirst();
  if (Number(result.numUpdatedRows) === 0) {
    await classifyTurnFenceWriteFailure2(db, keys);
  }
}
var init_threads2 = __esm({
  "src/db/postgres/session-store/queries/threads.ts"() {
    "use strict";
    init_sqlExpressions3();
    init_sqlExpressions4();
    init_turns2();
  }
});

// src/db/postgres/session-store/PostgresSessionStore.ts
var PostgresSessionStore_exports = {};
__export(PostgresSessionStore_exports, {
  PostgresSessionStore: () => PostgresSessionStore
});
import {
  decodeOffsetPageToken as decodeOffsetPageToken4,
  encodeOffsetPageToken as encodeOffsetPageToken2
} from "@truefoundry/trueforge-core/agent-session/store/OffsetPageToken";
var PostgresSessionStore;
var init_PostgresSessionStore = __esm({
  "src/db/postgres/session-store/PostgresSessionStore.ts"() {
    "use strict";
    init_capabilities2();
    init_events2();
    init_sessions2();
    init_threads2();
    init_turns2();
    PostgresSessionStore = class {
      constructor(db) {
        this.db = db;
      }
      db;
      createSession(input) {
        return createSession2(this.db, input);
      }
      deleteSession(input) {
        return deleteSession2(this.db, input);
      }
      getSession(input) {
        return getSession2(this.db, input);
      }
      updateSession(input) {
        return updateSession2(this.db, input);
      }
      async listSessions(input) {
        const result = await listSessions2(this.db, input);
        return {
          data: result.data,
          pagination: {
            limit: input.limit,
            ...result.pagination
          }
        };
      }
      async createTurn(input) {
        await createTurn2(this.db, {
          session_id: input.turn.session_id,
          turn: {
            turn_id: input.turn.turn_id,
            first_turn_id: input.turn.first_turn_id,
            previous_turn_id: input.turn.previous_turn_id,
            ancestor_ids: input.turn.ancestor_ids,
            input: input.turn.input,
            state: input.turn.state,
            custom: input.turn.custom
          },
          new_threads: input.new_threads.map((thread) => ({
            thread_id: thread.thread_id,
            parent: thread.parent,
            agent_info: thread.agent_info
          })),
          new_context_appends: input.new_context_appends,
          capability_states: input.capability_states,
          last_activity_timestamp_ms: Date.now(),
          update_session_title_if_not_exist: input.update_session_title_if_not_exist,
          mcp_servers: null,
          sandbox_info: null
        });
      }
      freezeAndGetTurn(input) {
        return freezeAndGetTurn2(this.db, input);
      }
      getTurn(input) {
        return getTurn2(this.db, input);
      }
      async listTurns(input) {
        const offset = decodeOffsetPageToken4(input.page_token);
        const result = await listTurns2(this.db, {
          session_id: input.session_id,
          limit: input.limit,
          offset
        });
        const pagination = { limit: input.limit };
        if (result.next_offset !== null) {
          pagination.next_page_token = encodeOffsetPageToken2(result.next_offset);
        }
        if (offset > 0) {
          pagination.previous_page_token = encodeOffsetPageToken2(Math.max(0, offset - input.limit));
        }
        return { data: result.turns, pagination };
      }
      updateTurnState(input) {
        return updateTurnState2(this.db, input);
      }
      appendToEvents(input) {
        return appendToEvents2(this.db, input);
      }
      addThreads(input) {
        return addThreads2(this.db, input);
      }
      removeThreads(input) {
        return removeThreads2(this.db, input);
      }
      appendToThreadContext(input) {
        return appendToThreadContext2(this.db, input);
      }
      overwriteThreadContext(input) {
        return overwriteThreadContext2(this.db, input);
      }
      patchMCPServers(input) {
        return patchMCPServers2(this.db, input);
      }
      patchSandboxInfo(input) {
        return patchSandboxInfo2(this.db, input);
      }
      patchThreadCapabilityState(input) {
        return patchThreadCapabilityState2(this.db, input);
      }
      listTurnEvents(input) {
        return listTurnEvents2(this.db, input);
      }
      listSessionEvents(input) {
        return listSessionEvents2(this.db, input);
      }
    };
  }
});

// src/db/postgres/model-provider-store/PostgresModelProviderStore.ts
var PostgresModelProviderStore_exports = {};
__export(PostgresModelProviderStore_exports, {
  PostgresModelProviderStore: () => PostgresModelProviderStore
});
function toRecord2(row) {
  return {
    tenant_id: row.tenant_id,
    name: row.name,
    manifest: row.manifest,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString()
  };
}
var PostgresModelProviderStore;
var init_PostgresModelProviderStore = __esm({
  "src/db/postgres/model-provider-store/PostgresModelProviderStore.ts"() {
    "use strict";
    init_modelProviderStore();
    init_client2();
    init_sqlExpressions3();
    PostgresModelProviderStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async listProviders(tenantId, transaction) {
        const db = transaction ?? this.#db;
        const rows = await db.selectFrom("model_provider").selectAll().where("tenant_id", "=", tenantId).orderBy("name").execute();
        return rows.map(toRecord2);
      }
      async getProvider(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.selectFrom("model_provider").selectAll().where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).executeTakeFirst();
        return row === void 0 ? void 0 : toRecord2(row);
      }
      async getProviderForUpdate(input, transaction) {
        const row = await transaction.selectFrom("model_provider").selectAll().where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).forUpdate().executeTakeFirst();
        return row ? toRecord2(row) : void 0;
      }
      async createProvider(input, transaction) {
        const db = transaction ?? this.#db;
        try {
          const row = await db.insertInto("model_provider").values({
            tenant_id: input.tenant_id,
            name: input.name,
            manifest: json(input.manifest),
            created_at: now(),
            updated_at: now()
          }).returningAll().executeTakeFirstOrThrow();
          return toRecord2(row);
        } catch (error) {
          if (isUniqueViolation2(error)) {
            throw new ModelProviderNameConflictError({ tenant_id: input.tenant_id, name: input.name }, { cause: error });
          }
          throw error;
        }
      }
      async upsertProvider(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.insertInto("model_provider").values({
          tenant_id: input.tenant_id,
          name: input.name,
          manifest: json(input.manifest),
          created_at: now(),
          updated_at: now()
        }).onConflict(
          (oc) => oc.columns(["tenant_id", "name"]).doUpdateSet({
            manifest: json(input.manifest),
            updated_at: now()
          })
        ).returningAll().executeTakeFirstOrThrow();
        return toRecord2(row);
      }
      async listModels(tenantId, transaction) {
        return flattenProviderModels(await this.listProviders(tenantId, transaction));
      }
    };
  }
});

// src/db/postgres/mcp-server-store/PostgresMcpServerStore.ts
var PostgresMcpServerStore_exports = {};
__export(PostgresMcpServerStore_exports, {
  PostgresMcpServerStore: () => PostgresMcpServerStore
});
import { ulid as ulid7 } from "ulid";
function toRecord3(row) {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    manifest: row.manifest,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString()
  };
}
var PostgresMcpServerStore;
var init_PostgresMcpServerStore = __esm({
  "src/db/postgres/mcp-server-store/PostgresMcpServerStore.ts"() {
    "use strict";
    init_mcpServerStore();
    init_client2();
    init_sqlExpressions3();
    PostgresMcpServerStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async listServers(input, transaction) {
        if (input.names?.length === 0) {
          return [];
        }
        const db = transaction ?? this.#db;
        let query = db.selectFrom("mcp_server").selectAll().where("tenant_id", "=", input.tenant_id);
        if (input.names !== void 0) {
          query = query.where("name", "in", [...input.names]);
        }
        const rows = await query.orderBy("name").execute();
        return rows.map(toRecord3);
      }
      async getServer(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.selectFrom("mcp_server").selectAll().where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).executeTakeFirst();
        return row === void 0 ? void 0 : toRecord3(row);
      }
      async getServerForUpdate(input, transaction) {
        const row = await transaction.selectFrom("mcp_server").selectAll().where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).forUpdate().executeTakeFirst();
        return row ? toRecord3(row) : void 0;
      }
      async createServer(input, transaction) {
        const db = transaction ?? this.#db;
        try {
          const row = await db.insertInto("mcp_server").values({
            id: ulid7(),
            tenant_id: input.tenant_id,
            name: input.name,
            manifest: json(input.manifest),
            oauth_server: null,
            oauth_client: null,
            created_at: now(),
            updated_at: now()
          }).returningAll().executeTakeFirstOrThrow();
          return toRecord3(row);
        } catch (error) {
          if (isUniqueViolation2(error)) {
            throw new McpServerNameConflictError({ tenant_id: input.tenant_id, name: input.name }, { cause: error });
          }
          throw error;
        }
      }
      async upsertServer(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.insertInto("mcp_server").values({
          id: ulid7(),
          tenant_id: input.tenant_id,
          name: input.name,
          manifest: json(input.manifest),
          oauth_server: null,
          oauth_client: null,
          created_at: now(),
          updated_at: now()
        }).onConflict(
          (oc) => oc.columns(["tenant_id", "name"]).doUpdateSet({
            manifest: json(input.manifest),
            updated_at: now()
          })
        ).returningAll().executeTakeFirstOrThrow();
        return toRecord3(row);
      }
      async getClient(params, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.selectFrom("mcp_server").select(["oauth_server", "oauth_client"]).where("id", "=", params.id).executeTakeFirst();
        if (row?.oauth_server == null || row.oauth_client == null) {
          return void 0;
        }
        return fromStoredOAuthClientRecord({ server: row.oauth_server, client: row.oauth_client });
      }
      async saveClient(params, transaction) {
        const db = transaction ?? this.#db;
        const stored = toStoredOAuthClientRecord(params.record);
        await db.updateTable("mcp_server").set({
          oauth_server: json(stored.server),
          oauth_client: json(stored.client)
        }).where("id", "=", params.id).execute();
      }
      async deleteClient(params, transaction) {
        const db = transaction ?? this.#db;
        await db.updateTable("mcp_server").set({
          oauth_server: null,
          oauth_client: null
        }).where("id", "=", params.id).execute();
      }
    };
  }
});

// src/db/postgres/token-store/queries/pendingAuthorization.ts
async function savePendingAuthorization2(db, pending) {
  const authData = toStoredOAuthPendingAuthorizationData(pending);
  await db.insertInto("oauth_pending_authorization").values({
    id: pending.state,
    oauth_server_id: pending.id,
    user_id: pending.userRef,
    auth_data: json(authData),
    created_at: now()
  }).execute();
}
async function consumePendingAuthorization2(db, params) {
  const row = await db.deleteFrom("oauth_pending_authorization").where("id", "=", params.state).where("created_at", ">", nowMinusMs(PENDING_AUTHORIZATION_TTL_MS)).returning(["id", "oauth_server_id", "user_id", "auth_data"]).executeTakeFirst();
  if (row === void 0) {
    return void 0;
  }
  return {
    state: row.id,
    id: row.oauth_server_id,
    userRef: row.user_id,
    ...fromStoredOAuthPendingAuthorizationData(row.auth_data)
  };
}
async function deletePendingAuthorizationsForServer2(db, params) {
  await db.deleteFrom("oauth_pending_authorization").where("oauth_server_id", "=", params.id).execute();
}
var init_pendingAuthorization2 = __esm({
  "src/db/postgres/token-store/queries/pendingAuthorization.ts"() {
    "use strict";
    init_mcpServerStore();
    init_sqlExpressions3();
  }
});

// src/db/postgres/token-store/queries/token.ts
import { sql as sql16 } from "kysely";
async function saveToken2(db, params) {
  await db.insertInto("oauth_token").values({
    oauth_server_id: params.id,
    user_id: params.userRef,
    token: json(params.token),
    updated_at: now()
  }).onConflict(
    (oc) => oc.columns(["oauth_server_id", "user_id"]).doUpdateSet({
      token: sql16`excluded.token`,
      updated_at: sql16`excluded.updated_at`
    })
  ).execute();
}
async function getToken2(db, params) {
  const row = await db.selectFrom("oauth_token").select("token").where("oauth_server_id", "=", params.id).where("user_id", "=", params.userRef).executeTakeFirst();
  return row === void 0 ? void 0 : row.token;
}
async function getTokens2(db, params) {
  if (params.ids.length === 0) {
    return /* @__PURE__ */ new Map();
  }
  const rows = await db.selectFrom("oauth_token").select(["oauth_server_id", "token"]).where("oauth_server_id", "in", params.ids).where("user_id", "=", params.userRef).execute();
  return new Map(rows.map((row) => [row.oauth_server_id, row.token]));
}
async function deleteToken2(db, params) {
  await db.deleteFrom("oauth_token").where("oauth_server_id", "=", params.id).where("user_id", "=", params.userRef).execute();
}
async function deleteTokensForServer2(db, params) {
  await db.deleteFrom("oauth_token").where("oauth_server_id", "=", params.id).execute();
}
var init_token2 = __esm({
  "src/db/postgres/token-store/queries/token.ts"() {
    "use strict";
    init_sqlExpressions3();
  }
});

// src/db/postgres/token-store/PostgresOAuthTokenStore.ts
var PostgresOAuthTokenStore_exports = {};
__export(PostgresOAuthTokenStore_exports, {
  PostgresOAuthTokenStore: () => PostgresOAuthTokenStore
});
var PostgresOAuthTokenStore;
var init_PostgresOAuthTokenStore = __esm({
  "src/db/postgres/token-store/PostgresOAuthTokenStore.ts"() {
    "use strict";
    init_mcpServerStore();
    init_pendingAuthorization2();
    init_token2();
    PostgresOAuthTokenStore = class {
      constructor(db) {
        this.db = db;
      }
      db;
      savePendingAuthorization(pending, transaction) {
        return savePendingAuthorization2(transaction ?? this.db, pending);
      }
      consumePendingAuthorization(params, transaction) {
        return consumePendingAuthorization2(transaction ?? this.db, params);
      }
      saveToken(params, transaction) {
        return saveToken2(transaction ?? this.db, {
          id: params.id,
          userRef: params.userRef,
          token: toStoredOAuthToken(params.token)
        });
      }
      async getToken(params, transaction) {
        const stored = await getToken2(transaction ?? this.db, params);
        return stored === void 0 ? void 0 : fromStoredOAuthToken(stored);
      }
      async getTokens(params, transaction) {
        const stored = await getTokens2(transaction ?? this.db, params);
        return new Map([...stored].map(([id, token]) => [id, fromStoredOAuthToken(token)]));
      }
      deleteToken(params, transaction) {
        return deleteToken2(transaction ?? this.db, params);
      }
      deleteTokensForServer(params, transaction) {
        return deleteTokensForServer2(transaction ?? this.db, params);
      }
      deletePendingAuthorizationsForServer(params, transaction) {
        return deletePendingAuthorizationsForServer2(transaction ?? this.db, params);
      }
    };
  }
});

// src/db/postgres/skill-store/PostgresSkillStore.ts
var PostgresSkillStore_exports = {};
__export(PostgresSkillStore_exports, {
  PostgresSkillStore: () => PostgresSkillStore
});
function toRecord4(row) {
  return {
    tenant_id: row.tenant_id,
    name: row.name,
    manifest: row.manifest,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString()
  };
}
var PostgresSkillStore;
var init_PostgresSkillStore = __esm({
  "src/db/postgres/skill-store/PostgresSkillStore.ts"() {
    "use strict";
    init_skillStore();
    init_client2();
    init_sqlExpressions3();
    PostgresSkillStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async listSkills(input, transaction) {
        if (input.names?.length === 0) {
          return [];
        }
        const db = transaction ?? this.#db;
        let query = db.selectFrom("skill").selectAll().where("tenant_id", "=", input.tenant_id);
        if (input.names !== void 0) {
          query = query.where("name", "in", [...input.names]);
        }
        const rows = await query.orderBy("name").execute();
        return rows.map(toRecord4);
      }
      async getSkill(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.selectFrom("skill").selectAll().where("tenant_id", "=", input.tenant_id).where("name", "=", input.name).executeTakeFirst();
        return row === void 0 ? void 0 : toRecord4(row);
      }
      async createSkill(input, transaction) {
        const db = transaction ?? this.#db;
        try {
          const row = await db.insertInto("skill").values({
            tenant_id: input.tenant_id,
            name: input.name,
            manifest: json(input.manifest),
            created_at: now(),
            updated_at: now()
          }).returningAll().executeTakeFirstOrThrow();
          return toRecord4(row);
        } catch (error) {
          if (isUniqueViolation2(error)) {
            throw new SkillNameConflictError({ tenant_id: input.tenant_id, name: input.name }, { cause: error });
          }
          throw error;
        }
      }
      async upsertSkill(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.insertInto("skill").values({
          tenant_id: input.tenant_id,
          name: input.name,
          manifest: json(input.manifest),
          created_at: now(),
          updated_at: now()
        }).onConflict(
          (oc) => oc.columns(["tenant_id", "name"]).doUpdateSet({
            manifest: json(input.manifest),
            updated_at: now()
          })
        ).returningAll().executeTakeFirstOrThrow();
        return toRecord4(row);
      }
    };
  }
});

// src/db/postgres/sandbox-provider-store/PostgresSandboxProviderStore.ts
var PostgresSandboxProviderStore_exports = {};
__export(PostgresSandboxProviderStore_exports, {
  PostgresSandboxProviderStore: () => PostgresSandboxProviderStore
});
function toRecord5(row) {
  return {
    tenant_id: row.tenant_id,
    manifest: row.manifest,
    status: row.status,
    status_reason: row.status_reason,
    build_metadata: row.build_metadata,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString()
  };
}
var PostgresSandboxProviderStore;
var init_PostgresSandboxProviderStore = __esm({
  "src/db/postgres/sandbox-provider-store/PostgresSandboxProviderStore.ts"() {
    "use strict";
    init_sqlExpressions3();
    PostgresSandboxProviderStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async getSandboxProvider(tenantId, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.selectFrom("sandbox_provider").selectAll().where("tenant_id", "=", tenantId).executeTakeFirst();
        return row === void 0 ? void 0 : toRecord5(row);
      }
      async getSandboxProviderForUpdate(tenantId, transaction) {
        const row = await transaction.selectFrom("sandbox_provider").selectAll().where("tenant_id", "=", tenantId).forUpdate().executeTakeFirst();
        return row ? toRecord5(row) : void 0;
      }
      async upsertSandboxProvider(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.insertInto("sandbox_provider").values({
          tenant_id: input.tenant_id,
          manifest: json(input.manifest),
          status: input.status,
          status_reason: input.status_reason,
          build_metadata: input.build_metadata !== null ? json(input.build_metadata) : null,
          created_at: now(),
          updated_at: now()
        }).onConflict(
          (oc) => oc.columns(["tenant_id"]).doUpdateSet({
            manifest: json(input.manifest),
            status: input.status,
            status_reason: input.status_reason,
            build_metadata: input.build_metadata !== null ? json(input.build_metadata) : null,
            updated_at: now()
          })
        ).returningAll().executeTakeFirstOrThrow();
        return toRecord5(row);
      }
      async updateSandboxStatus(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.updateTable("sandbox_provider").set({
          status: input.status,
          status_reason: input.status_reason,
          build_metadata: input.build_metadata !== null ? json(input.build_metadata) : null,
          updated_at: now()
        }).where("tenant_id", "=", input.tenant_id).returningAll().executeTakeFirst();
        return row === void 0 ? void 0 : toRecord5(row);
      }
    };
  }
});

// src/db/postgres/agent-store/PostgresAgentStore.ts
var PostgresAgentStore_exports = {};
__export(PostgresAgentStore_exports, {
  PostgresAgentStore: () => PostgresAgentStore
});
import { ulid as ulid8 } from "ulid";
function toRecord6(row) {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    manifest: parseStoredAgentSpec(row.manifest),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString()
  };
}
var PostgresAgentStore;
var init_PostgresAgentStore = __esm({
  "src/db/postgres/agent-store/PostgresAgentStore.ts"() {
    "use strict";
    init_agentStore();
    init_client2();
    init_sqlExpressions3();
    PostgresAgentStore = class {
      #db;
      constructor(db) {
        this.#db = db;
      }
      async listAgents(tenantId, transaction) {
        const db = transaction ?? this.#db;
        const rows = await db.selectFrom("agent").selectAll().where("tenant_id", "=", tenantId).orderBy("name").execute();
        return rows.map(toRecord6);
      }
      async getAgent(input, transaction) {
        const db = transaction ?? this.#db;
        let query = db.selectFrom("agent").selectAll().where("tenant_id", "=", input.tenant_id);
        if ("id" in input) {
          query = query.where("id", "=", input.id);
        } else {
          query = query.where("name", "=", input.name);
        }
        const row = await query.executeTakeFirst();
        return row === void 0 ? void 0 : toRecord6(row);
      }
      async createAgent(input, transaction) {
        const db = transaction ?? this.#db;
        try {
          const row = await db.insertInto("agent").values({
            id: ulid8().toLowerCase(),
            tenant_id: input.tenant_id,
            name: input.name,
            manifest: json(input.manifest),
            created_at: now(),
            updated_at: now()
          }).returningAll().executeTakeFirstOrThrow();
          return toRecord6(row);
        } catch (error) {
          if (isUniqueViolation2(error)) {
            throw new AgentNameConflictError({ tenant_id: input.tenant_id, name: input.name }, { cause: error });
          }
          throw error;
        }
      }
      async updateAgent(input, transaction) {
        const db = transaction ?? this.#db;
        const row = await db.updateTable("agent").set({
          manifest: json(input.manifest),
          updated_at: now()
        }).where("tenant_id", "=", input.tenant_id).where("id", "=", input.id).returningAll().executeTakeFirst();
        return row === void 0 ? void 0 : toRecord6(row);
      }
      async deleteAgent(input, transaction) {
        const db = transaction ?? this.#db;
        await db.deleteFrom("agent").where("tenant_id", "=", input.tenant_id).where("id", "=", input.id).execute();
      }
    };
  }
});

// src/main.ts
import { extractErrorLogFields as extractErrorLogFields9 } from "@truefoundry/trueforge-core/core";
import { mkdir as mkdir5 } from "fs/promises";
import path6 from "path";

// src/sandbox/localLifecycle.ts
import { existsSync } from "fs";
import { mkdir, rm } from "fs/promises";
var SOCKET_PARENT_MODE = 448;
async function prepareCodeModeSocketParent(params) {
  if (existsSync(params.path)) {
    params.logger.warn("Removing leftover Code Mode socket parent", { path: params.path });
    await rm(params.path, { recursive: true, force: true });
  }
  await mkdir(params.path, { recursive: true, mode: SOCKET_PARENT_MODE });
}
async function removeCodeModeSocketParent(socketParentPath) {
  await rm(socketParentPath, { recursive: true, force: true });
}
async function ensureLocalSandboxRootParent(sandboxRootPathParent) {
  await mkdir(sandboxRootPathParent, { recursive: true, mode: SOCKET_PARENT_MODE });
}

// src/sandbox/localRuntime.ts
init_config();
var cachedSupport;
function setCachedLocalSandboxSupport(support) {
  cachedSupport = support;
}
function getCachedLocalSandboxSupport() {
  return cachedSupport;
}
function isLocalSandboxFallbackEnabled() {
  return config_default.STANDALONE && cachedSupport?.supported === true;
}

// src/main.ts
import { serve } from "@hono/node-server";
import {
  CancellationReason as CancellationReason4,
  Sessions
} from "@truefoundry/trueforge-core/agent-session";
import { RequestReplyExecutor, RequestReplyRouter } from "@truefoundry/trueforge-core/request-reply";

// src/app.ts
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono as OpenAPIHono14, z as z26 } from "@hono/zod-openapi";
import { extractErrorLogFields as extractErrorLogFields7 } from "@truefoundry/trueforge-core/core";
import { bodyLimit } from "hono/body-limit";
import { HTTPException as HTTPException5 } from "hono/http-exception";

// src/apis/agents.ts
init_agentStore();
import { OpenAPIHono as OpenAPIHono2 } from "@hono/zod-openapi";

// src/routes/agentRoutes.ts
import { createRoute, z as z4 } from "@hono/zod-openapi";

// src/schemas/agent.ts
import { z as z2 } from "@hono/zod-openapi";
import { AgentSpecSchema as AgentSpecSchema2 } from "@truefoundry/trueforge-core/agent-session";

// src/schemas/common.ts
import { z } from "@hono/zod-openapi";
var NameSchema = z.string().min(2).max(64).regex(
  /^[a-z](?:[a-z0-9._-]{0,62}[a-z0-9])$/,
  'must be 2\u201364 lowercase chars: start with a letter, end with alphanumeric, optionally separated by ".", "_" or "-"'
).openapi("ResourceName");
var PAGE_LIMIT = 25;
var EVENTS_PAGE_LIMIT = 100;
function uniqueNames(entries, ctx) {
  const seen = /* @__PURE__ */ new Set();
  for (const entry of entries) {
    if (seen.has(entry.name)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate name "${entry.name}" \u2014 names must be unique`
      });
    }
    seen.add(entry.name);
  }
}
function uniqueTypes(entries, ctx) {
  const seen = /* @__PURE__ */ new Set();
  for (const entry of entries) {
    if (seen.has(entry.type)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate type "${entry.type}" \u2014 types must be unique`
      });
    }
    seen.add(entry.type);
  }
}

// src/schemas/agent.ts
var CreateAgentRequestSchema = z2.object({
  name: NameSchema,
  manifest: AgentSpecSchema2
}).strict().openapi("CreateAgentRequest");
var UpdateAgentRequestSchema = z2.object({
  manifest: AgentSpecSchema2
}).strict().openapi("UpdateAgentRequest");
var AgentSchema = z2.object({
  id: z2.string().min(1).describe("Immutable server-generated agent identifier."),
  name: NameSchema,
  manifest: AgentSpecSchema2
}).strict().openapi("Agent");
var GetAgentResponseSchema = z2.object({ data: AgentSchema }).openapi("GetAgentResponse");
var ListAgentsResponseSchema = z2.object({ data: z2.array(AgentSchema) }).openapi("ListAgentsResponse");
var DeleteAgentResponseSchema = z2.object({}).openapi("DeleteAgentResponse");

// src/schemas/errors.ts
import { z as z3 } from "@hono/zod-openapi";
var RequestErrorResponseSchema = z3.object({
  error: z3.object({
    message: z3.string().describe("Human-readable explanation of the failure."),
    type: z3.string().optional().describe("Optional error category (e.g. validation vs conflict)."),
    code: z3.string().nullable().optional().describe("Optional machine-readable error code; null when not applicable."),
    param: z3.string().nullable().optional().describe("Optional request field that caused the error; null when not field-specific.")
  })
}).openapi("RequestErrorResponse");

// src/routes/openapiTags.ts
var OPENAPI_DOCUMENT_TAGS = [
  { name: "Auth" /* AUTH */ },
  { name: "Capabilities" /* CAPABILITIES */ },
  { name: "Models" /* MODELS */ },
  { name: "MCP Servers" /* MCP_SERVERS */ },
  { name: "Skills" /* SKILLS */ },
  { name: "Sandboxes" /* SANDBOXES */ },
  { name: "Agents" /* AGENTS */ },
  { name: "Agent Sessions" /* AGENT_SESSIONS */ }
];

// src/routes/agentRoutes.ts
var AgentIdParamsSchema = z4.object({
  agent_id: z4.string().min(1).max(64).describe("Immutable agent identifier.")
});
var listAgentsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Agents" /* AGENTS */],
  summary: "List agents",
  description: "All configured agents for the tenant.",
  "x-fern-sdk-group-name": ["agents"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: ListAgentsResponseSchema } },
      description: "All configured agents."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    }
  }
});
var createAgentRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Agents" /* AGENTS */],
  summary: "Create an agent",
  description: "Creates an agent and allocates an immutable id. Fails if `name` is already taken. Name cannot be changed later.",
  "x-fern-sdk-group-name": ["agents"],
  "x-fern-sdk-method-name": "create",
  request: {
    body: {
      content: { "application/json": { schema: CreateAgentRequestSchema } },
      required: true
    }
  },
  responses: {
    201: {
      content: { "application/json": { schema: GetAgentResponseSchema } },
      description: "The created agent."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body or unknown model/MCP/skill refs."
    },
    409: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "An agent with this name already exists."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "The agent spec is valid but requires a capability this server does not provide (e.g. sandbox or skills)."
    }
  }
});
var getAgentRoute = createRoute({
  method: "get",
  path: "/{agent_id}",
  tags: ["Agents" /* AGENTS */],
  summary: "Get an agent",
  description: "Fetch a configured agent by immutable id.",
  "x-fern-sdk-group-name": ["agents"],
  "x-fern-sdk-method-name": "get",
  request: {
    params: AgentIdParamsSchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetAgentResponseSchema } },
      description: "The agent."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Agent not found."
    }
  }
});
var deleteAgentRoute = createRoute({
  method: "delete",
  path: "/{agent_id}",
  tags: ["Agents" /* AGENTS */],
  summary: "Delete an agent",
  description: "Delete a configured agent by immutable id. Idempotent if already gone.",
  "x-fern-sdk-group-name": ["agents"],
  "x-fern-sdk-method-name": "delete",
  request: {
    params: AgentIdParamsSchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeleteAgentResponseSchema } },
      description: "Agent deleted."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    }
  }
});
var putAgentRoute = createRoute({
  method: "put",
  path: "/{agent_id}",
  tags: ["Agents" /* AGENTS */],
  summary: "Update an agent",
  description: "Replaces the manifest for an existing agent keyed by immutable `agent_id`.",
  "x-fern-sdk-group-name": ["agents"],
  "x-fern-sdk-method-name": "update",
  request: {
    params: AgentIdParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateAgentRequestSchema } },
      required: true
    }
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetAgentResponseSchema } },
      description: "The saved agent."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body or unknown model/MCP/skill refs."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Agent not found."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "The agent spec is valid but requires a capability this server does not provide (e.g. sandbox or skills)."
    }
  }
});

// src/runtime/sessionResources.ts
init_config();
import {
  Sandbox,
  SkillMounter
} from "@truefoundry/trueforge-core/core";
import { HTTPException } from "hono/http-exception";
import { join as join4 } from "path";

// src/mcp/auth/mcpDcr.ts
import {
  discoverOAuthServerInfo,
  exchangeAuthorization,
  refreshAuthorization,
  registerClient,
  startAuthorization
} from "@modelcontextprotocol/sdk/client/auth.js";
import { InvalidClientError, InvalidClientMetadataError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { resourceUrlFromServerUrl } from "@modelcontextprotocol/sdk/shared/auth-utils.js";
import { McpConnectionError as McpConnectionError2, McpDcrConfigurationError } from "@truefoundry/trueforge-core/core";
import { randomBytes } from "crypto";

// src/mcp/auth/mcpOAuthHelpers.ts
init_config();
import { McpConnectionError } from "@truefoundry/trueforge-core/core";
var MCP_OAUTH_CALLBACK_PATH = "/api/v1/mcp-servers/oauth/callback";
var DEFAULT_MCP_ACCESS_TOKEN_TTL_SECONDS = 3600;
function mcpOAuthCallbackUrl() {
  try {
    const publicBaseUrl = getPublicBaseUrl();
    return `${publicBaseUrl}${MCP_OAUTH_CALLBACK_PATH}`;
  } catch (error) {
    throw new McpConnectionError("PUBLIC_BASE_URL is required for MCP OAuth registration but was empty", 500, {
      cause: error
    });
  }
}
function mcpClientInformation(client) {
  return client.clientSecret !== null ? {
    client_id: client.clientId,
    client_secret: client.clientSecret,
    token_endpoint_auth_method: "client_secret_post"
  } : {
    client_id: client.clientId,
    token_endpoint_auth_method: "none"
  };
}
function mcpAuthorizationServerMetadata(server) {
  return {
    issuer: new URL(server.authorizationEndpoint).origin,
    authorization_endpoint: server.authorizationEndpoint,
    token_endpoint: server.tokenEndpoint,
    response_types_supported: ["code"],
    ...server.codeChallengeMethodsSupported !== null ? { code_challenge_methods_supported: server.codeChallengeMethodsSupported } : {}
  };
}
function mcpAuthorizationServerOrigin(server) {
  return new URL(server.authorizationEndpoint).origin;
}
function oauthTokensToOAuthToken(tokens, nowMs, fallbackRefreshToken) {
  const expiresInSeconds = tokens.expires_in ?? DEFAULT_MCP_ACCESS_TOKEN_TTL_SECONDS;
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? fallbackRefreshToken,
    expiresAt: new Date(nowMs + expiresInSeconds * 1e3).toISOString(),
    scope: tokens.scope ?? null
  };
}
function isOAuthAccessTokenUsable(expiresAtIso, nowMs) {
  const expiresAtMs = Date.parse(expiresAtIso);
  return !Number.isNaN(expiresAtMs) && expiresAtMs > nowMs;
}

// src/mcp/auth/mcpDcr.ts
var MCP_OAUTH_HTTP_TIMEOUT_MS = 15e3;
var mcpOAuthFetch = (url, init) => {
  const timeoutSignal = AbortSignal.timeout(MCP_OAUTH_HTTP_TIMEOUT_MS);
  const signal = init?.signal != null ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
  return fetch(url, { ...init, signal });
};
function isTimeoutError(error) {
  return error instanceof Error && error.name === "TimeoutError";
}
function mcpOAuthConnectionError(message, error, statusCode) {
  let body = message;
  if (isTimeoutError(error)) {
    body = `${message}: timed out after ${String(MCP_OAUTH_HTTP_TIMEOUT_MS / 1e3)}s waiting for the authorization server`;
  }
  return new McpConnectionError2(body, statusCode, { cause: error });
}
function isMcpAuthRequired(result) {
  return "authUrl" in result;
}
async function registerMcpClientWithAuthMethodFallback(params) {
  const { authorizationServerUrl, metadata, clientMetadata, mcpServerName, authorizationEndpoint, tokenEndpoint } = params;
  let fullInfo;
  try {
    fullInfo = await registerClient(authorizationServerUrl, {
      metadata,
      clientMetadata: { ...clientMetadata, token_endpoint_auth_method: "client_secret_post" },
      fetchFn: mcpOAuthFetch
    });
  } catch (firstError) {
    if (!(firstError instanceof InvalidClientMetadataError)) {
      throw mcpOAuthConnectionError(
        `Failed to dynamically register OAuth client for MCP server '${mcpServerName}'`,
        firstError,
        424
      );
    }
    try {
      fullInfo = await registerClient(authorizationServerUrl, {
        metadata,
        clientMetadata,
        fetchFn: mcpOAuthFetch
      });
    } catch (secondError) {
      throw mcpOAuthConnectionError(
        `Failed to dynamically register OAuth client for MCP server '${mcpServerName}'`,
        secondError,
        424
      );
    }
  }
  if (!fullInfo.client_id) {
    throw new McpConnectionError2(
      `Authorization server for MCP server '${mcpServerName}' returned a client response without client_id`,
      424
    );
  }
  return {
    server: {
      authorizationEndpoint,
      tokenEndpoint,
      codeChallengeMethodsSupported: metadata.code_challenge_methods_supported ?? null
    },
    client: {
      clientId: fullInfo.client_id,
      clientSecret: fullInfo.client_secret ?? null
    }
  };
}
async function createMcpOAuthClient(params) {
  const { mcpServerUrl, mcpServerName, redirectUri, clientName } = params;
  let discovered;
  try {
    discovered = await discoverOAuthServerInfo(mcpServerUrl, { fetchFn: mcpOAuthFetch });
  } catch (error) {
    throw mcpOAuthConnectionError(
      `Failed to discover OAuth authorization server for MCP server '${mcpServerName}'`,
      error,
      424
    );
  }
  const { authorizationServerUrl, authorizationServerMetadata: metadata } = discovered;
  if (!metadata?.registration_endpoint) {
    throw new McpDcrConfigurationError(
      `MCP server '${mcpServerName}' has no DCR support (missing registration_endpoint); auth.type: dcr is misconfigured for this server`
    );
  }
  if (!metadata.authorization_endpoint || !metadata.token_endpoint) {
    throw new McpDcrConfigurationError(
      `Authorization server for MCP server '${mcpServerName}' is missing authorization_endpoint or token_endpoint`
    );
  }
  const pkceMethods = metadata.code_challenge_methods_supported;
  if (pkceMethods && !pkceMethods.includes("S256")) {
    throw new McpDcrConfigurationError(
      `Authorization server for MCP server '${mcpServerName}' advertises PKCE methods without S256`
    );
  }
  return registerMcpClientWithAuthMethodFallback({
    authorizationServerUrl,
    metadata,
    clientMetadata: {
      client_name: clientName,
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"]
    },
    mcpServerName,
    authorizationEndpoint: metadata.authorization_endpoint,
    tokenEndpoint: metadata.token_endpoint
  });
}
async function ensureMcpClientRegistered(params) {
  const existing = await params.mcpServerStore.getClient({ id: params.serverId });
  if (existing) {
    return existing;
  }
  const client = await createMcpOAuthClient({
    mcpServerUrl: params.mcpServerUrl,
    mcpServerName: params.mcpServerName,
    redirectUri: mcpOAuthCallbackUrl(),
    clientName: params.clientName
  });
  await params.mcpServerStore.saveClient({ id: params.serverId, record: client });
  return client;
}
async function buildMcpAuthorizationUrl(params) {
  const state = randomBytes(32).toString("base64url");
  const redirectUri = mcpOAuthCallbackUrl();
  let started;
  try {
    started = await startAuthorization(mcpAuthorizationServerOrigin(params.client.server), {
      metadata: mcpAuthorizationServerMetadata(params.client.server),
      clientInformation: mcpClientInformation(params.client.client),
      redirectUrl: redirectUri,
      resource: resourceUrlFromServerUrl(params.mcpServerUrl),
      state
    });
  } catch (error) {
    throw new McpConnectionError2(`Failed to start OAuth authorization for MCP server '${params.mcpServerName}'`, 424, {
      cause: error
    });
  }
  await params.tokenStore.savePendingAuthorization({
    state,
    id: params.serverId,
    userRef: params.userRef,
    mcpServerUrl: params.mcpServerUrl,
    codeVerifier: started.codeVerifier,
    returnTo: params.returnTo ?? null
  });
  return started.authorizationUrl;
}
async function resolveMcpAuth(params) {
  const nowMs = Date.now();
  const tokenKey = { id: params.serverId, userRef: params.userRef };
  const token = await params.tokenStore.getToken(tokenKey);
  if (token && isOAuthAccessTokenUsable(token.expiresAt, nowMs)) {
    return { headers: { Authorization: `Bearer ${token.accessToken}` } };
  }
  const client = await ensureMcpClientRegistered({
    mcpServerStore: params.mcpServerStore,
    serverId: params.serverId,
    mcpServerUrl: params.mcpServerUrl,
    mcpServerName: params.mcpServerName,
    clientName: params.clientName
  });
  if (token?.refreshToken) {
    try {
      const refreshed = await refreshAuthorization(mcpAuthorizationServerOrigin(client.server), {
        metadata: mcpAuthorizationServerMetadata(client.server),
        clientInformation: mcpClientInformation(client.client),
        refreshToken: token.refreshToken,
        resource: resourceUrlFromServerUrl(params.mcpServerUrl),
        fetchFn: mcpOAuthFetch
      });
      const saved = oauthTokensToOAuthToken(refreshed, nowMs, token.refreshToken);
      await params.tokenStore.saveToken({ ...tokenKey, token: saved });
      return { headers: { Authorization: `Bearer ${saved.accessToken}` } };
    } catch {
    }
  }
  if (token) {
    await params.tokenStore.deleteToken(tokenKey);
  }
  const authUrl = await buildMcpAuthorizationUrl({
    tokenStore: params.tokenStore,
    client,
    serverId: params.serverId,
    userRef: params.userRef,
    mcpServerUrl: params.mcpServerUrl,
    mcpServerName: params.mcpServerName,
    ...params.returnTo !== void 0 ? { returnTo: params.returnTo } : {}
  });
  return { authUrl };
}
async function completeMcpAuthorization(params) {
  const nowMs = Date.now();
  const { pending } = params;
  const client = await params.mcpServerStore.getClient({ id: pending.id });
  if (!client) {
    throw new McpConnectionError2(
      `No OAuth client registered for MCP server id '${pending.id}'; re-run authorize first`,
      400
    );
  }
  if (pending.codeVerifier === null) {
    throw new McpConnectionError2("Pending authorization is missing PKCE code_verifier; re-run authorize", 400);
  }
  let tokens;
  try {
    tokens = await exchangeAuthorization(mcpAuthorizationServerOrigin(client.server), {
      metadata: mcpAuthorizationServerMetadata(client.server),
      clientInformation: mcpClientInformation(client.client),
      authorizationCode: params.code,
      codeVerifier: pending.codeVerifier,
      redirectUri: mcpOAuthCallbackUrl(),
      resource: resourceUrlFromServerUrl(pending.mcpServerUrl),
      fetchFn: mcpOAuthFetch
    });
  } catch (error) {
    if (error instanceof InvalidClientError) {
      await params.mcpServerStore.deleteClient({ id: pending.id });
      throw new McpConnectionError2("OAuth client registration is invalid; please retry connecting", 400, {
        cause: error
      });
    }
    throw mcpOAuthConnectionError("OAuth token exchange failed", error, 400);
  }
  await params.tokenStore.saveToken({
    id: pending.id,
    userRef: pending.userRef,
    token: oauthTokensToOAuthToken(tokens, nowMs, null)
  });
}

// src/runtime/sessionResources.ts
init_LocalSandboxProvider();

// src/sandbox/providerUtils.ts
init_config();
import { Daytona, DaytonaError } from "@daytona/sdk";
import { DaytonaSandboxProvider, SANDBOX_IMAGE_URI } from "@truefoundry/trueforge-core/core";

// src/schemas/sandboxProvider.ts
import { z as z7 } from "@hono/zod-openapi";
var DaytonaSandboxProviderAuthSchema = z7.object({
  api_key: z7.string().min(1).describe(
    "Daytona API key. Responses are redacted; on PUT, a real value sets/rotates and a redacted value keeps the stored key."
  )
}).strict().describe("Daytona authentication credentials.").openapi("DaytonaSandboxProviderAuth");
var DaytonaSandboxProviderSchema = z7.object({
  type: z7.literal("daytona").describe("Daytona sandbox provider."),
  auth: DaytonaSandboxProviderAuthSchema,
  exec_timeout_ms: z7.number().int().positive().describe("Default sandbox command exec timeout in milliseconds."),
  auto_stop_interval_in_minutes: z7.number().int().nonnegative().describe("Minutes of idle time before Daytona auto-stops the sandbox (0 disables)."),
  auto_archive_interval_in_minutes: z7.number().int().nonnegative().describe("Minutes before Daytona auto-archives the sandbox (0 disables)."),
  auto_delete_interval_in_minutes: z7.number().int().nonnegative().describe("Minutes before Daytona auto-deletes the sandbox (0 disables).")
}).strict();
var SandboxProviderManifestSchema = DaytonaSandboxProviderSchema.openapi("SandboxProviderManifest");
var SandboxBuildStatusSchema = z7.enum(["pending", "ready", "failed"]).describe("Current build status.").openapi("SandboxBuildStatus");
var SandboxBuildMetadataSchema = z7.record(z7.string(), z7.string()).describe("Provider-specific build metadata (opaque string map).");
var SandboxStatusSchema = z7.object({
  status: SandboxBuildStatusSchema,
  status_reason: z7.string().nullable().describe("Human-readable detail for the current status; null when ready."),
  build_metadata: SandboxBuildMetadataSchema.nullable().describe(
    "Provider-specific build metadata; null when the provider has none."
  )
}).strict();
var ConfiguredSandboxProviderSchema = z7.object({
  manifest: SandboxProviderManifestSchema,
  status: SandboxBuildStatusSchema,
  status_reason: z7.string().nullable().describe("Human-readable detail for the current status; null when ready.")
}).strict().openapi("ConfiguredSandboxProvider");
var UpdateSandboxProviderRequestSchema = z7.object({
  manifest: SandboxProviderManifestSchema
}).strict().openapi("UpdateSandboxProviderRequest");
var GetSandboxProviderResponseSchema = z7.object({
  data: ConfiguredSandboxProviderSchema
}).openapi("GetSandboxProviderResponse");
function toDaytonaSandboxProviderInput(manifest) {
  return {
    apiKey: manifest.auth.api_key,
    timeoutMs: manifest.exec_timeout_ms,
    autoStopIntervalInMinutes: manifest.auto_stop_interval_in_minutes,
    autoArchiveIntervalInMinutes: manifest.auto_archive_interval_in_minutes,
    autoDeleteIntervalInMinutes: manifest.auto_delete_interval_in_minutes
  };
}

// src/sandbox/providerUtils.ts
function isDaytonaAuthError(error) {
  return error instanceof DaytonaError && (error.statusCode === 401 || error.statusCode === 403);
}
function toDaytonaSandboxProvider({
  manifest,
  tenant_id,
  logger,
  build_metadata
}) {
  const { apiKey, ...settings } = toDaytonaSandboxProviderInput(manifest);
  return new DaytonaSandboxProvider({
    client: new Daytona({ apiKey }),
    apiKey,
    ...settings,
    tenantName: tenant_id,
    sandboxImage: build_metadata?.["image_uri"] ?? SANDBOX_IMAGE_URI,
    buildRef: build_metadata?.["build_ref"],
    fileMaxBytesForDownload: config_default.SANDBOX_FILE_MAX_BYTES_FOR_DOWNLOAD,
    logger
  });
}
function toSandboxStatus(build) {
  return {
    status: build.status,
    status_reason: build.reason,
    build_metadata: build.metadata
  };
}
function sandboxStatusFromRecord(record) {
  return {
    status: record.status,
    status_reason: record.status_reason,
    build_metadata: record.build_metadata
  };
}
var READY_REVALIDATE_INTERVAL_MS = 13 * 24 * 60 * 60 * 1e3;
async function checkSnapshotStatus({
  store,
  tenant_id,
  logger
}) {
  const record = await store.getSandboxProvider(tenant_id);
  if (!record) {
    return void 0;
  }
  const persisted = sandboxStatusFromRecord(record);
  const readyIsFresh = record.status === "ready" && Date.now() - Date.parse(record.updated_at) < READY_REVALIDATE_INTERVAL_MS;
  if (record.status === "failed" || readyIsFresh) {
    return persisted;
  }
  const provider = toDaytonaSandboxProvider({
    manifest: record.manifest,
    tenant_id,
    logger,
    build_metadata: record.build_metadata
  });
  let build;
  if (record.status === "ready") {
    build = await provider.buildImage();
  } else {
    build = await provider.getImageBuildStatus();
  }
  const next = toSandboxStatus(build);
  const updated = await store.updateSandboxStatus({ tenant_id, ...next });
  return updated ? sandboxStatusFromRecord(updated) : next;
}

// src/schemas/mcpServer.ts
import { z as z8 } from "@hono/zod-openapi";
var McpServerTypeSchema = z8.enum(["remote"]).openapi("MCPServerType");
var McpServerHeaderAuthSchema = z8.object({
  type: z8.literal("header").describe("Authenticate with static HTTP headers."),
  headers: z8.record(z8.string().min(1), z8.string().min(1)).refine((headers) => Object.keys(headers).length > 0, {
    message: "must include at least one header"
  }).describe(
    "Request headers for this MCP server. Responses are redacted; on PUT, a real value sets/rotates and a redacted value keeps the stored secret for that header name."
  )
}).strict().openapi("MCPServerHeaderAuth");
var McpServerDcrAuthSchema = z8.object({
  type: z8.literal("dcr").describe("Authenticate via OAuth Dynamic Client Registration.")
}).strict().openapi("MCPServerDcrAuth");
var McpServerManifestAuthSchema = z8.discriminatedUnion("type", [McpServerHeaderAuthSchema, McpServerDcrAuthSchema]).describe("Optional auth settings. Omit when the server needs no credentials.").openapi("MCPServerManifestAuth");
var McpServerDescriptionSchema = z8.string().trim().min(1).describe("Concise summary of what this MCP server provides.");
var McpServerManifestObjectSchema = z8.object({
  type: McpServerTypeSchema,
  name: NameSchema,
  url: z8.url().describe("URL of the remote MCP server."),
  description: McpServerDescriptionSchema,
  auth: McpServerManifestAuthSchema.optional()
}).strict();
var McpServerManifestSchema = McpServerManifestObjectSchema.openapi("MCPServerManifest");
var McpAuthStatusSchema = z8.object({
  status: z8.enum(["authenticated", "auth_required", "not_required"]).describe("Current auth state for this MCP server."),
  authorization_url: z8.url().optional().describe("When auth is required, this contains the URL to redirect the user to for authorization.")
}).strict().describe("Current auth state.").openapi("MCPAuthStatus");
var ConfiguredMcpServerSchema = z8.object({
  name: NameSchema,
  manifest: McpServerManifestSchema,
  auth_status: McpAuthStatusSchema
}).strict().openapi("ConfiguredMCPServer");
var CreateMcpServerRequestSchema = z8.object({
  manifest: McpServerManifestSchema
}).strict().openapi("CreateMCPServerRequest");
var UpdateMcpServerRequestSchema = z8.object({
  manifest: McpServerManifestSchema
}).strict().openapi("UpdateMCPServerRequest");
var GetMcpServerResponseSchema = z8.object({ data: ConfiguredMcpServerSchema }).openapi("GetMCPServerResponse");
var ListMcpServersResponseSchema = z8.object({ data: z8.array(ConfiguredMcpServerSchema) }).openapi("ListMCPServersResponse");
var McpServerAuthPublicSchema = z8.discriminatedUnion("type", [
  z8.object({ type: z8.literal("dcr") }).strict(),
  z8.object({ type: z8.literal("header") }).strict()
]).describe("Auth mechanism when configured (no secrets). Omit when the server needs no credentials.").openapi("MCPServerAuthPublic");
var AvailableMcpServerSchema = z8.object({
  name: NameSchema,
  url: z8.url().describe("URL of the remote MCP server."),
  auth: McpServerAuthPublicSchema.optional(),
  auth_status: McpAuthStatusSchema
}).strict().openapi("AvailableMCPServer");
var ListAvailableMcpServersResponseSchema = z8.object({ data: z8.array(AvailableMcpServerSchema) }).openapi("ListAvailableMCPServersResponse");
function resolveConfiguredMcpRequestHeaders(manifest) {
  if (manifest.auth?.type === "header") {
    return { ...manifest.auth.headers };
  }
  return {};
}
function resolveMcpAuthStatus({
  manifest,
  token
}) {
  if (manifest.auth?.type === "dcr") {
    return token ? { status: "authenticated" } : { status: "auth_required" };
  }
  if (manifest.auth?.type === "header") {
    return { status: "authenticated" };
  }
  return { status: "not_required" };
}

// src/runtime/sessionResources.ts
function parseModelFqn(name) {
  const slash = name.indexOf("/");
  if (slash <= 0 || slash === name.length - 1) {
    return void 0;
  }
  if (name.includes("/", slash + 1)) {
    return void 0;
  }
  return { providerName: name.slice(0, slash), modelName: name.slice(slash + 1) };
}
async function getModelDetails({
  tenant_id,
  name,
  store
}) {
  const parsed = parseModelFqn(name);
  if (parsed === void 0) {
    throw new HTTPException(422, {
      message: `Model name must be a fully qualified "provider/model": ${name}`
    });
  }
  const provider = await store.getProvider({ tenant_id, name: parsed.providerName });
  if (provider === void 0) {
    throw new HTTPException(422, {
      message: `Unknown model "${name}" \u2014 provider not configured`
    });
  }
  const model = provider.manifest.models.find((entry) => entry.name === parsed.modelName);
  if (model === void 0) {
    throw new HTTPException(422, {
      message: `Unknown model "${name}" \u2014 not configured on provider`
    });
  }
  const { type, base_url } = provider.manifest;
  return {
    providerConfig: {
      provider: { type, name: provider.name },
      model: { id: model.model_id, name: model.name },
      name,
      baseUrl: base_url,
      // Custom providers may omit auth; adapters still require a string.
      apiKey: provider.manifest.auth?.api_key ?? "",
      headers: {}
    },
    defaultModelParams: model.properties.max_output_tokens ? { max_tokens: model.properties.max_output_tokens } : {}
  };
}
function dcrHeadersResolver(params) {
  const { record, tokenStore, mcpServerStore, clientName, userRef } = params;
  return async () => {
    const result = await resolveMcpAuth({
      tokenStore,
      mcpServerStore,
      serverId: record.id,
      userRef,
      mcpServerUrl: record.manifest.url,
      mcpServerName: record.name,
      clientName
    });
    if (isMcpAuthRequired(result)) {
      return {
        authRequired: {
          servers: [{ id: record.name, name: record.name, auth_url: result.authUrl.href }]
        }
      };
    }
    return { headers: result.headers };
  };
}
async function getMcpConnection({
  tenant_id,
  name,
  store,
  tokenStore,
  clientName,
  userRef
}) {
  const record = await store.getServer({ tenant_id, name });
  if (record === void 0) {
    return void 0;
  }
  if (record.manifest.auth?.type === "dcr") {
    return {
      url: record.manifest.url,
      headers: dcrHeadersResolver({
        record,
        tokenStore,
        mcpServerStore: store,
        clientName,
        userRef
      })
    };
  }
  return {
    url: record.manifest.url,
    headers: resolveConfiguredMcpRequestHeaders(record.manifest)
  };
}
async function resolveGitSkills({
  tenant_id,
  skills,
  store
}) {
  if (skills.length === 0) {
    return [];
  }
  const names = skills.map((skill) => skill.name);
  const records = await store.listSkills({ tenant_id, names });
  const byName = new Map(records.map((record) => [record.name, record]));
  const resolved = [];
  for (const skill of skills) {
    const record = byName.get(skill.name);
    if (record === void 0) {
      throw new HTTPException(422, {
        message: `Unknown skill "${skill.name}" \u2014 not configured`
      });
    }
    resolved.push({
      name: record.manifest.name,
      description: record.manifest.description,
      url: record.manifest.url,
      path: record.manifest.path ?? "",
      ref: record.manifest.ref
    });
  }
  return resolved;
}
function localSandboxSessionSegment(sessionId) {
  if (sessionId === void 0 || sessionId.length === 0 || sessionId.includes("/") || sessionId.includes("..")) {
    return "_";
  }
  return sessionId;
}
async function resolveSandboxProvider({
  tenant_id,
  store,
  logger,
  sessionId
}) {
  const record = await store.getSandboxProvider(tenant_id);
  if (record !== void 0) {
    return toDaytonaSandboxProvider({
      manifest: record.manifest,
      tenant_id,
      logger,
      build_metadata: record.build_metadata
    });
  }
  if (!config_default.STANDALONE) {
    return void 0;
  }
  const support = getCachedLocalSandboxSupport();
  if (support?.supported !== true) {
    return void 0;
  }
  return new LocalSandboxProvider({
    sandboxRootPathParent: join4(config_default.LOCAL_SANDBOX_ROOT_PARENT, localSandboxSessionSegment(sessionId)),
    codeModeSocketParentPath: config_default.CODE_MODE_SOCKET_PARENT,
    support,
    fileMaxBytesForDownload: config_default.SANDBOX_FILE_MAX_BYTES_FOR_DOWNLOAD,
    logger
  });
}
function buildTurnSandbox(input) {
  const skillMounter = input.gitSkills.length > 0 ? new SkillMounter([...input.gitSkills]) : void 0;
  return new Sandbox({
    provider: input.provider,
    existingSandboxId: input.existingSandboxId,
    fileDownloadEnabled: input.fileDownloadEnabled,
    blockDestructiveToolsInCodeMode: true,
    mcpRequestTimeoutMs: config_default.MCP_REQUEST_TIMEOUT_MS,
    mcpConnectTimeoutMs: config_default.MCP_CONNECT_TIMEOUT_MS,
    ...skillMounter ? { skillMounter } : {},
    tracing: input.tracing,
    logger: input.logger
  });
}
async function validateAgentSpec({
  spec,
  tenant_id,
  modelProviderStore,
  mcpServerStore,
  skillStore,
  sandboxProviderStore
}) {
  const parsed = parseModelFqn(spec.model.name);
  if (parsed === void 0) {
    throw new HTTPException(422, {
      message: `Model name must be a fully qualified "provider/model": ${spec.model.name}`
    });
  }
  const provider = await modelProviderStore.getProvider({ tenant_id, name: parsed.providerName });
  if (provider === void 0) {
    throw new HTTPException(422, {
      message: `Unknown model "${spec.model.name}" \u2014 provider not configured`
    });
  }
  const model = provider.manifest.models.find((entry) => entry.name === parsed.modelName);
  if (model === void 0) {
    throw new HTTPException(422, {
      message: `Unknown model "${spec.model.name}" \u2014 not configured on provider`
    });
  }
  const reasoningEffort = spec.model.params?.reasoning_effort;
  if (reasoningEffort !== void 0) {
    const efforts = model.properties.reasoning_efforts;
    if (!efforts?.some((effort) => effort === reasoningEffort)) {
      throw new HTTPException(422, {
        message: efforts ? `Reasoning effort "${reasoningEffort}" is not supported by model "${spec.model.name}"` : `Model "${spec.model.name}" does not support configurable reasoning effort`
      });
    }
  }
  const requestedMcpServers = spec.mcp_servers ?? [];
  if (requestedMcpServers.length > 0) {
    const names = requestedMcpServers.map((server) => server.name);
    const configuredNames = new Set(
      (await mcpServerStore.listServers({ tenant_id, names })).map((record) => record.name)
    );
    const unknown = requestedMcpServers.find((server) => !configuredNames.has(server.name));
    if (unknown !== void 0) {
      throw new HTTPException(422, {
        message: `Unknown MCP server "${unknown.name}" \u2014 not configured`
      });
    }
  }
  const requestedSkills = spec.skills ?? [];
  if (requestedSkills.length > 0) {
    const names = requestedSkills.map((skill) => skill.name);
    const configuredNames = new Set((await skillStore.listSkills({ tenant_id, names })).map((record) => record.name));
    const unknown = requestedSkills.find((skill) => !configuredNames.has(skill.name));
    if (unknown !== void 0) {
      throw new HTTPException(422, {
        message: `Unknown skill "${unknown.name}" \u2014 not configured`
      });
    }
  }
  const wantsSandbox = spec.config.sandbox.enabled;
  const hasSkills = requestedSkills.length > 0;
  if (wantsSandbox || hasSkills) {
    const record = await sandboxProviderStore.getSandboxProvider(tenant_id);
    if (record === void 0 && !isLocalSandboxFallbackEnabled()) {
      throw new HTTPException(422, {
        message: hasSkills ? "skills require a sandbox provider \u2014 configure via PUT /settings/sandbox-providers" : "sandbox is enabled but no sandbox provider is configured \u2014 PUT /settings/sandbox-providers"
      });
    }
  }
}

// src/apis/sessions.ts
init_config();
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  CancellationReason,
  SessionStoreConflictError,
  SessionStoreInvariantError,
  SessionStoreNotFoundError,
  TurnNotFoundError
} from "@truefoundry/trueforge-core/agent-session";
import { extractErrorLogFields } from "@truefoundry/trueforge-core/core";
import {
  redisRequest,
  RequestTimeoutError
} from "@truefoundry/trueforge-core/request-reply";
import { ulid as ulid4 } from "ulid";
import { z as z13 } from "zod";

// src/routes/sessionRoutes.ts
import { createRoute as createRoute2, z as z12 } from "@hono/zod-openapi";

// src/schemas/events.ts
import { z as z9 } from "@hono/zod-openapi";
import {
  EventType,
  SessionEventItemSchema,
  TokenPaginationSchema,
  TurnCreatedEventSchema,
  TurnDoneEventSchema
} from "@truefoundry/trueforge-core/agent-session";
import {
  MCPAuthRequiredEventSchema,
  MCPInitializeEventSchema,
  ModelMessageDeltaEventSchema,
  ModelMessageEventSchema,
  SandboxCreatedEventSchema,
  ThreadCreatedEventSchema,
  ThreadDoneEventSchema,
  ToolApprovalRequiredEventSchema,
  ToolResponseEventSchema,
  ToolResponseRequiredEventSchema
} from "@truefoundry/trueforge-core/core";
var TurnStreamingEventSchema = z9.discriminatedUnion("type", [
  ModelMessageEventSchema,
  ModelMessageDeltaEventSchema,
  ToolResponseEventSchema,
  ThreadCreatedEventSchema,
  ThreadDoneEventSchema,
  MCPAuthRequiredEventSchema,
  MCPInitializeEventSchema,
  SandboxCreatedEventSchema,
  ToolApprovalRequiredEventSchema,
  ToolResponseRequiredEventSchema,
  TurnCreatedEventSchema,
  TurnDoneEventSchema
]).openapi("TurnStreamingEvent");
var ListSessionEventsRequestQuerySchema = z9.object({
  page_token: z9.string().optional().describe(
    "Pagination cursor from `pagination.next_page_token`. It retains the branch anchor turn and returns older events toward the session start."
  ),
  last_turn_id: z9.string().optional().describe(
    "Newest turn in the listing window (initial load only; ignored when `page_token` is set). Lists that turn and its ancestors, newest events first. Omit to use the session last turn."
  ),
  limit: z9.coerce.number().int().min(1).max(EVENTS_PAGE_LIMIT).optional().default(EVENTS_PAGE_LIMIT).describe(`Page size. Defaults to ${String(EVENTS_PAGE_LIMIT)}, max ${String(EVENTS_PAGE_LIMIT)}.`)
}).openapi("ListSessionEventsRequestQuery");
var ListSessionEventsResponseSchema = z9.object({
  data: z9.array(SessionEventItemSchema),
  pagination: TokenPaginationSchema
}).openapi("ListSessionEventsResponse");

// src/schemas/session.ts
import { z as z10 } from "@hono/zod-openapi";
import { AgentSpecSchema as AgentSpecSchema3, SessionSchema, TokenPaginationSchema as TokenPaginationSchema2 } from "@truefoundry/trueforge-core/agent-session";
var SessionAgentNameRefSchema = z10.object({ name: NameSchema }).strict().openapi("SessionAgentNameRef");
var SessionAgentSpecBodySchema = z10.object({ spec: AgentSpecSchema3 }).strict().openapi("SessionAgentSpecBody");
var CreateSessionAgentSchema = z10.union([SessionAgentNameRefSchema, SessionAgentSpecBodySchema]).openapi("CreateSessionAgent");
function isSessionAgentNameRef(agent) {
  return SessionAgentNameRefSchema.safeParse(agent).success;
}
var CreateSessionRequestSchema = z10.object({
  agent: CreateSessionAgentSchema
}).strict().openapi("CreateSessionRequest");
var UpdateSessionRequestSchema = z10.object({
  agent: SessionAgentSpecBodySchema.optional()
}).strict().openapi("UpdateSessionRequest");
var IsoTimestampQueryParam = z10.iso.datetime({ offset: true }).openapi({ type: "string", format: "date-time" }).transform((s) => new Date(s));
var ListSessionsRequestQuerySchema = z10.object({
  limit: z10.coerce.number().int().min(1).max(PAGE_LIMIT).optional().default(PAGE_LIMIT).describe(`Page size. Defaults to ${String(PAGE_LIMIT)}, max ${String(PAGE_LIMIT)}.`),
  order: z10.enum(["asc", "desc"]).optional().default("desc").describe('Sort sessions by `updated_at`. Defaults to "desc".').openapi("ListSessionsOrder"),
  page_token: z10.string().min(1).optional().describe("Opaque keyset cursor from a previous response `next_page_token`."),
  start_timestamp: IsoTimestampQueryParam.optional().describe(
    "Inclusive lower bound on `created_at` (ISO-8601 / RFC 3339)."
  ),
  end_timestamp: IsoTimestampQueryParam.optional().describe(
    "Inclusive upper bound on `created_at` (ISO-8601 / RFC 3339)."
  ),
  agent_id: z10.string().min(1).optional().describe("When set, only sessions bound to this agent id are returned.")
}).openapi("ListSessionsRequestQuery");
var GetSessionResponseSchema = z10.object({
  data: SessionSchema
}).openapi("GetSessionResponse");
var ListSessionsResponseSchema = z10.object({
  data: z10.array(SessionSchema),
  pagination: TokenPaginationSchema2
}).openapi("ListSessionsResponse");

// src/schemas/turn.ts
import { z as z11 } from "@hono/zod-openapi";
import { SessionEventSchema, TokenPaginationSchema as TokenPaginationSchema3, TurnSchema } from "@truefoundry/trueforge-core/agent-session";
import { CreateTurnRequestSchema, TurnSchema as TurnSchema2 } from "@truefoundry/trueforge-core/agent-session";
var SubscribeTurnQuerySchema = z11.object({
  // Query strings need coerce; map null/'' to undefined first so Number(null)→0
  // cannot silently become a resume cursor (and so OpenAPI does not advertise null).
  after_sequence_number: z11.preprocess(
    (val) => val === null || val === "" ? void 0 : val,
    z11.coerce.number().int().nonnegative().optional().describe(
      "Exclusive resume cursor: replay only events with a sequence number greater than this value. Omit to start from the beginning of the live buffer."
    )
  )
}).openapi("SubscribeTurnQuery");
var CancelSessionRequestSchema = z11.object({}).describe("Empty request body. Cancel identifies the session via the path only.").openapi("CancelSessionRequest");
var CancelSessionResponseSchema = z11.object({}).describe("Empty success body. HTTP 200 means the cancel request was accepted (or nothing was running).").openapi("CancelSessionResponse");
var ListTurnsRequestQuerySchema = z11.object({
  limit: z11.coerce.number().int().min(1).max(PAGE_LIMIT).optional().default(PAGE_LIMIT).describe(`Page size. Defaults to ${String(PAGE_LIMIT)}, max ${String(PAGE_LIMIT)}.`),
  page_token: z11.string().optional().describe("Opaque token from a previous response `next_page_token`.")
}).openapi("ListTurnsRequestQuery");
var GetTurnResponseSchema = z11.object({
  data: TurnSchema
}).openapi("GetTurnResponse");
var ListTurnsResponseSchema = z11.object({
  data: z11.array(TurnSchema),
  pagination: TokenPaginationSchema3
}).openapi("ListTurnsResponse");
var ListTurnEventsRequestQuerySchema = z11.object({
  limit: z11.coerce.number().int().min(1).max(EVENTS_PAGE_LIMIT).optional().default(EVENTS_PAGE_LIMIT).describe(`Page size. Defaults to ${String(EVENTS_PAGE_LIMIT)}, max ${String(EVENTS_PAGE_LIMIT)}.`),
  page_token: z11.string().optional().describe("Opaque token from a previous response `next_page_token`."),
  order: z11.enum(["asc", "desc"]).optional().default("asc").describe('Sort events by insertion order. Defaults to "asc".').openapi("ListTurnEventsOrder")
}).openapi("ListTurnEventsRequestQuery");
var ListTurnEventsResponseSchema = z11.object({
  data: z11.array(SessionEventSchema),
  pagination: TokenPaginationSchema3
}).openapi("ListTurnEventsResponse");
var DownloadSandboxFileRequestQuerySchema = z11.object({
  path: z11.string().min(1).describe(
    "Absolute path of the file inside the sandbox, as listed in the assistant's `sandbox_artifacts` block."
  )
}).openapi("DownloadSandboxFileRequestQuery");

// src/routes/fernExtensions.ts
var TOKEN_PAGINATION = {
  cursor: "$request.page_token",
  next_cursor: "$response.pagination.next_page_token",
  results: "$response.data"
};

// src/routes/sessionRoutes.ts
var SessionIdParamsSchema = z12.object({
  session_id: z12.string().min(1).max(64).describe("Session identifier.")
});
var createSessionRoute = createRoute2({
  method: "post",
  path: "/",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "Create a session",
  description: 'Create a session with `agent` as either `{ name }` (named registry binding) or `{ spec: AgentSpec }` (inline). Named sessions snapshot the agent name at create and resolve the live agent on each turn. Responses use `{ type: "reference", name, id }` or `{ type: "inline", spec }`.',
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "create",
  request: {
    body: {
      content: { "application/json": { schema: CreateSessionRequestSchema } },
      required: true
    }
  },
  responses: {
    201: {
      content: { "application/json": { schema: GetSessionResponseSchema } },
      description: "Session created."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Named agent not found."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "The agent spec is valid but references a resource this server does not provide (e.g. model, MCP server, skill, or sandbox)."
    }
  }
});
var getSessionRoute = createRoute2({
  method: "get",
  path: "/{session_id}",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "Get a session",
  description: "Fetch a session by ID. Only the session creator (`created_by`) may fetch it.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "get",
  request: {
    params: SessionIdParamsSchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetSessionResponseSchema } },
      description: "Session data."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Session not found."
    }
  }
});
var deleteSessionRoute = createRoute2({
  method: "delete",
  path: "/{session_id}",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "Delete a session",
  description: "Delete a session and all related turns, events, and internal state. Only the session creator (`created_by`) may delete it. Idempotent if already gone.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "delete",
  request: {
    params: SessionIdParamsSchema
  },
  responses: {
    204: {
      description: "Session and all related data deleted."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    }
  }
});
var updateSessionRoute = createRoute2({
  method: "patch",
  path: "/{session_id}",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "Update a session",
  description: "Update a session by replacing `agent` with `{ spec: AgentSpec }`. Named (reference) sessions reject agent updates. An empty body is a valid no-op that refreshes `updated_at`. Only the session creator (`created_by`) may update it.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "update",
  request: {
    params: SessionIdParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateSessionRequestSchema } },
      required: true
    }
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetSessionResponseSchema } },
      description: "Session updated."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Session not found."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Named session rejected an agent update, or the agent spec references a resource this server does not provide (e.g. model, MCP server, skill, or sandbox)."
    }
  }
});
var listSessionsRoute = createRoute2({
  method: "get",
  path: "/",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "List sessions",
  description: "List the caller's sessions (newest first by default), token-paginated. Results are scoped to the authenticated identity via the session store's `created_by` filter (not a client query param). Optional `agent_id` filters to sessions bound to that named agent. Pass `page_token` to fetch the next page, keeping the other query params constant.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "list",
  "x-fern-pagination": TOKEN_PAGINATION,
  request: {
    query: ListSessionsRequestQuerySchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: ListSessionsResponseSchema } },
      description: "Paginated sessions."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid query parameters or page token."
    }
  }
});
var cancelSessionRoute = createRoute2({
  method: "post",
  path: "/{session_id}/cancel",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "Cancel a running turn in a session",
  description: "Cancel the running last turn for a session. Only the session creator (`created_by`) may cancel.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "cancel",
  request: {
    params: SessionIdParamsSchema,
    body: {
      content: { "application/json": { schema: CancelSessionRequestSchema } },
      required: false
    }
  },
  responses: {
    200: {
      content: { "application/json": { schema: CancelSessionResponseSchema } },
      description: "Turn cancelled."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Session not found."
    },
    412: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Requested action cannot be performed on the session because it is no longer usable, or the executor owning the running turn is unreachable."
    }
  }
});
var listSessionEventsRoute = createRoute2({
  method: "get",
  path: "/{session_id}/events",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "List session events",
  description: "List session events as `{ turn_id, event }` across the active turn branch (newest first), including persisted events from a running tip. Each turn contributes turn.created, content events (model.message, tool.call, \u2026), and turn.done when terminal; streaming deltas are not included. Use `page_token` to paginate backward toward older events while retaining the original branch anchor. Only the session creator (`created_by`) may list events.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "list_events",
  "x-fern-pagination": TOKEN_PAGINATION,
  request: {
    params: SessionIdParamsSchema,
    query: ListSessionEventsRequestQuerySchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: ListSessionEventsResponseSchema } },
      description: "Paginated session events."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid page token."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Session not found."
    }
  }
});

// src/runtime/peeringIds.ts
import { HTTPException as HTTPException2 } from "hono/http-exception";
import { ulid as ulid3 } from "ulid";
function mintPeeredTurnId(executorId) {
  return `${ulid3().toLowerCase()}.${executorId}`;
}
function executorFromTurnId(turnId) {
  const parts = turnId.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new HTTPException2(400, { message: `ID ${turnId} is not a valid turn id` });
  }
  return parts[1];
}

// src/apis/sessions.ts
var TENANT_ID = "default";
var SESSIONS_CANCEL_PATH = "sessions/cancel";
var CancelPeerBodySchema = z13.object({
  session_id: z13.string(),
  turn_id: z13.string(),
  reason: z13.enum(CancellationReason)
});
function toWireSession(record) {
  return {
    id: record.session_id,
    agent: record.agent,
    title: record.title,
    created_by: record.created_by,
    created_at: record.created_at.toISOString(),
    updated_at: record.updated_at.toISOString()
  };
}
function cancelTurnOnThisExecutor(activeTurns, input) {
  return activeTurns.cancelIfRunning({
    sessionId: input.sessionId,
    turnId: input.turnId,
    abortReason: input.reason
  });
}
function cancelSessionTurnPeerHandler(activeTurns) {
  return (request) => {
    const parsed = CancelPeerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return Promise.resolve({ status: 400, body: { message: "Invalid sessions/cancel payload" } });
    }
    const found = cancelTurnOnThisExecutor(activeTurns, {
      sessionId: parsed.data.session_id,
      turnId: parsed.data.turn_id,
      reason: parsed.data.reason
    });
    return Promise.resolve(
      found ? { status: 200, body: {} } : { status: 412, body: { message: "Turn is not running on this executor" } }
    );
  };
}
async function cancelSessionTurn(deps, input) {
  const { turnId, reason = CancellationReason.ClientCancelled } = input;
  const sessionId = deps.session.session_id;
  const turn = await deps.sessionStore.getTurn({
    session_id: sessionId,
    turn_id: turnId
  });
  if (turn?.state.status !== "running") {
    return;
  }
  const owner = executorFromTurnId(turnId);
  if (owner !== config_default.EXECUTOR_ID && deps.redis) {
    try {
      const reply = await redisRequest({
        redis: deps.redis,
        executorId: owner,
        path: SESSIONS_CANCEL_PATH,
        request: {
          body: { session_id: sessionId, turn_id: turnId, reason }
        },
        options: {
          replyTimeoutMs: config_default.REDIS_REQUEST_REPLY_TIMEOUT_MS,
          pollIntervalMs: config_default.REDIS_REQUEST_REPLY_POLL_INTERVAL_MS
        }
      });
      if (reply.status === 200) {
        return;
      }
    } catch (error) {
      const fields = {
        sessionId,
        turnId,
        owner,
        ...extractErrorLogFields(error)
      };
      if (error instanceof RequestTimeoutError) {
        deps.logger.warn("Timed out waiting for owning executor to cancel; freezing the running turn", fields);
      } else {
        deps.logger.warn("Failed to reach owning executor over Redis; freezing the running turn", fields);
      }
    }
    await freezeTurnIgnoringMissing(deps.session, { turnId, reason });
    return;
  }
  const aborted = cancelTurnOnThisExecutor(deps.activeTurns, { sessionId, turnId, reason });
  if (!aborted) {
    await freezeTurnIgnoringMissing(deps.session, { turnId, reason });
  }
}
async function freezeTurnIgnoringMissing(session, input) {
  try {
    await session.freezeTurn({ turn_id: input.turnId, reason: input.reason });
  } catch (error) {
    if (error instanceof TurnNotFoundError) {
      return;
    }
    throw error;
  }
}
var FORBIDDEN_SESSION_ACCESS = "Only the session creator can access this session";
function checkSessionAccess({ userRef, createdBy }) {
  return userRef === createdBy;
}
function createSessionsRouter(deps) {
  const createSessionHandler = async (c) => {
    const body = c.req.valid("json");
    const sessionId = ulid4().toLowerCase();
    if (isSessionAgentNameRef(body.agent)) {
      const agent = await deps.agentStore.getAgent({ tenant_id: TENANT_ID, name: body.agent.name });
      if (agent === void 0) {
        return c.json({ error: { message: `Agent not found: ${body.agent.name}` } }, 404);
      }
      const user2 = deps.resolveUserContext(c);
      const session2 = await deps.sessions.create({
        tenant_id: TENANT_ID,
        session_id: sessionId,
        created_by: user2.userRef,
        agent: { type: "reference", id: agent.id, name: agent.name }
      });
      return c.json({ data: toWireSession(session2.record) }, 201);
    }
    await validateAgentSpec({
      spec: body.agent.spec,
      tenant_id: TENANT_ID,
      modelProviderStore: deps.modelProviderStore,
      mcpServerStore: deps.mcpServerStore,
      skillStore: deps.skillStore,
      sandboxProviderStore: deps.sandboxProviderStore
    });
    const user = deps.resolveUserContext(c);
    const session = await deps.sessions.create({
      tenant_id: TENANT_ID,
      session_id: sessionId,
      created_by: user.userRef,
      agent: { type: "inline", spec: body.agent.spec }
    });
    return c.json({ data: toWireSession(session.record) }, 201);
  };
  const getSessionHandler = async (c) => {
    const { session_id: sessionId } = c.req.valid("param");
    const record = await deps.sessionStore.getSession({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!record) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    if (!checkSessionAccess({ userRef: deps.resolveUserContext(c).userRef, createdBy: record.created_by })) {
      return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS } }, 403);
    }
    return c.json({ data: toWireSession(record) }, 200);
  };
  const deleteSessionHandler = async (c) => {
    const { session_id: sessionId } = c.req.valid("param");
    const record = await deps.sessionStore.getSession({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!record) {
      return c.body(null, 204);
    }
    if (!checkSessionAccess({ userRef: deps.resolveUserContext(c).userRef, createdBy: record.created_by })) {
      return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS } }, 403);
    }
    await deps.sessionStore.deleteSession({ tenant_id: TENANT_ID, session_id: sessionId });
    return c.body(null, 204);
  };
  const updateSessionHandler = async (c) => {
    const { session_id: sessionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const existing = await deps.sessionStore.getSession({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!existing) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    if (!checkSessionAccess({ userRef: deps.resolveUserContext(c).userRef, createdBy: existing.created_by })) {
      return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS } }, 403);
    }
    if (body.agent !== void 0) {
      await validateAgentSpec({
        spec: body.agent.spec,
        tenant_id: TENANT_ID,
        modelProviderStore: deps.modelProviderStore,
        mcpServerStore: deps.mcpServerStore,
        skillStore: deps.skillStore,
        sandboxProviderStore: deps.sandboxProviderStore
      });
    }
    try {
      await deps.sessionStore.updateSession({
        tenant_id: TENANT_ID,
        session_id: sessionId,
        agent: body.agent === void 0 ? void 0 : { type: "inline", spec: body.agent.spec },
        title: void 0
      });
    } catch (error) {
      if (error instanceof SessionStoreNotFoundError) {
        return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
      }
      if (error instanceof SessionStoreInvariantError) {
        return c.json({ error: { message: error.message } }, 422);
      }
      throw error;
    }
    const record = await deps.sessionStore.getSession({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!record) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    return c.json({ data: toWireSession(record) }, 200);
  };
  const listSessionsHandler = async (c) => {
    const query = c.req.valid("query");
    const user = deps.resolveUserContext(c);
    try {
      const { data, pagination } = await deps.sessionStore.listSessions({
        agent_id: query.agent_id,
        created_by: user.userRef,
        tenant_id: TENANT_ID,
        limit: query.limit,
        order: query.order,
        page_token: query.page_token,
        start_timestamp: query.start_timestamp,
        end_timestamp: query.end_timestamp
      });
      return c.json({ data: data.map(toWireSession), pagination }, 200);
    } catch (error) {
      if (error instanceof SessionStoreConflictError) {
        return c.json({ error: { message: error.message } }, 400);
      }
      throw error;
    }
  };
  const cancelSessionHandler = async (c) => {
    const { session_id: sessionId } = c.req.valid("param");
    const session = await deps.sessions.get({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!session) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    if (!checkSessionAccess({ userRef: deps.resolveUserContext(c).userRef, createdBy: session.record.created_by })) {
      return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS } }, 403);
    }
    const turnId = session.record.last_turn_id;
    if (!turnId) {
      return c.json({}, 200);
    }
    await cancelSessionTurn({ ...deps, session }, { turnId });
    return c.json({}, 200);
  };
  const listSessionEventsHandler = async (c) => {
    const { session_id: sessionId } = c.req.valid("param");
    const query = c.req.valid("query");
    const session = await deps.sessions.get({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!session) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    if (!checkSessionAccess({ userRef: deps.resolveUserContext(c).userRef, createdBy: session.record.created_by })) {
      return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS } }, 403);
    }
    try {
      const { data, pagination } = await session.listEvents({
        limit: query.limit,
        page_token: query.page_token,
        last_turn_id: query.last_turn_id
      });
      return c.json({ data, pagination }, 200);
    } catch (error) {
      if (error instanceof SessionStoreConflictError) {
        return c.json({ error: { message: error.message } }, 400);
      }
      if (error instanceof SessionStoreNotFoundError) {
        return c.json({ error: { message: error.message } }, 404);
      }
      throw error;
    }
  };
  const router = new OpenAPIHono();
  router.openapi(createSessionRoute, createSessionHandler);
  router.openapi(getSessionRoute, getSessionHandler);
  router.openapi(deleteSessionRoute, deleteSessionHandler);
  router.openapi(updateSessionRoute, updateSessionHandler);
  router.openapi(listSessionsRoute, listSessionsHandler);
  router.openapi(cancelSessionRoute, cancelSessionHandler);
  router.openapi(listSessionEventsRoute, listSessionEventsHandler);
  deps.requestReplyRouter.registerRoute(SESSIONS_CANCEL_PATH, cancelSessionTurnPeerHandler(deps.activeTurns));
  return router;
}

// src/apis/agents.ts
function toWireAgent(record) {
  return {
    id: record.id,
    name: record.name,
    manifest: record.manifest
  };
}
async function validateManifest({
  spec,
  deps
}) {
  await validateAgentSpec({
    spec,
    tenant_id: TENANT_ID,
    modelProviderStore: deps.modelProviderStore,
    mcpServerStore: deps.mcpServerStore,
    skillStore: deps.skillStore,
    sandboxProviderStore: deps.sandboxProviderStore
  });
  return spec;
}
function createAgentsRouter(deps) {
  const listHandler = async (c) => {
    const records = await deps.agentStore.listAgents(TENANT_ID);
    return c.json({ data: records.map(toWireAgent) }, 200);
  };
  const createHandler = async (c) => {
    const body = c.req.valid("json");
    const manifest = await validateManifest({ spec: body.manifest, deps });
    try {
      const record = await deps.agentStore.createAgent({
        tenant_id: TENANT_ID,
        name: body.name,
        manifest
      });
      return c.json({ data: toWireAgent(record) }, 201);
    } catch (error) {
      if (error instanceof AgentNameConflictError) {
        return c.json({ error: { message: error.message } }, 409);
      }
      throw error;
    }
  };
  const getHandler = async (c) => {
    const { agent_id: agentId } = c.req.valid("param");
    const record = await deps.agentStore.getAgent({ tenant_id: TENANT_ID, id: agentId });
    if (record === void 0) {
      return c.json({ error: { message: `Agent not found: ${agentId}` } }, 404);
    }
    return c.json({ data: toWireAgent(record) }, 200);
  };
  const deleteHandler = async (c) => {
    const { agent_id: agentId } = c.req.valid("param");
    await deps.agentStore.deleteAgent({ tenant_id: TENANT_ID, id: agentId });
    return c.json({}, 200);
  };
  const putHandler = async (c) => {
    const { agent_id: agentId } = c.req.valid("param");
    const body = c.req.valid("json");
    const manifest = await validateManifest({ spec: body.manifest, deps });
    const record = await deps.agentStore.updateAgent({
      tenant_id: TENANT_ID,
      id: agentId,
      manifest
    });
    if (record === void 0) {
      return c.json({ error: { message: `Agent not found: ${agentId}` } }, 404);
    }
    return c.json({ data: toWireAgent(record) }, 200);
  };
  const router = new OpenAPIHono2();
  router.openapi(listAgentsRoute, listHandler);
  router.openapi(createAgentRoute, createHandler);
  router.openapi(getAgentRoute, getHandler);
  router.openapi(deleteAgentRoute, deleteHandler);
  router.openapi(putAgentRoute, putHandler);
  return router;
}

// src/apis/auth.ts
import { OpenAPIHono as OpenAPIHono3 } from "@hono/zod-openapi";
import { extractErrorLogFields as extractErrorLogFields2 } from "@truefoundry/trueforge-core/core";

// src/auth/cookies.ts
init_config();
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z as z14 } from "zod";
var OAUTH_STATE_COOKIE = "oauth_state";
var ID_TOKEN_COOKIE = "id_token";
var OAuthStateSchema = z14.object({
  state: z14.string(),
  code_verifier: z14.string(),
  return_to: z14.string()
});
function getAuthCookieAttributes() {
  return {
    httpOnly: true,
    sameSite: "Lax",
    secure: getPublicBaseUrl().startsWith("https://"),
    path: "/"
  };
}
function setAuthCookie(params) {
  setCookie(params.context, params.name, params.value, {
    ...getAuthCookieAttributes(),
    maxAge: params.maxAgeSeconds
  });
}
function readOAuthStateCookie(params) {
  const raw = getCookie(params.context, OAUTH_STATE_COOKIE);
  if (!raw) {
    return void 0;
  }
  try {
    const result = OAuthStateSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      params.logger.warn("oauth_state cookie failed schema validation", { error: result.error.message });
      return void 0;
    }
    return result.data;
  } catch (error) {
    params.logger.warn("oauth_state cookie is not valid JSON", {
      error: error instanceof Error ? error.message : error
    });
    return void 0;
  }
}
function clearAuthCookie(params) {
  deleteCookie(params.context, params.name, getAuthCookieAttributes());
}
function readIdTokenCookie(params) {
  return getCookie(params.context, ID_TOKEN_COOKIE);
}

// src/auth/oidc.ts
init_config();
import { createRemoteJWKSet } from "jose";
import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  randomPKCECodeVerifier,
  randomState
} from "openid-client";

// src/auth/claims.ts
function claimValues(claim) {
  if (Array.isArray(claim)) {
    return claim.filter((value) => typeof value === "string");
  }
  if (typeof claim === "string") {
    return [claim];
  }
  return [];
}
function resolveUserRef(claims, config) {
  const value = claims[config.OIDC_USER_REFERENCE_CLAIM];
  if (typeof value !== "string" || value === "") {
    throw new Error(
      `ID token is missing a non-empty "${config.OIDC_USER_REFERENCE_CLAIM}" claim (OIDC_USER_REFERENCE_CLAIM).`
    );
  }
  return value;
}
function resolveRole(claims, config) {
  return claimValues(claims[config.OIDC_USER_ROLE_CLAIM]).includes(config.OIDC_ADMIN_ROLE_VALUE) ? "admin" : "user";
}
function toUserContext(claims, config) {
  return {
    userRef: resolveUserRef(claims, config),
    role: resolveRole(claims, config)
  };
}
function buildAuthorizationRequestParams(config) {
  return {
    scopes: config.OIDC_SCOPES,
    claims: {
      id_token: {
        [config.OIDC_USER_REFERENCE_CLAIM]: { essential: true },
        [config.OIDC_USER_ROLE_CLAIM]: { essential: true }
      }
    }
  };
}

// src/auth/safeReturnTo.ts
var SAFE_RETURN_TO = /^\/(?!\/|api(?:\/|$)).*/;
function isSafeReturnTo(value) {
  return SAFE_RETURN_TO.test(value);
}
function safeReturnTo(value) {
  if (value && isSafeReturnTo(value)) {
    return value;
  }
  return "/";
}

// src/auth/oidc.ts
var CALLBACK_PATH = "/api/v1/auth/callback";
var OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
var ID_TOKEN_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;
var oidcVerify = null;
function enableOidcAuth(params) {
  const metadata = params.client.serverMetadata();
  if (!metadata.jwks_uri) {
    throw new Error("OIDC discovery did not return jwks_uri; cannot verify ID tokens");
  }
  oidcVerify = {
    jwks: createRemoteJWKSet(new URL(metadata.jwks_uri)),
    issuer: metadata.issuer,
    audience: params.client.clientMetadata().client_id,
    oidcConfig: params.oidcConfig
  };
}
function disableOidcAuth() {
  oidcVerify = null;
}
function getOidcVerify() {
  return oidcVerify;
}
async function initOidc(oidc) {
  if (!oidc) {
    disableOidcAuth();
    return void 0;
  }
  const client = await discovery(new URL(oidc.OIDC_ISSUER_URL), oidc.OIDC_CLIENT_ID, oidc.OIDC_CLIENT_SECRET);
  enableOidcAuth({ client, oidcConfig: oidc });
  return client;
}
function authCallbackUrl() {
  const publicBaseUrl = getPublicBaseUrl();
  return `${publicBaseUrl}${CALLBACK_PATH}`;
}
async function buildLoginAuthorization(params) {
  const oidcConfig = getOidcVerify()?.oidcConfig;
  if (!oidcConfig) {
    throw new Error(
      "OIDC claim configuration is unavailable; call initOidc before building a login authorization URL."
    );
  }
  const { scopes, claims } = buildAuthorizationRequestParams(oidcConfig);
  const returnTo = safeReturnTo(params.returnTo);
  const codeVerifier = randomPKCECodeVerifier();
  const state = randomState();
  const authorizationUrl = buildAuthorizationUrl(params.client, {
    redirect_uri: authCallbackUrl(),
    scope: scopes.join(" "),
    claims: JSON.stringify(claims),
    code_challenge: await calculatePKCECodeChallenge(codeVerifier),
    code_challenge_method: "S256",
    state
  });
  setAuthCookie({
    context: params.context,
    name: OAUTH_STATE_COOKIE,
    value: JSON.stringify({
      state,
      code_verifier: codeVerifier,
      return_to: returnTo
    }),
    maxAgeSeconds: OAUTH_STATE_MAX_AGE_SECONDS
  });
  return authorizationUrl.href;
}
async function exchangeAuthorizationCode(params) {
  const callbackUrl = new URL(authCallbackUrl());
  callbackUrl.search = params.callbackParams.toString();
  const tokens = await authorizationCodeGrant(params.client, callbackUrl, {
    pkceCodeVerifier: params.codeVerifier,
    expectedState: params.state
  });
  const idToken = tokens.id_token;
  if (!idToken) {
    throw new Error("Token response missing id_token");
  }
  setAuthCookie({
    context: params.context,
    name: ID_TOKEN_COOKIE,
    value: idToken,
    maxAgeSeconds: ID_TOKEN_COOKIE_MAX_AGE_SECONDS
  });
}

// src/auth/identity.ts
var LOCAL_USER_CONTEXT = {
  userRef: "trueforge-default",
  role: "admin"
};
function isAdmin(user) {
  if (!getOidcVerify()) {
    return true;
  }
  return user.role === "admin";
}
function resolveUserContext(c) {
  const uc = c.get("user_context");
  if (uc === void 0) {
    throw new Error("UserContext missing; auth middleware did not run");
  }
  return uc;
}

// src/auth/middleware.ts
import { HTTPException as HTTPException3 } from "hono/http-exception";
import { jwtVerify } from "jose";
var AUTH_HEADER_TYPE = "Bearer";
function readBearerIdToken(c) {
  const header = c.req.header("Authorization")?.trim();
  if (!header) {
    return void 0;
  }
  const prefix = `${AUTH_HEADER_TYPE} `;
  if (!header.toLowerCase().startsWith(prefix.toLowerCase())) {
    return void 0;
  }
  const token = header.slice(prefix.length).trim();
  return token.length > 0 ? token : void 0;
}
function readIdToken(c) {
  return readBearerIdToken(c) ?? readIdTokenCookie({ context: c });
}
async function resolveAuthUser(c) {
  const oidcVerify2 = getOidcVerify();
  if (!oidcVerify2) {
    return void 0;
  }
  const token = readIdToken(c);
  if (!token) {
    return void 0;
  }
  let payload;
  try {
    ({ payload } = await jwtVerify(token, oidcVerify2.jwks, {
      issuer: oidcVerify2.issuer,
      audience: oidcVerify2.audience
    }));
  } catch {
    return void 0;
  }
  const claims = { ...payload };
  return toUserContext(claims, oidcVerify2.oidcConfig);
}
var authMiddleware = async (c, next) => {
  if (!getOidcVerify()) {
    c.set("user_context", LOCAL_USER_CONTEXT);
    return next();
  }
  try {
    const user = await resolveAuthUser(c);
    if (!user) {
      throw new HTTPException3(401, { message: "Authentication required" });
    }
    c.set("user_context", user);
  } catch (error) {
    if (error instanceof HTTPException3) {
      throw error;
    }
    throw new HTTPException3(401, { message: "Authentication required", cause: error });
  }
  return next();
};
var adminAuthMiddleware = async (c, next) => {
  if (!getOidcVerify()) {
    c.set("user_context", LOCAL_USER_CONTEXT);
    return next();
  }
  try {
    const user = await resolveAuthUser(c);
    if (!user) {
      throw new HTTPException3(401, { message: "Authentication required" });
    }
    if (!isAdmin(user)) {
      throw new HTTPException3(403, { message: "Admin access required" });
    }
    c.set("user_context", user);
  } catch (error) {
    if (error instanceof HTTPException3) {
      throw error;
    }
    throw new HTTPException3(401, { message: "Authentication required", cause: error });
  }
  return next();
};

// src/routes/authRoutes.ts
import { createRoute as createRoute3 } from "@hono/zod-openapi";

// src/schemas/auth.ts
import { z as z15 } from "@hono/zod-openapi";
var AuthLoginQuerySchema = z15.object({
  return_to: z15.string().optional().describe('Path to return to after login. Must be a same-origin relative path; anything else falls back to "/".')
});
var OAuthCallbackQuerySchema = z15.object({
  code: z15.string().min(1).optional().describe("Authorization code, present when the user granted consent."),
  state: z15.string().min(1).describe("Opaque token; correlates this callback to its pending login. Always present, success or error."),
  error: z15.string().optional().describe("Error code from the identity provider, present instead of `code` if the user denied consent."),
  error_description: z15.string().optional().describe("Human-readable error detail from the identity provider when `error` is set.")
});
var OAuthCallbackSuccessSchema = z15.object({
  success: z15.literal(true).describe("Present when the OAuth callback completed without a return_to.")
});
var GetMeResponseSchema = z15.object({
  type: z15.enum(["default", "oidc-connected"]).describe(
    "Session kind: `default` when no valid OIDC session; `oidc-connected` after a successful browser login."
  ),
  email: z15.string().describe('User email from the ID token when connected; `"default"` when anonymous.'),
  role: z15.string().describe("Caller role.")
}).openapi("GetMeResponse");

// src/routes/authRoutes.ts
var authLoginRoute = createRoute3({
  method: "get",
  path: "/login",
  tags: ["Auth" /* AUTH */],
  summary: "Start the login flow",
  description: "Redirects the browser to the configured identity provider. In local/single-binary mode, redirects straight back into the app \u2014 there is nothing to log into.",
  "x-fern-ignore": true,
  "x-excluded": true,
  request: { query: AuthLoginQuerySchema },
  responses: {
    302: { description: "Redirect to the IdP authorization endpoint." }
  }
});
var oAuthCallbackRoute = createRoute3({
  method: "get",
  path: "/callback",
  tags: ["Auth" /* AUTH */],
  summary: "Login callback",
  description: "Browser-redirect target hit by the identity provider after login, never called directly by SDK consumers. In local/single-binary mode, redirects straight back into the app.",
  "x-fern-ignore": true,
  "x-excluded": true,
  request: { query: OAuthCallbackQuerySchema },
  responses: {
    302: { description: "Redirect back into the app on success, or to /?error=<reason> on failure." }
  }
});
var authLogoutRoute = createRoute3({
  method: "post",
  path: "/logout",
  tags: ["Auth" /* AUTH */],
  summary: "Clear the local session",
  description: "Ends the local harness session only \u2014 does not hit the IdP end-session endpoint. A no-op in local/single-binary mode, since there is no real session to clear.",
  "x-fern-ignore": true,
  "x-excluded": true,
  responses: {
    204: { description: "Session cookie cleared." }
  }
});
var meRoute = createRoute3({
  method: "get",
  path: "/me",
  tags: ["Auth" /* AUTH */],
  summary: "Current session",
  description: "Returns the authenticated caller identity. When auth is enabled this requires a valid `id_token` cookie or `Authorization: Bearer` ID token (401 otherwise). When auth is disabled, returns the default identity.",
  "x-fern-sdk-group-name": ["auth"],
  "x-fern-sdk-method-name": "me",
  responses: {
    200: {
      content: { "application/json": { schema: GetMeResponseSchema } },
      description: "Session type and identity for the current request."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Auth is enabled and the request has no valid cookie or Bearer ID token."
    }
  }
});

// src/apis/auth.ts
function oauthErrorRedirect(reason) {
  return `/?error=${encodeURIComponent(reason)}`;
}
function createAuthRouter(params) {
  const router = new OpenAPIHono3();
  router.openapi(authLoginRoute, async (c) => {
    if (!params.oidcClient) {
      return c.redirect("/", 302);
    }
    try {
      const authorizationUrl = await buildLoginAuthorization({
        context: c,
        client: params.oidcClient,
        returnTo: c.req.valid("query").return_to
      });
      return c.redirect(authorizationUrl, 302);
    } catch (error) {
      params.logger.error("Failed to build login authorization", extractErrorLogFields2(error));
      return c.redirect(oauthErrorRedirect("login_failed"), 302);
    }
  });
  router.openapi(oAuthCallbackRoute, async (c) => {
    if (!params.oidcClient) {
      return c.redirect("/", 302);
    }
    const query = c.req.valid("query");
    const pending = readOAuthStateCookie({ context: c, logger: params.logger });
    clearAuthCookie({ context: c, name: OAUTH_STATE_COOKIE });
    if (pending?.state !== query.state || query.error || !query.code) {
      if (await resolveAuthUser(c)) {
        return c.redirect("/", 302);
      }
      const description = query.error_description?.trim();
      const reason = query.error && description ? description : "login_failed";
      return c.redirect(oauthErrorRedirect(reason), 302);
    }
    try {
      await exchangeAuthorizationCode({
        context: c,
        client: params.oidcClient,
        callbackParams: new URL(c.req.url).searchParams,
        codeVerifier: pending.code_verifier,
        state: pending.state
      });
      return c.redirect(safeReturnTo(pending.return_to), 302);
    } catch (error) {
      params.logger.error("Failed to exchange authorization code", extractErrorLogFields2(error));
      if (await resolveAuthUser(c)) {
        return c.redirect(safeReturnTo(pending.return_to), 302);
      }
      const reason = error instanceof Error ? error.message : "login_failed";
      return c.redirect(oauthErrorRedirect(reason), 302);
    }
  });
  router.openapi(authLogoutRoute, (c) => {
    clearAuthCookie({ context: c, name: ID_TOKEN_COOKIE });
    return c.body(null, 204);
  });
  const gated = new OpenAPIHono3();
  gated.use("*", authMiddleware);
  gated.openapi(meRoute, (c) => {
    const user = resolveUserContext(c);
    const body = getOidcVerify() ? { type: "oidc-connected", email: user.userRef, role: user.role } : { type: "default", email: user.userRef, role: user.role };
    return c.json(body, 200);
  });
  router.route("/", gated);
  return router;
}

// src/apis/capabilities.ts
import { OpenAPIHono as OpenAPIHono4 } from "@hono/zod-openapi";
import { extractErrorLogFields as extractErrorLogFields3 } from "@truefoundry/trueforge-core/core";

// src/routes/capabilityRoutes.ts
import { createRoute as createRoute4, z as z16 } from "@hono/zod-openapi";
var SandboxCapabilitySchema = z16.object({
  enabled: z16.boolean().describe("Whether a sandbox provider is configured for this tenant.")
}).openapi("SandboxCapability");
var SkillCapabilitySchema = z16.object({
  enabled: z16.boolean().describe("Whether skills are available. False when sandbox is not enabled (skills require a sandbox)."),
  reason: z16.string().optional().describe("Present when skills are disabled. Explains why.")
}).openapi("SkillCapability");
var SettingsCapabilitySchema = z16.object({
  enabled: z16.boolean().describe("Whether the settings UI/API is enabled.")
}).openapi("SettingsCapability");
var CapabilitiesDataSchema = z16.object({
  sandbox: SandboxCapabilitySchema,
  skill: SkillCapabilitySchema,
  settings: SettingsCapabilitySchema
}).openapi("CapabilitiesData");
var GetCapabilitiesResponseSchema = z16.object({
  data: CapabilitiesDataSchema
}).openapi("GetCapabilitiesResponse");
var getCapabilitiesRoute = createRoute4({
  method: "get",
  path: "/",
  tags: ["Capabilities" /* CAPABILITIES */],
  summary: "Get server capabilities",
  "x-fern-sdk-group-name": ["server"],
  "x-fern-sdk-method-name": "get_capabilities",
  description: "Report optional runtime capabilities available for this tenant.",
  responses: {
    200: {
      content: { "application/json": { schema: GetCapabilitiesResponseSchema } },
      description: "Server capabilities."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    }
  }
});

// src/apis/capabilities.ts
function skillDisabledReason(status) {
  if (status === "pending") {
    return "Skills run in a sandbox whose image is still being prepared \u2014 retry shortly.";
  }
  return "Skills run in a sandbox, which is not configured.";
}
function createCapabilitiesRouter(deps) {
  const router = new OpenAPIHono4();
  router.openapi(getCapabilitiesRoute, async (c) => {
    let status;
    try {
      const refreshed = await checkSnapshotStatus({
        store: deps.sandboxProviderStore,
        tenant_id: TENANT_ID,
        logger: deps.logger
      });
      status = refreshed?.status;
    } catch (error) {
      deps.logger.warn("Sandbox image status check failed; reporting sandbox disabled", extractErrorLogFields3(error));
    }
    const sandboxEnabled = status === "ready" || status === void 0 && isLocalSandboxFallbackEnabled();
    const settingsEnabled = isAdmin(resolveUserContext(c));
    return c.json(
      {
        data: {
          sandbox: { enabled: sandboxEnabled },
          skill: sandboxEnabled ? { enabled: true } : { enabled: false, reason: skillDisabledReason(status) },
          settings: { enabled: settingsEnabled }
        }
      },
      200
    );
  });
  return router;
}

// src/apis/catalog.ts
import { OpenAPIHono as OpenAPIHono5 } from "@hono/zod-openapi";
import { SUPPORTED_REASONING_EFFORTS as SUPPORTED_REASONING_EFFORTS2 } from "@truefoundry/trueforge-core/core";

// src/routes/catalogRoutes.ts
import { createRoute as createRoute5 } from "@hono/zod-openapi";

// src/schemas/mcpCatalog.ts
import { z as z17 } from "@hono/zod-openapi";
var CatalogMcpServerSchema = z17.object({
  type: McpServerTypeSchema,
  name: NameSchema,
  logo: z17.url().optional().describe("URL of the MCP server logo asset."),
  url: z17.url().describe("URL of the remote MCP server."),
  description: McpServerDescriptionSchema,
  auth: McpServerManifestAuthSchema.optional()
}).strict().openapi("CatalogMCPServer");
var McpCatalogFileSchema = z17.object({
  mcp_servers: z17.array(CatalogMcpServerSchema)
}).strict().superRefine((file, ctx) => {
  uniqueNames(file.mcp_servers, ctx);
});
var GetMcpServerCatalogResponseSchema = z17.object({
  data: z17.array(CatalogMcpServerSchema)
}).openapi("GetMCPServerCatalogResponse");

// src/schemas/modelCatalog.ts
import { z as z19 } from "@hono/zod-openapi";

// src/schemas/modelProvider.ts
import { z as z18 } from "@hono/zod-openapi";
import { SUPPORTED_REASONING_EFFORTS, VERCEL_AI_PROVIDER_NAMES } from "@truefoundry/trueforge-core/core";
var ModelProviderTypeSchema = z18.enum(VERCEL_AI_PROVIDER_NAMES).openapi("ModelProviderType");
var ReasoningEffortSchema = z18.enum(SUPPORTED_REASONING_EFFORTS).openapi("ReasoningEffort");
var ModelPropertiesSchema = z18.object({
  context_length: z18.number().int().positive().optional().describe("Maximum context window size in tokens."),
  max_output_tokens: z18.number().int().positive().optional().describe("Maximum output tokens the model can generate."),
  reasoning_efforts: z18.array(ReasoningEffortSchema).min(1).optional().describe("Supported reasoning-effort values for this model.")
}).strict().describe("Optional model capability metadata.").openapi("ModelProperties");
var ConfiguredModelSchema = z18.object({
  model_id: z18.string().min(1).describe("Upstream, provider-specific identifier sent to the provider API."),
  name: NameSchema,
  properties: ModelPropertiesSchema
}).strict().openapi("ConfiguredModel");
function refineUniqueModels(models, ctx) {
  uniqueNames(models, ctx);
  const seenModelIds = /* @__PURE__ */ new Set();
  for (const model of models) {
    if (seenModelIds.has(model.model_id)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate model_id "${model.model_id}" \u2014 model_ids must be unique within a provider`,
        path: ["models"]
      });
    }
    seenModelIds.add(model.model_id);
  }
}
var ModelProviderAuthSchema = z18.object({
  api_key: z18.string().min(1).describe(
    "Provider API key. Responses are redacted; on PUT, a real value sets/rotates and a redacted value keeps the stored key."
  )
}).strict().describe("Provider authentication credentials.").openapi("ModelProviderAuth");
var ModelProviderManifestBaseSchema = z18.object({
  auth: ModelProviderAuthSchema,
  models: z18.array(ConfiguredModelSchema).min(1).describe("Models exposed by this provider (at least one).")
}).strict();
function wellKnownProviderSchema({
  type,
  base_url
}) {
  return ModelProviderManifestBaseSchema.extend({
    type: z18.literal(type),
    base_url: z18.url().default(base_url).describe("Override of the provider's default API base URL.")
  }).strict();
}
var OpenAiModelProviderSchema = wellKnownProviderSchema({
  type: "openai",
  base_url: "https://api.openai.com/v1"
}).openapi("OpenAIModelProvider");
var AnthropicModelProviderSchema = wellKnownProviderSchema({
  type: "anthropic",
  base_url: "https://api.anthropic.com/v1"
}).openapi("AnthropicModelProvider");
var GoogleGeminiModelProviderSchema = wellKnownProviderSchema({
  type: "google-gemini",
  base_url: "https://generativelanguage.googleapis.com/v1beta"
}).openapi("GoogleGeminiModelProvider");
var FireworksModelProviderSchema = wellKnownProviderSchema({
  type: "fireworks",
  base_url: "https://api.fireworks.ai/inference/v1"
}).openapi("FireworksModelProvider");
var ZaiModelProviderSchema = wellKnownProviderSchema({
  type: "zai",
  base_url: "https://api.z.ai/api/paas/v4"
}).openapi("ZaiModelProvider");
var MoonshotModelProviderSchema = wellKnownProviderSchema({
  type: "moonshot",
  base_url: "https://api.moonshot.ai/v1"
}).openapi("MoonshotModelProvider");
var TogetherAIModelProviderSchema = wellKnownProviderSchema({
  type: "together",
  base_url: "https://api.together.xyz/v1"
}).openapi("TogetherAIModelProvider");
var AlibabaModelProviderSchema = wellKnownProviderSchema({
  type: "alibaba",
  base_url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
}).openapi("AlibabaModelProvider");
var CustomModelProviderSchema = ModelProviderManifestBaseSchema.extend({
  type: z18.literal("custom"),
  name: NameSchema,
  base_url: z18.url().describe("Base URL of the provider's API."),
  auth: ModelProviderAuthSchema.optional()
}).strict().openapi("CustomModelProvider");
function refineModelProviderManifest(manifest, ctx) {
  refineUniqueModels(manifest.models, ctx);
}
var ModelProviderBodySchema = z18.discriminatedUnion("type", [
  OpenAiModelProviderSchema,
  AnthropicModelProviderSchema,
  GoogleGeminiModelProviderSchema,
  FireworksModelProviderSchema,
  ZaiModelProviderSchema,
  MoonshotModelProviderSchema,
  TogetherAIModelProviderSchema,
  AlibabaModelProviderSchema,
  CustomModelProviderSchema
]).superRefine(refineModelProviderManifest);
var ModelProviderManifestSchema = ModelProviderBodySchema.openapi("ModelProviderManifest");
function modelProviderName(provider) {
  return provider.type === "custom" ? provider.name : provider.type;
}
var ConfiguredModelProviderSchema = z18.object({
  name: NameSchema,
  manifest: ModelProviderManifestSchema
}).strict().openapi("ConfiguredModelProvider");
var CreateModelProviderRequestSchema = z18.object({
  manifest: ModelProviderManifestSchema
}).strict().openapi("CreateModelProviderRequest");
var UpdateModelProviderRequestSchema = z18.object({
  manifest: ModelProviderManifestSchema
}).strict().openapi("UpdateModelProviderRequest");
var GetModelProviderResponseSchema = z18.object({
  data: ConfiguredModelProviderSchema
}).openapi("GetModelProviderResponse");
var ListModelProvidersResponseSchema = z18.object({
  data: z18.array(ConfiguredModelProviderSchema)
}).openapi("ListModelProvidersResponse");
var AvailableModelProviderSchema = z18.object({
  name: z18.string().min(1).describe("Configured provider resource name; matches the FQN prefix of `name`.")
}).strict().describe("Owning configured provider.").openapi("AvailableModelProvider");
var AvailableModelSchema = z18.object({
  name: z18.string().describe('Fully qualified name `provider_name/model_name`, e.g. "openai/gpt-5-6-sol". Unique within a tenant.'),
  model_id: z18.string().describe("Upstream, provider-specific identifier sent to the provider API."),
  provider: AvailableModelProviderSchema,
  properties: ModelPropertiesSchema
}).strict().openapi("AvailableModel");
var ListAvailableModelsResponseSchema = z18.object({
  data: z18.array(AvailableModelSchema)
}).openapi("ListAvailableModelsResponse");

// src/schemas/modelCatalog.ts
var CatalogWellKnownModelProviderTypeSchema = ModelProviderTypeSchema.exclude(["custom"]).openapi(
  "CatalogWellKnownModelProviderType"
);
var CatalogModelSchema = ConfiguredModelSchema.openapi("CatalogModel");
var CatalogWellKnownModelProviderSchema = z19.object({
  type: CatalogWellKnownModelProviderTypeSchema,
  logo: z19.url().optional().describe("URL of the provider logo asset"),
  models: z19.array(CatalogModelSchema).describe("Preset models")
}).strict().openapi("CatalogWellKnownModelProvider");
var CatalogCustomModelProviderSchema = z19.object({
  type: z19.literal("custom"),
  supported_reasoning_efforts: z19.array(ReasoningEffortSchema).describe("Supported reasoning-effort values for this provider")
}).strict().openapi("CatalogCustomModelProvider");
var CatalogModelProviderSchema = z19.union([CatalogWellKnownModelProviderSchema, CatalogCustomModelProviderSchema]).openapi("CatalogModelProvider");
var ModelCatalogFileSchema = z19.object({
  providers: z19.array(CatalogWellKnownModelProviderSchema)
}).strict().superRefine((file, ctx) => {
  uniqueTypes(file.providers, ctx);
  for (const provider of file.providers) {
    refineUniqueModels(provider.models, ctx);
  }
});
var GetModelProviderCatalogResponseSchema = z19.object({
  data: z19.array(CatalogModelProviderSchema)
}).openapi("GetModelProviderCatalogResponse");

// src/schemas/sandboxCatalog.ts
import { z as z20 } from "@hono/zod-openapi";
var CatalogSandboxProviderSchema = DaytonaSandboxProviderSchema.omit({ auth: true }).strict().openapi("CatalogSandboxProvider");
var SandboxCatalogFileSchema = z20.object({
  providers: z20.array(CatalogSandboxProviderSchema)
}).strict();
var GetSandboxProviderCatalogResponseSchema = z20.object({
  data: z20.array(CatalogSandboxProviderSchema)
}).openapi("GetSandboxProviderCatalogResponse");

// src/schemas/skillCatalog.ts
import { z as z22 } from "@hono/zod-openapi";

// src/schemas/skill.ts
import { z as z21 } from "@hono/zod-openapi";
var SkillTypeSchema = z21.enum(["git"]).openapi("SkillType");
var GIT_URL_REGEX = /^https:\/\/(github\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+|gitlab\.com\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)+)(\/|\.git)?$/;
var GIT_REF_REGEX = /^[A-Za-z0-9._\-/]+$/;
var SKILL_PATH_REGEX = /^[A-Za-z0-9._\-/]+$/;
var hasParentTraversal = (value) => value.split("/").includes("..");
var SkillGitUrlSchema = z21.string().trim().min(1).regex(GIT_URL_REGEX, "Must be a GitHub or GitLab HTTPS URL").refine((v) => !hasParentTraversal(v), 'URL must not contain ".." segments').describe("Full HTTPS URL of a GitHub or GitLab repository.");
var SkillGitPathSchema = z21.string().trim().min(1).regex(SKILL_PATH_REGEX, 'Path may only contain letters, numbers, ".", "_", "-", and "/"').refine((v) => !hasParentTraversal(v), 'Path must not contain ".." segments').refine((v) => !v.split("/").includes("."), 'Path must not contain "." segments').refine((v) => v.replace(/^\/+|\/+$/g, "").length > 0, "Path must reference a subdirectory, not only slashes").describe("Path to the skill directory within the repository. Omit to use the repository root.");
var SkillGitRefSchema = z21.string().trim().min(1).regex(GIT_REF_REGEX, 'Ref may only contain letters, numbers, ".", "_", "-", and "/"').refine((v) => !hasParentTraversal(v), 'Ref must not contain ".." segments').refine((v) => v.replace(/^\/+|\/+$/g, "").length > 0, "Ref must not consist only of slashes").describe("Git ref \u2014 branch name, tag, or commit SHA.");
var SkillDescriptionSchema = z21.string().trim().min(1).describe("Concise guidance for when the agent should use the skill.");
var SkillManifestObjectSchema = z21.object({
  type: SkillTypeSchema,
  name: NameSchema,
  url: SkillGitUrlSchema,
  path: SkillGitPathSchema.optional(),
  ref: SkillGitRefSchema,
  description: SkillDescriptionSchema
}).strict();
var SkillManifestSchema = SkillManifestObjectSchema.openapi("SkillManifest");
var ConfiguredSkillSchema = z21.object({
  name: NameSchema,
  manifest: SkillManifestSchema
}).strict().openapi("ConfiguredSkill");
var CreateSkillRequestSchema = z21.object({
  manifest: SkillManifestSchema
}).strict().openapi("CreateSkillRequest");
var UpdateSkillRequestSchema = z21.object({
  manifest: SkillManifestSchema
}).strict().openapi("UpdateSkillRequest");
var GetSkillResponseSchema = z21.object({ data: ConfiguredSkillSchema }).openapi("GetSkillResponse");
var ListSkillsResponseSchema = z21.object({ data: z21.array(ConfiguredSkillSchema) }).openapi("ListSkillsResponse");
var AvailableSkillSchema = z21.object({
  name: NameSchema,
  description: SkillDescriptionSchema
}).strict().openapi("AvailableSkill");
var ListAvailableSkillsResponseSchema = z21.object({ data: z21.array(AvailableSkillSchema) }).openapi("ListAvailableSkillsResponse");

// src/schemas/skillCatalog.ts
var CatalogSkillSchema = z22.object({
  type: SkillTypeSchema,
  name: NameSchema,
  url: SkillGitUrlSchema,
  path: SkillGitPathSchema.optional(),
  ref: SkillGitRefSchema,
  description: SkillDescriptionSchema
}).strict().openapi("CatalogSkill");
var SkillCatalogFileSchema = z22.object({
  skills: z22.array(CatalogSkillSchema)
}).strict().superRefine((file, ctx) => {
  uniqueNames(file.skills, ctx);
});
var GetSkillCatalogResponseSchema = z22.object({
  data: z22.array(CatalogSkillSchema)
}).openapi("GetSkillCatalogResponse");

// src/routes/catalogRoutes.ts
var listModelProviderCatalogRoute = createRoute5({
  method: "get",
  path: "/model-providers",
  tags: ["Models" /* MODELS */],
  summary: "Get the model catalog",
  description: "Shipped model-provider presets (discovery-only). Copy into PUT /settings/model-providers to configure. Includes a `custom` sentinel with `supported_reasoning_efforts`.",
  "x-fern-sdk-group-name": ["catalogs", "modelProviders"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: GetModelProviderCatalogResponseSchema } },
      description: "Shipped model-provider presets."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Not authenticated."
    }
  }
});
var listMcpServerCatalogRoute = createRoute5({
  method: "get",
  path: "/mcp-servers",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "Get the MCP catalog",
  description: "Shipped MCP server presets (discovery-only). Copy into PUT /settings/mcp-servers to configure.",
  "x-fern-sdk-group-name": ["catalogs", "mcpServers"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: GetMcpServerCatalogResponseSchema } },
      description: "Shipped MCP server presets."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Not authenticated."
    }
  }
});
var listSkillCatalogRoute = createRoute5({
  method: "get",
  path: "/skills",
  tags: ["Skills" /* SKILLS */],
  summary: "Get the skill catalog",
  description: "Shipped skill presets (discovery-only). Copy into PUT /settings/skills to configure.",
  "x-fern-sdk-group-name": ["catalogs", "skills"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: GetSkillCatalogResponseSchema } },
      description: "Shipped skill presets."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Not authenticated."
    }
  }
});
var listSandboxProviderCatalogRoute = createRoute5({
  method: "get",
  path: "/sandbox-providers",
  tags: ["Sandboxes" /* SANDBOXES */],
  summary: "Get the sandbox provider catalog",
  description: "Shipped sandbox-provider presets (discovery-only). Copy into PUT /settings/sandbox-providers to configure.",
  "x-fern-sdk-group-name": ["catalogs", "sandboxProviders"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: GetSandboxProviderCatalogResponseSchema } },
      description: "Shipped sandbox-provider presets."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Not authenticated."
    }
  }
});

// src/apis/catalog.ts
function createCatalogRouter(deps) {
  const listModelProvidersHandler = (c) => {
    const loadedProvidersCatalog = deps.modelCatalog.list();
    const providersCatalog = [...loadedProvidersCatalog];
    providersCatalog.push({
      type: "custom",
      supported_reasoning_efforts: [...SUPPORTED_REASONING_EFFORTS2]
    });
    return c.json({ data: providersCatalog }, 200);
  };
  const listMcpServersHandler = (c) => {
    return c.json({ data: [...deps.mcpCatalog.list()] }, 200);
  };
  const listSkillsHandler = (c) => {
    return c.json({ data: [...deps.skillCatalog.list()] }, 200);
  };
  const listSandboxProvidersHandler = (c) => {
    return c.json({ data: [...deps.sandboxCatalog.list()] }, 200);
  };
  const router = new OpenAPIHono5();
  router.openapi(listModelProviderCatalogRoute, listModelProvidersHandler);
  router.openapi(listMcpServerCatalogRoute, listMcpServersHandler);
  router.openapi(listSkillCatalogRoute, listSkillsHandler);
  router.openapi(listSandboxProviderCatalogRoute, listSandboxProvidersHandler);
  return router;
}

// src/apis/mcpOAuth.ts
import { OpenAPIHono as OpenAPIHono6 } from "@hono/zod-openapi";
import { extractErrorLogFields as extractErrorLogFields4, McpConnectionError as McpConnectionError3 } from "@truefoundry/trueforge-core/core";

// src/routes/mcpOAuthRoutes.ts
import { createRoute as createRoute6 } from "@hono/zod-openapi";
var mcpOAuthCallbackRoute = createRoute6({
  method: "get",
  path: "/callback",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "OAuth callback for MCP authorization",
  description: "Browser redirect target for MCP server OAuth. The authorization server redirects here with `code`/`state` (or `error`). Exchanges the code for tokens, then either returns JSON or redirects to the `return_to` path supplied at authorize time. Not called by the SDK \u2014 browsers hit this URL directly.",
  // Browser-redirect target hit directly by the authorization server, never called by SDK.
  "x-fern-ignore": true,
  "x-excluded": true,
  request: {
    query: OAuthCallbackQuerySchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: OAuthCallbackSuccessSchema } },
      description: "Token exchanged successfully and no `return_to` was given at authorize time."
    },
    302: {
      description: "Redirect to the `return_to` path given at authorize time, with `isSuccess` (and `reason` when it failed) appended to its existing query params."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "IdP `error`, unknown/expired `state`, token exchange failure, or `code`/`error` both missing."
    },
    500: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Unexpected failure during token exchange."
    }
  }
});

// src/apis/mcpOAuth.ts
function callbackLandingPath(params) {
  const url = new URL(params.returnTo, params.c.req.url);
  url.searchParams.set("isSuccess", String(params.isSuccess));
  if (params.reason) {
    url.searchParams.set("reason", params.reason);
  }
  return `${url.pathname}${url.search}`;
}
function callbackSuccess(params) {
  const returnTo = params.pending.returnTo;
  if (returnTo) {
    return params.c.redirect(callbackLandingPath({ c: params.c, returnTo, isSuccess: true }), 302);
  }
  return params.c.json({ success: true }, 200);
}
function callbackFailure(params) {
  const returnTo = params.pending?.returnTo;
  if (returnTo) {
    return params.c.redirect(
      callbackLandingPath({ c: params.c, returnTo, isSuccess: false, reason: params.message }),
      302
    );
  }
  return params.c.json({ error: { message: params.message } }, params.jsonStatus ?? 400);
}
function createMcpOAuthRouter(deps) {
  const callbackHandler = async (c) => {
    const { state, code, error, error_description: errorDescription } = c.req.valid("query");
    const pending = await deps.tokenStore.consumePendingAuthorization({ state });
    if (!pending) {
      deps.logger.warn("MCP OAuth callback has no pending authorization", { state, error, errorDescription });
      return callbackFailure({ c, pending, message: "Unknown or expired OAuth state" });
    }
    if (error) {
      deps.logger.warn("MCP OAuth callback returned an error", { state, error, errorDescription });
      return callbackFailure({ c, pending, message: error });
    }
    if (!code) {
      return callbackFailure({ c, pending, message: "OAuth callback is missing both `code` and `error`" });
    }
    try {
      await completeMcpAuthorization({
        tokenStore: deps.tokenStore,
        mcpServerStore: deps.mcpServerStore,
        pending,
        code
      });
    } catch (err) {
      if (err instanceof McpConnectionError3) {
        deps.logger.warn("MCP OAuth callback token exchange failed", extractErrorLogFields4(err));
        return callbackFailure({ c, pending, message: err.message });
      }
      deps.logger.error("MCP OAuth callback unexpected failure", extractErrorLogFields4(err));
      return callbackFailure({ c, pending, message: "Internal server error", jsonStatus: 500 });
    }
    return callbackSuccess({ c, pending });
  };
  const router = new OpenAPIHono6();
  router.openapi(mcpOAuthCallbackRoute, callbackHandler);
  return router;
}

// src/apis/mcpServers.ts
import { OpenAPIHono as OpenAPIHono7 } from "@hono/zod-openapi";
import { extractErrorLogFields as extractErrorLogFields5, isAuthRequired, McpConnectionError as McpConnectionError4, RemoteMCP } from "@truefoundry/trueforge-core/core";
init_config();
init_mcpServerStore();

// src/routes/mcpServerRoutes.ts
import { createRoute as createRoute7, z as z23 } from "@hono/zod-openapi";
var listAvailableMcpServersRoute = createRoute7({
  method: "get",
  path: "/",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "List MCP servers for chat",
  description: "MCP servers as a slim name/url list for the composer. No auth or auth_status.",
  "x-fern-sdk-group-name": ["mcpServers"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: ListAvailableMcpServersResponseSchema } },
      description: "All MCP servers (chat projection)."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    }
  }
});
var listMcpServersRoute = createRoute7({
  method: "get",
  path: "/",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "List MCP servers",
  description: "All MCP servers with nested auth_status (settings / admin projection). Header auth values are redacted.",
  "x-fern-sdk-group-name": ["settings", "mcpServers"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: ListMcpServersResponseSchema } },
      description: "All MCP servers"
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the caller is authenticated but not an admin."
    }
  }
});
var McpServerNameParamsSchema = z23.object({
  name: z23.string().min(1).describe("MCP server name.")
});
var getMcpServerRoute = createRoute7({
  method: "get",
  path: "/{name}",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "Get a single MCP server by name",
  description: "A single MCP server by name, with nested auth_status (settings / admin projection). Header auth values are redacted.",
  "x-fern-sdk-group-name": ["settings", "mcpServers"],
  "x-fern-sdk-method-name": "get",
  request: {
    params: McpServerNameParamsSchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetMcpServerResponseSchema } },
      description: "The MCP server"
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "MCP server not found."
    }
  }
});
var createMcpServerRoute = createRoute7({
  method: "post",
  path: "/",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "Create an MCP server",
  description: "Creates an MCP server by `name`. Fails if `name` is already taken. Runs DCR registration when `auth.type` is `dcr`. Header secrets: real value required; redacted with no stored value returns 400.",
  "x-fern-sdk-group-name": ["settings", "mcpServers"],
  "x-fern-sdk-method-name": "create",
  request: {
    body: {
      content: { "application/json": { schema: CreateMcpServerRequestSchema } },
      required: true
    }
  },
  responses: {
    201: {
      content: { "application/json": { schema: GetMcpServerResponseSchema } },
      description: "The created MCP server with auth_status"
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body, or redacted header secret with no stored value to keep."
    },
    409: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "An MCP server with this name already exists."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "The server cannot satisfy `auth.type: dcr` (e.g. it advertises no registration_endpoint)."
    }
  }
});
var putMcpServerRoute = createRoute7({
  method: "put",
  path: "/",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "Create or replace an MCP server",
  description: "Create or replace by `name`. Does not start DCR or change oauth client columns. Header secrets: real value sets/rotates; redacted keeps existing (400 if none).",
  "x-fern-sdk-group-name": ["settings", "mcpServers"],
  "x-fern-sdk-method-name": "create_or_update",
  request: {
    body: {
      content: { "application/json": { schema: UpdateMcpServerRequestSchema } },
      required: true
    }
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetMcpServerResponseSchema } },
      description: "The saved MCP server with auth_status"
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body, or redacted header secret with no stored value to keep."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "The server cannot satisfy `auth.type: dcr` (e.g. it advertises no registration_endpoint)."
    }
  }
});
var ListMcpServerToolsResponseSchema = z23.object({
  // TODO: Type tools/list entries to the MCP tool shape (name, description, inputSchema, …) for OpenAPI quality.
  data: z23.array(z23.record(z23.string(), z23.unknown())).describe("MCP `tools/list` entries, passed through verbatim from the MCP server.")
}).openapi("ListMCPServerToolsResponse");
var listMcpServerToolsRoute = createRoute7({
  method: "get",
  path: "/{name}/tools",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "List tools of an MCP server",
  "x-fern-sdk-group-name": ["mcpServers"],
  "x-fern-sdk-method-name": "list_tools",
  description: "All tools exposed by the given MCP server (non-paginated), as returned by the MCP `tools/list` call.",
  request: {
    params: McpServerNameParamsSchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: ListMcpServerToolsResponseSchema } },
      description: "All tools of the MCP server."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "MCP server not found."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "The MCP server requires authentication (does not trigger browser OIDC login)."
    },
    502: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "The MCP server could not be reached or returned an error."
    }
  }
});
var McpAuthorizeQuerySchema = z23.object({
  return_to: z23.string().optional().describe(
    "Optional path to return to after OAuth. Must be a same-origin relative path; the OAuth callback redirects here with `isSuccess`/`reason` appended."
  )
});
var authorizeMcpServerRoute = createRoute7({
  method: "get",
  path: "/{name}/authorize",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "Start (or short-circuit) the auth flow for an MCP server",
  "x-fern-sdk-group-name": ["mcpServers"],
  "x-fern-sdk-method-name": "authorize",
  description: "For servers without auth returns not_required, and for header credentials returns authenticated (no browser flow). For auth.type dcr, returns authenticated when a usable (or refreshable) token exists; otherwise runs DCR if needed and returns auth_required with an authorization URL. Optional return_to is where the OAuth callback then redirects the browser; without it the callback returns JSON.",
  request: {
    params: McpServerNameParamsSchema,
    query: McpAuthorizeQuerySchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: McpAuthStatusSchema } },
      description: "Either already authenticated, or an authorization URL to redirect to."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid return_to."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "MCP server not found."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "DCR could not be completed for this server (e.g. it lacks a registration_endpoint)."
    },
    424: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "The authorization server failed dynamic client registration or authorization startup."
    },
    500: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Server misconfiguration (e.g. PUBLIC_BASE_URL unset)."
    }
  }
});
var deleteAuthorizationMcpServerRoute = createRoute7({
  method: "delete",
  path: "/{name}/authorize",
  tags: ["MCP Servers" /* MCP_SERVERS */],
  summary: "Disconnect OAuth for an MCP server",
  "x-fern-sdk-group-name": ["mcpServers"],
  "x-fern-sdk-method-name": "delete_authorization",
  description: "For auth.type dcr, deletes the stored OAuth token and returns the server with auth_status auth_required, keeping the dynamically registered OAuth client so the next authorize can reuse it. No-op for header or no-auth servers (returns the server unchanged).",
  request: {
    params: McpServerNameParamsSchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetMcpServerResponseSchema } },
      description: "The MCP server after disconnect (auth_required for dcr)."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "MCP server not found."
    }
  }
});

// src/utils/secretRedaction.ts
var SECRET_REDACTION = "***REDACTED***";
var MIN_LENGTH_FOR_PREFIX_SUFFIX = 10;
function toRedactedSecretValue(secret) {
  if (secret.length < MIN_LENGTH_FOR_PREFIX_SUFFIX) {
    return SECRET_REDACTION;
  }
  return `${secret.slice(0, 3)}-${SECRET_REDACTION}-${secret.slice(-3)}`;
}
function isRedactedSecretValue(value) {
  return value.includes(SECRET_REDACTION);
}
var MissingStoredSecretError = class extends Error {
  constructor() {
    super("Missing stored secret");
    this.name = "MissingStoredSecretError";
  }
};
function resolveStoredSecretValue({
  incoming,
  existing
}) {
  if (!isRedactedSecretValue(incoming)) {
    return incoming;
  }
  if (existing) {
    return existing;
  }
  throw new MissingStoredSecretError();
}

// src/apis/mcpServers.ts
function omitUndefinedEntries(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== void 0) {
      out[key] = value;
    }
  }
  return out;
}
function redactMcpServerManifest(manifest) {
  if (manifest.auth?.type !== "header") {
    return manifest;
  }
  const headers = {};
  for (const [name, value] of Object.entries(manifest.auth.headers)) {
    headers[name] = toRedactedSecretValue(value);
  }
  return {
    ...manifest,
    auth: { type: "header", headers }
  };
}
function resolveMcpServerManifestForWrite({
  incoming,
  existing
}) {
  if (incoming.auth?.type !== "header") {
    return incoming;
  }
  const existingHeaders = existing?.auth?.type === "header" ? existing.auth.headers : void 0;
  const headers = {};
  for (const [name, value] of Object.entries(incoming.auth.headers)) {
    headers[name] = resolveStoredSecretValue({
      incoming: value,
      existing: existingHeaders?.[name]
    });
  }
  return {
    ...incoming,
    auth: { type: "header", headers }
  };
}
function toConfiguredMcpServer({
  record,
  token
}) {
  return {
    name: record.name,
    manifest: redactMcpServerManifest(record.manifest),
    auth_status: resolveMcpAuthStatus({
      manifest: record.manifest,
      ...token !== void 0 ? { token } : {}
    })
  };
}
function toAvailableMcpServer({
  record,
  token
}) {
  const authType = record.manifest.auth?.type;
  return {
    name: record.name,
    url: record.manifest.url,
    ...authType !== void 0 ? { auth: { type: authType } } : {},
    auth_status: resolveMcpAuthStatus({
      manifest: record.manifest,
      ...token !== void 0 ? { token } : {}
    })
  };
}
function createSettingsMcpServersRouter(deps) {
  const listHandler = async (c) => {
    const userRef = deps.resolveUserContext(c).userRef;
    const records = await deps.mcpServerStore.listServers({ tenant_id: TENANT_ID, names: void 0 });
    const dcrIds = records.filter((record) => record.manifest.auth?.type === "dcr").map((record) => record.id);
    const tokens = await deps.tokenStore.getTokens({ ids: dcrIds, userRef });
    return c.json(
      { data: records.map((record) => toConfiguredMcpServer({ record, token: tokens.get(record.id) })) },
      200
    );
  };
  const getHandler = async (c) => {
    const { name } = c.req.valid("param");
    const userRef = deps.resolveUserContext(c).userRef;
    const record = await deps.mcpServerStore.getServer({ tenant_id: TENANT_ID, name });
    if (!record) {
      return c.json({ error: { message: `MCP server not found: ${name}` } }, 404);
    }
    let token;
    if (record.manifest.auth?.type === "dcr") {
      token = await deps.tokenStore.getToken({ id: record.id, userRef });
    }
    return c.json({ data: toConfiguredMcpServer({ record, token }) }, 200);
  };
  const createHandler = async (c) => {
    const body = c.req.valid("json");
    const incomingManifest = body.manifest;
    let dcrClientToSave;
    if (incomingManifest.auth?.type === "dcr") {
      try {
        dcrClientToSave = await createMcpOAuthClient({
          mcpServerUrl: incomingManifest.url,
          mcpServerName: incomingManifest.name,
          redirectUri: mcpOAuthCallbackUrl(),
          clientName: config_default.MCP_DCR_OAUTH_CLIENT_NAME
        });
      } catch (error) {
        deps.logger.error(
          `DCR client registration failed for "${incomingManifest.name}"; rejecting create`,
          extractErrorLogFields5(error)
        );
        const message = error instanceof Error ? error.message : "Failed to register OAuth client for this MCP server";
        return c.json({ error: { message } }, 422);
      }
    }
    let manifest;
    try {
      manifest = resolveMcpServerManifestForWrite({
        incoming: incomingManifest,
        existing: void 0
      });
    } catch (error) {
      if (error instanceof MissingStoredSecretError) {
        return c.json({ error: { message: "Header secret is required" } }, 400);
      }
      throw error;
    }
    try {
      const record = await deps.withTransaction(async (transaction) => {
        const saved = await deps.mcpServerStore.createServer(
          {
            tenant_id: TENANT_ID,
            name: manifest.name,
            manifest
          },
          transaction
        );
        if (dcrClientToSave !== void 0) {
          await deps.mcpServerStore.saveClient({ id: saved.id, record: dcrClientToSave }, transaction);
        }
        return saved;
      });
      return c.json({ data: toConfiguredMcpServer({ record, token: void 0 }) }, 201);
    } catch (error) {
      if (error instanceof McpServerNameConflictError) {
        return c.json({ error: { message: error.message } }, 409);
      }
      throw error;
    }
  };
  const putHandler = async (c) => {
    const userRef = deps.resolveUserContext(c).userRef;
    const body = c.req.valid("json");
    const incomingManifest = body.manifest;
    try {
      const record = await deps.withTransaction(async (transaction) => {
        const existing = await deps.mcpServerStore.getServerForUpdate(
          { tenant_id: TENANT_ID, name: incomingManifest.name },
          transaction
        );
        const manifest = resolveMcpServerManifestForWrite({
          incoming: incomingManifest,
          existing: existing?.manifest
        });
        let dcrClientToSave;
        const urlChanged = existing !== void 0 && existing.manifest.url !== manifest.url && manifest.auth?.type === "dcr";
        if (manifest.auth?.type === "dcr") {
          const existingClient = existing ? await deps.mcpServerStore.getClient({ id: existing.id }, transaction) : void 0;
          const needsDcr = existingClient === void 0 || urlChanged;
          if (needsDcr) {
            dcrClientToSave = await createMcpOAuthClient({
              mcpServerUrl: manifest.url,
              mcpServerName: manifest.name,
              redirectUri: mcpOAuthCallbackUrl(),
              clientName: config_default.MCP_DCR_OAUTH_CLIENT_NAME
            });
          }
        }
        const saved = await deps.mcpServerStore.upsertServer(
          {
            tenant_id: TENANT_ID,
            name: manifest.name,
            manifest
          },
          transaction
        );
        if (dcrClientToSave !== void 0) {
          await deps.mcpServerStore.saveClient({ id: saved.id, record: dcrClientToSave }, transaction);
        }
        if (urlChanged) {
          await deps.tokenStore.deleteTokensForServer({ id: saved.id }, transaction);
          await deps.tokenStore.deletePendingAuthorizationsForServer({ id: saved.id }, transaction);
        }
        return saved;
      });
      const token = record.manifest.auth?.type === "dcr" ? await deps.tokenStore.getToken({ id: record.id, userRef }) : void 0;
      return c.json({ data: toConfiguredMcpServer({ record, token }) }, 200);
    } catch (error) {
      if (error instanceof MissingStoredSecretError) {
        return c.json({ error: { message: "Header secret is required" } }, 400);
      }
      if (error instanceof McpConnectionError4) {
        deps.logger.error(
          `DCR client registration failed for "${incomingManifest.name}"; rejecting upsert`,
          extractErrorLogFields5(error)
        );
        return c.json({ error: { message: error.message } }, 422);
      }
      throw error;
    }
  };
  const router = new OpenAPIHono7();
  router.openapi(listMcpServersRoute, listHandler);
  router.openapi(createMcpServerRoute, createHandler);
  router.openapi(putMcpServerRoute, putHandler);
  router.openapi(getMcpServerRoute, getHandler);
  return router;
}
function createMcpServersRouter(deps) {
  const authorizeHandler = async (c) => {
    const { name } = c.req.valid("param");
    const { return_to: returnTo } = c.req.valid("query");
    const userRef = deps.resolveUserContext(c).userRef;
    const record = await deps.mcpServerStore.getServer({ tenant_id: TENANT_ID, name });
    if (!record) {
      return c.json({ error: { message: `MCP server not found: ${name}` } }, 404);
    }
    if (record.manifest.auth?.type !== "dcr") {
      return c.json(resolveMcpAuthStatus({ manifest: record.manifest }), 200);
    }
    if (returnTo && safeReturnTo(returnTo) !== returnTo) {
      return c.json({ error: { message: "Invalid return_to: must be a same-origin relative path" } }, 400);
    }
    try {
      const result = await resolveMcpAuth({
        tokenStore: deps.tokenStore,
        mcpServerStore: deps.mcpServerStore,
        serverId: record.id,
        userRef,
        mcpServerUrl: record.manifest.url,
        mcpServerName: record.name,
        clientName: config_default.MCP_DCR_OAUTH_CLIENT_NAME,
        ...returnTo !== void 0 ? { returnTo } : {}
      });
      const authStatus = isMcpAuthRequired(result) ? { status: "auth_required", authorization_url: result.authUrl.href } : { status: "authenticated" };
      return c.json(authStatus, 200);
    } catch (error) {
      if (error instanceof McpConnectionError4) {
        deps.logger.warn(`MCP authorize failed for "${name}"`, extractErrorLogFields5(error));
        if (error.statusCode === 400) {
          return c.json({ error: { message: error.message } }, 400);
        }
        if (error.statusCode === 422) {
          return c.json({ error: { message: error.message } }, 422);
        }
        if (error.statusCode === 424) {
          return c.json({ error: { message: error.message } }, 424);
        }
        return c.json({ error: { message: error.message } }, 500);
      }
      deps.logger.error(`MCP authorize unexpected failure for "${name}"`, extractErrorLogFields5(error));
      return c.json({ error: { message: "Internal server error" } }, 500);
    }
  };
  const listToolsHandler = async (c) => {
    const { name } = c.req.valid("param");
    const userRef = deps.resolveUserContext(c).userRef;
    const connection = await getMcpConnection({
      tenant_id: TENANT_ID,
      name,
      store: deps.mcpServerStore,
      tokenStore: deps.tokenStore,
      clientName: config_default.MCP_DCR_OAUTH_CLIENT_NAME,
      userRef
    });
    if (connection === void 0) {
      return c.json({ error: { message: `MCP server not found: ${name}` } }, 404);
    }
    const remote = new RemoteMCP({
      id: name,
      name,
      url: connection.url,
      headers: connection.headers,
      requestTimeoutMs: config_default.MCP_REQUEST_TIMEOUT_MS,
      connectTimeoutMs: config_default.MCP_CONNECT_TIMEOUT_MS,
      logger: deps.logger,
      signal: c.req.raw.signal
    });
    try {
      const response = await remote.listTools();
      if (isAuthRequired(response)) {
        return c.json({ error: { message: `MCP server "${name}" requires authentication` } }, 422);
      }
      const data = response.result.tools.map((tool) => omitUndefinedEntries({ ...tool }));
      return c.json({ data }, 200);
    } catch (error) {
      if (error instanceof McpConnectionError4) {
        deps.logger.warn(`MCP tools/list failed for "${name}"`, extractErrorLogFields5(error));
        if (error.statusCode === 401) {
          return c.json({ error: { message: error.message } }, 422);
        }
        return c.json({ error: { message: error.message } }, 502);
      }
      throw error;
    }
  };
  const deleteAuthorizationHandler = async (c) => {
    const { name } = c.req.valid("param");
    const userRef = deps.resolveUserContext(c).userRef;
    const record = await deps.mcpServerStore.getServer({ tenant_id: TENANT_ID, name });
    if (!record) {
      return c.json({ error: { message: `MCP server not found: ${name}` } }, 404);
    }
    if (record.manifest.auth?.type === "dcr") {
      await deps.tokenStore.deleteToken({ id: record.id, userRef });
    }
    return c.json({ data: toConfiguredMcpServer({ record, token: void 0 }) }, 200);
  };
  const router = new OpenAPIHono7();
  router.openapi(listAvailableMcpServersRoute, async (c) => {
    const userRef = deps.resolveUserContext(c).userRef;
    const records = await deps.mcpServerStore.listServers({ tenant_id: TENANT_ID, names: void 0 });
    const dcrIds = records.filter((record) => record.manifest.auth?.type === "dcr").map((record) => record.id);
    const tokens = await deps.tokenStore.getTokens({ ids: dcrIds, userRef });
    return c.json(
      {
        data: records.map((record) => toAvailableMcpServer({ record, token: tokens.get(record.id) }))
      },
      200
    );
  });
  router.openapi(listMcpServerToolsRoute, listToolsHandler);
  router.openapi(authorizeMcpServerRoute, authorizeHandler);
  router.openapi(deleteAuthorizationMcpServerRoute, deleteAuthorizationHandler);
  return router;
}

// src/apis/models.ts
import { OpenAPIHono as OpenAPIHono8 } from "@hono/zod-openapi";

// src/routes/modelRoutes.ts
import { createRoute as createRoute8 } from "@hono/zod-openapi";
var listAvailableModelsRoute = createRoute8({
  method: "get",
  path: "/",
  tags: ["Models" /* MODELS */],
  summary: "List models for chat",
  "x-fern-sdk-group-name": ["models"],
  "x-fern-sdk-method-name": "list",
  description: "Configured models as a slim FQN list for the composer.",
  responses: {
    200: {
      content: { "application/json": { schema: ListAvailableModelsResponseSchema } },
      description: "All configured models (chat projection)."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    }
  }
});

// src/apis/models.ts
function createModelsRouter(deps) {
  const router = new OpenAPIHono8();
  router.openapi(
    listAvailableModelsRoute,
    async (c) => c.json({ data: await deps.modelProviderStore.listModels(TENANT_ID) }, 200)
  );
  return router;
}

// src/apis/settings.ts
import { OpenAPIHono as OpenAPIHono12 } from "@hono/zod-openapi";

// src/apis/modelProviders.ts
init_modelProviderStore();
import { OpenAPIHono as OpenAPIHono9 } from "@hono/zod-openapi";

// src/routes/modelProviderRoutes.ts
import { createRoute as createRoute9 } from "@hono/zod-openapi";
var listModelProvidersRoute = createRoute9({
  method: "get",
  path: "/",
  tags: ["Models" /* MODELS */],
  summary: "List configured model providers",
  description: "All configured providers with nested manifests.",
  "x-fern-sdk-group-name": ["settings", "modelProviders"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: ListModelProvidersResponseSchema } },
      description: "All configured model providers"
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the caller is authenticated but not an admin."
    }
  }
});
var createModelProviderRoute = createRoute9({
  method: "post",
  path: "/",
  tags: ["Models" /* MODELS */],
  summary: "Create a model provider",
  description: "Creates a provider (models included). Fails if `name` is already taken. Well-known types use `type` as `name` (one each); `custom` is named by the caller. `auth.api_key`: real value required; redacted with no stored secret returns 400.",
  "x-fern-sdk-group-name": ["settings", "modelProviders"],
  "x-fern-sdk-method-name": "create",
  request: {
    body: {
      content: { "application/json": { schema: CreateModelProviderRequestSchema } },
      required: true
    }
  },
  responses: {
    201: {
      content: { "application/json": { schema: GetModelProviderResponseSchema } },
      description: "The created provider"
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body, or redacted API key with no stored secret to keep."
    },
    409: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "A model provider with this name already exists."
    }
  }
});
var putModelProviderRoute = createRoute9({
  method: "put",
  path: "/",
  tags: ["Models" /* MODELS */],
  summary: "Create or replace a model provider",
  description: "Create or replace a provider (models included). Well-known types use `type` as `name` (one each); `custom` is named by the caller. `auth.api_key`: real value sets/rotates; redacted keeps existing (400 if none).",
  "x-fern-sdk-group-name": ["settings", "modelProviders"],
  "x-fern-sdk-method-name": "create_or_update",
  request: {
    body: {
      content: { "application/json": { schema: UpdateModelProviderRequestSchema } },
      required: true
    }
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetModelProviderResponseSchema } },
      description: "The saved provider"
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body, or redacted API key with no stored secret to keep."
    }
  }
});

// src/apis/modelProviders.ts
function redactModelProvider(manifest) {
  if (manifest.auth === void 0) {
    return manifest;
  }
  return {
    ...manifest,
    auth: { api_key: toRedactedSecretValue(manifest.auth.api_key) }
  };
}
function resolveModelProviderManifestForWrite({
  incoming,
  existing
}) {
  if (incoming.auth === void 0) {
    return incoming;
  }
  return {
    ...incoming,
    auth: {
      api_key: resolveStoredSecretValue({
        incoming: incoming.auth.api_key,
        existing: existing?.auth?.api_key
      })
    }
  };
}
function toWireProvider(record) {
  return {
    name: record.name,
    manifest: redactModelProvider(record.manifest)
  };
}
function createModelProvidersRouter(deps) {
  const listHandler = async (c) => {
    const records = await deps.modelProviderStore.listProviders(TENANT_ID);
    return c.json({ data: records.map(toWireProvider) }, 200);
  };
  const createHandler = async (c) => {
    const body = c.req.valid("json");
    const provider = body.manifest;
    const name = modelProviderName(provider);
    try {
      const manifest = resolveModelProviderManifestForWrite({ incoming: provider, existing: void 0 });
      const record = await deps.modelProviderStore.createProvider({ tenant_id: TENANT_ID, name, manifest });
      return c.json({ data: toWireProvider(record) }, 201);
    } catch (error) {
      if (error instanceof MissingStoredSecretError) {
        return c.json({ error: { message: "API key is required" } }, 400);
      }
      if (error instanceof ModelProviderNameConflictError) {
        return c.json({ error: { message: error.message } }, 409);
      }
      throw error;
    }
  };
  const putHandler = async (c) => {
    const body = c.req.valid("json");
    const provider = body.manifest;
    const name = modelProviderName(provider);
    try {
      const record = await deps.withTransaction(async (transaction) => {
        const existing = await deps.modelProviderStore.getProviderForUpdate(
          { tenant_id: TENANT_ID, name },
          transaction
        );
        const manifest = resolveModelProviderManifestForWrite({
          incoming: provider,
          existing: existing?.manifest
        });
        return deps.modelProviderStore.upsertProvider({ tenant_id: TENANT_ID, name, manifest }, transaction);
      });
      return c.json({ data: toWireProvider(record) }, 200);
    } catch (error) {
      if (error instanceof MissingStoredSecretError) {
        return c.json({ error: { message: "API key is required" } }, 400);
      }
      throw error;
    }
  };
  const router = new OpenAPIHono9();
  router.openapi(listModelProvidersRoute, listHandler);
  router.openapi(createModelProviderRoute, createHandler);
  router.openapi(putModelProviderRoute, putHandler);
  return router;
}

// src/apis/sandboxProviders.ts
import { OpenAPIHono as OpenAPIHono10 } from "@hono/zod-openapi";
import { withTimeout } from "@truefoundry/trueforge-core/core";

// src/routes/sandboxProviderRoutes.ts
import { createRoute as createRoute10 } from "@hono/zod-openapi";
var getSandboxProviderRoute = createRoute10({
  method: "get",
  path: "/",
  tags: ["Sandboxes" /* SANDBOXES */],
  summary: "Get the configured sandbox provider",
  description: "The single configured sandbox provider for this tenant. `auth.api_key` is redacted.",
  "x-fern-sdk-group-name": ["settings", "sandboxProviders"],
  "x-fern-sdk-method-name": "get",
  responses: {
    200: {
      content: { "application/json": { schema: GetSandboxProviderResponseSchema } },
      description: "The configured sandbox provider."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "No sandbox provider configured."
    }
  }
});
var putSandboxProviderRoute = createRoute10({
  method: "put",
  path: "/",
  tags: ["Sandboxes" /* SANDBOXES */],
  summary: "Create or replace the sandbox provider",
  description: "Upserts the single sandbox provider for this tenant: creates it or replaces its entire configuration. `auth.api_key`: real value sets/rotates; redacted keeps existing (400 if none).",
  "x-fern-sdk-group-name": ["settings", "sandboxProviders"],
  "x-fern-sdk-method-name": "create_or_update",
  request: {
    body: {
      content: { "application/json": { schema: UpdateSandboxProviderRequestSchema } },
      required: true
    }
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetSandboxProviderResponseSchema } },
      description: "The saved sandbox provider."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body, or redacted API key with no stored secret to keep."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Daytona rejected the provided API key."
    }
  }
});

// src/apis/sandboxProviders.ts
var BUILD_REQUEST_TIMEOUT_MS = 3e3;
function redactSandboxProvider(manifest) {
  return {
    ...manifest,
    auth: { api_key: toRedactedSecretValue(manifest.auth.api_key) }
  };
}
function createSandboxProvidersRouter(deps) {
  const getHandler = async (c) => {
    const record = await deps.sandboxProviderStore.getSandboxProvider(TENANT_ID);
    if (record === void 0) {
      return c.json({ error: { message: "No sandbox provider configured" } }, 404);
    }
    const status = await checkSnapshotStatus({
      store: deps.sandboxProviderStore,
      tenant_id: TENANT_ID,
      logger: deps.logger
    });
    return c.json(
      {
        data: {
          manifest: redactSandboxProvider(record.manifest),
          status: status?.status ?? record.status,
          status_reason: status?.status_reason ?? record.status_reason
        }
      },
      200
    );
  };
  const putHandler = async (c) => {
    const body = c.req.valid("json");
    const incoming = body.manifest;
    const resolveManifest = (existing) => ({
      ...incoming,
      auth: {
        api_key: resolveStoredSecretValue({
          incoming: incoming.auth.api_key,
          existing: existing?.manifest.auth.api_key
        })
      }
    });
    try {
      const { manifest, status } = await deps.withTransaction(async (transaction) => {
        const locked = await deps.sandboxProviderStore.getSandboxProviderForUpdate(TENANT_ID, transaction);
        const resolved = resolveManifest(locked);
        const provider = toDaytonaSandboxProvider({
          manifest: resolved,
          tenant_id: TENANT_ID,
          logger: deps.logger,
          ...locked ? { build_metadata: locked.build_metadata } : {}
        });
        const built = toSandboxStatus(
          await withTimeout(provider.buildImage(), BUILD_REQUEST_TIMEOUT_MS, "sandbox buildImage")
        );
        await deps.sandboxProviderStore.upsertSandboxProvider(
          { tenant_id: TENANT_ID, manifest: resolved, ...built },
          transaction
        );
        return { manifest: resolved, status: built };
      });
      return c.json(
        {
          data: {
            manifest: redactSandboxProvider(manifest),
            status: status.status,
            status_reason: status.status_reason
          }
        },
        200
      );
    } catch (error) {
      if (error instanceof MissingStoredSecretError) {
        return c.json({ error: { message: "API key is required" } }, 400);
      }
      if (isDaytonaAuthError(error)) {
        return c.json({ error: { message: "Daytona rejected the API key \u2014 check the credentials" } }, 422);
      }
      throw error;
    }
  };
  const router = new OpenAPIHono10();
  router.openapi(getSandboxProviderRoute, getHandler);
  router.openapi(putSandboxProviderRoute, putHandler);
  return router;
}

// src/apis/skills.ts
init_skillStore();
import { OpenAPIHono as OpenAPIHono11 } from "@hono/zod-openapi";

// src/routes/skillRoutes.ts
import { createRoute as createRoute11 } from "@hono/zod-openapi";
var listAvailableSkillsRoute = createRoute11({
  method: "get",
  path: "/",
  tags: ["Skills" /* SKILLS */],
  summary: "List skills for chat",
  description: "Configured skills as a slim name/description list for the composer.",
  "x-fern-sdk-group-name": ["skills"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: ListAvailableSkillsResponseSchema } },
      description: "All configured skills (chat projection)."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    }
  }
});
var listConfiguredSkillsRoute = createRoute11({
  method: "get",
  path: "/",
  tags: ["Skills" /* SKILLS */],
  summary: "List configured skills",
  description: "All configured skills with nested manifests (settings / admin projection).",
  "x-fern-sdk-group-name": ["settings", "skills"],
  "x-fern-sdk-method-name": "list",
  responses: {
    200: {
      content: { "application/json": { schema: ListSkillsResponseSchema } },
      description: "All configured skills."
    },
    401: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the request has no valid session cookie."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "OIDC is configured and the caller is authenticated but not an admin."
    }
  }
});
var createSkillRoute = createRoute11({
  method: "post",
  path: "/",
  tags: ["Skills" /* SKILLS */],
  summary: "Create a skill",
  description: "Creates a skill keyed by `name`. Fails if `name` is already taken.",
  "x-fern-sdk-group-name": ["settings", "skills"],
  "x-fern-sdk-method-name": "create",
  request: {
    body: {
      content: { "application/json": { schema: CreateSkillRequestSchema } },
      required: true
    }
  },
  responses: {
    201: {
      content: { "application/json": { schema: GetSkillResponseSchema } },
      description: "The created skill."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body."
    },
    409: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "A skill with this name already exists."
    }
  }
});
var putSkillRoute = createRoute11({
  method: "put",
  path: "/",
  tags: ["Skills" /* SKILLS */],
  summary: "Create or replace a skill",
  description: "Full upsert keyed by `name`: creates the skill or replaces its entire manifest.",
  "x-fern-sdk-group-name": ["settings", "skills"],
  "x-fern-sdk-method-name": "create_or_update",
  request: {
    body: {
      content: { "application/json": { schema: UpdateSkillRequestSchema } },
      required: true
    }
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetSkillResponseSchema } },
      description: "The saved skill."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body."
    }
  }
});

// src/apis/skills.ts
function toConfiguredSkill(record) {
  return {
    name: record.name,
    manifest: record.manifest
  };
}
function createSkillsRouter(deps) {
  const listConfiguredHandler = async (c) => {
    const records = await deps.skillStore.listSkills({ tenant_id: TENANT_ID, names: void 0 });
    return c.json({ data: records.map(toConfiguredSkill) }, 200);
  };
  const createHandler = async (c) => {
    const body = c.req.valid("json");
    const manifest = body.manifest;
    try {
      const record = await deps.skillStore.createSkill({
        tenant_id: TENANT_ID,
        name: manifest.name,
        manifest
      });
      return c.json({ data: toConfiguredSkill(record) }, 201);
    } catch (error) {
      if (error instanceof SkillNameConflictError) {
        return c.json({ error: { message: error.message } }, 409);
      }
      throw error;
    }
  };
  const putHandler = async (c) => {
    const body = c.req.valid("json");
    const manifest = body.manifest;
    const record = await deps.skillStore.upsertSkill({
      tenant_id: TENANT_ID,
      name: manifest.name,
      manifest
    });
    return c.json({ data: toConfiguredSkill(record) }, 200);
  };
  const router = new OpenAPIHono11();
  router.openapi(listConfiguredSkillsRoute, listConfiguredHandler);
  router.openapi(createSkillRoute, createHandler);
  router.openapi(putSkillRoute, putHandler);
  return router;
}
function createAvailableSkillsRouter(deps) {
  const router = new OpenAPIHono11();
  router.openapi(listAvailableSkillsRoute, async (c) => {
    const records = await deps.skillStore.listSkills({ tenant_id: TENANT_ID, names: void 0 });
    return c.json(
      {
        data: records.map((record) => ({
          name: record.name,
          description: record.manifest.description
        }))
      },
      200
    );
  });
  return router;
}

// src/apis/settings.ts
function createSettingsRouter(deps) {
  const router = new OpenAPIHono12();
  router.route(
    "/model-providers",
    createModelProvidersRouter({
      modelProviderStore: deps.modelProviderStore,
      withTransaction: deps.withTransaction
    })
  );
  router.route(
    "/mcp-servers",
    createSettingsMcpServersRouter({
      mcpServerStore: deps.mcpServerStore,
      tokenStore: deps.tokenStore,
      withTransaction: deps.withTransaction,
      logger: deps.logger,
      resolveUserContext: deps.resolveUserContext
    })
  );
  router.route(
    "/skills",
    createSkillsRouter({
      skillStore: deps.skillStore,
      withTransaction: deps.withTransaction
    })
  );
  router.route(
    "/sandbox-providers",
    createSandboxProvidersRouter({
      sandboxProviderStore: deps.sandboxProviderStore,
      withTransaction: deps.withTransaction,
      logger: deps.logger
    })
  );
  return router;
}

// src/apis/turns.ts
init_config();
import { OpenAPIHono as OpenAPIHono13 } from "@hono/zod-openapi";
import {
  CancellationReason as CancellationReason2,
  EventType as EventType2,
  SessionStoreConflictError as SessionStoreConflictError2,
  SessionStoreNotFoundError as SessionStoreNotFoundError2,
  TurnResourceResolver
} from "@truefoundry/trueforge-core/agent-session";
import {
  AgentHarnessError,
  existingSandboxIdForProvider,
  extractErrorLogFields as extractErrorLogFields6,
  isAgentInputUserMessage,
  isFileContentPart,
  McpConnectionError as McpConnectionError5,
  rawSandboxId,
  SandboxError as SandboxError2,
  VercelAILLM
} from "@truefoundry/trueforge-core/core";
import { HTTPException as HTTPException4 } from "hono/http-exception";
import { streamSSE } from "hono/streaming";

// src/routes/turnRoutes.ts
import { createRoute as createRoute12, z as z24 } from "@hono/zod-openapi";
var TurnIdParamsSchema = SessionIdParamsSchema.extend({
  turn_id: z24.string().min(1).describe("Turn identifier.")
});
var listTurnsRoute = createRoute12({
  method: "get",
  path: "/{session_id}/turns",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "List turns in a session",
  description: "List turns for a session (newest first by default), token-paginated. Only the session creator (`created_by`) may list turns.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "list_turns",
  "x-fern-pagination": TOKEN_PAGINATION,
  request: {
    params: SessionIdParamsSchema,
    query: ListTurnsRequestQuerySchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: ListTurnsResponseSchema } },
      description: "Paginated turns."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid page token."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Session not found."
    }
  }
});
var getTurnRoute = createRoute12({
  method: "get",
  path: "/{session_id}/turns/{turn_id}",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "Get a turn",
  description: "Fetch a single turn by ID. Only the session creator (`created_by`) may fetch it.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "get_turn",
  request: {
    params: TurnIdParamsSchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetTurnResponseSchema } },
      description: "Turn data."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Session or turn not found."
    }
  }
});
var downloadSandboxFileRoute = createRoute12({
  method: "get",
  path: "/{session_id}/turns/{turn_id}/download-sandbox-file",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "Download a file from the turn sandbox",
  description: "Download a file from the sandbox this turn ran in. Paths come from the assistant's `sandbox_artifacts` block. Only the session creator (`created_by`) may download.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "download_sandbox_file",
  request: {
    params: TurnIdParamsSchema,
    query: DownloadSandboxFileRequestQuerySchema
  },
  responses: {
    200: {
      content: { "application/octet-stream": { schema: z24.string().openapi({ format: "binary" }) } },
      description: "File contents."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid path, or the path is a directory."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Session, turn, or file not found."
    },
    410: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Sandbox no longer exists."
    },
    412: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Turn has no sandbox, or no sandbox provider is configured."
    },
    413: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "File exceeds the maximum download size."
    },
    424: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Sandbox infrastructure error."
    }
  }
});
var listTurnEventsRoute = createRoute12({
  method: "get",
  path: "/{session_id}/turns/{turn_id}/events",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "List turn events",
  description: "Paginated persisted events for a turn (insertion order by default). Only the session creator (`created_by`) may list events.",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "list_turn_events",
  "x-fern-pagination": TOKEN_PAGINATION,
  request: {
    params: TurnIdParamsSchema,
    query: ListTurnEventsRequestQuerySchema
  },
  responses: {
    200: {
      content: { "application/json": { schema: ListTurnEventsResponseSchema } },
      description: "Paginated turn events."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid page token."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Session or turn not found."
    }
  }
});
var createAndExecuteTurnRoute = createRoute12({
  method: "post",
  path: "/{session_id}/turns",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "Create and execute a turn in a session",
  description: `Create a turn within a session and execute it.
Only the session creator (\`created_by\`) may create turns.
When \`stream\` is true (default), respond with a Server-Sent Events stream of turn events.
When \`stream\` is false, return the turn immediately with \`state.status: "running"\` while execution continues in the background; use get turn or subscribe to observe completion.
Use \`previous_turn_id\` to chain to the session's last turn (defaults to \`auto\`); use \`none\` for a new root.`,
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "create_turn",
  "x-fern-streaming": {
    format: "sse",
    resumable: false,
    "stream-condition": "$request.stream",
    response: { $ref: "#/components/schemas/GetTurnResponse" },
    "response-stream": { $ref: "#/components/schemas/TurnStreamingEvent" }
  },
  request: {
    params: SessionIdParamsSchema,
    body: {
      content: { "application/json": { schema: CreateTurnRequestSchema } },
      required: true
    }
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GetTurnResponseSchema
        },
        "text/event-stream": {
          schema: TurnStreamingEventSchema
        }
      },
      description: "When stream is false: the running turn. When stream is true: Server-Sent Events stream of turn events."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid request body."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Session or prior turn not found."
    },
    412: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Requested action cannot be performed on the session because it is no longer usable."
    },
    413: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Request body exceeds the configured maximum size (MAX_REQUEST_BODY_BYTES)."
    },
    422: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "The request is well-formed but cannot be processed: a referenced resource is missing (named agent, model, MCP server, skill, or sandbox provider), sandbox is required but unavailable (e.g. file uploads), or the turn input conflicts with current state (e.g. unresolved tool calls or approvals, tool name collision)."
    }
  }
});
var subscribeTurnRoute = createRoute12({
  method: "get",
  path: "/{session_id}/turns/{turn_id}/subscribe",
  tags: ["Agent Sessions" /* AGENT_SESSIONS */],
  summary: "Subscribe to a running turn",
  description: "Subscribe to the live SSE stream for a turn. Only the session creator (`created_by`) may subscribe. Pass `after_sequence_number` to resume after a disconnect (exclusive \u2014 events after this sequence number are replayed).",
  "x-fern-sdk-group-name": ["sessions"],
  "x-fern-sdk-method-name": "subscribe_to_turn",
  "x-fern-streaming": { format: "sse", resumable: true },
  request: {
    params: TurnIdParamsSchema,
    query: SubscribeTurnQuerySchema
  },
  responses: {
    200: {
      content: {
        "text/event-stream": {
          schema: TurnStreamingEventSchema
        }
      },
      description: "Server-Sent Events stream of turn events (deltas and lifecycle)."
    },
    400: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Invalid query parameters."
    },
    403: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Caller is not the session creator."
    },
    404: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Turn not found."
    },
    412: {
      content: { "application/json": { schema: RequestErrorResponseSchema } },
      description: "Cannot subscribe \u2014 the live stream no longer exists."
    }
  }
});

// src/runtime/event-subscription/inMemory.ts
import { EventEmitter, once } from "events";
var InMemoryEventStreamStore = class {
  streams = /* @__PURE__ */ new Map();
  /** Rings per stream id on append and expiry so parked pollers wake instantly. */
  changes = new EventEmitter();
  constructor() {
    this.changes.setMaxListeners(0);
  }
  append(streamId, event, streamTTLSeconds) {
    const stream = this.getLiveStream(streamId) ?? { events: [] };
    this.streams.set(streamId, stream);
    const sequenceNumber = stream.events.length + 1;
    stream.events.push({ ...structuredClone(event), sequence_number: sequenceNumber });
    if (streamTTLSeconds && streamTTLSeconds > 0) {
      stream.expiresAtMs = Date.now() + streamTTLSeconds * 1e3;
      this.scheduleExpiry(streamId, stream);
    }
    this.changes.emit(streamId);
    return sequenceNumber;
  }
  /** Returns the stream if it exists and has not passed its TTL; drops it lazily otherwise. */
  getLiveStream(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return void 0;
    }
    if (stream.expiresAtMs !== void 0 && stream.expiresAtMs <= Date.now()) {
      this.dropStream(streamId, stream);
      return void 0;
    }
    return stream;
  }
  /**
   * Resolves on the next append/expiry of the stream; rejects when the signal
   * aborts (which also detaches the listener, so abandoned waits do not leak).
   */
  async waitForChange(streamId, signal) {
    await once(this.changes, streamId, { signal });
  }
  /**
   * Evicts a stream: clears its timer, removes it from the map, and wakes any
   * parked pollers so they observe StreamGoneError promptly. Shared by the
   * lazy-expiry path in getLiveStream and the scheduled expiry timer.
   */
  dropStream(streamId, stream) {
    if (stream.expiryTimer) {
      clearTimeout(stream.expiryTimer);
      stream.expiryTimer = void 0;
    }
    if (this.streams.get(streamId) !== stream) {
      return;
    }
    this.streams.delete(streamId);
    this.changes.emit(streamId);
  }
  scheduleExpiry(streamId, stream) {
    if (stream.expiryTimer) {
      clearTimeout(stream.expiryTimer);
    }
    if (stream.expiresAtMs === void 0) {
      return;
    }
    stream.expiryTimer = setTimeout(
      () => {
        this.dropStream(streamId, stream);
      },
      Math.max(0, stream.expiresAtMs - Date.now())
    );
    stream.expiryTimer.unref();
  }
};
var InMemoryEventSubscription = class {
  constructor(store, streamId) {
    this.store = store;
    this.streamId = streamId;
  }
  store;
  streamId;
  put(event, options) {
    return Promise.resolve(this.store.append(this.streamId, event, options?.streamTTLSeconds));
  }
  assertSubscribable() {
    const stream = this.store.getLiveStream(this.streamId);
    if (!stream) {
      throw new StreamGoneError(this.streamId);
    }
    if (stream.expiresAtMs !== void 0 && stream.expiresAtMs - Date.now() < SUBSCRIBE_STREAM_THRESHOLD_MS) {
      throw new StreamGoneError(this.streamId);
    }
    return Promise.resolve();
  }
  async *poll(afterSequenceNumber, options) {
    const signal = options?.signal;
    let cursor = afterSequenceNumber === void 0 || afterSequenceNumber === 0 ? 0 : afterSequenceNumber;
    for (; ; ) {
      if (signal?.aborted) {
        return;
      }
      const live = this.store.getLiveStream(this.streamId);
      if (!live) {
        throw new StreamGoneError(this.streamId);
      }
      const end = live.events.length;
      if (cursor >= end) {
        try {
          await this.store.waitForChange(this.streamId, signal);
        } catch (error) {
          if (signal?.aborted) {
            return;
          }
          throw error;
        }
        continue;
      }
      while (cursor < end) {
        const event = live.events[cursor];
        if (event === void 0) {
          throw new Error(`Corrupt stream ${this.streamId}: missing event at index ${String(cursor)}`);
        }
        cursor += 1;
        yield structuredClone(event);
      }
    }
  }
};

// src/runtime/event-subscription/redis.ts
import { setTimeout as sleep } from "timers/promises";
var SUBSCRIBE_STREAM_POLL_ITEMS_COUNT = 100;
var SUBSCRIBE_STREAM_POLL_SLEEP_INTERVAL_MS = 1e3;
function sequenceNumberFromEntryId(streamId, entryId) {
  const separator = entryId.indexOf("-");
  const raw = separator === -1 ? entryId : entryId.slice(0, separator);
  const sequenceNumber = Number(raw);
  if (!Number.isSafeInteger(sequenceNumber) || sequenceNumber < 0) {
    throw new Error(`Corrupt stream entry ${entryId} on ${streamId}: invalid sequence number`);
  }
  return sequenceNumber;
}
var RedisEventSubscription = class {
  constructor(redis, streamId) {
    this.redis = redis;
    this.streamId = streamId;
  }
  redis;
  streamId;
  nextSequenceNumber = 1;
  async put(event, options) {
    const sequenceNumber = this.nextSequenceNumber;
    this.nextSequenceNumber += 1;
    const sequencedEvent = { ...event, sequence_number: sequenceNumber };
    const multi = this.redis.multi().xAdd(this.streamId, `${String(sequenceNumber)}-1`, {
      data: JSON.stringify(sequencedEvent)
    });
    if (options?.streamTTLSeconds && options.streamTTLSeconds > 0) {
      multi.expire(this.streamId, options.streamTTLSeconds);
    }
    await multi.exec();
    return sequenceNumber;
  }
  async assertSubscribable() {
    const expiresAtMs = await this.redis.pExpireTime(this.streamId);
    if (expiresAtMs === -2) {
      throw new StreamGoneError(this.streamId);
    }
    if (expiresAtMs >= 0 && expiresAtMs - Date.now() < SUBSCRIBE_STREAM_THRESHOLD_MS) {
      throw new StreamGoneError(this.streamId);
    }
  }
  async *poll(afterSequenceNumber, options) {
    const signal = options?.signal;
    let cursor = afterSequenceNumber === void 0 || afterSequenceNumber === 0 ? "1-0" : `${String(afterSequenceNumber + 1)}-0`;
    for (; ; ) {
      if (signal?.aborted) {
        return;
      }
      if (await this.redis.exists(this.streamId) === 0) {
        throw new StreamGoneError(this.streamId);
      }
      const reply = await this.redis.xRead([{ key: this.streamId, id: cursor }], {
        COUNT: SUBSCRIBE_STREAM_POLL_ITEMS_COUNT
      });
      const messages = reply?.[0]?.messages ?? [];
      if (messages.length === 0) {
        try {
          await sleep(SUBSCRIBE_STREAM_POLL_SLEEP_INTERVAL_MS, void 0, { signal });
        } catch (error) {
          if (signal?.aborted) {
            return;
          }
          throw error;
        }
        continue;
      }
      for (const { id, message } of messages) {
        cursor = id;
        const data = message["data"];
        if (data === void 0) {
          throw new Error(`Corrupt stream entry ${id} on ${this.streamId}: missing data field`);
        }
        let event;
        try {
          event = JSON.parse(data);
        } catch (error) {
          throw new Error(`Corrupt stream entry ${id} on ${this.streamId}: data is not valid JSON`, {
            cause: error
          });
        }
        yield { ...event, sequence_number: sequenceNumberFromEntryId(this.streamId, id) };
      }
    }
  }
};

// src/runtime/event-subscription/index.ts
var EventSubscriptionRegistry = class {
  constructor(redis) {
    this.redis = redis;
  }
  redis;
  /** One store for the whole process so producers and subscribers share streams. */
  memoryStore = new InMemoryEventStreamStore();
  get(streamId) {
    if (this.redis) {
      return new RedisEventSubscription(this.redis, streamId);
    }
    return new InMemoryEventSubscription(this.memoryStore, streamId);
  }
};
var SUBSCRIBE_STREAM_THRESHOLD_MS = 60 * 1e3;
var StreamGoneError = class extends Error {
  constructor(streamId) {
    super(`Cannot read from stream, stream does not exist anymore: ${streamId}`);
    this.streamId = streamId;
    this.name = "StreamGoneError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
  streamId;
  code = "STREAM_GONE";
};

// src/runtime/sandboxFilePath.ts
import { SandboxError, validateNoPathTraversal as validateNoPathTraversal3 } from "@truefoundry/trueforge-core/core";
var SandboxInvalidPathError = class extends SandboxError {
  statusCode = 400;
  constructor({ path: path7, reason }) {
    super(`Path ${reason}: ${path7}`);
    this.name = "SandboxInvalidPathError";
  }
};
var MAX_PATH_BYTES = 4095;
var MAX_SEGMENT_BYTES = 255;
function validateSandboxFilePath(path7) {
  if (!path7.startsWith("/")) {
    throw new SandboxInvalidPathError({ path: path7, reason: "must be absolute" });
  }
  if (path7.includes("\0")) {
    throw new SandboxInvalidPathError({ path: path7, reason: "must not contain a NUL byte" });
  }
  if (Buffer.byteLength(path7) > MAX_PATH_BYTES) {
    throw new SandboxInvalidPathError({ path: path7, reason: `must be at most ${String(MAX_PATH_BYTES)} bytes` });
  }
  if (path7.split("/").some((segment) => Buffer.byteLength(segment) > MAX_SEGMENT_BYTES)) {
    throw new SandboxInvalidPathError({
      path: path7,
      reason: `must not have a segment longer than ${String(MAX_SEGMENT_BYTES)} bytes`
    });
  }
  validateNoPathTraversal3(path7);
}

// src/apis/turns.ts
function toWireTurn(record) {
  return {
    id: record.turn_id,
    session_id: record.session_id,
    previous_turn_id: record.previous_turn_id,
    input: record.input,
    state: record.state,
    created_at: record.created_at.toISOString()
  };
}
function toArrayBuffer(content) {
  const buffer = new ArrayBuffer(content.byteLength);
  new Uint8Array(buffer).set(content);
  return buffer;
}
function toContentDisposition(path7) {
  const fileName = path7.split("/").filter(Boolean).pop() ?? "download";
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename*=UTF-8''${encoded}`;
}
function createTurnResolver(deps) {
  const {
    mcpServerStore,
    tokenStore,
    skillStore,
    sandboxProviderStore,
    agentStore,
    modelProviderStore,
    logger,
    signal,
    userRef,
    sessionId
  } = deps;
  return new TurnResourceResolver({
    llm: async (name) => {
      const { providerConfig, defaultModelParams } = await getModelDetails({
        tenant_id: TENANT_ID,
        name,
        store: modelProviderStore
      });
      return {
        modelClient: new VercelAILLM({
          providerConfig,
          logger,
          signal
        }),
        defaultModelParams
      };
    },
    mcp: async (name) => {
      const connection = await getMcpConnection({
        tenant_id: TENANT_ID,
        name,
        store: mcpServerStore,
        tokenStore,
        clientName: config_default.MCP_DCR_OAUTH_CLIENT_NAME,
        userRef
      });
      if (connection === void 0) {
        throw new HTTPException4(422, {
          message: `Unknown MCP server "${name}" \u2014 not configured`
        });
      }
      return connection;
    },
    mcpRequestTimeoutMs: config_default.MCP_REQUEST_TIMEOUT_MS,
    mcpConnectTimeoutMs: config_default.MCP_CONNECT_TIMEOUT_MS,
    sandboxProvider: async ({ spec, existingSandboxId, tracing }) => {
      const provider = await resolveSandboxProvider({
        tenant_id: TENANT_ID,
        store: sandboxProviderStore,
        logger,
        sessionId
      });
      if (provider === void 0) {
        throw new HTTPException4(422, {
          message: "no sandbox provider configured \u2014 PUT /settings/sandbox-providers"
        });
      }
      const carriedSandboxId = existingSandboxIdForProvider({
        existingSandboxId,
        currentProviderType: provider.type
      });
      if (carriedSandboxId === void 0 && provider.type !== "local") {
        const status = await checkSnapshotStatus({ store: sandboxProviderStore, tenant_id: TENANT_ID, logger });
        if (status?.status !== "ready") {
          throw new HTTPException4(422, {
            message: status?.status === "failed" ? `sandbox image build failed (${status.status_reason ?? "unknown error"})` : "sandbox image is activating \u2014 retry shortly"
          });
        }
      }
      const gitSkills = await resolveGitSkills({
        tenant_id: TENANT_ID,
        skills: spec.skills ?? [],
        store: skillStore
      });
      return buildTurnSandbox({
        provider,
        logger,
        gitSkills,
        fileDownloadEnabled: spec.config.sandbox.file_downloads,
        existingSandboxId: carriedSandboxId,
        tracing
      });
    },
    agent: async (agentId) => {
      const record = await agentStore.getAgent({ tenant_id: TENANT_ID, id: agentId });
      if (record === void 0) {
        throw new HTTPException4(422, { message: `Agent not found: ${agentId}` });
      }
      return record.manifest;
    },
    logger
  });
}
var MAX_SESSION_TITLE_LENGTH = 50;
function deriveSessionTitle(input) {
  const firstUserMessage = input?.find(isAgentInputUserMessage);
  if (!firstUserMessage) {
    return void 0;
  }
  const text = typeof firstUserMessage.content === "string" ? firstUserMessage.content : firstUserMessage.content.filter((part) => !isFileContentPart(part)).map((part) => part.text).join(" ");
  const trimmed = text.trim();
  if (!trimmed) {
    return void 0;
  }
  return trimmed.slice(0, MAX_SESSION_TITLE_LENGTH);
}
function turnEventSsePayload(event, sequenceNumber) {
  return {
    id: String(sequenceNumber),
    data: JSON.stringify(event)
  };
}
function streamTTLSecondsFor(event) {
  if (event.type === EventType2.TURN_CREATED) {
    return config_default.TURN_STREAM_TTL_SECONDS;
  }
  if (event.type === EventType2.TURN_DONE) {
    return config_default.TURN_STREAM_POST_COMPLETION_TTL_SECONDS;
  }
  return void 0;
}
function turnStreamId(tenantId, sessionId, turnId) {
  return `agent:turn:${tenantId}:${sessionId}:${turnId}:stream`;
}
async function drainTurnEvents(input) {
  const { trackedStream, turnEventStream, sessionId, turnId, maxExecutionTimer, logger, onEvent } = input;
  try {
    for await (const event of trackedStream) {
      const sequenceNumber = await turnEventStream.put(event, {
        streamTTLSeconds: streamTTLSecondsFor(event)
      });
      await onEvent?.(event, sequenceNumber);
    }
  } catch (error) {
    if (error instanceof SessionStoreNotFoundError2) {
      logger.warn("Turn stream ended after session/turn was removed", {
        sessionId,
        turnId,
        ...extractErrorLogFields6(error)
      });
    } else {
      logger.error("Unexpected error in turn event drain", {
        sessionId,
        turnId,
        ...extractErrorLogFields6(error)
      });
    }
  } finally {
    clearTimeout(maxExecutionTimer);
  }
}
function resolveAfterSequenceNumber(c, bodyAfterSequenceNumber) {
  const lastEventId = c.req.header("last-event-id");
  if (lastEventId) {
    const sequenceNumber = Number(lastEventId);
    if (!Number.isInteger(sequenceNumber) || sequenceNumber < 0) {
      throw new HTTPException4(400, { message: "Invalid Last-Event-Id header" });
    }
    return sequenceNumber;
  }
  return bodyAfterSequenceNumber;
}
function checkTurnAccess(user, createdBy) {
  return createdBy === user.userRef;
}
var FORBIDDEN_SESSION_ACCESS2 = "Only the session creator can access this session";
var FORBIDDEN_CREATE_TURN = "Only the session creator can create turns";
function createTurnsRouter(deps) {
  const listTurnsHandler = async (c) => {
    const { session_id: sessionId } = c.req.valid("param");
    const query = c.req.valid("query");
    const session = await deps.sessions.get({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!session) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    if (!checkTurnAccess(deps.resolveUserContext(c), session.record.created_by)) {
      return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS2 } }, 403);
    }
    try {
      const { data, pagination } = await session.listTurns({
        limit: query.limit,
        page_token: query.page_token
      });
      return c.json({ data: data.map(toWireTurn), pagination }, 200);
    } catch (error) {
      if (error instanceof SessionStoreConflictError2) {
        return c.json({ error: { message: error.message } }, 400);
      }
      throw error;
    }
  };
  const getTurnHandler = async (c) => {
    const { session_id: sessionId, turn_id: turnId } = c.req.valid("param");
    const session = await deps.sessions.get({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!session) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    if (!checkTurnAccess(deps.resolveUserContext(c), session.record.created_by)) {
      return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS2 } }, 403);
    }
    const turn = await session.getTurn(turnId);
    if (!turn) {
      return c.json({ error: { message: `Turn not found: ${turnId}` } }, 404);
    }
    return c.json({ data: toWireTurn(turn.record) }, 200);
  };
  const downloadSandboxFileHandler = async (c) => {
    const { session_id: sessionId, turn_id: turnId } = c.req.valid("param");
    const { path: path7 } = c.req.valid("query");
    let sandboxId;
    try {
      validateSandboxFilePath(path7);
      const session = await deps.sessions.get({ tenant_id: TENANT_ID, session_id: sessionId });
      if (!session) {
        return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
      }
      if (!checkTurnAccess(deps.resolveUserContext(c), session.record.created_by)) {
        return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS2 } }, 403);
      }
      const turn = await session.getTurn(turnId);
      if (!turn) {
        return c.json({ error: { message: `Turn not found: ${turnId}` } }, 404);
      }
      sandboxId = turn.record.snapshot.sandbox_info?.sandbox_id;
      if (sandboxId === void 0) {
        return c.json({ error: { message: `Turn has no sandbox: ${turnId}` } }, 412);
      }
      const provider = await resolveSandboxProvider({
        tenant_id: TENANT_ID,
        store: deps.sandboxProviderStore,
        logger: deps.logger,
        sessionId
      });
      if (provider === void 0) {
        return c.json({ error: { message: "No sandbox provider configured" } }, 412);
      }
      const content = await provider.downloadFile({ sandboxId: rawSandboxId(sandboxId), path: path7 });
      return c.body(toArrayBuffer(content), 200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(content.byteLength),
        "Content-Disposition": toContentDisposition(path7),
        "Cache-Control": "private, no-store"
      });
    } catch (error) {
      if (error instanceof SandboxError2) {
        return c.json({ error: { message: error.message } }, error.statusCode);
      }
      deps.logger.error("Sandbox file download failed", {
        ...extractErrorLogFields6(error),
        sessionId,
        turnId,
        sandboxId,
        path: path7
      });
      return c.json({ error: { message: "Failed to download file from sandbox" } }, 424);
    }
  };
  const listTurnEventsHandler = async (c) => {
    const { session_id: sessionId, turn_id: turnId } = c.req.valid("param");
    const query = c.req.valid("query");
    const session = await deps.sessions.get({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!session) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    if (!checkTurnAccess(deps.resolveUserContext(c), session.record.created_by)) {
      return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS2 } }, 403);
    }
    const turn = await session.getTurn(turnId);
    if (!turn) {
      return c.json({ error: { message: `Turn not found: ${turnId}` } }, 404);
    }
    try {
      const { data, pagination } = await turn.listEvents({
        limit: query.limit,
        page_token: query.page_token,
        order: query.order
      });
      return c.json({ data, pagination }, 200);
    } catch (error) {
      if (error instanceof SessionStoreConflictError2) {
        return c.json({ error: { message: error.message } }, 400);
      }
      throw error;
    }
  };
  const createAndExecuteTurnHandler = async (c) => {
    const { session_id: sessionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const session = await deps.sessions.get({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!session) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    if (!checkTurnAccess(deps.resolveUserContext(c), session.record.created_by)) {
      return c.json({ error: { message: FORBIDDEN_CREATE_TURN } }, 403);
    }
    const abortController = new AbortController();
    const resolver = createTurnResolver({
      mcpServerStore: deps.mcpServerStore,
      tokenStore: deps.tokenStore,
      skillStore: deps.skillStore,
      sandboxProviderStore: deps.sandboxProviderStore,
      agentStore: deps.agentStore,
      modelProviderStore: deps.modelProviderStore,
      logger: deps.logger,
      signal: abortController.signal,
      userRef: deps.resolveUserContext(c).userRef,
      sessionId
    });
    const title = session.record.last_turn_id ? void 0 : deriveSessionTitle(body.input);
    let turn;
    try {
      turn = await session.createTurn({
        turn_id: mintPeeredTurnId(config_default.EXECUTOR_ID),
        input: body.input,
        previous_turn_id: body.previous_turn_id,
        signal: abortController.signal,
        resolver,
        update_session_title_if_not_exist: title
      });
    } catch (error) {
      if (error instanceof SessionStoreNotFoundError2) {
        return c.json({ error: { message: error.message } }, 404);
      }
      if (error instanceof AgentHarnessError && !(error instanceof McpConnectionError5)) {
        switch (error.code) {
          case "invalid_file_input":
            return c.json({ error: { message: error.message } }, 400);
          case "invalid_send_input":
          case "agent_sandbox_required":
          case "tool_name_collision":
            return c.json({ error: { message: error.message } }, 422);
          case "capability_state_error":
          case "mcp_connection_failed":
            throw error;
        }
      }
      throw error;
    }
    const maxExecutionTimer = setTimeout(() => {
      if (!abortController.signal.aborted) {
        abortController.abort(CancellationReason2.ServerExecutionTimeout);
      }
    }, config_default.SERVER_EXECUTION_TIMEOUT_SECONDS * 1e3);
    maxExecutionTimer.unref();
    const trackedStream = deps.activeTurns.track({
      sessionId,
      turnId: turn.id,
      abortController,
      stream: turn.stream()
    });
    const turnEventStream = deps.eventSubscriptions.get(turnStreamId(TENANT_ID, sessionId, turn.id));
    const drainInput = {
      trackedStream,
      turnEventStream,
      sessionId,
      turnId: turn.id,
      maxExecutionTimer,
      logger: deps.logger
    };
    if (!body.stream) {
      const { promise: firstEventDualWritten, resolve: markFirstEventDualWritten } = Promise.withResolvers();
      void drainTurnEvents({
        ...drainInput,
        onEvent: () => {
          markFirstEventDualWritten(void 0);
          return Promise.resolve();
        }
      }).finally(() => {
        markFirstEventDualWritten(void 0);
      });
      await firstEventDualWritten;
      return c.json({ data: toWireTurn(turn.record) }, 200);
    }
    let shouldWriteToSSEStream = true;
    return streamSSE(c, async (stream) => {
      stream.onAbort(() => {
        shouldWriteToSSEStream = false;
      });
      await drainTurnEvents({
        ...drainInput,
        onEvent: async (event, sequenceNumber) => {
          if (!stream.closed && !stream.aborted && shouldWriteToSSEStream) {
            try {
              await stream.writeSSE(turnEventSsePayload(event, sequenceNumber));
            } catch (error) {
              deps.logger.error("SSE stream write error", extractErrorLogFields6(error));
              shouldWriteToSSEStream = false;
            }
          }
        }
      });
      await stream.close();
    });
  };
  const subscribeTurnHandler = async (c) => {
    const { session_id: sessionId, turn_id: turnId } = c.req.valid("param");
    const query = c.req.valid("query");
    const afterSequenceNumber = resolveAfterSequenceNumber(c, query.after_sequence_number);
    const session = await deps.sessions.get({ tenant_id: TENANT_ID, session_id: sessionId });
    if (!session) {
      return c.json({ error: { message: `Session not found: ${sessionId}` } }, 404);
    }
    if (!checkTurnAccess(deps.resolveUserContext(c), session.record.created_by)) {
      return c.json({ error: { message: FORBIDDEN_SESSION_ACCESS2 } }, 403);
    }
    const turn = await session.getTurn(turnId);
    if (!turn) {
      return c.json({ error: { message: `Turn not found: ${turnId}` } }, 404);
    }
    const turnEventStream = deps.eventSubscriptions.get(turnStreamId(TENANT_ID, sessionId, turnId));
    try {
      await turnEventStream.assertSubscribable();
    } catch (error) {
      if (error instanceof StreamGoneError) {
        throw new HTTPException4(412, { message: error.message, cause: error });
      }
      throw error;
    }
    const subscribeAbort = new AbortController();
    const timeoutMs = config_default.TURN_SUBSCRIBE_TIMEOUT_MS;
    const timeoutHandler = setTimeout(() => {
      deps.logger.info("Subscribe turn stream server-side timeout reached, closing stream", {
        sessionId,
        turnId,
        afterSequenceNumber,
        timeoutMs
      });
      subscribeAbort.abort(new Error("subscribe-timeout"));
    }, timeoutMs);
    return streamSSE(c, async (stream) => {
      stream.onAbort(() => {
        subscribeAbort.abort(new Error("client-disconnected"));
      });
      const generator = turnEventStream.poll(afterSequenceNumber, { signal: subscribeAbort.signal });
      try {
        for await (const { sequence_number: sequenceNumber, ...event } of generator) {
          await stream.writeSSE(turnEventSsePayload(event, sequenceNumber));
          if (event.type === EventType2.TURN_DONE) {
            break;
          }
        }
      } catch (error) {
        if (!subscribeAbort.signal.aborted) {
          deps.logger.error("Unexpected error in turn subscribe SSE loop", extractErrorLogFields6(error));
        }
      } finally {
        clearTimeout(timeoutHandler);
        subscribeAbort.abort();
        await generator.return(void 0);
        await stream.close();
      }
    });
  };
  const router = new OpenAPIHono13();
  router.openapi(createAndExecuteTurnRoute, createAndExecuteTurnHandler);
  router.openapi(listTurnsRoute, listTurnsHandler);
  router.openapi(getTurnRoute, getTurnHandler);
  router.openapi(downloadSandboxFileRoute, downloadSandboxFileHandler);
  router.openapi(listTurnEventsRoute, listTurnEventsHandler);
  router.openapi(subscribeTurnRoute, subscribeTurnHandler);
  return router;
}

// src/app.ts
init_config();

// src/packageVersion.ts
import { readFileSync } from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var PACKAGE_ROOT2 = path2.resolve(path2.dirname(fileURLToPath2(import.meta.url)), "..");
function readPackageVersion() {
  const packageJsonPath = path2.join(PACKAGE_ROOT2, "package.json");
  const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  if (typeof parsed !== "object" || parsed === null || !("version" in parsed)) {
    throw new Error(`${packageJsonPath} is missing a version field`);
  }
  const { version } = parsed;
  if (typeof version !== "string" || version.length === 0) {
    throw new Error(`${packageJsonPath} version must be a non-empty string`);
  }
  return version;
}
var PACKAGE_VERSION = readPackageVersion();

// src/zodErrorResponse.ts
import { z as z25 } from "@hono/zod-openapi";
function zodErrorResponse(c, error) {
  return c.json({ error: { message: z25.prettifyError(error) } }, 400);
}
var zodValidationHook = (result, c) => {
  if (!result.success) {
    return zodErrorResponse(c, result.error);
  }
  return void 0;
};

// src/app.ts
var BEARER_AUTH_SCHEME = "BearerAuth";
function createRequestBodyLimitMiddleware(maxSize) {
  return bodyLimit({
    maxSize,
    onError: (c) => c.json({ error: { message: `Request body exceeds the maximum size of ${String(maxSize)} bytes` } }, 413)
  });
}
function createAppErrorHandler(params) {
  return (error, c) => {
    if (error instanceof z26.ZodError) {
      return zodErrorResponse(c, error);
    }
    if (error instanceof HTTPException5) {
      if (error.status >= 500) {
        params.logger.error("Server API error", {
          status: error.status,
          ...extractErrorLogFields7(error)
        });
      }
      return c.json({ error: { message: error.message } }, error.status);
    }
    params.logger.error("Unhandled error", extractErrorLogFields7(error));
    return c.json({ error: { message: "Internal server error" } }, 500);
  };
}
var openApiDocConfig = {
  openapi: "3.1.0",
  info: {
    title: "TrueForge API",
    description: "HTTP API for the TrueForge agent server (`/api/v1`). Interactive docs are served at `/api/v1/docs` (OpenAPI JSON at `/api/v1/openapi.json`).\n\n**Authentication:** Standalone deployments (no OIDC) accept requests without credentials \u2014 middleware stamps a local default user. When OIDC is configured, protected routes require a valid `id_token` cookie or `Authorization: Bearer` ID token. There is no built-in API-key scheme; pass custom headers only if your reverse proxy or IdP layer requires them.\n\nCovers DB-backed sessions, the agent registry, settings catalogs, and model/MCP/skill/sandbox providers.",
    version: PACKAGE_VERSION
  },
  tags: OPENAPI_DOCUMENT_TAGS
};
function registerOpenApiBearerAuth(app) {
  app.openAPIRegistry.registerComponent("securitySchemes", BEARER_AUTH_SCHEME, {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "ID token (`Authorization: Bearer <id_token>`). Required on protected routes. Browser sessions may use the HttpOnly `id_token` cookie instead."
  });
}
function buildOpenApiDocument(app, options) {
  const authEnabled = options?.authEnabled ?? false;
  if (authEnabled) {
    registerOpenApiBearerAuth(app);
  }
  return app.getOpenAPI31Document({
    ...openApiDocConfig,
    ...authEnabled ? { security: [{ [BEARER_AUTH_SCHEME]: [] }] } : {}
  });
}
function routeNotFound(c) {
  return c.json({ error: { message: `Route not found: ${c.req.method} ${c.req.path}` } }, 404);
}
function withAuth(router) {
  const shell = new OpenAPIHono14();
  shell.use("*", authMiddleware);
  shell.route("/", router);
  return shell;
}
function withAdminAuth(router) {
  const shell = new OpenAPIHono14();
  shell.use("*", adminAuthMiddleware);
  shell.route("/", router);
  return shell;
}
function createServerApp(deps) {
  const app = new OpenAPIHono14({ defaultHook: zodValidationHook });
  const authEnabled = deps.oidcClient != null;
  app.use("*", createRequestBodyLimitMiddleware(config_default.MAX_REQUEST_BODY_BYTES));
  app.get("/healthz", (c) => c.text("OK!"));
  app.route("/api/v1/auth", createAuthRouter({ oidcClient: deps.oidcClient, logger: deps.logger }));
  app.route(
    "/api/v1/capabilities",
    withAuth(
      createCapabilitiesRouter({
        sandboxProviderStore: deps.sandboxProviderStore,
        withTransaction: deps.withTransaction,
        logger: deps.logger
      })
    )
  );
  app.route(
    "/api/v1/models",
    withAuth(
      createModelsRouter({
        modelProviderStore: deps.modelProviderStore,
        withTransaction: deps.withTransaction
      })
    )
  );
  app.route(
    "/api/v1/catalogs",
    withAuth(
      createCatalogRouter({
        modelCatalog: deps.modelCatalog,
        mcpCatalog: deps.mcpCatalog,
        skillCatalog: deps.skillCatalog,
        sandboxCatalog: deps.sandboxCatalog
      })
    )
  );
  app.route(
    "/api/v1/mcp-servers/oauth",
    createMcpOAuthRouter({
      tokenStore: deps.tokenStore,
      mcpServerStore: deps.mcpServerStore,
      logger: deps.logger
    })
  );
  app.route(
    "/api/v1/mcp-servers",
    withAuth(
      createMcpServersRouter({
        mcpServerStore: deps.mcpServerStore,
        tokenStore: deps.tokenStore,
        withTransaction: deps.withTransaction,
        logger: deps.logger,
        resolveUserContext
      })
    )
  );
  app.route(
    "/api/v1/skills",
    withAuth(
      createAvailableSkillsRouter({
        skillStore: deps.skillStore,
        withTransaction: deps.withTransaction
      })
    )
  );
  app.route(
    "/api/v1/agents",
    withAuth(
      createAgentsRouter({
        agentStore: deps.agentStore,
        modelProviderStore: deps.modelProviderStore,
        mcpServerStore: deps.mcpServerStore,
        skillStore: deps.skillStore,
        sandboxProviderStore: deps.sandboxProviderStore,
        withTransaction: deps.withTransaction
      })
    )
  );
  app.route(
    "/api/v1/settings",
    withAdminAuth(
      createSettingsRouter({
        modelProviderStore: deps.modelProviderStore,
        mcpServerStore: deps.mcpServerStore,
        tokenStore: deps.tokenStore,
        skillStore: deps.skillStore,
        sandboxProviderStore: deps.sandboxProviderStore,
        withTransaction: deps.withTransaction,
        logger: deps.logger,
        resolveUserContext
      })
    )
  );
  app.route(
    "/api/v1/sessions",
    withAuth(
      createSessionsRouter({
        sessions: deps.sessions,
        sessionStore: deps.sessionStore,
        activeTurns: deps.activeTurns,
        modelProviderStore: deps.modelProviderStore,
        mcpServerStore: deps.mcpServerStore,
        skillStore: deps.skillStore,
        agentStore: deps.agentStore,
        sandboxProviderStore: deps.sandboxProviderStore,
        redis: deps.redis,
        requestReplyRouter: deps.requestReplyRouter,
        resolveUserContext,
        logger: deps.logger
      })
    )
  );
  app.route(
    "/api/v1/sessions",
    withAuth(
      createTurnsRouter({
        sessions: deps.sessions,
        sessionStore: deps.sessionStore,
        activeTurns: deps.activeTurns,
        modelProviderStore: deps.modelProviderStore,
        mcpServerStore: deps.mcpServerStore,
        tokenStore: deps.tokenStore,
        skillStore: deps.skillStore,
        agentStore: deps.agentStore,
        eventSubscriptions: deps.eventSubscriptions,
        sandboxProviderStore: deps.sandboxProviderStore,
        logger: deps.logger,
        resolveUserContext
      })
    )
  );
  app.get("/api/v1/docs", swaggerUI({ url: "/api/v1/openapi.json" }));
  app.get("/api/v1/openapi.json", (c) => c.json(buildOpenApiDocument(app, { authEnabled })));
  app.notFound(routeNotFound);
  app.onError(createAppErrorHandler({ logger: deps.logger }));
  return app;
}

// src/catalog/McpCatalog.ts
init_config();

// src/catalog/loadYaml.ts
import fs from "fs";
import { parse } from "yaml";
function parseYamlString(raw, schema, label) {
  let document;
  try {
    document = parse(raw);
  } catch (error) {
    throw new Error(`Invalid YAML in ${label}: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error
    });
  }
  const result = schema.safeParse(document);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `  - ${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`).join("\n");
    throw new Error(`Invalid config in ${label}:
${issues}`);
  }
  return result.data;
}
function loadYamlAtPath(filePath, schema) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to read config file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
  return parseYamlString(raw, schema, filePath);
}

// src/catalog/mcpCatalog.gen.ts
var shippedMcpCatalogYaml = "# Shipped MCP catalog: server presets offered by\n# GET /api/v1/catalog/mcp-servers for the UI to copy into\n# PUT /api/v1/settings/mcp-servers bodies. Discovery-only \u2014 never executed against.\nmcp_servers:\n  - type: remote\n    name: linear\n    logo: https://assets.production.truefoundry.com/linear.svg\n    url: https://mcp.linear.app/mcp\n    description: Search, read, and create Linear issues.\n    auth:\n      type: dcr\n  - type: remote\n    name: notion\n    logo: https://assets.production.truefoundry.com/notion.svg\n    url: https://mcp.notion.com/mcp\n    description: Search pages, read content, query databases, create pages.\n    auth:\n      type: dcr\n  - type: remote\n    name: sentry\n    logo: https://assets.production.truefoundry.com/sentry.svg\n    url: https://mcp.sentry.dev/mcp\n    description: Search errors, read stack traces, and check releases.\n    auth:\n      type: dcr\n  - type: remote\n    name: deepwiki\n    logo: https://assets.production.truefoundry.com/deepwiki.png\n    url: https://mcp.deepwiki.com/mcp\n    description: Read documentation and ask questions about any public GitHub repository.\n  - type: remote\n    name: exa\n    logo: https://assets.production.truefoundry.com/exa.svg\n    url: https://mcp.exa.ai/mcp\n    description: Search the web, fetch page contents, and find similar pages.\n  - type: remote\n    name: parallel-web\n    logo: https://assets.production.truefoundry.com/parallel-web.svg\n    url: https://search.parallel.ai/mcp\n    description: Search the web and get ranked results with extracted content.\n  - type: remote\n    name: github\n    logo: https://assets.production.truefoundry.com/github.svg\n    url: https://api.githubcopilot.com/mcp/\n    description: Work with issues, pull requests, repository files, and CI status.\n    auth:\n      type: header\n      headers:\n        Authorization: Bearer YOUR_GITHUB_PAT\n  - type: remote\n    name: tavily\n    logo: https://assets.production.truefoundry.com/tavily.svg\n    url: https://mcp.tavily.com/mcp\n    description: Search the web, extract page content, and crawl sites.\n    auth:\n      type: header\n      headers:\n        Authorization: Bearer YOUR_TAVILY_API_KEY\n  - type: remote\n    name: bright-data\n    logo: https://assets.production.truefoundry.com/bright-data.png\n    url: https://mcp.brightdata.com/mcp\n    description: Search the web and scrape pages, including sites behind bot protection.\n    auth:\n      type: header\n      headers:\n        Authorization: Bearer YOUR_BRIGHT_DATA_API_TOKEN\n  - type: remote\n    name: supabase\n    logo: https://assets.production.truefoundry.com/supabase.svg\n    url: https://mcp.supabase.com/mcp\n    description: Run SQL queries, manage tables, and inspect Supabase projects.\n    auth:\n      type: dcr\n  - type: remote\n    name: stripe\n    logo: https://assets.production.truefoundry.com/stripe.svg\n    url: https://mcp.stripe.com\n    description: Create and manage customers, payments, invoices, and subscriptions.\n    auth:\n      type: dcr\n  - type: remote\n    name: confluence\n    logo: https://assets.production.truefoundry.com/confluence.svg\n    url: https://mcp.atlassian.com/v1/mcp\n    description: Search spaces, read pages, and create or update content.\n    auth:\n      type: dcr\n  - type: remote\n    name: jira\n    logo: https://assets.production.truefoundry.com/jira.png\n    url: https://mcp.atlassian.com/v1/mcp\n    description: Search, read, create, and update Jira issues.\n    auth:\n      type: dcr\n  - type: remote\n    name: posthog\n    logo: https://assets.production.truefoundry.com/posthog.svg\n    url: https://mcp.posthog.com/mcp\n    description: Query product analytics, run SQL, and manage feature flags.\n    auth:\n      type: dcr\n";

// src/catalog/McpCatalog.ts
var McpCatalog = class _McpCatalog {
  mcpServers;
  constructor(mcpServers) {
    this.mcpServers = mcpServers;
  }
  /** Loads and validates the catalog. Throws on any error. */
  static load() {
    if (config_default.MCP_CATALOG_PATH !== void 0) {
      const file2 = loadYamlAtPath(config_default.MCP_CATALOG_PATH, McpCatalogFileSchema);
      return new _McpCatalog(file2.mcp_servers);
    }
    const file = parseYamlString(shippedMcpCatalogYaml, McpCatalogFileSchema, "shipped mcp-catalog");
    return new _McpCatalog(file.mcp_servers);
  }
  list() {
    return this.mcpServers;
  }
};

// src/catalog/ModelCatalog.ts
init_config();

// src/catalog/modelCatalog.gen.ts
var shippedModelCatalogYaml = "# Shipped model catalog: provider/model presets offered by\n# GET /api/v1/catalog/model-providers for the UI to copy into\n# PUT /api/v1/settings/model-providers bodies. Discovery-only \u2014 never executed against.\nproviders:\n  - type: openai\n    logo: https://assets.production.truefoundry.com/openai.svg\n    models:\n      - model_id: gpt-5.4-mini\n        name: gpt-5-4-mini\n        properties:\n          context_length: 400000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n      - model_id: gpt-5.5\n        name: gpt-5-5\n        properties:\n          context_length: 1050000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n      - model_id: gpt-5.6-luna\n        name: gpt-5-6-luna\n        properties:\n          context_length: 1050000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n      - model_id: gpt-5.6-sol\n        name: gpt-5-6-sol\n        properties:\n          context_length: 1050000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n      - model_id: gpt-5.6-terra\n        name: gpt-5-6-terra\n        properties:\n          context_length: 1050000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n  - type: anthropic\n    logo: https://assets.production.truefoundry.com/anthropic.svg\n    models:\n      - model_id: claude-fable-5\n        name: claude-fable-5\n        properties:\n          context_length: 1000000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n      - model_id: claude-haiku-4-5\n        name: claude-haiku-4-5\n        properties:\n          context_length: 200000\n          max_output_tokens: 64000\n      - model_id: claude-opus-4-8\n        name: claude-opus-4-8\n        properties:\n          context_length: 1000000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n      - model_id: claude-opus-5\n        name: claude-opus-5\n        properties:\n          context_length: 1000000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n      - model_id: claude-sonnet-4-6\n        name: claude-sonnet-4-6\n        properties:\n          context_length: 1000000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - low\n            - medium\n            - high\n            - max\n      - model_id: claude-sonnet-5\n        name: claude-sonnet-5\n        properties:\n          context_length: 1000000\n          max_output_tokens: 128000\n          reasoning_efforts:\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n  - type: google-gemini\n    logo: https://assets.production.truefoundry.com/google-gemini.svg\n    models:\n      - model_id: gemini-3.1-pro-preview\n        name: gemini-3-1-pro-preview\n        properties:\n          context_length: 1048576\n          max_output_tokens: 65536\n          reasoning_efforts:\n            - low\n            - medium\n            - high\n      - model_id: gemini-3.6-flash\n        name: gemini-3-6-flash\n        properties:\n          context_length: 1048576\n          max_output_tokens: 65536\n          reasoning_efforts:\n            - minimal\n            - low\n            - medium\n            - high\n  - type: fireworks\n    logo: https://assets.production.truefoundry.com/fireworks.svg\n    models:\n      - model_id: accounts/fireworks/models/deepseek-v4-pro\n        name: deepseek-v4-pro\n        properties:\n          context_length: 1048576\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n      - model_id: accounts/fireworks/models/glm-5p2\n        name: glm-5p2\n        properties:\n          context_length: 1048576\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n      - model_id: accounts/fireworks/models/kimi-k2p7-code\n        name: kimi-k2p7-code\n        properties:\n          context_length: 262144\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n      - model_id: accounts/fireworks/models/kimi-k3\n        name: kimi-k3\n        properties:\n          context_length: 1048576\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n      - model_id: accounts/fireworks/models/minimax-m3\n        name: minimax-m3\n        properties:\n          context_length: 512000\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n  - type: zai\n    logo: https://assets.production.truefoundry.com/zai.svg\n    models:\n      - model_id: glm-5-turbo\n        name: glm-5-turbo\n        properties:\n          context_length: 200000\n          max_output_tokens: 131072\n      - model_id: glm-5.1\n        name: glm-5-1\n        properties:\n          context_length: 200000\n          max_output_tokens: 131072\n      - model_id: glm-5.2\n        name: glm-5-2\n        properties:\n          context_length: 1000000\n          max_output_tokens: 131072\n          reasoning_efforts:\n            - none\n            - minimal\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n  - type: moonshot\n    logo: https://assets.production.truefoundry.com/moonshot.png\n    models:\n      - model_id: kimi-k2.7-code\n        name: kimi-k2-7-code\n        properties:\n          context_length: 262144\n      - model_id: kimi-k3\n        name: kimi-k3\n        properties:\n          context_length: 1048576\n          reasoning_efforts:\n            - low\n            - high\n            - max\n  - type: alibaba\n    logo: https://assets.production.truefoundry.com/alibaba.png\n    models:\n      - model_id: qwen3.7-flash\n        name: qwen3-7-flash\n        properties:\n          context_length: 1000000\n          max_output_tokens: 131072\n          reasoning_efforts:\n            - none\n            - minimal\n            - low\n            - medium\n            - high\n            - xhigh\n      - model_id: qwen3.7-max\n        name: qwen3-7-max\n        properties:\n          context_length: 1000000\n          max_output_tokens: 131072\n          reasoning_efforts:\n            - none\n            - minimal\n            - low\n            - medium\n            - high\n            - xhigh\n      - model_id: qwen3.7-plus\n        name: qwen3-7-plus\n        properties:\n          context_length: 1000000\n          max_output_tokens: 131072\n          reasoning_efforts:\n            - none\n            - minimal\n            - low\n            - medium\n            - high\n            - xhigh\n      - model_id: qwen3.8-max\n        name: qwen3-8-max\n        properties:\n          context_length: 1000000\n          max_output_tokens: 131072\n          reasoning_efforts:\n            - none\n            - minimal\n            - low\n            - medium\n            - high\n            - xhigh\n            - max\n  - type: together\n    logo: https://assets.production.truefoundry.com/togetherai.svg\n    models:\n      - model_id: deepseek-ai/DeepSeek-V4-Pro\n        name: deepseek-v4-pro\n        properties:\n          context_length: 512000\n          reasoning_efforts:\n            - high\n            - max\n      - model_id: MiniMaxAI/MiniMax-M3\n        name: minimax-m3\n        properties:\n          context_length: 524288\n      - model_id: moonshotai/Kimi-K2.7-Code\n        name: kimi-k2-7-code\n        properties:\n          context_length: 262144\n      - model_id: moonshotai/Kimi-K3\n        name: kimi-k3\n        properties:\n          context_length: 1048576\n          reasoning_efforts:\n            - none\n            - low\n            - medium\n            - high\n            - max\n      - model_id: Qwen/Qwen3.7-Max\n        name: qwen3-7-max\n        properties:\n          context_length: 1000000\n          max_output_tokens: 131072\n          reasoning_efforts:\n            - none\n            - minimal\n            - low\n            - medium\n            - high\n            - xhigh\n      - model_id: Qwen/Qwen3.7-Plus\n        name: qwen3-7-plus\n        properties:\n          context_length: 1000000\n          max_output_tokens: 131072\n          reasoning_efforts:\n            - none\n            - minimal\n            - low\n            - medium\n            - high\n            - xhigh\n      - model_id: zai-org/GLM-5.2\n        name: glm-5-2\n        properties:\n          context_length: 512000\n          reasoning_efforts:\n            - high\n            - max\n";

// src/catalog/ModelCatalog.ts
var ModelCatalog = class _ModelCatalog {
  providers;
  constructor(providers) {
    this.providers = providers;
  }
  /** Loads and validates the catalog. Throws on any error. */
  static load() {
    if (config_default.MODEL_CATALOG_PATH !== void 0) {
      const file2 = loadYamlAtPath(config_default.MODEL_CATALOG_PATH, ModelCatalogFileSchema);
      return new _ModelCatalog(file2.providers);
    }
    const file = parseYamlString(shippedModelCatalogYaml, ModelCatalogFileSchema, "shipped model-catalog");
    return new _ModelCatalog(file.providers);
  }
  list() {
    return this.providers;
  }
};

// src/catalog/SandboxCatalog.ts
init_config();

// src/catalog/sandboxCatalog.gen.ts
var shippedSandboxCatalogYaml = "# Shipped sandbox catalog: provider presets offered by\n# GET /api/v1/catalog/sandbox-providers for the UI to copy into\n# PUT /api/v1/settings/sandbox-providers bodies. Discovery-only \u2014 never executed against.\nproviders:\n  - type: daytona\n    exec_timeout_ms: 60000\n    auto_stop_interval_in_minutes: 5\n    auto_archive_interval_in_minutes: 60\n    auto_delete_interval_in_minutes: 7200\n";

// src/catalog/SandboxCatalog.ts
var SandboxCatalog = class _SandboxCatalog {
  providers;
  constructor(providers) {
    this.providers = providers;
  }
  /** Loads and validates the catalog. Throws on any error. */
  static load() {
    if (config_default.SANDBOX_CATALOG_PATH !== void 0) {
      const file2 = loadYamlAtPath(config_default.SANDBOX_CATALOG_PATH, SandboxCatalogFileSchema);
      return new _SandboxCatalog(file2.providers);
    }
    const file = parseYamlString(shippedSandboxCatalogYaml, SandboxCatalogFileSchema, "shipped sandbox-catalog");
    return new _SandboxCatalog(file.providers);
  }
  list() {
    return this.providers;
  }
};

// src/catalog/SkillCatalog.ts
init_config();

// src/catalog/skillCatalog.gen.ts
var shippedSkillCatalogYaml = `# Shipped skill catalog: skill presets offered by
# GET /api/v1/catalog/skills for the UI to copy into
# PUT /api/v1/settings/skills bodies. Discovery-only \u2014 never executed against.
#
# Entries reference upstream skill repos directly (url + path + ref); installing
# a preset sparse-clones that subdirectory into the sandbox. Only permissively
# licensed skills (Apache-2.0 / MIT) are listed \u2014 licenses were verified against
# each skill's upstream LICENSE and are noted in the comments below. The schema
# stores only {type, name, url, path, ref, description}; license and the MCP a
# skill pairs with live in the comments for provenance.
#
# NOTE: Anthropic's document skills (pdf, docx, pptx, xlsx) are intentionally
# excluded \u2014 their LICENSE.txt is proprietary ("All rights reserved", usable
# only within Anthropic's Services) and forbids extracting/retaining/redistributing
# the materials, which a clone-into-sandbox preset would do.
skills:
  # \u2500\u2500 Anthropic skills (github.com/anthropics/skills \xB7 per-skill LICENSE, all Apache-2.0) \u2500\u2500
  - type: git
    name: algorithmic-art
    url: https://github.com/anthropics/skills
    path: skills/algorithmic-art
    ref: main
    description: Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration.

  # Agent-builder skills \u2014 author skills, MCP servers, and web artifacts.
  - type: git
    name: skill-creator
    url: https://github.com/anthropics/skills
    path: skills/skill-creator
    ref: main
    description: Scaffold, refine, and package new Agent Skills, including SKILL.md structure and evaluation.
  - type: git
    name: mcp-builder
    url: https://github.com/anthropics/skills
    path: skills/mcp-builder
    ref: main
    description: Build Model Context Protocol (MCP) servers \u2014 tool definitions, transports, and packaging.
  - type: git
    name: web-artifacts-builder
    url: https://github.com/anthropics/skills
    path: skills/web-artifacts-builder
    ref: main
    description: Build self-contained web artifacts (HTML/JS/CSS) that render as interactive standalone pages.

  # \u2500\u2500 MCP-paired workflow skills (each pairs with the noted MCP connector) \u2500\u2500

  # tavily-research \u2014 pairs with the Tavily retrieval MCP. (tavily-ai/skills \xB7 MIT)
  - type: git
    name: tavily-research
    url: https://github.com/tavily-ai/skills
    path: skills/tavily-research
    ref: main
    description: Run structured web research with the Tavily MCP \u2014 search, extract, and synthesize sources.

  # supabase \u2014 pairs with the Supabase MCP. (supabase/agent-skills \xB7 MIT)
  - type: git
    name: supabase
    url: https://github.com/supabase/agent-skills
    path: skills/supabase
    ref: main
    description: Query and manage a Supabase Postgres database via SQL through the Supabase MCP.

  # wiki-architect / wiki-qa \u2014 pair with DeepWiki / GitHub for repo briefs. (microsoft/skills \xB7 MIT)
  - type: git
    name: wiki-architect
    url: https://github.com/microsoft/skills
    path: .github/plugins/deep-wiki/skills/wiki-architect
    ref: main
    description: Plan and structure a repository wiki / brief from a codebase (DeepWiki).
  - type: git
    name: wiki-qa
    url: https://github.com/microsoft/skills
    path: .github/plugins/deep-wiki/skills/wiki-qa
    ref: main
    description: Answer questions about a repository from its generated wiki (DeepWiki); companion to wiki-architect.

  # openai/skills \u2014 per-skill licenses (verified). Apache-2.0 unless noted.
  # NOTE: this repo is deprecated upstream \u2014 plan to re-vendor from openai/plugins
  # later and update the url/path/ref.
  # linear \u2014 pairs with the Linear MCP. (Apache-2.0)
  - type: git
    name: linear
    url: https://github.com/openai/skills
    path: skills/.curated/linear
    ref: main
    description: Triage and manage Linear issues (create, update, search) via the Linear MCP.
  # gh-fix-ci \u2014 pairs with the GitHub MCP. (Apache-2.0)
  - type: git
    name: gh-fix-ci
    url: https://github.com/openai/skills
    path: skills/.curated/gh-fix-ci
    ref: main
    description: Diagnose and fix failing GitHub CI checks on a pull request via the GitHub MCP.
  # notion-knowledge-capture \u2014 pairs with the Notion MCP. (MIT \xB7 Notion Labs, Inc.)
  - type: git
    name: notion-knowledge-capture
    url: https://github.com/openai/skills
    path: skills/.curated/notion-knowledge-capture
    ref: main
    description: Capture and organize knowledge into Notion pages and databases via the Notion MCP.
  # sentry \u2014 pairs with the Sentry MCP. (Apache-2.0)
  - type: git
    name: sentry
    url: https://github.com/openai/skills
    path: skills/.curated/sentry
    ref: main
    description: Investigate and triage Sentry errors and issues via the Sentry MCP.
  # jupyter-notebook \u2014 data analysis (pairs with data/DB MCPs such as Supabase). (Apache-2.0)
  - type: git
    name: jupyter-notebook
    url: https://github.com/openai/skills
    path: skills/.curated/jupyter-notebook
    ref: main
    description: Perform data analysis in Jupyter notebooks \u2014 load data, compute, and visualize results.
`;

// src/catalog/SkillCatalog.ts
var SkillCatalog = class _SkillCatalog {
  skills;
  constructor(skills) {
    this.skills = skills;
  }
  /** Loads and validates the catalog. Throws on any error. */
  static load() {
    if (config_default.SKILL_CATALOG_PATH !== void 0) {
      const file2 = loadYamlAtPath(config_default.SKILL_CATALOG_PATH, SkillCatalogFileSchema);
      return new _SkillCatalog(file2.skills);
    }
    const file = parseYamlString(shippedSkillCatalogYaml, SkillCatalogFileSchema, "shipped skill-catalog");
    return new _SkillCatalog(file.skills);
  }
  list() {
    return this.skills;
  }
};

// src/main.ts
init_config();

// src/frontend.ts
import { serveStatic } from "@hono/node-server/serve-static";
import { every } from "hono/combine";
import { compress } from "hono/compress";
import { existsSync as existsSync5 } from "fs";
import path3 from "path";
var SERVER_PATH_PREFIXES = ["/api", "/healthz"];
var HASHED_ASSET_PREFIX = "/assets/";
var IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
var REVALIDATE_CACHE_CONTROL = "no-cache";
function isServerPath(pathname) {
  return SERVER_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
function mountFrontend(app, dir) {
  if (!existsSync5(path3.join(dir, "index.html"))) {
    return false;
  }
  const serveFile = serveStatic({ root: dir, precompressed: true });
  const serveWithCacheHeaders = async (c, next) => {
    const response = await serveFile(c, next);
    if (response instanceof Response) {
      const cacheControl = c.req.path.startsWith(HASHED_ASSET_PREFIX) ? IMMUTABLE_CACHE_CONTROL : REVALIDATE_CACHE_CONTROL;
      response.headers.set("Cache-Control", cacheControl);
      response.headers.set("Vary", "Accept-Encoding");
    }
    return response;
  };
  const serveCompressed = every(compress(), serveWithCacheHeaders);
  const serveBuild = async (c, next) => {
    if (isServerPath(c.req.path)) {
      return next();
    }
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      return next();
    }
    return serveCompressed(c, next);
  };
  const serveAppShell = serveStatic({ root: dir, rewriteRequestPath: () => "/index.html", precompressed: true });
  const serveSpaFallback = async (c, next) => {
    if (isServerPath(c.req.path)) {
      return next();
    }
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      return next();
    }
    if (c.req.header("accept")?.includes("text/html") !== true) {
      return next();
    }
    const response = await serveAppShell(c, next);
    if (response instanceof Response) {
      response.headers.set("Cache-Control", REVALIDATE_CACHE_CONTROL);
      response.headers.set("Vary", "Accept-Encoding");
    }
    return response;
  };
  app.use("/*", serveBuild);
  app.use("/*", serveSpaFallback);
  return true;
}

// src/logger.ts
import winston from "winston";
var STANDALONE_META_SKIP = /* @__PURE__ */ new Set(["level", "message", "timestamp", "version", "stack", "splat"]);
function shouldColorize() {
  const noColor = process.env["NO_COLOR"];
  if (noColor !== void 0 && noColor !== "") {
    return false;
  }
  const forceColor = process.env["FORCE_COLOR"];
  if (forceColor === "0") {
    return false;
  }
  if (forceColor !== void 0 && forceColor !== "") {
    return true;
  }
  return process.stderr.isTTY;
}
function standaloneMeta(info) {
  const copied = { ...info };
  const meta = {};
  for (const key of Object.keys(copied)) {
    if (STANDALONE_META_SKIP.has(key)) {
      continue;
    }
    meta[key] = copied[key];
  }
  if (Object.keys(meta).length === 0) {
    return "";
  }
  return ` ${JSON.stringify(meta)}`;
}
function standaloneFormat(color) {
  const parts = [
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.errors({ stack: true })
  ];
  if (color) {
    parts.push(winston.format.colorize({ level: true }));
  }
  parts.push(
    winston.format.printf((info) => {
      const extra = standaloneMeta(info);
      const stack = typeof info["stack"] === "string" ? `
${info["stack"]}` : "";
      return `${String(info["timestamp"])} ${info.level} ${String(info.message)}${extra}${stack}`;
    })
  );
  return winston.format.combine(...parts);
}
function jsonFormat() {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );
}
function serverLogFormat(options) {
  if (options.standalone) {
    return standaloneFormat(shouldColorize());
  }
  return jsonFormat();
}
function createServerLogger(options) {
  return winston.createLogger({
    level: options.level,
    defaultMeta: { version: options.version },
    format: serverLogFormat({ standalone: options.standalone }),
    transports: [new winston.transports.Console()]
  });
}

// src/runtime/activeTurns.ts
import "@truefoundry/trueforge-core/agent-session";
function activeTurnKey(sessionId, turnId) {
  return `${sessionId}:${turnId}`;
}
var ActiveTurnRegistry = class {
  runs = /* @__PURE__ */ new Map();
  alreadyShutDownAbortReason;
  /**
   * Registers the run immediately, then returns a generator that forwards
   * `stream` and removes the run when the stream completes (or the consumer
   * exits early). If shutdown has already begun, aborts the controller with
   * the shutdown reason so the turn ends as abandoned.
   */
  track(input) {
    const key = activeTurnKey(input.sessionId, input.turnId);
    const { promise: waitUntilCompleted, resolve: resolve3 } = Promise.withResolvers();
    const markCompleted = () => {
      resolve3(void 0);
    };
    const run = {
      abortController: input.abortController,
      waitUntilCompleted,
      markCompleted
    };
    this.runs.set(key, run);
    if (this.alreadyShutDownAbortReason !== void 0) {
      if (!input.abortController.signal.aborted) {
        input.abortController.abort(this.alreadyShutDownAbortReason);
      }
    }
    const complete = () => {
      run.markCompleted();
      if (this.runs.get(key) === run) {
        this.runs.delete(key);
      }
    };
    async function* tracked() {
      try {
        yield* input.stream;
      } finally {
        complete();
      }
    }
    return tracked();
  }
  /**
   * Aborts the given turn if it is running in this process. Returns true when
   * the run was found (already-aborted runs are not re-aborted). Cancelling a
   * turn that is not running is a no-op, mirroring the store's
   * first-terminal-write-wins rule.
   */
  cancelIfRunning(input) {
    const run = this.runs.get(activeTurnKey(input.sessionId, input.turnId));
    if (!run) {
      return false;
    }
    if (!run.abortController.signal.aborted) {
      run.abortController.abort(input.abortReason);
    }
    return true;
  }
  /**
   * Enter shutdown mode, abort every run with `abortReason`, and wait until the
   * registry is empty. Late `track()` calls (in-flight HTTP that registered after
   * the first snapshot) are aborted immediately as `abortReason` and included in
   * subsequent wait iterations.
   */
  async shutdownAndWait(abortReason) {
    this.alreadyShutDownAbortReason = abortReason;
    while (this.runs.size > 0) {
      const pending = Array.from(this.runs.values());
      for (const run of pending) {
        if (!run.abortController.signal.aborted) {
          run.abortController.abort(abortReason);
        }
      }
      await Promise.allSettled(pending.map((run) => run.waitUntilCompleted));
    }
  }
};

// src/startupBanner.ts
var STANDALONE_MODE_DISCLAIMER = "Standalone mode is intended for local use on your own machine. It is not hardened for production or shared internet access \u2014 please keep it on localhost. We cannot take responsibility for data loss or unauthorized access if this mode is used beyond that.";
var ANSI_SHADOW = {
  T: ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D", "   \u2588\u2588\u2551   ", "   \u2588\u2588\u2551   ", "   \u2588\u2588\u2551   ", "   \u255A\u2550\u255D   "],
  R: ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557 ", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u255A\u2550\u255D  \u255A\u2550\u255D"],
  U: ["\u2588\u2588\u2557   \u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D", " \u255A\u2550\u2550\u2550\u2550\u2550\u255D "],
  E: ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D", "\u2588\u2588\u2588\u2588\u2588\u2557  ", "\u2588\u2588\u2554\u2550\u2550\u255D  ", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D"],
  F: ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D", "\u2588\u2588\u2588\u2588\u2588\u2557  ", "\u2588\u2588\u2554\u2550\u2550\u255D  ", "\u2588\u2588\u2551     ", "\u255A\u2550\u255D     "],
  O: [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557 ", "\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D", " \u255A\u2550\u2550\u2550\u2550\u2550\u255D "],
  G: [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557 ", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D ", "\u2588\u2588\u2551  \u2588\u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D", " \u255A\u2550\u2550\u2550\u2550\u2550\u255D "]
};
var WORDMARK_TEXT = "TRUEFORGE";
var WARNING_INNER_WIDTH = 72;
var BRAND_COLOR = "\x1B[38;5;99m";
var YELLOW = "\x1B[33m";
var BOLD = "\x1B[1m";
var DIM = "\x1B[2m";
var RESET = "\x1B[0m";
function glyphFor(ch) {
  const glyph = ANSI_SHADOW[ch];
  if (glyph === void 0) {
    throw new Error(`No ASCII glyph for ${JSON.stringify(ch)}`);
  }
  return glyph;
}
function rowOf(glyph, row) {
  const cell = glyph[row];
  if (cell === void 0) {
    throw new Error(`Glyph is missing row ${String(row)}`);
  }
  return cell;
}
function renderTrueForgeWordmark() {
  const glyphs = [];
  for (let i = 0; i < WORDMARK_TEXT.length; i += 1) {
    const ch = WORDMARK_TEXT[i];
    if (ch === void 0) {
      throw new Error(`Missing character at index ${String(i)}`);
    }
    glyphs.push(glyphFor(ch));
  }
  const rowCount = glyphs[0]?.length;
  if (rowCount === void 0) {
    throw new Error("Wordmark text must not be empty");
  }
  const rows = [];
  for (let row = 0; row < rowCount; row += 1) {
    rows.push(glyphs.map((glyph) => rowOf(glyph, row)).join(""));
  }
  return rows.join("\n");
}
function wrapText(text, width) {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (current.length === 0) {
      if (word.length > width) {
        lines.push(word);
      } else {
        current = word;
      }
      continue;
    }
    const next = `${current} ${word}`;
    if (next.length <= width) {
      current = next;
    } else {
      lines.push(current);
      current = word.length > width ? "" : word;
      if (word.length > width) {
        lines.push(word);
      }
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}
function paint(options) {
  if (!options.enabled) {
    return options.text;
  }
  return `${options.color}${options.text}${RESET}`;
}
function warningBox(message) {
  const label = " WARNING ";
  const inner = wrapText(message, WARNING_INNER_WIDTH);
  const width = Math.max(WARNING_INNER_WIDTH, ...inner.map((line) => line.length), label.length);
  const topPad = width + 1 - label.length;
  const top = `\u250C\u2500${label}${"\u2500".repeat(topPad)}\u2510`;
  const body = inner.map((line) => `\u2502 ${line.padEnd(width)} \u2502`);
  const bottom = `\u2514${"\u2500".repeat(width + 2)}\u2518`;
  return [top, ...body, bottom].join("\n");
}
function formatStandaloneStartupBanner(options) {
  const { version, color } = options;
  const wordmark = paint({ text: renderTrueForgeWordmark(), color: `${BOLD}${BRAND_COLOR}`, enabled: color });
  const subtitle = paint({ text: `  TrueForge v${version}  \xB7  standalone`, color: DIM, enabled: color });
  const warning = paint({ text: warningBox(STANDALONE_MODE_DISCLAIMER), color: `${BOLD}${YELLOW}`, enabled: color });
  return { wordmark: `
${wordmark}
${subtitle}
`, warning };
}
function printStandaloneStartupBanner(options) {
  const { wordmark, warning } = formatStandaloneStartupBanner(options);
  console.log(wordmark);
  console.warn(warning);
}

// src/main.ts
var configuration2;
var isOidcConfigured2;
try {
  ({ default: configuration2, isOidcConfigured: isOidcConfigured2 } = await Promise.resolve().then(() => (init_config(), config_exports)));
} catch (error) {
  console.error(
    "Failed to start server: Failed to load configuration:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}
async function createStandalonePersistence(options) {
  const { sqlitePath, logger } = options;
  await mkdir5(path6.dirname(sqlitePath), { recursive: true });
  const [{ createSqliteDb: createSqliteDb2 }, { migrateSqliteToLatest: migrateSqliteToLatest2 }, sqliteStores] = await Promise.all([
    Promise.resolve().then(() => (init_client(), client_exports)),
    Promise.resolve().then(() => (init_migrateSqlite(), migrateSqlite_exports)),
    Promise.all([
      Promise.resolve().then(() => (init_SqliteSessionStore(), SqliteSessionStore_exports)),
      Promise.resolve().then(() => (init_SqliteModelProviderStore(), SqliteModelProviderStore_exports)),
      Promise.resolve().then(() => (init_SqliteMcpServerStore(), SqliteMcpServerStore_exports)),
      Promise.resolve().then(() => (init_SqliteOAuthTokenStore(), SqliteOAuthTokenStore_exports)),
      Promise.resolve().then(() => (init_SqliteSkillStore(), SqliteSkillStore_exports)),
      Promise.resolve().then(() => (init_SqliteSandboxProviderStore(), SqliteSandboxProviderStore_exports)),
      Promise.resolve().then(() => (init_SqliteAgentStore(), SqliteAgentStore_exports))
    ])
  ]);
  const [
    { SqliteSessionStore: SqliteSessionStore2 },
    { SqliteModelProviderStore: SqliteModelProviderStore2 },
    { SqliteMcpServerStore: SqliteMcpServerStore2 },
    { SqliteOAuthTokenStore: SqliteOAuthTokenStore2 },
    { SqliteSkillStore: SqliteSkillStore2 },
    { SqliteSandboxProviderStore: SqliteSandboxProviderStore2 },
    { SqliteAgentStore: SqliteAgentStore2 }
  ] = sqliteStores;
  const db = createSqliteDb2(sqlitePath);
  await migrateSqliteToLatest2(db);
  logger.info(`Standalone mode: sqlite at ${sqlitePath}`);
  logger.info("Standalone mode: executor peering disabled and Redis unused");
  return {
    sessionStore: new SqliteSessionStore2(db),
    modelProviderStore: new SqliteModelProviderStore2(db),
    withTransaction: (callback) => db.transaction().execute(callback),
    mcpServerStore: new SqliteMcpServerStore2(db),
    tokenStore: new SqliteOAuthTokenStore2(db),
    skillStore: new SqliteSkillStore2(db),
    sandboxProviderStore: new SqliteSandboxProviderStore2(db),
    agentStore: new SqliteAgentStore2(db),
    destroyDb: () => db.destroy(),
    redis: void 0
  };
}
async function createDistributedPersistence(options) {
  const { configuration: configuration3, logger } = options;
  const {
    DATABASE_URL: databaseUrl,
    DATABASE_POOL_MAX: databasePoolMax,
    POSTGRES_STATEMENT_TIMEOUT_MS: statementTimeoutMs,
    POSTGRES_IDLE_IN_TRANSACTION_SESSION_TIMEOUT_MS: idleInTransactionSessionTimeoutMs,
    REDIS_URL: redisUrl,
    EXECUTOR_ID: executorId
  } = configuration3;
  const [{ createDb: createDb2 }, { migrateToLatest: migrateToLatest2 }, { connectRedis: connectRedis2 }, postgresStores] = await Promise.all([
    Promise.resolve().then(() => (init_client2(), client_exports2)),
    Promise.resolve().then(() => (init_migratePostgres(), migratePostgres_exports)),
    Promise.resolve().then(() => (init_redis(), redis_exports)),
    Promise.all([
      Promise.resolve().then(() => (init_PostgresSessionStore(), PostgresSessionStore_exports)),
      Promise.resolve().then(() => (init_PostgresModelProviderStore(), PostgresModelProviderStore_exports)),
      Promise.resolve().then(() => (init_PostgresMcpServerStore(), PostgresMcpServerStore_exports)),
      Promise.resolve().then(() => (init_PostgresOAuthTokenStore(), PostgresOAuthTokenStore_exports)),
      Promise.resolve().then(() => (init_PostgresSkillStore(), PostgresSkillStore_exports)),
      Promise.resolve().then(() => (init_PostgresSandboxProviderStore(), PostgresSandboxProviderStore_exports)),
      Promise.resolve().then(() => (init_PostgresAgentStore(), PostgresAgentStore_exports))
    ])
  ]);
  const [
    { PostgresSessionStore: PostgresSessionStore2 },
    { PostgresModelProviderStore: PostgresModelProviderStore2 },
    { PostgresMcpServerStore: PostgresMcpServerStore2 },
    { PostgresOAuthTokenStore: PostgresOAuthTokenStore2 },
    { PostgresSkillStore: PostgresSkillStore2 },
    { PostgresSandboxProviderStore: PostgresSandboxProviderStore2 },
    { PostgresAgentStore: PostgresAgentStore2 }
  ] = postgresStores;
  const db = createDb2({
    connectionString: databaseUrl,
    poolMax: databasePoolMax,
    statementTimeoutMs,
    idleInTransactionSessionTimeoutMs
  });
  await migrateToLatest2(db);
  logger.info("Distributed mode: postgres");
  logger.info(`Executor id: ${executorId}`);
  return {
    sessionStore: new PostgresSessionStore2(db),
    modelProviderStore: new PostgresModelProviderStore2(db),
    withTransaction: (callback) => db.transaction().execute(callback),
    mcpServerStore: new PostgresMcpServerStore2(db),
    tokenStore: new PostgresOAuthTokenStore2(db),
    skillStore: new PostgresSkillStore2(db),
    sandboxProviderStore: new PostgresSandboxProviderStore2(db),
    agentStore: new PostgresAgentStore2(db),
    destroyDb: () => db.destroy(),
    redis: await connectRedis2({ url: redisUrl, logger })
  };
}
async function createServerRuntime(persistence, logger) {
  const {
    sessionStore,
    modelProviderStore,
    withTransaction,
    mcpServerStore,
    tokenStore,
    skillStore,
    sandboxProviderStore,
    agentStore,
    destroyDb,
    redis
  } = persistence;
  const activeTurns = new ActiveTurnRegistry();
  const requestReplyRouter = new RequestReplyRouter();
  const eventSubscriptions = new EventSubscriptionRegistry(redis);
  const oidc = isOidcConfigured2(configuration2) ? configuration2.OIDC : void 0;
  if (oidc) {
    logger.info("Auth is enabled", { issuer: oidc.OIDC_ISSUER_URL });
  } else {
    logger.warn("Auth is disabled; browser login is off");
  }
  const oidcClient = await initOidc(oidc);
  const app = createServerApp({
    modelCatalog: ModelCatalog.load(),
    mcpCatalog: McpCatalog.load(),
    skillCatalog: SkillCatalog.load(),
    sandboxCatalog: SandboxCatalog.load(),
    modelProviderStore,
    withTransaction,
    mcpServerStore,
    tokenStore,
    skillStore,
    sandboxProviderStore,
    agentStore,
    sessionStore,
    sessions: new Sessions({ sessionStore }),
    activeTurns,
    redis,
    requestReplyRouter,
    eventSubscriptions,
    logger,
    oidcClient
  });
  return { activeTurns, app, destroyDb, redis, requestReplyRouter };
}
try {
  const logger = createServerLogger({
    level: configuration2.LOG_LEVEL,
    standalone: configuration2.STANDALONE,
    version: PACKAGE_VERSION
  });
  if (configuration2.STANDALONE) {
    printStandaloneStartupBanner({ version: PACKAGE_VERSION, color: shouldColorize() });
    await prepareCodeModeSocketParent({ path: configuration2.CODE_MODE_SOCKET_PARENT, logger });
    await ensureLocalSandboxRootParent(configuration2.LOCAL_SANDBOX_ROOT_PARENT);
    const { LocalSandboxProvider: LocalSandboxProvider2 } = await Promise.resolve().then(() => (init_LocalSandboxProvider(), LocalSandboxProvider_exports));
    const support = await LocalSandboxProvider2.isSupported({
      codeModeSocketParentPath: configuration2.CODE_MODE_SOCKET_PARENT
    });
    setCachedLocalSandboxSupport(support);
    if (support.supported) {
      logger.info("Local sandbox fallback is available", {
        platform: support.platform,
        shell: support.shell,
        python: support.python
      });
    } else {
      logger.warn("Local sandbox fallback is unavailable", {
        reason: support.reason,
        ...support.platform === void 0 ? {} : { platform: support.platform },
        ...support.attempts === void 0 ? {} : { attempts: support.attempts }
      });
    }
  } else {
    logger.info("TrueForge starting", { mode: "distributed" });
  }
  const { activeTurns, app, destroyDb, redis, requestReplyRouter } = configuration2.STANDALONE ? await createServerRuntime(
    await createStandalonePersistence({ sqlitePath: configuration2.SQLITE_PATH, logger }),
    logger
  ) : await createServerRuntime(await createDistributedPersistence({ configuration: configuration2, logger }), logger);
  if (mountFrontend(app, configuration2.FRONTEND_DIR)) {
    logger.info(`Serving frontend from ${configuration2.FRONTEND_DIR}`);
  } else {
    logger.warn(
      `No frontend build at ${configuration2.FRONTEND_DIR}: serving the API only. Run \`pnpm --filter frontend build\` (and copy via build:frontend-assets) to serve the UI, or \`pnpm standalone:dev\` / \`pnpm dev\` for Vite.`
    );
  }
  let requestReplySubscriber;
  let requestReplyExecutor;
  if (redis) {
    requestReplySubscriber = redis.duplicate();
    requestReplySubscriber.on("error", (error) => {
      logger.error("[RedisSubscriber] Client error", extractErrorLogFields9(error));
    });
    await requestReplySubscriber.connect();
    requestReplyExecutor = new RequestReplyExecutor({
      executorId: configuration2.EXECUTOR_ID,
      redis,
      subscriberClient: requestReplySubscriber,
      requestHandler: requestReplyRouter.createRequestHandler(),
      logger,
      options: {
        heartbeatIntervalMs: configuration2.REDIS_REQUEST_REPLY_HEARTBEAT_INTERVAL_MS,
        replyTtlMs: configuration2.REDIS_REQUEST_REPLY_REPLY_TTL_MS
      }
    });
    await requestReplyExecutor.init();
  }
  const server = serve({ fetch: app.fetch, port: configuration2.PORT, hostname: configuration2.HOST }, (info) => {
    logger.info(`Agent server listening on http://${configuration2.HOST}:${String(info.port)} (docs at /api/v1/docs)`);
  });
  server.on("error", (error) => {
    console.error("Failed to start server:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
  if (configuration2.NODE_ENV !== "development") {
    let shuttingDown = false;
    const shutdown = async (signal) => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      logger.info(`Received ${signal}, draining connections before shutdown`);
      setTimeout(() => {
        logger.warn(`Drain timed out after ${String(configuration2.GRACEFUL_TIMEOUT_SECONDS)}s, exiting`);
        process.exit(1);
      }, configuration2.GRACEFUL_TIMEOUT_SECONDS * 1e3).unref();
      const closed = new Promise((resolve3) => {
        server.close(() => {
          resolve3();
        });
      });
      await activeTurns.shutdownAndWait(CancellationReason4.Abandoned);
      await closed;
      await requestReplyExecutor?.drain();
      await requestReplySubscriber?.close().catch((error) => {
        logger.warn("[Redis] Error closing subscriber client during shutdown", extractErrorLogFields9(error));
      });
      await redis?.close().catch((error) => {
        logger.warn("[Redis] Error closing client during shutdown", extractErrorLogFields9(error));
      });
      if (configuration2.STANDALONE) {
        await removeCodeModeSocketParent(configuration2.CODE_MODE_SOCKET_PARENT).catch((error) => {
          logger.warn("Error removing Code Mode socket parent during shutdown", extractErrorLogFields9(error));
        });
      }
      await destroyDb();
      process.exit(0);
    };
    process.on("SIGTERM", (signal) => {
      void shutdown(signal);
    });
    process.on("SIGINT", (signal) => {
      void shutdown(signal);
    });
  }
} catch (error) {
  console.error("Failed to start server:", error instanceof Error ? error.message : error);
  process.exit(1);
}
//# sourceMappingURL=main.js.map